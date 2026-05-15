import { ICreateConferenciaRequest, IUpdateConferenciaRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

const STATUS_RECEBIDO = "recebido";
const STATUS_APROVADO = "aprovado";
const STATUS_APROVADO_PARCIAL = "aprovado_parcial";
const STATUS_APROVADO_DEFEITO = "aprovado_defeito";

const STATUS_APROVADOS = [STATUS_APROVADO, STATUS_APROVADO_PARCIAL, STATUS_APROVADO_DEFEITO] as const;
const STATUS_QUE_PERMITEM_PAGAMENTO_TRUE = [STATUS_APROVADO, STATUS_APROVADO_PARCIAL, STATUS_APROVADO_DEFEITO] as const;

function roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
}

async function normalizeConferenciaItems(
    tx: any,
    conferenciaId: string | undefined,
    items: Array<{ id?: string; direcionamentoItemId?: string; qtdRecebida: number; qtdDefeito?: number }>
): Promise<Array<{ direcionamentoItemId: string; qtdRecebida: number; qtdDefeito?: number }>> {
    const itensComDirecionamento = items
        .filter((item) => Boolean(item.direcionamentoItemId))
        .map((item) => ({
            direcionamentoItemId: item.direcionamentoItemId as string,
            qtdRecebida: item.qtdRecebida,
            qtdDefeito: item.qtdDefeito
        }));

    const idsConferenciaItem = [...new Set(
        items
            .map((item) => item.id)
            .filter((itemId): itemId is string => Boolean(itemId))
    )];

    if (idsConferenciaItem.length === 0) {
        return itensComDirecionamento;
    }

    const where: any = {
        id: {
            in: idsConferenciaItem
        }
    };

    if (conferenciaId) {
        where.conferenciaId = conferenciaId;
    }

    const conferenciaItems = await tx.conferenciaItem.findMany({
        where,
        select: {
            id: true,
            direcionamentoItemId: true
        }
    });

    if (conferenciaItems.length !== idsConferenciaItem.length) {
        throw new Error("Um ou mais itens da conferência não foram encontrados.");
    }

    const mapaConferenciaItem = new Map(conferenciaItems.map((item: any) => [item.id, item.direcionamentoItemId]));

    const itensNormalizadosViaId = items
        .filter((item) => !item.direcionamentoItemId && item.id)
        .map((item) => ({
            direcionamentoItemId: mapaConferenciaItem.get(item.id as string) as string,
            qtdRecebida: item.qtdRecebida,
            qtdDefeito: item.qtdDefeito
        }));

    return [...itensComDirecionamento, ...itensNormalizadosViaId];
}

async function applySkuValuesOnDirecionamento(
    tx: any,
    direcionamentoId: string,
    produtoSKU: Array<{ sku: string; valorFaccaoPorPeca: number }>
): Promise<void> {
    const skusDuplicados = produtoSKU
        .map((item) => item.sku)
        .filter((sku, index, array) => array.indexOf(sku) !== index);

    if (skusDuplicados.length > 0) {
        throw new Error(`SKU duplicado no payload: ${skusDuplicados[0]}.`);
    }

    const itensDirecionamento = await tx.direcionamentoItem.findMany({
        where: { direcionamentoId },
        include: {
            estoqueCorte: {
                include: {
                    produto: {
                        select: { sku: true }
                    }
                }
            }
        }
    });

    const skusDirecionamento = new Set(itensDirecionamento.map((item: any) => item.estoqueCorte.produto.sku));

    for (const itemSku of produtoSKU) {
        if (!skusDirecionamento.has(itemSku.sku)) {
            throw new Error(`O SKU ${itemSku.sku} não pertence a este direcionamento.`);
        }
    }

    for (const itemSku of produtoSKU) {
        const idsItensSku = itensDirecionamento
            .filter((item: any) => item.estoqueCorte.produto.sku === itemSku.sku)
            .map((item: any) => item.id);

        await tx.direcionamentoItem.updateMany({
            where: {
                id: {
                    in: idsItensSku
                }
            },
            data: {
                valorFaccaoPorPeca: itemSku.valorFaccaoPorPeca
            }
        });
    }
}

const conferenciaDirecionamentoInclude = {
    faccao: true,
    items: {
        include: {
            estoqueCorte: {
                include: {
                    lote: true,
                    produto: true,
                    tamanho: true,
                    cor: true
                }
            }
        }
    }
} as const;

const conferenciaItemsInclude = {
    direcionamentoItem: {
        include: {
            estoqueCorte: {
                include: {
                    lote: true,
                    produto: true,
                    tamanho: true,
                    cor: true
                }
            }
        }
    }
} as const;

interface IConferenciaResponse {
    id: string;
    dataConferencia: string | null;
    statusQualidade: string | null;
    observacao: string | null;
    liberadoPagamento: boolean;
    isProducaoInterna: boolean;
    responsavel: {
        id: string;
        nome: string;
    };
    direcionamento: {
        id: string;
        tipoServico: string;
        status: string;
        dataSaida: string | null;
        faccao: {
            id: string;
            nome: string;
        };
    };
    items: Array<{
        id: string;
        direcionamentoItemId: string;
        quantidadeEnviada: number;
        qtdRecebida: number;
        qtdDefeito: number;
        quebra: number;
        produto: {
            id: string;
            nome: string;
            sku: string;
        };
        tamanho: string;
        cor: {
            nome: string;
            codigoHex: string | null;
        };
        lote: string;
    }>;
    pagamento: {
        totalCalculado: number;
        valorPago: number;
        valorAPagar: number;
        porSku: Array<{
            sku: string;
            quantidadeRecebida: number;
            quantidadeAprovada: number;
            valorUnitario: number;
            subtotal: number;
        }>;
    };
}

function mapConferenciaToResponse(conferencia: any): IConferenciaResponse {
    const pagamentoPorSku = new Map<string, {
        sku: string;
        quantidadeRecebida: number;
        quantidadeAprovada: number;
        valorUnitario: number;
        subtotal: number;
    }>();

    conferencia.items.forEach((item: any) => {
        const sku = item.direcionamentoItem.estoqueCorte.produto.sku;
        const quantidadeRecebida = item.qtdRecebida;
        const quantidadeAprovada = Math.max(item.qtdRecebida - item.qtdDefeito, 0);
        const valorUnitario = Number(item.direcionamentoItem.valorFaccaoPorPeca || 0);
        const subtotal = roundCurrency(quantidadeAprovada * valorUnitario);

        const atual = pagamentoPorSku.get(sku);
        if (atual) {
            atual.quantidadeRecebida += quantidadeRecebida;
            atual.quantidadeAprovada += quantidadeAprovada;
            atual.subtotal = roundCurrency(atual.subtotal + subtotal);
        } else {
            pagamentoPorSku.set(sku, {
                sku,
                quantidadeRecebida,
                quantidadeAprovada,
                valorUnitario,
                subtotal,
            });
        }
    });

    const porSku = Array.from(pagamentoPorSku.values());
    const totalCalculado = roundCurrency(porSku.reduce((acc, item) => acc + item.subtotal, 0));
    const valorPago = conferencia.liberadoPagamento ? totalCalculado : 0;
    const valorAPagar = conferencia.liberadoPagamento ? 0 : totalCalculado;

    return {
        id: conferencia.id,
        dataConferencia: conferencia.dataConferencia ? conferencia.dataConferencia.toISOString().split('T')[0] : null,
        statusQualidade: conferencia.status,
        observacao: conferencia.observacao,
        liberadoPagamento: conferencia.liberadoPagamento,
        isProducaoInterna: Boolean(conferencia.isProducaoInterna),
        responsavel: {
            id: conferencia.responsavel.id,
            nome: conferencia.responsavel.nome
        },
        direcionamento: {
            id: conferencia.direcionamento.id,
            tipoServico: conferencia.direcionamento.tipoServico,
            status: conferencia.direcionamento.status,
            dataSaida: conferencia.direcionamento.dataSaida ? conferencia.direcionamento.dataSaida.toISOString().split('T')[0] : null,
            faccao: {
                id: conferencia.direcionamento.faccao.id,
                nome: conferencia.direcionamento.faccao.nome
            }
        },
        items: conferencia.items.map((item: any) => {
            const quantidadeEnviada = item.direcionamentoItem.quantidade || 0;
            const quebra = quantidadeEnviada - (item.qtdRecebida + item.qtdDefeito);

            return {
                id: item.id,
                direcionamentoItemId: item.direcionamentoItemId,
                quantidadeEnviada,
                qtdRecebida: item.qtdRecebida,
                qtdDefeito: item.qtdDefeito,
                quebra,
                produto: {
                    id: item.direcionamentoItem.estoqueCorte.produto.id,
                    nome: item.direcionamentoItem.estoqueCorte.produto.nome,
                    sku: item.direcionamentoItem.estoqueCorte.produto.sku
                },
                tamanho: item.direcionamentoItem.estoqueCorte.tamanho.nome,
                cor: {
                    nome: item.direcionamentoItem.estoqueCorte.cor.nome,
                    codigoHex: item.direcionamentoItem.estoqueCorte.cor.codigoHex
                },
                lote: item.direcionamentoItem.estoqueCorte.lote.codigoLote
            };
        }),
        pagamento: {
            totalCalculado,
            valorPago,
            valorAPagar,
            porSku,
        }
    };
}

class CreateConferenciaService {
    async execute({ direcionamentoId, responsavelId, dataConferencia, statusQualidade, produtoSKU, liberadoPagamento, observacao, items }: ICreateConferenciaRequest) {
        // Verificar se direcionamento existe
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id: direcionamentoId }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        // Verificar se responsável existe
        const responsavel = await prismaClient.usuario.findUnique({
            where: { id: responsavelId }
        });

        if (!responsavel) {
            throw new Error("Responsável não encontrado.");
        }

        const itemsNormalizados = items?.length
            ? await normalizeConferenciaItems(prismaClient, undefined, items)
            : [];

        if (itemsNormalizados.length > 0) {
            const direcionamentoItemIds = [...new Set(itemsNormalizados.map(item => item.direcionamentoItemId))];
            const itensDirecionamento = await prismaClient.direcionamentoItem.findMany({
                where: {
                    id: { in: direcionamentoItemIds },
                    direcionamentoId
                },
                select: { id: true }
            });

            if (itensDirecionamento.length !== direcionamentoItemIds.length) {
                throw new Error("Um ou mais itens não pertencem ao direcionamento informado.");
            }
        }

        const statusFinal = statusQualidade || STATUS_RECEBIDO;
        let liberadoFinal = liberadoPagamento !== undefined ? liberadoPagamento : false;

        if (liberadoFinal && !STATUS_QUE_PERMITEM_PAGAMENTO_TRUE.includes(statusFinal as (typeof STATUS_QUE_PERMITEM_PAGAMENTO_TRUE)[number])) {
            throw new Error("Não é possível definir pagamento como true sem status de aprovação.");
        }

        // Criar conferência com items e opcionalmente atualizar valor por SKU do direcionamento.
        const conferencia = await prismaClient.$transaction(async (tx) => {
            if (produtoSKU?.length) {
                await applySkuValuesOnDirecionamento(tx, direcionamentoId, produtoSKU);
            }

            return tx.conferencia.create({
                data: {
                    direcionamentoId,
                    responsavelId,
                    dataConferencia: dataConferencia ? new Date(dataConferencia) : new Date(),
                    status: statusFinal,
                    observacao,
                    liberadoPagamento: liberadoFinal,
                    isProducaoInterna: false,
                    items: itemsNormalizados.length > 0 ? {
                        create: itemsNormalizados.map(item => ({
                            direcionamentoItemId: item.direcionamentoItemId,
                            qtdRecebida: item.qtdRecebida,
                            qtdDefeito: item.qtdDefeito || 0
                        }))
                    } : undefined
                },
                include: {
                    direcionamento: {
                        include: conferenciaDirecionamentoInclude
                    },
                    responsavel: true,
                    items: {
                        include: conferenciaItemsInclude
                    }
                }
            });
        });

        return mapConferenciaToResponse(conferencia);
    }
}

class ListAllConferenciaService {
    async execute(
        statusQualidade?: string,
        liberadoPagamento?: boolean,
        isProducaoInterna?: boolean,
        direcionamentoId?: string,
        faccaoId?: string,
        responsavelId?: string,
        dataInicio?: string,
        dataFim?: string,
        page?: number | string,
        limit?: number | string,
        somenteAprovadas?: boolean
    ): Promise<PaginatedResponse<IConferenciaResponse>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const andConditions: any[] = [];

        if (statusQualidade) {
            andConditions.push({ status: statusQualidade });
        } else if (somenteAprovadas) {
            andConditions.push({
                status: {
                    in: [STATUS_APROVADO, STATUS_APROVADO_DEFEITO]
                }
            });
        } else {
            andConditions.push({
                status: {
                    notIn: [STATUS_APROVADO, STATUS_APROVADO_PARCIAL, STATUS_APROVADO_DEFEITO]
                }
            });
        }

        if (liberadoPagamento !== undefined) {
            andConditions.push({ liberadoPagamento });
        }

        if (isProducaoInterna !== undefined) {
            andConditions.push({ isProducaoInterna });
        }

        if (direcionamentoId) {
            andConditions.push({ direcionamentoId });
        }

        if (responsavelId) {
            andConditions.push({ responsavelId });
        }

        if (faccaoId) {
            andConditions.push({
                direcionamento: {
                    is: {
                        faccaoId
                    }
                }
            });
        }

        if (dataInicio || dataFim) {
            andConditions.push({
                dataConferencia: {
                    ...(dataInicio && { gte: new Date(dataInicio) }),
                    ...(dataFim && { lte: new Date(dataFim) })
                }
            });
        }

        const whereCondition: any = { AND: andConditions };

        const [conferencias, total] = await Promise.all([
            prismaClient.conferencia.findMany({
                where: whereCondition,
                include: {
                    direcionamento: {
                        include: conferenciaDirecionamentoInclude
                    },
                    responsavel: true,
                    items: {
                        include: conferenciaItemsInclude
                    }
                },
                skip,
                take: pageLimit,
                orderBy: {
                    dataConferencia: "desc"
                }
            }),
            prismaClient.conferencia.count({
                where: whereCondition
            })
        ]);

        const conferenciasFormatadas = conferencias.map(mapConferenciaToResponse);
        return createPaginatedResponse(conferenciasFormatadas, total, pageNumber, pageLimit);
    }
}

class ListByIdConferenciaService {
    async execute(id: string): Promise<IConferenciaResponse> {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id },
            include: {
                direcionamento: {
                    include: conferenciaDirecionamentoInclude
                },
                responsavel: true,
                items: {
                    include: conferenciaItemsInclude
                }
            }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        return mapConferenciaToResponse(conferencia);
    }
}

class UpdateConferenciaService {
    async execute(id: string, { direcionamentoId, responsavelId, dataConferencia, statusQualidade, produtoSKU, liberadoPagamento, observacao, items }: IUpdateConferenciaRequest): Promise<IConferenciaResponse> {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        const statusAtual = conferencia.status || "";
        const statusSolicitado = statusQualidade ?? statusAtual;

        // Quando a conferência já está em qualquer status de aprovação,
        // permitir apenas trocar o `status` entre os status aprovados.
        // Qualquer outra alteração (itens, produtoSKU, responsavel, etc.) é proibida.
        if (STATUS_APROVADOS.includes(statusAtual as (typeof STATUS_APROVADOS)[number])) {
            const isStatusChangeRequested = statusQualidade !== undefined;

            // Verifica se qualquer outro campo realmente mudaria em relação ao estado atual.
            const dataConferenciaAtualStr = conferencia.dataConferencia ? conferencia.dataConferencia.toISOString().split('T')[0] : null;
            const dataConferenciaFornecidaStr = dataConferencia !== undefined ? (dataConferencia ? new Date(dataConferencia).toISOString().split('T')[0] : null) : undefined;

            const otherFieldChanges = (
                (direcionamentoId !== undefined && direcionamentoId !== conferencia.direcionamentoId) ||
                (responsavelId !== undefined && responsavelId !== conferencia.responsavelId) ||
                (dataConferenciaFornecidaStr !== undefined && dataConferenciaFornecidaStr !== dataConferenciaAtualStr) ||
                (liberadoPagamento !== undefined && liberadoPagamento !== conferencia.liberadoPagamento) ||
                (observacao !== undefined && observacao !== conferencia.observacao) ||
                (produtoSKU !== undefined) ||
                (items !== undefined)
            );

            if (isStatusChangeRequested) {
                // Se for alteração de status e o destino também for um status aprovado,
                // permitimos a operação — porém devemos ignorar quaisquer outros campos
                // enviados no payload para evitar alterações indesejadas.
                if (!STATUS_APROVADOS.includes(statusSolicitado as (typeof STATUS_APROVADOS)[number])) {
                    throw new Error("Conferências aprovadas podem trocar status apenas entre status de aprovação.");
                }

                // Se for troca entre aprovados, simplesmente descartar outros campos para
                // garantir que apenas o `status` será atualizado.
                direcionamentoId = undefined;
                responsavelId = undefined;
                dataConferencia = undefined;
                produtoSKU = undefined;
                liberadoPagamento = undefined;
                observacao = undefined;
                items = undefined;
            } else {
                if (otherFieldChanges) {
                    throw new Error("Conferências aprovadas permitem apenas trocar o status; outras alterações são proibidas.");
                }
            }
        }

        const statusFinal = statusQualidade ?? conferencia.status;
        let liberadoFinal = liberadoPagamento;

        if (liberadoFinal === true && !STATUS_QUE_PERMITEM_PAGAMENTO_TRUE.includes(statusFinal as (typeof STATUS_QUE_PERMITEM_PAGAMENTO_TRUE)[number])) {
            throw new Error("Não é possível definir pagamento como true sem status de aprovação.");
        }

        const conferenciaAtualizada = await prismaClient.$transaction(async (tx) => {
            if (direcionamentoId) {
                const direcionamento = await tx.direcionamento.findUnique({
                    where: { id: direcionamentoId }
                });
                if (!direcionamento) {
                    throw new Error("Direcionamento não encontrado.");
                }
            }

            if (responsavelId) {
                const responsavel = await tx.usuario.findUnique({
                    where: { id: responsavelId }
                });
                if (!responsavel) {
                    throw new Error("Responsável não encontrado.");
                }
            }

            if (items) {
                const direcionamentoAlvoId = direcionamentoId ?? conferencia.direcionamentoId;
                const itemsNormalizados = await normalizeConferenciaItems(tx, id, items);
                const direcionamentoItemIds = [...new Set(itemsNormalizados.map(item => item.direcionamentoItemId))];
                const itensDirecionamento = await tx.direcionamentoItem.findMany({
                    where: {
                        id: { in: direcionamentoItemIds },
                        direcionamentoId: direcionamentoAlvoId
                    },
                    select: { id: true }
                });

                if (itensDirecionamento.length !== direcionamentoItemIds.length) {
                    throw new Error("Um ou mais itens não pertencem ao direcionamento informado.");
                }

                await tx.conferenciaItem.deleteMany({
                    where: { conferenciaId: id }
                });

                if (items.length > 0) {
                    await tx.conferenciaItem.createMany({
                        data: itemsNormalizados.map(item => ({
                            conferenciaId: id,
                            direcionamentoItemId: item.direcionamentoItemId,
                            qtdRecebida: item.qtdRecebida,
                            qtdDefeito: item.qtdDefeito || 0
                        }))
                    });
                }
            }

            if (produtoSKU?.length) {
                const direcionamentoAlvoId = direcionamentoId ?? conferencia.direcionamentoId;
                await applySkuValuesOnDirecionamento(tx, direcionamentoAlvoId, produtoSKU);
            }

            return tx.conferencia.update({
                where: { id },
                data: {
                    ...(direcionamentoId && { direcionamentoId }),
                    ...(responsavelId && { responsavelId }),
                    ...(dataConferencia && { dataConferencia: new Date(dataConferencia) }),
                    ...(statusQualidade && { status: statusQualidade }),
                    ...(liberadoFinal !== undefined && { liberadoPagamento: liberadoFinal }),
                    ...(observacao !== undefined && { observacao })
                },
                include: {
                    direcionamento: {
                        include: conferenciaDirecionamentoInclude
                    },
                    responsavel: true,
                    items: {
                        include: conferenciaItemsInclude
                    }
                }
            });
        });

        return mapConferenciaToResponse(conferenciaAtualizada);
    }
}

class DeleteConferenciaService {
    async execute(id: string) {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        // Deletar items primeiro
        await prismaClient.conferenciaItem.deleteMany({
            where: { conferenciaId: id }
        });

        // Deletar conferência
        await prismaClient.conferencia.delete({
            where: { id }
        });

        return { message: "Conferência deletada com sucesso." };
    }
}

class GetRelatorioProdutividadeService {
    async execute(dataInicio?: string, dataFim?: string) {
        const conferencias = await prismaClient.conferencia.findMany({
            where: {
                dataConferencia: {
                    ...(dataInicio && { gte: new Date(dataInicio) }),
                    ...(dataFim && { lte: new Date(dataFim) })
                }
            },
            include: {
                direcionamento: {
                    include: {
                        faccao: true
                    }
                },
                items: true
            }
        });

        // Calcular período baseado nas datas reais
        let periodoInicio = "início";
        let periodoFim = "hoje";

        if (conferencias.length > 0) {
            const dataSaidas = conferencias
                .map(c => c.direcionamento.dataSaida)
                .filter((d): d is Date => d !== null);

            if (dataSaidas.length > 0) {
                const menorDataSaida = new Date(Math.min(...dataSaidas.map(d => d.getTime())));
                periodoInicio = menorDataSaida.toISOString().split("T")[0] ?? "início";
            }

            const datasConferencia = conferencias
                .map(c => c.dataConferencia)
                .filter((d): d is Date => d !== null);

            if (datasConferencia.length > 0) {
                const maiorDataConferencia = new Date(Math.max(...datasConferencia.map(d => d.getTime())));
                periodoFim = maiorDataConferencia.toISOString().split("T")[0] || "hoje";
            }
        }

        const totalConferencias = conferencias.length;
        const aprovados = conferencias.filter(c => c.status === STATUS_APROVADO).length;
        const aprovadosParcial = conferencias.filter(c => c.status === STATUS_APROVADO_PARCIAL).length;
        const aprovadosDefeito = conferencias.filter(c => c.status === STATUS_APROVADO_DEFEITO).length;
        const pagasAutorizadas = conferencias.filter(c => c.liberadoPagamento === true).length;

        // Agrupar por facção
        const porFaccao: Record<string, any> = {};
        conferencias.forEach(conf => {
            const faccaoNome = conf.direcionamento.faccao.nome;
            if (!porFaccao[faccaoNome]) {
                porFaccao[faccaoNome] = {
                    total: 0,
                    aprovado: 0,
                    aprovadoDefeito: 0
                };
            }
            porFaccao[faccaoNome].total++;
            if (conf.status === STATUS_APROVADO) porFaccao[faccaoNome].aprovado++;
            if (conf.status === STATUS_APROVADO_DEFEITO) porFaccao[faccaoNome].aprovadoDefeito++;
        });

        return {
            periodo: {
                inicio: periodoInicio,
                fim: periodoFim
            },
            totalConferencias,
            aprovados,
            aprovadosParcial,
            aprovadosDefeito,
            taxaAprovacao: totalConferencias > 0 ? (aprovados / totalConferencias * 100).toFixed(2) + "%" : "0%",
            pagasAutorizadas,
            porFaccao
        };
    }
}

export { CreateConferenciaService, ListAllConferenciaService, ListByIdConferenciaService, UpdateConferenciaService, DeleteConferenciaService, GetRelatorioProdutividadeService };
export type { IConferenciaResponse };

import prismaClient from "../../prisma";
import { createPaginatedResponse, PaginatedResponse, parsePaginationParams } from "../../utils/pagination";

class ListAllEstoqueCorteService {
    async execute(
        produtoId?: string,
        loteProducaoId?: string,
        tamanhoId?: string,
        corId?: string,
        page?: number | string,
        limit?: number | string,
        excludeTipoProdutoNome?: string
    ): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const where: any = {
            quantidadeDisponivel: { gt: 0 },
            ...(produtoId && { produtoId }),
            ...(loteProducaoId && { loteProducaoId }),
            ...(tamanhoId && { tamanhoId }),
            ...(corId && { corId })
        };

        // Excluir produtos por tipo (ex.: "Forro") quando solicitado
        if (excludeTipoProdutoNome && excludeTipoProdutoNome.trim()) {
            where.produto = {
                is: {
                    tipo: {
                        is: {
                            nome: {
                                not: {
                                    equals: excludeTipoProdutoNome.trim(),
                                    mode: "insensitive"
                                }
                            }
                        }
                    }
                }
            };
        }

        const [itens, total] = await Promise.all([
            prismaClient.estoqueCorte.findMany({
                where,
                include: {
                    produto: {
                        select: {
                            id: true,
                            nome: true,
                            sku: true
                        }
                    },
                    tamanho: {
                        select: {
                            id: true,
                            nome: true
                        }
                    },
                    cor: {
                        select: {
                            id: true,
                            nome: true,
                            codigoHex: true
                        }
                    },
                    lote: {
                        select: {
                            id: true,
                            codigoLote: true,
                            tecido: {
                                select: {
                                    id: true,
                                    nome: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    updatedAt: "desc"
                },
                skip,
                take: pageLimit
            }),
            prismaClient.estoqueCorte.count({ where })
        ]);

        return createPaginatedResponse(itens, total, pageNumber, pageLimit);
    }
}

class ListByIdEstoqueCorteService {
    async execute(id: string) {
        const estoque = await prismaClient.estoqueCorte.findUnique({
            where: { id },
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                cor: {
                    select: {
                        id: true,
                        nome: true,
                        codigoHex: true
                    }
                },
                lote: {
                    select: {
                        id: true,
                        codigoLote: true,
                        tecido: {
                            select: {
                                id: true,
                                nome: true
                            }
                        }
                    }
                },
                direcionamentoItems: {
                    include: {
                        direcionamento: {
                            select: {
                                id: true,
                                dataSaida: true,
                                faccao: {
                                    select: {
                                        nome: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        direcionamento: {
                            dataSaida: "desc"
                        }
                    }
                }
            }
        });

        if (!estoque) {
            throw new Error("Item de estoque de corte nao encontrado.");
        }

        const historicoEnvios = estoque.direcionamentoItems.map((item) => ({
            direcionamentoId: item.direcionamento.id,
            faccao: item.direcionamento.faccao.nome,
            quantidadeEnviada: item.quantidade,
            dataSaida: item.direcionamento.dataSaida
        }));

        return {
            id: estoque.id,
            quantidadeDisponivel: estoque.quantidadeDisponivel,
            produto: estoque.produto,
            tamanho: estoque.tamanho,
            cor: estoque.cor,
            lote: estoque.lote,
            historicoEnvios
        };
    }
}

class AjusteEstoqueCorteService {
    async execute(id: string, novaQuantidade: number, motivo: string, usuarioId?: string) {
        const estoque = await prismaClient.estoqueCorte.findUnique({
            where: { id },
            include: {
                produto: {
                    select: {
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        nome: true
                    }
                },
                lote: {
                    select: {
                        codigoLote: true
                    }
                }
            }
        });

        if (!estoque) {
            throw new Error("Item de estoque de corte nao encontrado.");
        }

        const atualizado = await prismaClient.estoqueCorte.update({
            where: { id },
            data: {
                quantidadeDisponivel: novaQuantidade
            },
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                cor: {
                    select: {
                        id: true,
                        nome: true,
                        codigoHex: true
                    }
                },
                lote: {
                    select: {
                        id: true,
                        codigoLote: true,
                        tecido: {
                            select: {
                                id: true,
                                nome: true
                            }
                        }
                    }
                }
            }
        });

        return {
            message: "Estoque de corte ajustado com sucesso.",
            motivo,
            usuarioId,
            quantidadeAnterior: estoque.quantidadeDisponivel,
            quantidadeAtual: atualizado.quantidadeDisponivel,
            item: atualizado
        };
    }
}

class CriarOuAjustarEstoqueCorteService {
    async execute(
        produtoId: string,
        loteProducaoId: string,
        tamanhoId: string,
        corId: string,
        novaQuantidade: number,
        motivo: string,
        usuarioId?: string
    ) {
        const estoqueExistente = await prismaClient.estoqueCorte.findUnique({
            where: {
                loteProducaoId_produtoId_tamanhoId_corId: {
                    loteProducaoId,
                    produtoId,
                    tamanhoId,
                    corId
                }
            },
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                cor: {
                    select: {
                        id: true,
                        nome: true,
                        codigoHex: true
                    }
                },
                lote: {
                    select: {
                        id: true,
                        codigoLote: true,
                        tecido: {
                            select: {
                                id: true,
                                nome: true
                            }
                        }
                    }
                }
            }
        });

        if (estoqueExistente) {
            const atualizado = await prismaClient.estoqueCorte.update({
                where: { id: estoqueExistente.id },
                data: {
                    quantidadeDisponivel: novaQuantidade
                },
                include: {
                    produto: {
                        select: {
                            id: true,
                            nome: true,
                            sku: true
                        }
                    },
                    tamanho: {
                        select: {
                            id: true,
                            nome: true
                        }
                    },
                    cor: {
                        select: {
                            id: true,
                            nome: true,
                            codigoHex: true
                        }
                    },
                    lote: {
                        select: {
                            id: true,
                            codigoLote: true,
                            tecido: {
                                select: {
                                    id: true,
                                    nome: true
                                }
                            }
                        }
                    }
                }
            });

            return {
                message: "Estoque de corte ajustado com sucesso.",
                motivo,
                usuarioId,
                quantidadeAnterior: estoqueExistente.quantidadeDisponivel,
                quantidadeAtual: atualizado.quantidadeDisponivel,
                item: atualizado
            };
        }

        const criado = await prismaClient.estoqueCorte.create({
            data: {
                produtoId,
                loteProducaoId,
                tamanhoId,
                corId,
                quantidadeDisponivel: novaQuantidade
            },
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                cor: {
                    select: {
                        id: true,
                        nome: true,
                        codigoHex: true
                    }
                },
                lote: {
                    select: {
                        id: true,
                        codigoLote: true,
                        tecido: {
                            select: {
                                id: true,
                                nome: true
                            }
                        }
                    }
                }
            }
        });

        return {
            message: "Estoque de corte criado com sucesso.",
            motivo,
            usuarioId,
            quantidadeAnterior: 0,
            quantidadeAtual: criado.quantidadeDisponivel,
            item: criado
        };
    }
}

export { ListAllEstoqueCorteService, ListByIdEstoqueCorteService, AjusteEstoqueCorteService, CriarOuAjustarEstoqueCorteService };

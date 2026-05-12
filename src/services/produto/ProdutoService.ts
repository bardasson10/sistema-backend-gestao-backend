import { ICreateProdutoRequest, IUpdateProdutoRequest } from "../../interfaces/IProduto";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateProdutoService {
    async execute({ tipoProdutoId, nome, sku, fabricante, custoMedioPeca, precoMedioVenda }: ICreateProdutoRequest) {
        // Verificar se tipo de produto existe
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id: tipoProdutoId }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        // Verificar se SKU já existe
        const produtoComSKU = await prismaClient.produto.findUnique({
            where: { sku }
        });

        if (produtoComSKU) {
            throw new Error("Produto com este SKU já existe.");
        }

        const produto = await prismaClient.produto.create({
            data: {
                tipoProdutoId,
                nome,
                sku,
                fabricante,
                custoMedioPeca,
                precoMedioVenda
            },
            include: {
                tipo: {
                    include: {
                        tamanhos: {
                            include: {
                                tamanho: true
                            }
                        }
                    }
                }
            }
        });

        return produto;
    }
}

class ListAllProdutoService {
    async execute(
        tipoProdutoId?: string,
        page?: number | string,
        limit?: number | string,
        tipoProdutoNome?: string
    ): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const where: any = {
            ...(tipoProdutoId && { tipoProdutoId }),
            ...(tipoProdutoNome && {
                tipo: {
                    nome: {
                        equals: tipoProdutoNome.trim(),
                        mode: 'insensitive'
                    }
                }
            })
        };

        const [produtos, total] = await Promise.all([
            prismaClient.produto.findMany({
                where,
                include: {
                    tipo: {
                        include: {
                            tamanhos: {
                                include: {
                                    tamanho: true
                                }
                            }
                        }
                    }
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prismaClient.produto.count({
                where
            })
        ]);

        return createPaginatedResponse(produtos, total, pageNumber, pageLimit);
    }
}

class ListByIdProdutoService {
    async execute(id: string) {
        const produto = await prismaClient.produto.findUnique({
            where: { id },
            include: {
                tipo: {
                    include: {
                        tamanhos: {
                            include: {
                                tamanho: true
                            }
                        }
                    }
                }
            }
        });

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        return produto;
    }
}

class UpdateProdutoService {
    async execute(id: string, data: IUpdateProdutoRequest) {
        const produto = await prismaClient.produto.findUnique({
            where: { id }
        });

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        // Se estiver atualizando o tipo, verificar se existe
        if (data.tipoProdutoId) {
            const tipoProduto = await prismaClient.tipoProduto.findUnique({
                where: { id: data.tipoProdutoId }
            });

            if (!tipoProduto) {
                throw new Error("Tipo de produto não encontrado.");
            }
        }

        // Se estiver atualizando SKU, verificar duplicação
        if (data.sku && data.sku !== produto.sku) {
            const produtoDuplicado = await prismaClient.produto.findUnique({
                where: { sku: data.sku }
            });

            if (produtoDuplicado) {
                throw new Error("Produto com este SKU já existe.");
            }
        }

        const produtoAtualizado = await prismaClient.produto.update({
            where: { id },
            data,
            include: {
                tipo: {
                    include: {
                        tamanhos: {
                            include: {
                                tamanho: true
                            }
                        }
                    }
                }
            }
        });

        return produtoAtualizado;
    }
}

class DeleteProdutoService {
    async execute(id: string) {
        const produto = await prismaClient.produto.findUnique({
            where: { id },
            include: {
                loteItems: true
            }
        });

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        if (produto.loteItems.length > 0) {
            throw new Error("Não é possível deletar um produto que possui itens de lote associados.");
        }

        await prismaClient.produto.delete({
            where: { id }
        });

        return { message: "Produto deletado com sucesso." };
    }
}

export { CreateProdutoService, ListAllProdutoService, ListByIdProdutoService, UpdateProdutoService, DeleteProdutoService };

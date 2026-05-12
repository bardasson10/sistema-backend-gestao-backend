import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createTipoProdutoSchema,
    updateTipoProdutoSchema,
    createTamanhoSchema,
    updateTamanhoSchema,
    createProdutoSchema,
    updateProdutoSchema,
    createTipoProdutoTamanhoSchema,
    deleteTipoProdutoTamanhoSchema,
} from '../schemas/produtoSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const errorSchema = z.object({
    error: z.string()
});

const messageSchema = z.object({
    message: z.string()
});

const tamanhoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    ordem: z.number().int().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});

const tipoProdutoTamanhoFormatadoSchema = z.object({
    id: z.string().uuid(),
    tamanhoId: z.string().uuid(),
    NomeTamanho: z.string(),
    OrdemTamanho: z.number().int().optional()
});

const tipoProdutoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    tamanhos: z.array(tipoProdutoTamanhoFormatadoSchema).optional()
});

const produtoSchema = z.object({
    id: z.string().uuid(),
    tipoProdutoId: z.string().uuid(),
    nome: z.string(),
    sku: z.string(),
    fabricante: z.string().nullable().optional(),
    custoMedioPeca: z.number().nullable().optional(),
    precoMedioVenda: z.number().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    tipo: z.object({
        id: z.string().uuid(),
        nome: z.string(),
        createdAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime().optional(),
        tamanhos: z.array(z.object({
            id: z.string().uuid(),
            tipoProdutoId: z.string().uuid(),
            tamanhoId: z.string().uuid(),
            tamanho: tamanhoSchema
        })).optional()
    }).optional()
});

const tipoProdutoTamanhoAssociationSchema = z.object({
    id: z.string().uuid(),
    tipoProdutoId: z.string().uuid(),
    tamanhoId: z.string().uuid(),
    tipo: z.object({
        id: z.string().uuid(),
        nome: z.string()
    }),
    tamanho: tamanhoSchema
});

const createTipoProdutoTamanhoResponseSchema = z.object({
    message: z.string(),
    criados: z.array(tipoProdutoTamanhoAssociationSchema),
    erros: z.array(z.string()).optional()
});

const deleteTipoProdutoTamanhoResponseSchema = z.object({
    message: z.string(),
    removidos: z.array(tipoProdutoTamanhoAssociationSchema),
    erros: z.array(z.string()).optional()
});

const paginatedTipoProdutoSchema = z.object({
    data: z.array(tipoProdutoSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedTamanhoSchema = z.object({
    data: z.array(tamanhoSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedProdutoSchema = z.object({
    data: z.array(produtoSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

export function registerProdutoRoutes(registry: OpenAPIRegistry) {
    // POST /tipos-produto - Criar tipo de produto
    registry.registerPath({
        method: 'post',
        path: '/tipos-produto',
        tags: ['Produtos'],
        summary: 'Criar tipo de produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTipoProdutoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Tipo de produto criado com sucesso',
                content: {
                    'application/json': {
                        schema: tipoProdutoSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /tipos-produto - Listar tipos de produto
    registry.registerPath({
        method: 'get',
        path: '/tipos-produto',
        tags: ['Produtos'],
        summary: 'Listar tipos de produto',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de tipos de produto',
                content: {
                    'application/json': {
                        schema: paginatedTipoProdutoSchema
                    }
                }
            }
        }
    });

    // GET /tipos-produto/{id} - Buscar tipo de produto por ID
    registry.registerPath({
        method: 'get',
        path: '/tipos-produto/{id}',
        tags: ['Produtos'],
        summary: 'Buscar tipo de produto por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tipo de produto encontrado',
                content: {
                    'application/json': {
                        schema: tipoProdutoSchema
                    }
                }
            },
            404: {
                description: 'Tipo de produto não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /tipos-produto/{id} - Atualizar tipo de produto
    registry.registerPath({
        method: 'put',
        path: '/tipos-produto/{id}',
        tags: ['Produtos'],
        summary: 'Atualizar tipo de produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateTipoProdutoSchema.shape.body
                    }
                }
            },
            params: z.object({
                id: z.uuid()
            })
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Tipo de produto atualizado',
                content: {
                    'application/json': {
                        schema: tipoProdutoSchema
                    }
                }
            },
            404: {
                description: 'Tipo de produto não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /tipos-produto/{id} - Deletar tipo de produto
    registry.registerPath({
        method: 'delete',
        path: '/tipos-produto/{id}',
        tags: ['Produtos'],
        summary: 'Deletar tipo de produto (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tipo de produto deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Tipo de produto não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /tamanhos - Criar tamanho
    registry.registerPath({
        method: 'post',
        path: '/tamanhos',
        tags: ['Produtos'],
        summary: 'Criar tamanho',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTamanhoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Tamanho criado com sucesso',
                content: {
                    'application/json': {
                        schema: tamanhoSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /tamanhos - Listar tamanhos
    registry.registerPath({
        method: 'get',
        path: '/tamanhos',
        tags: ['Produtos'],
        summary: 'Listar tamanhos',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de tamanhos',
                content: {
                    'application/json': {
                        schema: paginatedTamanhoSchema
                    }
                }
            }
        }
    });

    // GET /tamanhos/{id} - Buscar tamanho por ID
    registry.registerPath({
        method: 'get',
        path: '/tamanhos/{id}',
        tags: ['Produtos'],
        summary: 'Buscar tamanho por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tamanho encontrado',
                content: {
                    'application/json': {
                        schema: tamanhoSchema
                    }
                }
            },
            404: {
                description: 'Tamanho não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /tamanhos/{id} - Atualizar tamanho
    registry.registerPath({
        method: 'put',
        path: '/tamanhos/{id}',
        tags: ['Produtos'],
        summary: 'Atualizar tamanho',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateTamanhoSchema.shape.body
                    }
                }
            },
            params: z.object({
                id: z.uuid()
            })
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Tamanho atualizado',
                content: {
                    'application/json': {
                        schema: tamanhoSchema
                    }
                }
            },
            404: {
                description: 'Tamanho não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /tamanhos/{id} - Deletar tamanho
    registry.registerPath({
        method: 'delete',
        path: '/tamanhos/{id}',
        tags: ['Produtos'],
        summary: 'Deletar tamanho (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tamanho deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Tamanho não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /produtos - Criar produto
    registry.registerPath({
        method: 'post',
        path: '/produtos',
        tags: ['Produtos'],
        summary: 'Criar produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createProdutoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Produto criado com sucesso',
                content: {
                    'application/json': {
                        schema: produtoSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /produtos - Listar produtos
    registry.registerPath({
        method: 'get',
        path: '/produtos',
        tags: ['Produtos'],
        summary: 'Listar produtos',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                tipoProdutoId: z.uuid().optional(),
                tipoProdutoNome: z.string().optional(),
                page: z.coerce.number().int().positive().optional(),
                limit: z.coerce.number().int().positive().optional()
            })
        },
        responses: {
            200: {
                description: 'Lista de produtos',
                content: {
                    'application/json': {
                        schema: paginatedProdutoSchema
                    }
                }
            }
        }
    });

    // GET /produtos/{id} - Buscar produto por ID
    registry.registerPath({
        method: 'get',
        path: '/produtos/{id}',
        tags: ['Produtos'],
        summary: 'Buscar produto por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Produto encontrado',
                content: {
                    'application/json': {
                        schema: produtoSchema
                    }
                }
            },
            404: {
                description: 'Produto não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /produtos/{id} - Atualizar produto
    registry.registerPath({
        method: 'put',
        path: '/produtos/{id}',
        tags: ['Produtos'],
        summary: 'Atualizar produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateProdutoSchema.shape.body
                    }
                }
            },
            params: z.object({
                id: z.uuid()
            })
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Produto atualizado',
                content: {
                    'application/json': {
                        schema: produtoSchema
                    }
                }
            },
            404: {
                description: 'Produto não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /produtos/{id} - Deletar produto
    registry.registerPath({
        method: 'delete',
        path: '/produtos/{id}',
        tags: ['Produtos'],
        summary: 'Deletar produto (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Produto deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Produto não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /tipos-produto-tamanho - Associar tipo de produto a tamanho
    registry.registerPath({
        method: 'post',
        path: '/tipos-produto-tamanho',
        tags: ['Produtos'],
        summary: 'Associar tipo de produto a tamanho',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTipoProdutoTamanhoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Associação criada com sucesso',
                content: {
                    'application/json': {
                        schema: createTipoProdutoTamanhoResponseSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /tipos-produto/{tipoProdutoId}/tamanhos - Listar tamanhos por tipo
    registry.registerPath({
        method: 'get',
        path: '/tipos-produto/{tipoProdutoId}/tamanhos',
        tags: ['Produtos'],
        summary: 'Listar tamanhos por tipo de produto',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                tipoProdutoId: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lista de tamanhos do tipo de produto',
                content: {
                    'application/json': {
                        schema: z.array(tipoProdutoTamanhoAssociationSchema)
                    }
                }
            },
            404: {
                description: 'Tipo de produto não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /tipos-produto-tamanho/{idProduto} - Remover associação
    registry.registerPath({
        method: 'delete',
        path: '/tipos-produto-tamanho/{idProduto}',
        tags: ['Produtos'],
        summary: 'Desassociar tamanhos de um tipo de produto (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                idProduto: z.uuid()
            }),
            body: {
                content: {
                    'application/json': {
                        schema: deleteTipoProdutoTamanhoSchema.shape.body
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Desassociação concluída',
                content: {
                    'application/json': {
                        schema: deleteTipoProdutoTamanhoResponseSchema
                    }
                }
            },
            404: {
                description: 'Tipo de produto ou associação não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });
}
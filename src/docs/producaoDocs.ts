import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createFaccaoSchema,
    updateFaccaoSchema,
    createLoteProducaoSchema,
    updateLoteProducaoSchema,
    addLoteItemsSchema,
    addRolosLoteSchema,
    createDirecionamentoSchema,
    createDirecionamentoInternoSchema,
    updateDirecionamentoSchema,
    updateDirecionamentoItemsSchema,
    updateDirecionamentoStatusSchema,
    updateDirecionamentoSkuPriceSchema,
    createConferenciaSchema,
    updateConferenciaSchema,
} from '../schemas/producaoSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const TAG_FACCOES = 'Produção - Facções';
const TAG_LOTES = 'Produção - Lotes';
const TAG_DIRECIONAMENTOS = 'Produção - Direcionamentos';
const TAG_CONFERENCIAS = 'Produção - Conferências';

const errorSchema = z.object({
    error: z.string()
});

const messageSchema = z.object({
    message: z.string()
});

const usuarioResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    perfil: z.string().optional(),
    status: z.string().optional(),
    funcaoSetor: z.string().nullable().optional()
});

const faccaoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    responsavel: z.string().nullable().optional(),
    contato: z.string().nullable().optional(),
    prazoMedioDias: z.number().int().nullable().optional(),
    status: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    direcionamentos: z.array(z.any()).optional()
});

const corResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    codigoHex: z.string().nullable().optional()
});

const tecidoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    codigoReferencia: z.string().nullable().optional(),
    cor: corResumoSchema.optional(),
    fornecedor: z.any().optional(),
    rolos: z.array(z.any()).optional()
});

const produtoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    sku: z.string(),
    fabricante: z.string().nullable().optional()
});

const tamanhoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    ordem: z.number().int().optional()
});

const estoqueCorteResumoSchema = z.object({
    id: z.string().uuid(),
    produtoId: z.string().uuid(),
    tamanhoId: z.string().uuid(),
    loteProducaoId: z.string().uuid(),
    quantidadeDisponivel: z.number().int(),
    produto: produtoResumoSchema.optional(),
    tamanho: tamanhoResumoSchema.optional()
});

const loteItemSchema = z.object({
    id: z.string().uuid(),
    loteProducaoId: z.string().uuid(),
    produtoId: z.string().uuid(),
    tamanhoId: z.string().uuid(),
    quantidadePlanejada: z.number().int(),
    quantidadeProduzida: z.number().int().nullable().optional(),
    produto: produtoResumoSchema.optional(),
    tamanho: tamanhoResumoSchema.optional(),
    enfestos: z.array(z.any()).optional()
});

const loteSchema = z.object({
    id: z.string().uuid(),
    codigoLote: z.string(),
    tecidoId: z.string().uuid(),
    responsavelId: z.string().uuid().nullable().optional(),
    status: z.enum(["lote_criado", "enfesto", "cortado"]),
    observacao: z.string().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    tecido: tecidoResumoSchema.optional(),
    responsavel: usuarioResumoSchema.optional(),
    items: z.array(loteItemSchema).optional(),
    materiais: z.array(z.object({
        tecidoId: z.string().uuid(),
        nome: z.string().optional(),
        codigoReferencia: z.string().nullable().optional(),
        rendimentoMetroKg: z.number().nullable().optional(),
        larguraMetros: z.number().nullable().optional(),
        gramatura: z.number().nullable().optional(),
        valorPorKg: z.number(),
        pesoTotal: z.number(),
        cores: z.array(z.object({
            corId: z.string().uuid().nullable().optional(),
            nome: z.string().nullable().optional(),
            qtdFolhas: z.number().int(),
            valorTecido: z.number(),
            codigoHex: z.string().nullable().optional(),
            rolos: z.array(z.object({
                id: z.string().uuid(),
                codigoBarraRolo: z.string().nullable().optional(),
                pesoAtualKg: z.number(),
                pesoReservado: z.number(),
                situacao: z.string()
            })),
            gradeLote: z.array(z.object({
                id: z.string().uuid(),
                produtoId: z.string().uuid(),
                tamanhoId: z.string().uuid(),
                quantidadePlanejada: z.number().int(),
                qtdMultiplicadorGrade: z.number().nullable().optional(),
                produtoNome: z.string().optional(),
                sku: z.string().optional(),
                tamanhoNome: z.string().optional()
            }))
        }))
    })),
    direcionamentos: z.array(z.object({
        id: z.string().uuid(),
        faccaoId: z.string().uuid(),
        faccaoNome: z.string().optional(),
        tipoServico: z.string(),
        status: z.string(),
        dataPrevisaoRetorno: z.string().datetime().nullable().optional()
    })).optional()
});

const direcionamentoItemSchema = z.object({
    id: z.string().uuid(),
    direcionamentoId: z.string().uuid(),
    estoqueCorteId: z.string().uuid(),
    quantidade: z.number().int(),
    valorFaccaoPorPeca: z.number().nullable().optional(),
    estoqueCorte: estoqueCorteResumoSchema.extend({
        lote: loteSchema.pick({ id: true, codigoLote: true, status: true, tecido: true, responsavel: true }).optional()
    }).optional()
});

const direcionamentoSchema = z.object({
    id: z.string().uuid(),
    faccaoId: z.string().uuid(),
    tipoServico: z.enum(["costura", "corte"]),
    quantidade: z.number().int(),
    dataSaida: z.string().datetime().nullable().optional(),
    dataPrevisaoRetorno: z.string().datetime().nullable().optional(),
    status: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    faccao: faccaoSchema.optional(),
    items: z.array(direcionamentoItemSchema)
});

const direcionamentoListItemSchema = z.object({
    id: z.string().uuid(),
    status: z.string(),
    tipoServico: z.enum(["costura", "corte"]),
    quantidade: z.number().int(),
    valorTotalEstimado: z.number(),
    dataSaida: z.string().datetime().nullable(),
    dataPrevisaoRetorno: z.string().datetime().nullable(),
    faccao: z.object({
        id: z.string().uuid(),
        nome: z.string(),
        responsavel: z.string()
    }),
    items: z.array(z.object({
        id: z.string().uuid(),
        quantidade: z.number().int(),
        valorFaccaoPorPeca: z.number().nullable().optional(),
        valorEstimadoItem: z.number(),
        produto: z.object({
            id: z.string().uuid(),
            nome: z.string(),
            sku: z.string(),
            cor: z.object({
                id: z.string().uuid(),
                nome: z.string(),
                codigoHex: z.string()
            }),
            tamanho: z.string()
        }),
        lote: z.object({
            id: z.string().uuid(),
            codigoLote: z.string()
        })
    })),
    createdAt: z.string().datetime()
});

const conferenciaItemSchema = z.object({
    id: z.string().uuid(),
    direcionamentoItemId: z.string().uuid(),
    quantidadeEnviada: z.number().int().nonnegative(),
    qtdRecebida: z.number().int().nonnegative(),
    qtdDefeito: z.number().int().nonnegative(),
    quebra: z.number().int(),
    produto: z.object({
        id: z.string().uuid(),
        nome: z.string(),
        sku: z.string(),
    }),
    tamanho: z.string(),
    cor: z.object({
        nome: z.string(),
        codigoHex: z.string().nullable(),
    }),
    lote: z.string(),
});

const conferenciaSchema = z.object({
    id: z.string().uuid(),
    dataConferencia: z.string().nullable(),
    statusQualidade: z.string().nullable(),
    observacao: z.string().nullable(),
    liberadoPagamento: z.boolean(),
    isProducaoInterna: z.boolean(),
    responsavel: z.object({
        id: z.string().uuid(),
        nome: z.string(),
    }),
    direcionamento: z.object({
        id: z.string().uuid(),
        tipoServico: z.string(),
        status: z.string(),
        dataSaida: z.string().nullable(),
        faccao: z.object({
            id: z.string().uuid(),
            nome: z.string(),
        }),
    }),
    items: z.array(conferenciaItemSchema),
    pagamento: z.object({
        totalCalculado: z.number().nonnegative(),
        valorPago: z.number().nonnegative(),
        valorAPagar: z.number().nonnegative(),
        porSku: z.array(z.object({
            sku: z.string(),
            quantidadeRecebida: z.number().int().nonnegative(),
            quantidadeAprovada: z.number().int().nonnegative(),
            valorUnitario: z.number().nonnegative(),
            subtotal: z.number().nonnegative(),
        })),
    }),
});

const paginatedFaccoesSchema = z.object({
    data: z.array(faccaoSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedLotesSchema = z.object({
    data: z.array(loteSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedDirecionamentosSchema = z.object({
    data: z.array(direcionamentoListItemSchema),
    pagination: z.object({
        total: z.number().int(),
        page: z.number().int(),
        limit: z.number().int(),
        totalPages: z.number().int(),
        pages: z.number().int().optional()
    })
});

const paginatedConferenciasSchema = z.object({
    data: z.array(conferenciaSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
});

const relatorioProdutividadeSchema = z.object({
    periodo: z.object({
        inicio: z.string(),
        fim: z.string()
    }),
    totalConferencias: z.number().int(),
    aprovados: z.number().int(),
    aprovadosParcial: z.number().int(),
    aprovadosDefeito: z.number().int(),
    taxaAprovacao: z.string(),
    pagasAutorizadas: z.number().int(),
    porFaccao: z.record(z.string(), z.object({
        total: z.number().int(),
        aprovado: z.number().int(),
        aprovadoDefeito: z.number().int()
    }))
});

const linhaGradeSchema = z.object({
    tamanhoId: z.string().uuid(),
    tamanhoNome: z.string(),
    tamanhoOrdem: z.number().int(),
    quantidade: z.number().int()
});

const produtoOrdenado = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    sku: z.string(),
    linhas: z.array(linhaGradeSchema),
    total: z.number().int()
});

const tamanhoOrdenado = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    ordem: z.number().int(),
    total: z.number().int()
});

const multiValueQuerySchema = z.union([z.string(), z.array(z.string())]).optional();

const resumoPorCorSchema = z.object({
    totalGeral: z.object({
        produtos: z.array(produtoOrdenado),
        tamanhos: z.array(tamanhoOrdenado),
        grandTotal: z.number().int()
    }),
    cores: z.array(z.object({
        id: z.string().uuid(),
        nome: z.string(),
        codigoHex: z.string(),
        qtdFolhas: z.number().int(),
        produtos: z.array(produtoOrdenado),
        tamanhos: z.array(tamanhoOrdenado),
        total: z.number().int()
    })),
    paginacao: z.object({
        paginaAtual: z.number().int(),
        itensPorPagina: z.number().int(),
        totalItens: z.number().int(),
        totalPaginas: z.number().int()
    })
});

export function registerProducaoRoutes(registry: OpenAPIRegistry) {
    // POST /faccoes - Criar facção
    registry.registerPath({
        method: 'post',
        path: '/faccoes',
        tags: [TAG_FACCOES],
        summary: 'Criar facção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createFaccaoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Facção criada com sucesso',
                content: {
                    'application/json': {
                        schema: faccaoSchema
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

    // GET /faccoes - Listar facções
    registry.registerPath({
        method: 'get',
        path: '/faccoes',
        tags: [TAG_FACCOES],
        summary: 'Listar facções',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de facções',
                content: {
                    'application/json': {
                        schema: paginatedFaccoesSchema
                    }
                }
            }
        }
    });

    // GET /faccoes/{id} - Buscar facção por ID
    registry.registerPath({
        method: 'get',
        path: '/faccoes/{id}',
        tags: [TAG_FACCOES],
        summary: 'Buscar facção por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Facção encontrada',
                content: {
                    'application/json': {
                        schema: faccaoSchema
                    }
                }
            },
            404: {
                description: 'Facção não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /faccoes/{id} - Atualizar facção
    registry.registerPath({
        method: 'put',
        path: '/faccoes/{id}',
        tags: [TAG_FACCOES],
        summary: 'Atualizar facção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateFaccaoSchema.shape.body
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
                description: 'Facção atualizada',
                content: {
                    'application/json': {
                        schema: faccaoSchema
                    }
                }
            },
            404: {
                description: 'Facção não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /faccoes/{id} - Deletar facção
    registry.registerPath({
        method: 'delete',
        path: '/faccoes/{id}',
        tags: [TAG_FACCOES],
        summary: 'Deletar facção (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Facção deletada',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Facção não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /lotes-producao - Criar lote de produção
    registry.registerPath({
        method: 'post',
        path: '/lotes-producao',
        tags: [TAG_LOTES],
        summary: 'Criar lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createLoteProducaoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lote de produção criado com sucesso',
                content: {
                    'application/json': {
                        schema: loteSchema
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

    // GET /lotes-producao - Listar lotes de produção
    registry.registerPath({
        method: 'get',
        path: '/lotes-producao',
        tags: [TAG_LOTES],
        summary: 'Listar lotes de produção',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                status: z.union([z.enum(["lote_criado", "enfesto", "cortado"]), z.array(z.enum(["lote_criado", "enfesto", "cortado"]))]).optional(),
                responsavelId: multiValueQuerySchema,
                codigoLote: multiValueQuerySchema,
                page: z.coerce.number().int().positive().optional(),
                limit: z.coerce.number().int().positive().optional(),
                corId: multiValueQuerySchema,
                produtoId: multiValueQuerySchema,
                dataInicio: multiValueQuerySchema,
                dataFim: multiValueQuerySchema
            })
        },
        responses: {
            200: {
                description: 'Lista de lotes de produção',
                content: {
                    'application/json': {
                        schema: paginatedLotesSchema
                    }
                }
            }
        }
    });

    // GET /lotes-producao/resumo-por-cor - Resumo de lotes por cor
    registry.registerPath({
        method: 'get',
        path: '/lotes-producao/resumo-por-cor',
        tags: [TAG_LOTES],
        summary: 'Resumo de lotes agrupados por cor',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                status: z.enum(["lote_criado", "enfesto", "cortado"]).optional(),
                responsavelId: z.string().uuid().optional(),
                codigoLote: z.string().min(1).optional(),
                page: z.coerce.number().int().positive().optional(),
                limit: z.coerce.number().int().positive().optional(),
                corId: z.string().uuid().optional(),
                produtoId: z.string().uuid().optional(),
                dataInicio: z.string().optional(),
                dataFim: z.string().optional()
            })
        },
        responses: {
            200: {
                description: 'Resumo de lotes agrupados por cor',
                content: {
                    'application/json': {
                        schema: resumoPorCorSchema
                    }
                }
            }
        }
    });

    // GET /lotes-producao/{id} - Buscar lote por ID
    registry.registerPath({
        method: 'get',
        path: '/lotes-producao/{id}',
        tags: [TAG_LOTES],
        summary: 'Buscar lote de produção por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lote de produção encontrado',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /lotes/{loteId}/sobras - Listar grade de sobras do lote
    registry.registerPath({
        method: 'get',
        path: '/lotes/{loteId}/sobras',
        tags: [TAG_LOTES],
        summary: 'Listar saldo de estoque de corte por produto/tamanho de um lote',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                loteId: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Saldo disponivel de estoque de corte do lote',
                content: {
                    'application/json': {
                        schema: z.object({
                            loteId: z.string().uuid(),
                            codigoLote: z.string(),
                            items: z.array(z.object({
                                estoqueCorteId: z.string().uuid(),
                                produtoId: z.string().uuid(),
                                tamanhoId: z.string().uuid(),
                                produtoNome: z.string(),
                                sku: z.string(),
                                tamanhoNome: z.string(),
                                quantidadePlanejada: z.number().int(),
                                quantidadeDirecionada: z.number().int(),
                                quantidadeSobra: z.number().int(),
                                quantidadeDisponivel: z.number().int()
                            }))
                        })
                    }
                }
            },
            404: {
                description: 'Lote não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /lotes-producao/{id} - Atualizar lote de produção
    registry.registerPath({
        method: 'put',
        path: '/lotes-producao/{id}',
        tags: [TAG_LOTES],
        summary: 'Atualizar lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateLoteProducaoSchema.shape.body
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
                description: 'Lote de produção atualizado',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /lotes-producao/{id}/items - Adicionar items ao lote
    registry.registerPath({
        method: 'post',
        path: '/lotes-producao/{id}/items',
        tags: [TAG_LOTES],
        summary: 'Adicionar items ao lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: addLoteItemsSchema.shape.body
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
                description: 'Items adicionados ao lote',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /lotes-producao/{id}/rolos - Adicionar rolos ao lote
    registry.registerPath({
        method: 'post',
        path: '/lotes-producao/{id}/rolos',
        tags: [TAG_LOTES],
        summary: 'Adicionar rolos ao lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: addRolosLoteSchema.shape.body
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
                description: 'Rolos adicionados ao lote',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /lotes-producao/{id}/rolos/{estoqueRoloId} - Remover rolo do lote
    registry.registerPath({
        method: 'delete',
        path: '/lotes-producao/{id}/rolos/{estoqueRoloId}',
        tags: [TAG_LOTES],
        summary: 'Remover rolo do lote de produção',
        request: {
            params: z.object({
                id: z.uuid(),
                estoqueRoloId: z.uuid()
            })
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Rolo removido do lote',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote ou rolo não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /lotes-producao/{id} - Deletar lote de produção
    registry.registerPath({
        method: 'delete',
        path: '/lotes-producao/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Deletar lote de produção (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lote de produção deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /direcionamentos - Criar direcionamentos
    registry.registerPath({
        method: 'post',
        path: '/direcionamentos',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Criar direcionamentos',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createDirecionamentoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Direcionamentos criados com sucesso',
                content: {
                    'application/json': {
                        schema: z.array(direcionamentoSchema)
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

    // POST /direcionamentos/producao-interna - Criar remessa interna + conferência automática
    registry.registerPath({
        method: 'post',
        path: '/direcionamentos/producao-interna',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Criar remessa interna com conferência automática',
        description: 'Cria um direcionamento para facção interna e já cria conferência aprovada automaticamente.',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createDirecionamentoInternoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            201: {
                description: 'Remessa interna e conferência criadas com sucesso',
                content: {
                    'application/json': {
                        schema: z.object({
                            direcionamento: direcionamentoSchema,
                            conferencia: conferenciaSchema
                        })
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

    // GET /direcionamentos - Listar direcionamentos
    registry.registerPath({
        method: 'get',
        path: '/direcionamentos',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Listar direcionamentos com filtros',
        description: 'Lista direcionamentos (remessas) com suporte a filtros por status e facção. Suporta multiselect: ?status=separado&status=em_producao ou ?status=separado,em_producao',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                status: multiValueQuerySchema.describe('Filtrer por status: separado, em_producao, entregue'),
                faccaoId: multiValueQuerySchema.describe('Filtrar por ID da facção'),
                page: z.string().optional().describe('Número da página (padrão: 1)'),
                limit: z.string().optional().describe('Itens por página (padrão: 10)')
            }).partial()
        },
        responses: {
            200: {
                description: 'Lista de direcionamentos',
                content: {
                    'application/json': {
                        schema: paginatedDirecionamentosSchema
                    }
                }
            }
        }
    });

    // GET /direcionamentos/prontas - Listar remessas prontas
    registry.registerPath({
        method: 'get',
        path: '/direcionamentos/prontas',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Listar remessas prontas (entregues)',
        description: 'Lista direcionamentos (remessas) com status entregue (prontas para conferência de pagamento)',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                page: z.string().optional().describe('Número da página (padrão: 1)'),
                limit: z.string().optional().describe('Itens por página (padrão: 10)')
            }).partial()
        },
        responses: {
            200: {
                description: 'Lista de remessas prontas',
                content: {
                    'application/json': {
                        schema: paginatedDirecionamentosSchema
                    }
                }
            }
        }
    });

    // GET /direcionamentos/{id} - Buscar direcionamento por ID
    registry.registerPath({
        method: 'get',
        path: '/direcionamentos/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Buscar direcionamento por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Direcionamento encontrado',
                content: {
                    'application/json': {
                        schema: direcionamentoSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /direcionamentos/{id} - Atualizar remessa (status separado)
    registry.registerPath({
        method: 'put',
        path: '/direcionamentos/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Atualizar remessa (itens, facção e tipo de serviço)',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateDirecionamentoSchema.shape.body
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
                description: 'Direcionamento atualizado',
                content: {
                    'application/json': {
                        schema: direcionamentoSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /direcionamentos/{id}/status - Atualizar status do direcionamento
    registry.registerPath({
        method: 'put',
        path: '/direcionamentos/{id}/itens',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Editar itens da remessa (adicionar/remover)',
        description: 'Permite adicionar e remover quantidades por estoqueCorteId em uma remessa com status separado.',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateDirecionamentoItemsSchema.shape.body
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
                description: 'Itens da remessa atualizados',
                content: {
                    'application/json': {
                        schema: direcionamentoSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /direcionamentos/{id}/status - Atualizar status do direcionamento
    registry.registerPath({
        method: 'put',
        path: '/direcionamentos/{id}/status',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Atualizar status da remessa',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateDirecionamentoStatusSchema.shape.body
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
                description: 'Status atualizado',
                content: {
                    'application/json': {
                        schema: direcionamentoSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /direcionamentos/{id}/skuPrice - Atualizar preço por SKU
    registry.registerPath({
        method: 'put',
        path: '/direcionamentos/{id}/skuPrice',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Atualizar preço da facção por SKU',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateDirecionamentoSkuPriceSchema.shape.body
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
                description: 'Preço por SKU atualizado',
                content: {
                    'application/json': {
                        schema: direcionamentoSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /direcionamentos/{id} - Deletar direcionamento
    registry.registerPath({
        method: 'delete',
        path: '/direcionamentos/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Deletar direcionamento (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Direcionamento deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /conferencias - Criar conferência
    registry.registerPath({
        method: 'post',
        path: '/conferencias',
        tags: [TAG_CONFERENCIAS],
        summary: 'Criar conferência',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createConferenciaSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Conferência criada com sucesso',
                content: {
                    'application/json': {
                        schema: conferenciaSchema
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

    // GET /conferencias - Listar conferências
    registry.registerPath({
        method: 'get',
        path: '/conferencias',
        tags: [TAG_CONFERENCIAS],
        summary: 'Listar conferências',
        request: {
            query: z.object({
                page: z.coerce.number().int().positive().optional().describe('Número da página (padrão: 1)'),
                limit: z.coerce.number().int().positive().optional().describe('Itens por página (padrão: 10)'),
                statusQualidade: z.enum(['recebido', 'em_conferencia', 'aprovado', 'aprovado_parcial', 'aprovado_defeito']).optional().describe('Filtro por status da qualidade'),
                liberadoPagamento: z.coerce.boolean().optional().describe('Filtro por liberação de pagamento'),
                isProducaoInterna: z.coerce.boolean().optional().describe('Filtrar conferências internas/externas'),
                direcionamentoId: z.string().uuid().optional().describe('Filtrar por direcionamento'),
                faccaoId: z.string().uuid().optional().describe('Filtrar por facção do direcionamento'),
                responsavelId: z.string().uuid().optional().describe('Filtrar por responsável da conferência'),
                dataInicio: z.string().optional().describe('Data inicial (YYYY-MM-DD ou datetime ISO)'),
                dataFim: z.string().optional().describe('Data final (YYYY-MM-DD ou datetime ISO)')
            }).partial()
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de conferências',
                content: {
                    'application/json': {
                        schema: paginatedConferenciasSchema
                    }
                }
            }
        }
    });

    // GET /conferencias/aprovadas - Listar conferências aprovadas e aprovadas com defeito
    registry.registerPath({
        method: 'get',
        path: '/conferencias/aprovadas',
        tags: [TAG_CONFERENCIAS],
        summary: 'Listar conferências aprovadas e aprovadas com defeito',
        description: 'Retorna somente conferências com status de qualidade aprovado ou aprovado_defeito.',
        request: {
            query: z.object({
                page: z.coerce.number().int().positive().optional().describe('Número da página (padrão: 1)'),
                limit: z.coerce.number().int().positive().optional().describe('Itens por página (padrão: 10)'),
                liberadoPagamento: z.coerce.boolean().optional().describe('Filtro por liberação de pagamento'),
                isProducaoInterna: z.coerce.boolean().optional().describe('Filtrar conferências internas/externas'),
                direcionamentoId: z.string().uuid().optional().describe('Filtrar por direcionamento'),
                faccaoId: z.string().uuid().optional().describe('Filtrar por facção do direcionamento'),
                responsavelId: z.string().uuid().optional().describe('Filtrar por responsável da conferência'),
                dataInicio: z.string().optional().describe('Data inicial (YYYY-MM-DD ou datetime ISO)'),
                dataFim: z.string().optional().describe('Data final (YYYY-MM-DD ou datetime ISO)')
            }).partial()
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de conferências com status aprovado ou aprovado_defeito',
                content: {
                    'application/json': {
                        schema: paginatedConferenciasSchema
                    }
                }
            }
        }
    });

    // GET /conferencias/{id} - Buscar conferência por ID
    registry.registerPath({
        method: 'get',
        path: '/conferencias/{id}',
        tags: [TAG_CONFERENCIAS],
        summary: 'Buscar conferência por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Conferência encontrada',
                content: {
                    'application/json': {
                        schema: conferenciaSchema
                    }
                }
            },
            404: {
                description: 'Conferência não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /conferencias/{id} - Atualizar conferência
    registry.registerPath({
        method: 'put',
        path: '/conferencias/{id}',
        tags: [TAG_CONFERENCIAS],
        summary: 'Atualizar conferência',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateConferenciaSchema.shape.body,
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
                description: 'Conferência atualizada',
                content: {
                    'application/json': {
                        schema: conferenciaSchema
                    }
                }
            },
            404: {
                description: 'Conferência não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /conferencias/{id} - Deletar conferência
    registry.registerPath({
        method: 'delete',
        path: '/conferencias/{id}',
        tags: [TAG_CONFERENCIAS],
        summary: 'Deletar conferência (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Conferência deletada',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Conferência não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    registry.registerPath({
        method: 'get',
        path: '/conferencias/relatorio/produtividade',
        tags: [TAG_CONFERENCIAS],
        summary: 'Relatório de produtividade de conferências',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Relatório de produtividade',
                content: {
                    'application/json': {
                        schema: relatorioProdutividadeSchema
                    }
                }
            }
        }
    });
}

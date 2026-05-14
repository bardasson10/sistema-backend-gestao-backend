import { Router } from "express";
import { validateSchema } from "./middlewares/validateSchema";
import { isAuthenticated } from "./middlewares/isAuthenticated";
import { isAdmin } from "./middlewares/IsAdmin";
import { isManagerOrAdmin } from "./middlewares/IsManagerOrAdmin";

// User Controllers
import { CreateUserController } from "./controllers/user/CreateUserController";
import { AuthenticateUserController } from "./controllers/user/AuthUserController";
import { LogoutUserController } from "./controllers/user/LogoutUserController";
import { ListAllUserController } from "./controllers/user/ListAllUserController";
import { ListByIdUserController } from "./controllers/user/ListByIdUserController";
import { UpdateUserController } from "./controllers/user/UpdateUserController";
import { authenticateUserSchema, createUserSchema, updateUserSchema } from "./schemas/userSchemas";

// Produto Controllers
import { CreateTipoProdutoController, ListAllTipoProdutoController, ListByIdTipoProdutoController, UpdateTipoProdutoController, DeleteTipoProdutoController } from "./controllers/produto/TipoProdutoController";
import { CreateTamanhoController, ListAllTamanhoController, ListByIdTamanhoController, UpdateTamanhoController, DeleteTamanhoController } from "./controllers/produto/TamanhoController";
import { CreateProdutoController, ListAllProdutoController, ListByIdProdutoController, UpdateProdutoController, DeleteProdutoController } from "./controllers/produto/ProdutoController";
import { CreateTipoProdutoTamanhoController, ListTipoProdutoTamanhoController, DeleteTipoProdutoTamanhoController } from "./controllers/produto/TipoProdutoTamanhoController";
import { createTipoProdutoSchema, updateTipoProdutoSchema, createTamanhoSchema, updateTamanhoSchema, createProdutoSchema, updateProdutoSchema, createTipoProdutoTamanhoSchema, deleteTipoProdutoTamanhoSchema } from "./schemas/produtoSchemas";

// Material Controllers
import { CreateFornecedorController, ListAllFornecedorController, ListByIdFornecedorController, UpdateFornecedorController, DeleteFornecedorController } from "./controllers/material/FornecedorController";
import { CreateCorController, ListAllCorController, ListByIdCorController, UpdateCorController, DeleteCorController } from "./controllers/material/CorController";
import { CreateTecidoController, ListAllTecidoController, ListByIdTecidoController, UpdateTecidoController, DeleteTecidoController } from "./controllers/material/TecidoController";
import { createFornecedorSchema, updateFornecedorSchema, createCorSchema, updateCorSchema, createTecidoSchema, updateTecidoSchema } from "./schemas/materialSchemas";

// Estoque Controllers
import { CreateEstoqueRoloController, ListAllEstoqueRoloController, ListByIdEstoqueRoloController, UpdateEstoqueRoloController, DeleteEstoqueRoloController, GetRelatorioEstoqueController, GetResumoEstoqueRolosController } from "./controllers/estoque/EstoqueRoloController";
import { CreateMovimentacaoEstoqueController, ListAllMovimentacaoEstoqueController, ListByIdMovimentacaoEstoqueController, GetHistoricoRoloController } from "./controllers/estoque/MovimentacaoEstoqueController";
import { ListAllEstoqueCorteController, ListByIdEstoqueCorteController, AjusteEstoqueCorteController } from "./controllers/estoque/EstoqueCorteController";
import { createEstoqueRoloSchema, updateEstoqueRoloSchema, createMovimentacaoEstoqueSchema, listEstoqueCorteSchema, ajusteEstoqueCorteSchema, listEstoqueRolosSchema, getResumoEstoqueRolosSchema } from "./schemas/estoqueSchemas";

// Produção Controllers
import { CreateFaccaoController, ListAllFaccaoController, ListByIdFaccaoController, UpdateFaccaoController, DeleteFaccaoController } from "./controllers/producao/FaccaoController";
import { CreateLoteProducaoController, ListAllLoteProducaoController, ListByIdLoteProducaoController, UpdateLoteProducaoController, AddLoteItemsController, AddRolosLoteController, RemoveRoloLoteController, DeleteLoteProducaoController, ResumoPorCorLoteController } from "./controllers/producao/LoteProducaoController";
import {
	CreateDirecionamentoController,
	CreateDirecionamentoInternoController,
	ListAllDirecionamentoController,
	ListByIdDirecionamentoController,
	UpdateDirecionamentoController,
	EditDirecionamentoItemsController,
	UpdateDirecionamentoStatusController,
	UpdateDirecionamentoSkuPriceController,
	DeleteDirecionamentoController,
	ListarGradesSobraController,
	ListRemessasProntasController
} from "./controllers/producao/DirecionamentoController";
import { CreateConferenciaController, ListAllConferenciaController, ListAprovadasConferenciaController, ListByIdConferenciaController, UpdateConferenciaController, DeleteConferenciaController, GetRelatorioProdutividadeController } from "./controllers/producao/ConferenciaController";
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
	listConferenciaSchema,
	listConferenciaAprovadasSchema,
	removeRoloLoteSchema
} from "./schemas/producaoSchemas";


const router = Router();

// ==================== USUÁRIOS ====================
router.post("/users", validateSchema(createUserSchema), new CreateUserController().handle);
router.post("/session", validateSchema(authenticateUserSchema), new AuthenticateUserController().handle);
router.post("/logout", isAuthenticated, new LogoutUserController().handle);
router.get("/users/all", isAuthenticated, new ListAllUserController().handle);
router.get("/user/me", isAuthenticated, new ListByIdUserController().handle);
router.get("/user/:id", isAuthenticated, isAdmin, new ListByIdUserController().handle);
router.put("/user/:id", isAuthenticated, isAdmin,validateSchema(updateUserSchema), new UpdateUserController().handle);

// ==================== TIPOS DE PRODUTO ====================
router.post("/tipos-produto", isAuthenticated, validateSchema(createTipoProdutoSchema), new CreateTipoProdutoController().handle);
router.get("/tipos-produto", isAuthenticated, new ListAllTipoProdutoController().handle);
router.get("/tipos-produto/:id", isAuthenticated, new ListByIdTipoProdutoController().handle);
router.put("/tipos-produto/:id", isAuthenticated, validateSchema(updateTipoProdutoSchema), new UpdateTipoProdutoController().handle);
router.delete("/tipos-produto/:id", isAuthenticated, isAdmin, new DeleteTipoProdutoController().handle);

// ==================== TAMANHOS ====================
router.post("/tamanhos", isAuthenticated, validateSchema(createTamanhoSchema), new CreateTamanhoController().handle);
router.get("/tamanhos", isAuthenticated, new ListAllTamanhoController().handle);
router.get("/tamanhos/:id", isAuthenticated, new ListByIdTamanhoController().handle);
router.put("/tamanhos/:id", isAuthenticated, validateSchema(updateTamanhoSchema), new UpdateTamanhoController().handle);
router.delete("/tamanhos/:id", isAuthenticated, isAdmin, new DeleteTamanhoController().handle);

// ==================== PRODUTOS ====================
router.post("/produtos", isAuthenticated, validateSchema(createProdutoSchema), new CreateProdutoController().handle);
router.get("/produtos", isAuthenticated, new ListAllProdutoController().handle);
router.get("/produtos/:id", isAuthenticated, new ListByIdProdutoController().handle);
router.put("/produtos/:id", isAuthenticated, validateSchema(updateProdutoSchema), new UpdateProdutoController().handle);
router.delete("/produtos/:id", isAuthenticated, isAdmin, new DeleteProdutoController().handle);

// ==================== TIPO PRODUTO TAMANHO ====================
router.post("/tipos-produto-tamanho", isAuthenticated, validateSchema(createTipoProdutoTamanhoSchema), new CreateTipoProdutoTamanhoController().handle);
router.get("/tipos-produto/:tipoProdutoId/tamanhos", isAuthenticated, new ListTipoProdutoTamanhoController().handle);
router.delete("/tipos-produto-tamanho/:idProduto", isAuthenticated, isAdmin, validateSchema(deleteTipoProdutoTamanhoSchema), new DeleteTipoProdutoTamanhoController().handle);

// ==================== FORNECEDORES ====================
router.post("/fornecedores", isAuthenticated, validateSchema(createFornecedorSchema), new CreateFornecedorController().handle);
router.get("/fornecedores", isAuthenticated, new ListAllFornecedorController().handle);
router.get("/fornecedores/:id", isAuthenticated, new ListByIdFornecedorController().handle);
router.put("/fornecedores/:id", isAuthenticated, validateSchema(updateFornecedorSchema), new UpdateFornecedorController().handle);
router.delete("/fornecedores/:id", isAuthenticated, isAdmin, new DeleteFornecedorController().handle);

// ==================== CORES ====================
router.post("/cores", isAuthenticated, validateSchema(createCorSchema), new CreateCorController().handle);
router.get("/cores", isAuthenticated, new ListAllCorController().handle);
router.get("/cores/:id", isAuthenticated, new ListByIdCorController().handle);
router.put("/cores/:id", isAuthenticated, validateSchema(updateCorSchema), new UpdateCorController().handle);
router.delete("/cores/:id", isAuthenticated, isAdmin, new DeleteCorController().handle);

// ==================== TECIDOS ====================
router.post("/tecidos", isAuthenticated, validateSchema(createTecidoSchema), new CreateTecidoController().handle);
router.get("/tecidos", isAuthenticated, new ListAllTecidoController().handle);
router.get("/tecidos/:id", isAuthenticated, new ListByIdTecidoController().handle);
router.put("/tecidos/:id", isAuthenticated, validateSchema(updateTecidoSchema), new UpdateTecidoController().handle);
router.delete("/tecidos/:id", isAuthenticated, isAdmin, new DeleteTecidoController().handle);

// ==================== ESTOQUE ROLO ====================
router.post("/estoque-rolos", isAuthenticated, validateSchema(createEstoqueRoloSchema), new CreateEstoqueRoloController().handle);
router.get("/estoque-rolos/resumo", isAuthenticated, validateSchema(getResumoEstoqueRolosSchema), new GetResumoEstoqueRolosController().handle);
router.get("/estoque-rolos/relatorio/geral", isAuthenticated, validateSchema(listEstoqueRolosSchema), new GetRelatorioEstoqueController().handle);
router.get("/estoque-rolos", isAuthenticated, validateSchema(listEstoqueRolosSchema), new ListAllEstoqueRoloController().handle);
router.get("/estoque-rolos/:id", isAuthenticated, new ListByIdEstoqueRoloController().handle);
router.put("/estoque-rolos/:id", isAuthenticated, validateSchema(updateEstoqueRoloSchema), new UpdateEstoqueRoloController().handle);
router.delete("/estoque-rolos/:id", isAuthenticated, isAdmin, new DeleteEstoqueRoloController().handle);

// ==================== MOVIMENTAÇÃO ESTOQUE ====================
router.post("/movimentacoes-estoque", isAuthenticated, validateSchema(createMovimentacaoEstoqueSchema), new CreateMovimentacaoEstoqueController().handle);
router.get("/movimentacoes-estoque", isAuthenticated, new ListAllMovimentacaoEstoqueController().handle);
router.get("/movimentacoes-estoque/:id", isAuthenticated, new ListByIdMovimentacaoEstoqueController().handle);
router.get("/movimentacoes-estoque/:estoqueRoloId/historico", isAuthenticated, new GetHistoricoRoloController().handle);

// ==================== ESTOQUE DE CORTE ====================
router.get("/estoque-corte", isAuthenticated, validateSchema(listEstoqueCorteSchema), new ListAllEstoqueCorteController().handle);
router.get("/estoque-corte/:id", isAuthenticated, new ListByIdEstoqueCorteController().handle);
router.patch("/estoque-corte/ajuste", isAuthenticated, isManagerOrAdmin, validateSchema(ajusteEstoqueCorteSchema), new AjusteEstoqueCorteController().handle);

// ==================== FACÇÕES ====================
router.post("/faccoes", isAuthenticated, validateSchema(createFaccaoSchema), new CreateFaccaoController().handle);
router.get("/faccoes", isAuthenticated, new ListAllFaccaoController().handle);
router.get("/faccoes/:id", isAuthenticated, new ListByIdFaccaoController().handle);
router.put("/faccoes/:id", isAuthenticated, validateSchema(updateFaccaoSchema), new UpdateFaccaoController().handle);
router.delete("/faccoes/:id", isAuthenticated, isAdmin, new DeleteFaccaoController().handle);

// ==================== LOTES DE PRODUÇÃO ====================
router.post("/lotes-producao", isAuthenticated, validateSchema(createLoteProducaoSchema), new CreateLoteProducaoController().handle);
router.get("/lotes-producao/resumo-por-cor", isAuthenticated, new ResumoPorCorLoteController().handle);
router.get("/lotes-producao", isAuthenticated, new ListAllLoteProducaoController().handle);
router.get("/lotes-producao/:id", isAuthenticated, new ListByIdLoteProducaoController().handle);
router.put("/lotes-producao/:id", isAuthenticated, validateSchema(updateLoteProducaoSchema), new UpdateLoteProducaoController().handle);
router.post("/lotes-producao/:id/items", isAuthenticated, validateSchema(addLoteItemsSchema), new AddLoteItemsController().handle);
router.post("/lotes-producao/:id/rolos", isAuthenticated, validateSchema(addRolosLoteSchema), new AddRolosLoteController().handle);
router.delete("/lotes-producao/:id/rolos/:estoqueRoloId", isAuthenticated, validateSchema(removeRoloLoteSchema), new RemoveRoloLoteController().handle);
router.delete("/lotes-producao/:id", isAuthenticated, isAdmin, new DeleteLoteProducaoController().handle);

// ==================== DIRECIONAMENTOS ====================
router.post("/direcionamentos", isAuthenticated, validateSchema(createDirecionamentoSchema), new CreateDirecionamentoController().handle);
router.post("/direcionamentos/producao-interna", isAuthenticated, validateSchema(createDirecionamentoInternoSchema), new CreateDirecionamentoInternoController().handle);
router.get("/direcionamentos", isAuthenticated, new ListAllDirecionamentoController().handle);
router.get("/direcionamentos/prontas", isAuthenticated, new ListRemessasProntasController().handle);
router.get("/direcionamentos/:id", isAuthenticated, new ListByIdDirecionamentoController().handle);
router.put("/direcionamentos/:id", isAuthenticated, validateSchema(updateDirecionamentoSchema), new UpdateDirecionamentoController().handle);
router.put("/direcionamentos/:id/itens", isAuthenticated, validateSchema(updateDirecionamentoItemsSchema), new EditDirecionamentoItemsController().handle);
router.put("/direcionamentos/:id/status", isAuthenticated, validateSchema(updateDirecionamentoStatusSchema), new UpdateDirecionamentoStatusController().handle);
router.put("/direcionamentos/:id/skuPrice", isAuthenticated, validateSchema(updateDirecionamentoSkuPriceSchema), new UpdateDirecionamentoSkuPriceController().handle);
router.delete("/direcionamentos/:id", isAuthenticated, isAdmin, new DeleteDirecionamentoController().handle);
router.get("/lotes/:loteId/sobras", isAuthenticated, new ListarGradesSobraController().handle);

// ==================== CONFERÊNCIAS ====================
router.post("/conferencias", isAuthenticated, validateSchema(createConferenciaSchema), new CreateConferenciaController().handle);
router.get("/conferencias", isAuthenticated, validateSchema(listConferenciaSchema), new ListAllConferenciaController().handle);
router.get("/conferencias/aprovadas", isAuthenticated, validateSchema(listConferenciaAprovadasSchema), new ListAprovadasConferenciaController().handle);
router.get("/conferencias/:id", isAuthenticated, new ListByIdConferenciaController().handle);
router.put("/conferencias/:id", isAuthenticated, validateSchema(updateConferenciaSchema), new UpdateConferenciaController().handle);
router.delete("/conferencias/:id", isAuthenticated, isAdmin, new DeleteConferenciaController().handle);
router.get("/conferencias/relatorio/produtividade", isAuthenticated, new GetRelatorioProdutividadeController().handle);

export { router };
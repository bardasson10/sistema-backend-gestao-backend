import { Request, Response } from "express";
import { CreateEstoqueRoloService, ListAllEstoqueRoloService, ListByIdEstoqueRoloService, UpdateEstoqueRoloService, DeleteEstoqueRoloService, GetRelatorioEstoqueService, GetResumoEstoqueRolosService } from "../../services/estoque/EstoqueRoloService";

class CreateEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const { tecidoId, dataLote, rolos, situacao } = req.body;
        const usuarioId = req.userId; // Pega o ID do usuário autenticado
        
        const resultado = await new CreateEstoqueRoloService().execute({
            tecidoId,
            dataLote,
            rolos,
            situacao,
            usuarioId
        });

        return res.status(201).json(resultado);
    }
}

class ListAllEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const { tecidoId, situacao, page, limit, estoqueRoloId, fornecedorId, corId, tipoMovimentacao, dataInicio, dataFim, excludeTipoProdutoNome } = req.query;
        const rolos = await new ListAllEstoqueRoloService().execute(
            tecidoId as string,
            situacao as string,
            page as string | number | undefined,
            limit as string,
            estoqueRoloId as string,
            fornecedorId as string,
            corId as string,
            tipoMovimentacao as string,
            dataInicio as string,
            dataFim as string,
            excludeTipoProdutoNome as string | undefined
        );
        return res.json(rolos);
    }
}

class ListByIdEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const rolo = await new ListByIdEstoqueRoloService().execute(id);
        return res.json(rolo);
    }
}

class UpdateEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { pesoAtualKg, situacao, codigoBarraRolo } = req.body;
        const usuarioId = req.userId;
        const rolo = await new UpdateEstoqueRoloService().execute(id, {
            pesoAtualKg,
            situacao,
            usuarioId,
            codigoBarraRolo
        });
        return res.json(rolo);
    }
}

class DeleteEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteEstoqueRoloService().execute(id);
        return res.json(result);
    }
}

class GetRelatorioEstoqueController {
    async handle(req: Request, res: Response) {
        const { tecidoId, situacao, estoqueRoloId, fornecedorId, corId, tipoMovimentacao, dataInicio, dataFim, page, limit, excludeTipoProdutoNome } = req.query;
        const relatorio = await new GetRelatorioEstoqueService().execute(
            tecidoId as string,
            situacao as string,
            estoqueRoloId as string,
            fornecedorId as string,
            corId as string,
            tipoMovimentacao as string,
            dataInicio as string,
            dataFim as string,
            page as string | number | undefined,
            limit as string | number | undefined,
            excludeTipoProdutoNome as string | undefined
        );
        return res.json(relatorio);
    }
}

class GetResumoEstoqueRolosController {
    async handle(req: Request, res: Response) {
        const { fornecedorId, tecidoId, corId, page, limit, estoqueRoloId, tipoMovimentacao, dataInicio, dataFim, excludeTipoProdutoNome } = req.query;
        const resumo = await new GetResumoEstoqueRolosService().execute(
            fornecedorId as string,
            tecidoId as string,
            corId as string,
            page as string | number | undefined,
            limit as string | number | undefined,
            estoqueRoloId as string,
            tipoMovimentacao as string,
            dataInicio as string,
            dataFim as string,
            excludeTipoProdutoNome as string | undefined
        );
        return res.json(resumo);
    }
}

export { CreateEstoqueRoloController, ListAllEstoqueRoloController, ListByIdEstoqueRoloController, UpdateEstoqueRoloController, DeleteEstoqueRoloController, GetRelatorioEstoqueController, GetResumoEstoqueRolosController };

import { Request, Response } from "express";
import { CreateProdutoService, ListAllProdutoService, ListByIdProdutoService, UpdateProdutoService, DeleteProdutoService } from "../../services/produto/ProdutoService";

class CreateProdutoController {
    async handle(req: Request, res: Response) {
        const { tipoProdutoId, nome, sku, fabricante, custoMedioPeca, precoMedioVenda } = req.body;
        const produto = await new CreateProdutoService().execute({
            tipoProdutoId,
            nome,
            sku,
            fabricante,
            custoMedioPeca,
            precoMedioVenda
        });
        return res.status(201).json(produto);
    }
}

class ListAllProdutoController {
    async handle(req: Request, res: Response) {
        const { tipoProdutoId, tipoProdutoNome, page, limit } = req.query;
        const produtos = await new ListAllProdutoService().execute(
            tipoProdutoId as string,
            page as string | number | undefined,
            limit as string | number | undefined,
            tipoProdutoNome as string
        );
        return res.json(produtos);
    }
}

class ListByIdProdutoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const produto = await new ListByIdProdutoService().execute(id);
        return res.json(produto);
    }
}

class UpdateProdutoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { tipoProdutoId, nome, sku, fabricante, custoMedioPeca, precoMedioVenda } = req.body;
        const produto = await new UpdateProdutoService().execute(id, {
            tipoProdutoId,
            nome,
            sku,
            fabricante,
            custoMedioPeca,
            precoMedioVenda
        });
        return res.json(produto);
    }
}

class DeleteProdutoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteProdutoService().execute(id);
        return res.json(result);
    }
}

export { CreateProdutoController, ListAllProdutoController, ListByIdProdutoController, UpdateProdutoController, DeleteProdutoController };

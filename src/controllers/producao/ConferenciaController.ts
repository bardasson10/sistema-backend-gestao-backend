import { Request, Response } from "express";
import { CreateConferenciaService, ListAllConferenciaService, ListByIdConferenciaService, UpdateConferenciaService, DeleteConferenciaService, GetRelatorioProdutividadeService } from "../../services/producao/ConferenciaService";

class CreateConferenciaController {
    async handle(req: Request, res: Response) {
        const { direcionamentoId, responsavelId, dataConferencia, statusQualidade, produtoSKU, liberadoPagamento, observacao, items } = req.body;

        const conferencia = await new CreateConferenciaService().execute({
            direcionamentoId,
            responsavelId,
            dataConferencia,
            statusQualidade,
            produtoSKU,
            liberadoPagamento,
            observacao,
            items
        });
        return res.status(201).json(conferencia);
    }
}

class ListAllConferenciaController {
    async handle(req: Request, res: Response) {
        const {
            statusQualidade,
            liberadoPagamento,
            isProducaoInterna,
            direcionamentoId,
            faccaoId,
            responsavelId,
            dataInicio,
            dataFim,
            page,
            limit
        } = req.query;

        const statusQualidadeFiltro = typeof statusQualidade === "string" ? statusQualidade : undefined;
        const liberadoPagamentoFiltro =
            typeof liberadoPagamento === "string"
                ? liberadoPagamento === "true"
                    ? true
                    : liberadoPagamento === "false"
                        ? false
                        : undefined
                : undefined;

        const isProducaoInternaFiltro =
            typeof isProducaoInterna === "string"
                ? isProducaoInterna === "true"
                    ? true
                    : isProducaoInterna === "false"
                        ? false
                        : undefined
                : undefined;

        const conferencias = await new ListAllConferenciaService().execute(
            statusQualidadeFiltro,
            liberadoPagamentoFiltro,
            isProducaoInternaFiltro,
            direcionamentoId as string | undefined,
            faccaoId as string | undefined,
            responsavelId as string | undefined,
            dataInicio as string | undefined,
            dataFim as string | undefined,
            page as string | number | undefined,
            limit as string | number | undefined
        );
        return res.json(conferencias);
    }
}

class ListAprovadasConferenciaController {
    async handle(req: Request, res: Response) {
        const {
            liberadoPagamento,
            isProducaoInterna,
            direcionamentoId,
            faccaoId,
            responsavelId,
            dataInicio,
            dataFim,
            page,
            limit
        } = req.query;

        const liberadoPagamentoFiltro =
            typeof liberadoPagamento === "string"
                ? liberadoPagamento === "true"
                    ? true
                    : liberadoPagamento === "false"
                        ? false
                        : undefined
                : undefined;

        const isProducaoInternaFiltro =
            typeof isProducaoInterna === "string"
                ? isProducaoInterna === "true"
                    ? true
                    : isProducaoInterna === "false"
                        ? false
                        : undefined
                : undefined;

        const conferencias = await new ListAllConferenciaService().execute(
            undefined,
            liberadoPagamentoFiltro,
            isProducaoInternaFiltro,
            direcionamentoId as string | undefined,
            faccaoId as string | undefined,
            responsavelId as string | undefined,
            dataInicio as string | undefined,
            dataFim as string | undefined,
            page as string | number | undefined,
            limit as string | number | undefined,
            true
        );
        return res.json(conferencias);
    }
}

class ListByIdConferenciaController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const conferencia = await new ListByIdConferenciaService().execute(id);
        return res.json(conferencia);
    }
}

class UpdateConferenciaController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { direcionamentoId, responsavelId, dataConferencia, statusQualidade, produtoSKU, liberadoPagamento, observacao, items } = req.body;
        const conferencia = await new UpdateConferenciaService().execute(id, {
            direcionamentoId,
            responsavelId,
            dataConferencia,
            statusQualidade,
            produtoSKU,
            liberadoPagamento,
            observacao,
            items
        });
        return res.json(conferencia);
    }
}

class DeleteConferenciaController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteConferenciaService().execute(id);
        return res.json(result);
    }
}

class GetRelatorioProdutividadeController {
    async handle(req: Request, res: Response) {
        const { dataInicio, dataFim } = req.query;
        const relatorio = await new GetRelatorioProdutividadeService().execute(
            dataInicio as string,
            dataFim as string
        );
        return res.json(relatorio);
    }
}

export { CreateConferenciaController, ListAllConferenciaController, ListAprovadasConferenciaController, ListByIdConferenciaController, UpdateConferenciaController, DeleteConferenciaController, GetRelatorioProdutividadeController };

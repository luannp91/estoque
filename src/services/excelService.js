const ExcelJS = require("exceljs-hardened");
const ProdutoRepository = require("../repositories/produtoRepository");
const MovimentacaoRepository = require("../repositories/movimentacaoRepository");
const RelatorioService = require("./relatorioService");

// ==================== PALETA CORPORATIVA ====================
const CORES = {
    tituloBg: "FF0F172A",
    primaria: "FF1E40AF",
    primariaClara: "FF2563EB",
    headerTexto: "FFFFFFFF",
    texto: "FF1E293B",
    textoSuave: "FF64748B",
    altRow: "FFF8FAFC",
    borda: "FFE2E8F0",
    cinzaSuave: "FFF1F5F9",
    sucesso: "FF16A34A",
    alerta: "FFF59E0B",
    perigo: "FFDC2626",
    branco: "FFFFFFFF",
    perigoBg: "FFFEF2F2",
    sucessoBg: "FFF0FDF4"
};

const FONTE = "Calibri";
const FMT_MOEDA = '"R$" #,##0.00';
const FMT_DATA = "dd/mm/yyyy hh:mm";

class ExcelService {
    constructor() {
        this.relatorio = new RelatorioService();
        this.produtoRepo = new ProdutoRepository();
        this.movRepo = new MovimentacaoRepository();
    }

    async gerarBuffer(filtros = {}) {
        const wb = this._construirWorkbook(filtros);
        return await wb.xlsx.writeBuffer();
    }

    // ==================== MONTAGEM ====================
    _construirWorkbook(filtros) {
        const wb = new ExcelJS.Workbook();
        wb.creator = "Sistema de Estoque";
        wb.lastModifiedBy = "Sistema de Estoque";
        wb.created = new Date();
        wb.modified = new Date();
        wb.company = "Sistema de Estoque";
        wb.subject = "Relatório de Estoque";
        wb.title = "Relatório Executivo de Estoque";
        wb.keywords = "estoque, relatório, executivo, produtos";

        // ─── Coleta de dados ───
        const resumo = this.relatorio.resumoGeral();
        const estoqueBaixo = this.relatorio.estoqueBaixo();
        const top = this.relatorio.topProdutos(10);
        const movs = this.relatorio.movimentacoesPorPeriodo(filtros.inicio, filtros.fim);
        const porCategoria = this.relatorio.distribuicaoCategoria();
        const movsPorDia = this.relatorio.movsPorDia(filtros.inicio, filtros.fim);

        const produtos = this.produtoRepo.listar({
            pagina: 1,
            limite: 100000,
            ordenar: "nome",
            ordem: "asc"
        }).itens;

        const movimentacoes = this.movRepo.listar({
            data_inicio: filtros.inicio ? filtros.inicio + " 00:00:00" : null,
            data_fim: filtros.fim ? filtros.fim + " 23:59:59" : null,
            pagina: 1,
            limite: 100000
        }).itens;

        // ─── Monta as 6 abas ───
        this._sheetResumo(wb, resumo, movs, porCategoria);
        this._sheetProdutos(wb, produtos);
        this._sheetMovimentacoes(wb, movimentacoes, movs);
        this._sheetTop(wb, top);
        this._sheetEstoqueBaixo(wb, estoqueBaixo);
        this._sheetGraficos(wb, top, porCategoria, movsPorDia);

        return wb;
    }

    // ==================== HELPERS DE ESTILO ====================
    _borda(cor = CORES.borda) {
        return {
            top: { style: "thin", color: { argb: cor } },
            left: { style: "thin", color: { argb: cor } },
            bottom: { style: "thin", color: { argb: cor } },
            right: { style: "thin", color: { argb: cor } }
        };
    }

    _aplicarBorda(cell, cor = CORES.borda) {
        cell.border = this._borda(cor);
    }

    _tituloSecao(cell, texto) {
        cell.value = texto;
        cell.font = { name: FONTE, size: 11, bold: true, color: { argb: CORES.primaria } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.cinzaSuave } };
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        this._aplicarBorda(cell);
    }

    _cabecalhoTabela(ws, rowIdx, colInicio, valores) {
        for (let i = 0; i < valores.length; i++) {
            const cell = ws.getCell(rowIdx, colInicio + i);
            cell.value = valores[i];
            cell.font = { name: FONTE, size: 10, bold: true, color: { argb: CORES.headerTexto } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.primaria } };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
            this._aplicarBorda(cell, CORES.primaria);
        }
        ws.getRow(rowIdx).height = 24;
    }

    _linhaDados(ws, rowIdx, colInicio, valores, bg = CORES.branco) {
        for (let i = 0; i < valores.length; i++) {
            const def = typeof valores[i] === "object" && valores[i] !== null ? valores[i] : { v: valores[i] };

            const cell = ws.getCell(rowIdx, colInicio + i);
            cell.value = def.v ?? "";
            cell.font = {
                name: FONTE,
                size: 10,
                color: { argb: def.cor || CORES.texto },
                bold: !!def.bold
            };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
            cell.alignment = {
                vertical: "middle",
                horizontal: def.align || "left",
                wrapText: true
            };
            if (def.numFmt) cell.numFmt = def.numFmt;
            this._aplicarBorda(cell);
        }
        ws.getRow(rowIdx).height = 20;
    }

    _blocoCabecalho(ws, ultimaCol) {
        for (let row = 1; row <= 3; row++) {
            for (let col = 1; col <= ultimaCol; col++) {
                ws.getCell(row, col).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: CORES.tituloBg }
                };
            }
        }

        ws.mergeCells(1, 1, 1, ultimaCol);
        const t1 = ws.getCell(1, 1);
        t1.value = "SISTEMA DE ESTOQUE";
        t1.font = { name: FONTE, size: 18, bold: true, color: { argb: CORES.headerTexto } };
        t1.alignment = { vertical: "middle", horizontal: "center" };

        ws.mergeCells(2, 1, 2, ultimaCol);
        const t2 = ws.getCell(2, 1);
        t2.value = "Relatório Executivo de Estoque";
        t2.font = { name: FONTE, size: 11, italic: true, color: { argb: "FF94A3B8" } };
        t2.alignment = { vertical: "middle", horizontal: "center" };

        ws.mergeCells(3, 1, 3, ultimaCol);
        const t3 = ws.getCell(3, 1);
        t3.value = `Gerado em ${new Date().toLocaleString("pt-BR")}`;
        t3.font = { name: FONTE, size: 9, color: { argb: CORES.headerTexto } };
        t3.alignment = { vertical: "middle", horizontal: "center" };

        ws.getRow(1).height = 34;
        ws.getRow(2).height = 20;
        ws.getRow(3).height = 16;
    }

    _subtituloLinha3(ws, texto) {
        const t3 = ws.getCell(3, 1);
        t3.value = texto;
    }

    _celulaTotal(ws, row, col, valor, numFmt) {
        const c = ws.getCell(row, col);
        c.value = valor;
        c.font = { name: FONTE, size: 10, bold: true, color: { argb: CORES.headerTexto } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.primaria } };
        c.alignment = { vertical: "middle", horizontal: numFmt ? "right" : "center" };
        if (numFmt) c.numFmt = numFmt;
        this._aplicarBorda(c, CORES.primaria);
    }

    // ==================== ABA 1: RESUMO EXECUTIVO ====================
    _sheetResumo(wb, resumo, movs, porCategoria) {
        const ws = wb.addWorksheet("Resumo Executivo", { views: [{ showGridLines: false }] });

        ws.getColumn(1).width = 2;
        ws.getColumn(2).width = 24;
        ws.getColumn(3).width = 18;
        ws.getColumn(4).width = 18;
        ws.getColumn(5).width = 18;
        ws.getColumn(6).width = 18;
        ws.getColumn(7).width = 2;

        this._blocoCabecalho(ws, 7);
        this._subtituloLinha3(
            ws,
            `Período: ${movs.periodo.inicio}  a  ${movs.periodo.fim}     |     Gerado em ${new Date().toLocaleString("pt-BR")}`
        );

        ws.getRow(4).height = 8;

        ws.mergeCells(5, 2, 5, 6);
        this._tituloSecao(ws.getCell(5, 2), "INDICADORES PRINCIPAIS");
        ws.getRow(5).height = 26;

        const kpis = [
            { label: "TOTAL DE PRODUTOS", valor: resumo.total_produtos, fmt: "#,##0", cor: CORES.primaria },
            { label: "ITENS EM ESTOQUE", valor: resumo.total_itens, fmt: "#,##0", cor: CORES.sucesso },
            { label: "VALOR TOTAL", valor: resumo.valor_total, fmt: FMT_MOEDA, cor: CORES.primaria },
            { label: "ESTOQUE BAIXO", valor: resumo.estoque_baixo, fmt: "#,##0", cor: CORES.alerta },
            { label: "SEM ESTOQUE", valor: resumo.sem_estoque, fmt: "#,##0", cor: CORES.perigo }
        ];

        kpis.forEach((kpi, i) => {
            const col = 2 + i;

            const cLabel = ws.getCell(6, col);
            cLabel.value = kpi.label;
            cLabel.font = { name: FONTE, size: 8, bold: true, color: { argb: CORES.textoSuave } };
            cLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.cinzaSuave } };
            cLabel.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
            this._aplicarBorda(cLabel);

            const cVal = ws.getCell(7, col);
            cVal.value = kpi.valor;
            cVal.font = { name: FONTE, size: 15, bold: true, color: { argb: kpi.cor } };
            cVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.branco } };
            cVal.alignment = { vertical: "middle", horizontal: "center" };
            cVal.numFmt = kpi.fmt;
            this._aplicarBorda(cVal);
        });

        ws.getRow(6).height = 24;
        ws.getRow(7).height = 30;
        ws.getRow(8).height = 10;

        ws.mergeCells(9, 2, 9, 4);
        this._tituloSecao(ws.getCell(9, 2), "DISTRIBUIÇÃO POR CATEGORIA");
        ws.getRow(9).height = 26;

        this._cabecalhoTabela(ws, 10, 2, ["Categoria", "Qtd. Produtos", "% do Total"]);

        const totalCat = porCategoria.reduce((s, c) => s + c.total, 0) || 1;
        let r = 11;
        porCategoria.forEach((c, i) => {
            const bg = i % 2 === 0 ? CORES.branco : CORES.altRow;
            this._linhaDados(
                ws,
                r,
                2,
                [
                    { v: c.categoria, align: "left" },
                    { v: c.total, align: "center", numFmt: "#,##0" },
                    { v: c.total / totalCat, align: "center", numFmt: "0.0%" }
                ],
                bg
            );
            r++;
        });

        r += 1;
        ws.mergeCells(r, 2, r, 4);
        this._tituloSecao(ws.getCell(r, 2), "MOVIMENTAÇÕES NO PERÍODO");
        ws.getRow(r).height = 26;
        r++;

        this._cabecalhoTabela(ws, r, 2, ["Tipo", "Qtde. Movimentos", "Total de Itens"]);
        r++;

        const tipos = ["entrada", "saida", "ajuste", "cadastro", "remocao"];
        const coresTipo = {
            entrada: CORES.sucesso,
            saida: CORES.perigo,
            ajuste: CORES.primaria,
            cadastro: CORES.primariaClara,
            remocao: CORES.textoSuave
        };

        tipos.forEach((tipo, i) => {
            const item = movs.resumo.find((m) => m.tipo === tipo) || { total: 0, soma_qtd: 0 };
            const bg = i % 2 === 0 ? CORES.branco : CORES.altRow;
            this._linhaDados(
                ws,
                r,
                2,
                [
                    {
                        v: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                        align: "left",
                        cor: coresTipo[tipo],
                        bold: true
                    },
                    { v: item.total, align: "center", numFmt: "#,##0" },
                    { v: item.soma_qtd, align: "center", numFmt: "#,##0" }
                ],
                bg
            );
            r++;
        });

        r += 1;
        ws.mergeCells(r, 1, r, 7);
        const rodape = ws.getCell(r, 1);
        rodape.value = "Documento gerado automaticamente pelo Sistema de Estoque";
        rodape.font = { name: FONTE, size: 8, italic: true, color: { argb: CORES.textoSuave } };
        rodape.alignment = { horizontal: "center" };

        ws.pageSetup = {
            paperSize: 9,
            orientation: "portrait",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        };
        ws.headerFooter = { oddFooter: "&L&Sistema de Estoque&C&Página &P de &N&R&D &T" };
    }

    // ==================== ABA 2: PRODUTOS ====================
    _sheetProdutos(wb, produtos) {
        const ws = wb.addWorksheet("Produtos");

        ws.getColumn(1).width = 6;
        ws.getColumn(2).width = 36;
        ws.getColumn(3).width = 14;
        ws.getColumn(4).width = 18;
        ws.getColumn(5).width = 14;
        ws.getColumn(6).width = 10;
        ws.getColumn(7).width = 14;
        ws.getColumn(8).width = 16;
        ws.getColumn(9).width = 14;

        this._cabecalhoTabela(ws, 1, 1, [
            "ID",
            "Nome do Produto",
            "SKU",
            "Categoria",
            "Preço (R$)",
            "Qtd.",
            "Estoque Mín.",
            "Valor Total (R$)",
            "Status"
        ]);

        ws.views = [{ state: "frozen", ySplit: 1 }];
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 9 } };

        let totalValor = 0;
        let totalQtd = 0;

        produtos.forEach((p, i) => {
            const valorTotal = p.preco * p.quantidade;
            totalValor += valorTotal;
            totalQtd += p.quantidade;

            let status = "OK";
            let corStatus = CORES.sucesso;
            if (p.quantidade === 0) {
                status = "SEM ESTOQUE";
                corStatus = CORES.perigo;
            } else if (p.estoqueBaixo) {
                status = "BAIXO";
                corStatus = CORES.alerta;
            }

            const bg = i % 2 === 0 ? CORES.branco : CORES.altRow;
            this._linhaDados(
                ws,
                i + 2,
                1,
                [
                    { v: p.id, align: "center" },
                    { v: p.nome, align: "left" },
                    { v: p.sku || "—", align: "center" },
                    { v: p.categoria_nome || "Sem categoria", align: "left" },
                    { v: p.preco, align: "right", numFmt: FMT_MOEDA },
                    { v: p.quantidade, align: "center", numFmt: "#,##0" },
                    { v: p.estoque_minimo, align: "center", numFmt: "#,##0" },
                    { v: valorTotal, align: "right", numFmt: FMT_MOEDA, bold: true },
                    { v: status, align: "center", cor: corStatus, bold: true }
                ],
                bg
            );
        });

        const rTotal = produtos.length + 2;
        ws.mergeCells(rTotal, 1, rTotal, 4);
        const cTotLabel = ws.getCell(rTotal, 1);
        cTotLabel.value = `TOTAL (${produtos.length} produtos)`;

        for (let c = 1; c <= 4; c++) {
            const cell = ws.getCell(rTotal, c);
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.primaria } };
            this._aplicarBorda(cell, CORES.primaria);
        }
        cTotLabel.font = { name: FONTE, size: 10, bold: true, color: { argb: CORES.headerTexto } };
        cTotLabel.alignment = { vertical: "middle", horizontal: "right" };

        this._celulaTotal(ws, rTotal, 5, "", null);
        this._celulaTotal(ws, rTotal, 6, totalQtd, "#,##0");
        this._celulaTotal(ws, rTotal, 7, "", null);
        this._celulaTotal(ws, rTotal, 8, totalValor, FMT_MOEDA);
        this._celulaTotal(ws, rTotal, 9, "", null);

        ws.getRow(rTotal).height = 24;

        ws.pageSetup = {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        };
        ws.headerFooter = {
            oddHeader: "&L&Sistema de Estoque&RLista de Produtos",
            oddFooter: "&LArquivo: Produtos&C&Página &P de &N&R&D &T"
        };
    }

    // ==================== ABA 3: MOVIMENTAÇÕES ====================
    _sheetMovimentacoes(wb, movimentacoes, movs) {
        const ws = wb.addWorksheet("Movimentações");

        ws.getColumn(1).width = 18;
        ws.getColumn(2).width = 30;
        ws.getColumn(3).width = 12;
        ws.getColumn(4).width = 10;
        ws.getColumn(5).width = 10;
        ws.getColumn(6).width = 10;
        ws.getColumn(7).width = 18;
        ws.getColumn(8).width = 40;

        this._blocoCabecalho(ws, 8);
        this._subtituloLinha3(
            ws,
            `Período: ${movs.periodo.inicio} a ${movs.periodo.fim}  |  Total: ${movimentacoes.length} movimentação(ões)`
        );

        ws.getRow(4).height = 8;

        this._cabecalhoTabela(ws, 5, 1, [
            "Data",
            "Produto",
            "Tipo",
            "Qtd.",
            "Antes",
            "Depois",
            "Usuário",
            "Observação"
        ]);

        ws.views = [{ state: "frozen", ySplit: 5 }];

        const coresTipo = {
            entrada: CORES.sucesso,
            saida: CORES.perigo,
            ajuste: CORES.primaria,
            cadastro: CORES.primariaClara,
            remocao: CORES.textoSuave
        };

        movimentacoes.forEach((m, i) => {
            const bg = i % 2 === 0 ? CORES.branco : CORES.altRow;
            this._linhaDados(
                ws,
                i + 6,
                1,
                [
                    { v: new Date(m.criado_em), align: "center", numFmt: FMT_DATA },
                    { v: m.produto_nome || "—", align: "left" },
                    { v: m.tipo.toUpperCase(), align: "center", cor: coresTipo[m.tipo] || CORES.texto, bold: true },
                    { v: m.quantidade, align: "center", numFmt: "#,##0" },
                    { v: m.quantidade_anterior, align: "center", numFmt: "#,##0" },
                    { v: m.quantidade_nova, align: "center", numFmt: "#,##0" },
                    { v: m.usuario_nome || "—", align: "left" },
                    { v: m.observacao || "—", align: "left" }
                ],
                bg
            );
        });

        ws.pageSetup = {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        };
        ws.headerFooter = {
            oddHeader: "&L&Sistema de Estoque&RHistórico de Movimentações",
            oddFooter: "&LArquivo: Movimentações&C&Página &P de &N&R&D &T"
        };
    }

    // ==================== ABA 4: TOP PRODUTOS ====================
    _sheetTop(wb, top) {
        const ws = wb.addWorksheet("Top Produtos");

        ws.getColumn(1).width = 12;
        ws.getColumn(2).width = 36;
        ws.getColumn(3).width = 14;
        ws.getColumn(4).width = 10;
        ws.getColumn(5).width = 20;
        ws.getColumn(6).width = 14;

        this._blocoCabecalho(ws, 6);
        this._subtituloLinha3(
            ws,
            `Top 10 Produtos por Valor em Estoque  |  Gerado em ${new Date().toLocaleString("pt-BR")}`
        );

        ws.getRow(4).height = 8;

        ws.mergeCells(5, 1, 5, 6);
        this._tituloSecao(ws.getCell(5, 1), "RANKING DE PRODUTOS");
        ws.getRow(5).height = 26;

        this._cabecalhoTabela(ws, 6, 1, [
            "Posição",
            "Produto",
            "Preço (R$)",
            "Qtd.",
            "Valor em Estoque (R$)",
            "% do Top 10"
        ]);

        const totalTop = top.reduce((s, p) => s + p.preco * p.quantidade, 0) || 1;

        top.forEach((p, i) => {
            const posicao = i + 1;
            const valorTotal = p.preco * p.quantidade;
            const bg = i % 2 === 0 ? CORES.branco : CORES.altRow;
            const medalha = posicao === 1 ? "🥇" : posicao === 2 ? "🥈" : posicao === 3 ? "🥉" : "";
            const destaque = posicao <= 3;

            this._linhaDados(
                ws,
                i + 7,
                1,
                [
                    {
                        v: `${medalha} ${posicao}º`,
                        align: "center",
                        bold: destaque,
                        cor: destaque ? CORES.alerta : CORES.texto
                    },
                    { v: p.nome, align: "left", bold: destaque },
                    { v: p.preco, align: "right", numFmt: FMT_MOEDA },
                    { v: p.quantidade, align: "center", numFmt: "#,##0" },
                    { v: valorTotal, align: "right", numFmt: FMT_MOEDA, bold: true },
                    { v: valorTotal / totalTop, align: "center", numFmt: "0.0%" }
                ],
                bg
            );
        });

        ws.pageSetup = {
            paperSize: 9,
            orientation: "portrait",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        };
        ws.headerFooter = {
            oddHeader: "&L&Sistema de Estoque&RTop Produtos",
            oddFooter: "&LArquivo: Top Produtos&C&Página &P de &N&R&D &T"
        };
    }

    // ==================== ABA 5: ESTOQUE BAIXO ====================
    _sheetEstoqueBaixo(wb, produtos) {
        const ws = wb.addWorksheet("Estoque Baixo");

        ws.getColumn(1).width = 6;
        ws.getColumn(2).width = 34;
        ws.getColumn(3).width = 18;
        ws.getColumn(4).width = 12;
        ws.getColumn(5).width = 14;
        ws.getColumn(6).width = 12;
        ws.getColumn(7).width = 26;

        this._blocoCabecalho(ws, 7);
        this._subtituloLinha3(
            ws,
            `Produtos em situação crítica  |  Total: ${produtos.length} produto(s)  |  Gerado em ${new Date().toLocaleString("pt-BR")}`
        );

        ws.getRow(4).height = 8;

        ws.mergeCells(5, 1, 5, 7);
        this._tituloSecao(ws.getCell(5, 1), "⚠  ALERTAS DE ESTOQUE");
        ws.getRow(5).height = 26;

        this._cabecalhoTabela(ws, 6, 1, [
            "ID",
            "Produto",
            "Categoria",
            "Qtd. Atual",
            "Estoque Mín.",
            "Faltando",
            "Ação Sugerida"
        ]);

        if (!produtos.length) {
            ws.mergeCells(7, 1, 7, 7);
            const cell = ws.getCell(7, 1);
            cell.value = "✓ Nenhum produto em situação crítica.";
            cell.font = { name: FONTE, size: 11, italic: true, color: { argb: CORES.sucesso } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.sucessoBg } };
            this._aplicarBorda(cell, CORES.sucesso);
            ws.getRow(7).height = 30;
        } else {
            produtos.forEach((p, i) => {
                const faltando = Math.max(0, p.estoque_minimo - p.quantidade);
                const critico = p.quantidade === 0;
                const acao = critico ? "URGENTE: Repor imediatamente" : "Repor em breve";
                const bg = critico ? CORES.perigoBg : i % 2 === 0 ? CORES.branco : CORES.altRow;

                this._linhaDados(
                    ws,
                    i + 7,
                    1,
                    [
                        { v: p.id, align: "center" },
                        { v: p.nome, align: "left", bold: true },
                        { v: p.categoria_nome || "—", align: "left" },
                        {
                            v: p.quantidade,
                            align: "center",
                            numFmt: "#,##0",
                            cor: critico ? CORES.perigo : CORES.alerta,
                            bold: true
                        },
                        { v: p.estoque_minimo, align: "center", numFmt: "#,##0" },
                        { v: faltando, align: "center", numFmt: "#,##0", cor: CORES.perigo, bold: true },
                        { v: acao, align: "left", cor: critico ? CORES.perigo : CORES.textoSuave, bold: critico }
                    ],
                    bg
                );
            });
        }

        ws.pageSetup = {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        };
        ws.headerFooter = {
            oddHeader: "&L&Sistema de Estoque&RAlertas de Estoque",
            oddFooter: "&LArquivo: Estoque Baixo&C&Página &P de &N&R&D &T"
        };
    }

    // ==================== ABA 6: GRÁFICOS NATIVOS ====================
    _sheetGraficos(wb, top, porCategoria, movsPorDia) {
        const ws = wb.addWorksheet("Gráficos");

        ws.getColumn(1).width = 30;
        ws.getColumn(2).width = 18;
        ws.getColumn(3).width = 18;
        ws.getColumn(4).width = 18;
        ws.getColumn(5).width = 18;
        ws.getColumn(6).width = 18;

        // ============ BLOCO 1: Top Produtos ============
        ws.getCell("A1").value = "DADOS PARA GRÁFICO 1 — TOP PRODUTOS";
        ws.getCell("A1").font = { bold: true, size: 11, color: { argb: CORES.primaria } };

        ws.getCell("A2").value = "Produto";
        ws.getCell("B2").value = "Valor em Estoque (R$)";
        ws.getCell("A2").font = { bold: true };
        ws.getCell("B2").font = { bold: true };

        top.forEach((p, i) => {
            ws.getCell(`A${3 + i}`).value = p.nome;
            ws.getCell(`B${3 + i}`).value = p.preco * p.quantidade;
            ws.getCell(`B${3 + i}`).numFmt = FMT_MOEDA;
        });

        const fimTop = 2 + top.length;

        // Tenta inserir gráfico nativo; se não suportado, segue sem quebrar
        this._tentarAddChart(
            ws,
            "bar",
            {
                title: { name: "Top 10 Produtos por Valor em Estoque", color: { argb: CORES.primaria } },
                style: 10,
                width: 20,
                height: 12,
                series: [
                    {
                        name: "Valor",
                        labels: [top[0]?.nome || ""],
                        values: [`'Gráficos'!$B$3:$B$${fimTop}`]
                    }
                ],
                categories: [`'Gráficos'!$A$3:$A$${fimTop}`],
                catAxisTitle: "Produtos",
                valAxisTitle: "R$"
            },
            "D2",
            { tl: { col: 3, row: 1 }, br: { col: 12, row: 16 } }
        );

        // ============ BLOCO 2: Categorias ============
        const inicioCat = fimTop + 3;

        ws.getCell(`A${inicioCat}`).value = "DADOS PARA GRÁFICO 2 — CATEGORIAS";
        ws.getCell(`A${inicioCat}`).font = { bold: true, size: 11, color: { argb: CORES.primaria } };

        ws.getCell(`A${inicioCat + 1}`).value = "Categoria";
        ws.getCell(`B${inicioCat + 1}`).value = "Qtd. Produtos";
        ws.getCell(`A${inicioCat + 1}`).font = { bold: true };
        ws.getCell(`B${inicioCat + 1}`).font = { bold: true };

        porCategoria.forEach((c, i) => {
            ws.getCell(`A${inicioCat + 2 + i}`).value = c.categoria;
            ws.getCell(`B${inicioCat + 2 + i}`).value = c.total;
        });

        const fimCat = inicioCat + 1 + porCategoria.length;

        this._tentarAddChart(
            ws,
            "pie",
            {
                title: { name: "Distribuição por Categoria", color: { argb: CORES.primaria } },
                style: 10,
                width: 18,
                height: 12,
                series: [
                    {
                        name: "Qtd.",
                        values: [`'Gráficos'!$B$${inicioCat + 2}:$B$${fimCat}`]
                    }
                ],
                categories: [`'Gráficos'!$A$${inicioCat + 2}:$A$${fimCat}`]
            },
            "D20",
            { tl: { col: 3, row: 19 }, br: { col: 11, row: 33 } }
        );

        // ============ BLOCO 3: Movimentações por dia ============
        const inicioMov = fimCat + 3;

        ws.getCell(`A${inicioMov}`).value = "DADOS PARA GRÁFICO 3 — MOVIMENTAÇÕES POR DIA";
        ws.getCell(`A${inicioMov}`).font = { bold: true, size: 11, color: { argb: CORES.primaria } };

        ws.getCell(`A${inicioMov + 1}`).value = "Dia";
        ws.getCell(`B${inicioMov + 1}`).value = "Entradas";
        ws.getCell(`C${inicioMov + 1}`).value = "Saídas";
        ws.getCell(`A${inicioMov + 1}`).font = { bold: true };
        ws.getCell(`B${inicioMov + 1}`).font = { bold: true };
        ws.getCell(`C${inicioMov + 1}`).font = { bold: true };

        movsPorDia.forEach((m, i) => {
            ws.getCell(`A${inicioMov + 2 + i}`).value = m.dia;
            ws.getCell(`B${inicioMov + 2 + i}`).value = m.entradas;
            ws.getCell(`C${inicioMov + 2 + i}`).value = m.saidas;
        });

        const fimMov = inicioMov + 1 + movsPorDia.length;

        if (movsPorDia.length > 0) {
            this._tentarAddChart(
                ws,
                "line",
                {
                    title: { name: "Movimentações por Dia", color: { argb: CORES.primaria } },
                    style: 12,
                    width: 28,
                    height: 12,
                    series: [
                        {
                            name: "Entradas",
                            values: [`'Gráficos'!$B$${inicioMov + 2}:$B$${fimMov}`],
                            color: CORES.sucesso
                        },
                        { name: "Saídas", values: [`'Gráficos'!$C$${inicioMov + 2}:$C$${fimMov}`], color: CORES.perigo }
                    ],
                    categories: [`'Gráficos'!$A$${inicioMov + 2}:$A$${fimMov}`]
                },
                "D38",
                { tl: { col: 3, row: 37 }, br: { col: 15, row: 51 } }
            );
        }

        // Nota de rodapé
        const linhaRodape = fimMov + 3;
        ws.mergeCells(`A${linhaRodape}:F${linhaRodape}`);
        const rodape = ws.getCell(`A${linhaRodape}`);
        rodape.value =
            "Se os gráficos não aparecerem, selecione os dados acima e use Inserir → Gráfico no Excel/LibreOffice.";
        rodape.font = { size: 9, italic: true, color: { argb: CORES.textoSuave } };
        rodape.alignment = { horizontal: "center" };

        ws.pageSetup = {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0
        };
    }

    /**
     * Tenta adicionar um gráfico nativo ao worksheet.
     * Algumas versões/builds do exceljs não expõem `addChart` — nesse caso,
     * apenas ignora silenciosamente (os dados continuam disponíveis na aba).
     */
    _tentarAddChart(ws, tipo, config, posicao, extensao) {
        try {
            if (typeof ws.addChart !== "function") return;
            ws.addChart(tipo, config, posicao, extensao);
        } catch (err) {
            console.warn("⚠ Gráfico nativo indisponível nesta versão do exceljs:", err.message);
        }
    }
}

module.exports = ExcelService;

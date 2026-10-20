import * as fs from "fs";
import { DIR_DATA, ARQ_ORGANIZACOES, ARQ_LOTES, ARQ_EQUIPAMENTOS } from "../config/caminhos";
import { provisionar } from "../config/provisionamento";
import { autenticar } from "../auth/login";
import { executarOrganizacoes } from "../commands/organizacoes";
import { executarLotes } from "../commands/lotes";
import { executarEquipamentos } from "../commands/equipamentos";
import { RegraDeNegocioError } from "../models/erros";
import { Repositorio } from "../persistence/repositorio";
import { Organizacao } from "../models/organizacao";
import { Lote } from "../models/lote";


let passos = 0;
let falhas = 0;

function checar(descricao: string, condicao: boolean): void {
    passos++;
    if (condicao) console.log(`  OK  - ${descricao}`);
    else {
        falhas++;
        console.error(`  FALHA - ${descricao}`);
    }
}

function contarRegistros<T>(arquivo: string): number {
    return new Repositorio<T>(arquivo).carregar().length;
}

async function main(): Promise<void> {
    console.log("=== Cenários de falha ===\n");

    if (fs.existsSync(DIR_DATA)) fs.rmSync(DIR_DATA, { recursive: true, force: true });
    provisionar("SenhaAdmin123");
    const ctx = { usuario: "admin" };

    console.log("1) Login com senha incorreta");
    const loginFalho = autenticar("admin", "senhaErrada");
    checar("acesso negado, sem indicar se o usuário existe", !loginFalho.autenticado && loginFalho.papel === null);

    console.log("\n2) CNPJ inválido (dígitos verificadores não conferem)");
    const antesOrg = contarRegistros<Organizacao>(ARQ_ORGANIZACOES);
    try {
        executarOrganizacoes({ nome: "Empresa Teste", cnpj: "11.111.111/1111-11", tipo: "gerador" }, ctx);
        checar("organização com CNPJ inválido não é persistida", contarRegistros<Organizacao>(ARQ_ORGANIZACOES) === antesOrg);
    } catch (e) {
        checar("CNPJ inválido é rejeitado com RegraDeNegocioError", e instanceof RegraDeNegocioError);
    }

    console.log("\n3) CNPJ duplicado");
    const cnpjValido = "11.222.333/0001-81";
    executarOrganizacoes({ nome: "Empresa Válida", cnpj: cnpjValido, tipo: "gerador" }, ctx);
    const apos1a = contarRegistros<Organizacao>(ARQ_ORGANIZACOES);
    try {
        executarOrganizacoes({ nome: "Empresa Duplicada", cnpj: cnpjValido, tipo: "gerador" }, ctx);
        checar("segundo cadastro com mesmo CNPJ é rejeitado", contarRegistros<Organizacao>(ARQ_ORGANIZACOES) === apos1a);
    } catch (e) {
        checar("CNPJ duplicado é rejeitado com RegraDeNegocioError", e instanceof RegraDeNegocioError);
    }

    const org = new Repositorio<Organizacao>(ARQ_ORGANIZACOES).carregar().map((o) => Organizacao.deJSON(o))[0];

    console.log("\n4) Lote com data de entrada futura");
    const antesLote = contarRegistros<Lote>(ARQ_LOTES);
    try {
        executarLotes({ org: org.id, nf: "NF-FUTURA", transp: "Transp", data: "2099-01-01" }, ctx);
        checar("lote com data futura não é persistido", contarRegistros<Lote>(ARQ_LOTES) === antesLote);
    } catch (e) {
        checar("lote com data futura é rejeitado com RegraDeNegocioError", e instanceof RegraDeNegocioError);
    }

    console.log("\n5) Lote com data anterior a 90 dias");
    try {
        executarLotes({ org: org.id, nf: "NF-ANTIGA", transp: "Transp", data: "2020-01-01" }, ctx);
        checar("lote com data muito antiga não é persistido", contarRegistros<Lote>(ARQ_LOTES) === antesLote);
    } catch (e) {
        checar("lote com data muito antiga é rejeitado com RegraDeNegocioError", e instanceof RegraDeNegocioError);
    }

    console.log("\n6) Lote válido, para os próximos cenários");
    executarLotes({ org: org.id, nf: "NF-OK", transp: "Transp" }, ctx);
    const lote = new Repositorio<Lote>(ARQ_LOTES).carregar().map((l) => Lote.deJSON(l))[0];

    console.log("\n7) Desmonte sem triagem completa");
    executarEquipamentos("criar", { id: "GC-FALHA-01", lote: lote.id, tipo: "notebook", modelo: "X1", estado: "B_BOM" }, ctx);
    try {
        executarEquipamentos("desmonte", { id: "GC-FALHA-01" }, ctx);
        checar("desmonte sem triagem lança RegraDeNegocioError", false);
    } catch (e) {
        checar("desmonte sem triagem lança RegraDeNegocioError", e instanceof RegraDeNegocioError);
    }

    console.log("\n8) Queda de 2+ categorias no estado físico sem justificativa");
    executarEquipamentos("criar", { id: "GC-FALHA-02", lote: lote.id, tipo: "notebook", modelo: "X2", estado: "A_EXCELENTE" }, ctx);
    try {
        executarEquipamentos("estado", { id: "GC-FALHA-02", novo: "D_DANIFICADO" }, ctx);
        checar("queda de 3 categorias sem justificativa lança RegraDeNegocioError", false);
    } catch (e) {
        checar("queda de 3 categorias sem justificativa lança RegraDeNegocioError", e instanceof RegraDeNegocioError);
    }

    console.log("\n9) Mesma queda, agora com justificativa");
    try {
        executarEquipamentos("estado", { id: "GC-FALHA-02", novo: "D_DANIFICADO", justificativa: "Danos identificados na triagem visual." }, ctx);
        checar("queda de 3 categorias COM justificativa é aceita", true);
    } catch {
        checar("queda de 3 categorias COM justificativa é aceita", false);
    }

    console.log("\n10) Equipamento inexistente");
    const antesTriagem = contarRegistros<any>(ARQ_EQUIPAMENTOS);
    executarEquipamentos("triar", { id: "GC-NAO-EXISTE" }, ctx);
    checar("triagem de equipamento inexistente não altera dados (erro tratado via log)", contarRegistros<any>(ARQ_EQUIPAMENTOS) === antesTriagem);

    console.log(`\n=== Resultado: ${passos - falhas}/${passos} passos ok ===`);
    process.exitCode = falhas > 0 ? 1 : 0;
}

main();
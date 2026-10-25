import "./ambiente.js";
import * as fs from "fs";
import * as os from "os";
import { DIR_DATA, ARQ_ORGANIZACOES, ARQ_LOTES } from "../config/caminhos.js";
import { estaProvisionado, provisionar } from "../config/provisionamento.js";
import { autenticar } from "../auth/login.js";
import { executarOrganizacoes } from "../commands/organizacoes.js";
import { executarLotes } from "../commands/lotes.js";
import { executarEquipamentos } from "../commands/equipamentos.js";
import { executarRelatorios } from "../commands/relatorios.js";
import { verificarIntegridadeJournal } from "../persistence/journal.js";
import { Repositorio } from "../persistence/repositorio.js";
import { Organizacao } from "../models/organizacao.js";
import { Lote } from "../models/lote.js";

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

async function main(): Promise<void> {
  console.log("=== Jornada completa: provisionamento -> rastreabilidade ===\n");

  // Trava de segurança: o teste só apaga dados dentro da pasta temporária.
  if (!DIR_DATA.startsWith(os.tmpdir())) {
    throw new Error(`Teste recusado: DIR_DATA (${DIR_DATA}) está fora da pasta temporária.`);
  }

  if (fs.existsSync(DIR_DATA)) fs.rmSync(DIR_DATA, { recursive: true, force: true });

  console.log("1) Provisionamento inicial");
  checar("sistema começa não provisionado", !estaProvisionado());
  provisionar("SenhaAdmin123");
  checar("sistema fica provisionado", estaProvisionado());

  console.log("\n2) Login do administrador");
  const login = autenticar("admin", "SenhaAdmin123");
  checar("login com senha correta autentica", login.autenticado && login.papel === "administrador");
  const loginErrado = autenticar("admin", "senhaErrada");
  checar("login com senha errada é rejeitado", !loginErrado.autenticado);

  const ctx = { usuario: "admin" };

  console.log("\n3) Cadastro de organização (CNPJ válido de teste)");
  const cnpjTeste = "11.222.333/0001-81";
  executarOrganizacoes("criar", { nome: "Recicla Tech LTDA", cnpj: cnpjTeste, tipo: "gerador" }, ctx);

  const repoOrg = new Repositorio<Organizacao>(ARQ_ORGANIZACOES);
  const organizacao = repoOrg
    .carregar()
    .map((o) => Organizacao.deJSON(o))
    .find((o) => o.cnpj.replace(/\D/g, "") === cnpjTeste.replace(/\D/g, ""));
  checar("organização foi persistida e é encontrável pelo CNPJ", !!organizacao);
  if (!organizacao) return finalizar();

  console.log("\n4) Registro de lote");
  const nfTeste = "NF-TESTE-0001";
  executarLotes("criar", { org: organizacao.id, nf: nfTeste, transp: "TransRapida" }, ctx);

  const repoLote = new Repositorio<Lote>(ARQ_LOTES);
  const lote = repoLote.carregar().map((l) => Lote.deJSON(l)).find((l) => l.notaFiscal === nfTeste);
  checar("lote foi persistido e é encontrável pela nota fiscal", !!lote);
  if (!lote) return finalizar();

  console.log("\n5) Cadastro de equipamento e movimentações (ID sob nosso controle)");
  const idEquipamento = "GC-TESTE-0001";
  executarEquipamentos("criar", { id: idEquipamento, lote: lote.id, tipo: "notebook", modelo: "X1", estado: "B_BOM" }, ctx);
  executarEquipamentos("triar", { id: idEquipamento }, ctx);
  executarEquipamentos("desmonte", { id: idEquipamento }, ctx);

  console.log("\n6) Consulta de rastreabilidade após múltiplas movimentações");
  executarRelatorios("rastrear", { id: idEquipamento });

  console.log("\n7) Integridade do journal");
  checar("cadeia de hashes do journal está íntegra", verificarIntegridadeJournal() === -1);

  finalizar();
}

function finalizar(): void {
  console.log(`\n=== Resultado: ${passos - falhas}/${passos} passos ok ===`);
  process.exitCode = falhas > 0 ? 1 : 0;
}

main();
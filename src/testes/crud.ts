import "./ambiente.js";
import * as fs from "fs";
import * as os from "os";
import {
  DIR_DATA,
  ARQ_ORGANIZACOES,
  ARQ_CONTRATOS,
  ARQ_LOTES,
  ARQ_EQUIPAMENTOS,
} from "../config/caminhos.js";
import { provisionar } from "../config/provisionamento.js";
import { autenticar } from "../auth/login.js";
import { executarOrganizacoes } from "../commands/organizacoes.js";
import { executarContratos } from "../commands/contratos.js";
import { executarLotes } from "../commands/lotes.js";
import { executarEquipamentos } from "../commands/equipamentos.js";
import { executarUsuarios } from "../commands/usuarios.js";
import { RegraDeNegocioError } from "../models/erros.js";
import { Repositorio } from "../persistence/repositorio.js";
import { verificarIntegridadeJournal } from "../persistence/journal.js";
import { temPermissao } from "../auth/permissoes.js";

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

function carregar<T = any>(arquivo: string): T[] {
  return new Repositorio<T>(arquivo).carregar();
}

// Executa e informa se a operação foi barrada por regra de negócio.
function barrada(operacao: () => void): boolean {
  try {
    operacao();
    return false;
  } catch (e) {
    return e instanceof RegraDeNegocioError;
  }
}

async function main(): Promise<void> {
  console.log("=== CRUD completo de todas as entidades ===\n");

  // Trava de segurança: o teste só apaga dados dentro da pasta temporária.
  if (!DIR_DATA.startsWith(os.tmpdir())) {
    throw new Error(`Teste recusado: DIR_DATA (${DIR_DATA}) está fora da pasta temporária.`);
  }

  if (fs.existsSync(DIR_DATA)) fs.rmSync(DIR_DATA, { recursive: true, force: true });
  provisionar("SenhaAdmin123");
  const ctx = { usuario: "admin" };

  // ---------- Organização ----------
  console.log("1) Organização");
  executarOrganizacoes("criar", { nome: "Recicla Tech LTDA", cnpj: "11.222.333/0001-81", tipo: "gerador" }, ctx);
  const org = carregar(ARQ_ORGANIZACOES)[0];
  checar("criar persiste a organização", !!org);

  executarOrganizacoes("atualizar", { id: org.id, nome: "Recicla Tech Brasil", tipo: "desmontadora" }, ctx);
  const orgAtualizada = carregar(ARQ_ORGANIZACOES)[0];
  checar("atualizar altera nome e tipo", orgAtualizada.razosocial === "Recicla Tech Brasil" && orgAtualizada.tipo === "desmontadora");
  checar("atualizar preserva id e data de criação", orgAtualizada.id === org.id && orgAtualizada.criadoEm === org.criadoEm);
  checar("atualizar com CNPJ inválido é barrado", barrada(() => executarOrganizacoes("atualizar", { id: org.id, cnpj: "11.111.111/1111-11" }, ctx)));
  checar("CNPJ inválido não altera o registro", carregar(ARQ_ORGANIZACOES)[0].cnpj === org.cnpj);
  executarOrganizacoes("listar", {}, ctx);
  executarOrganizacoes("consultar", { id: org.id }, ctx);

  // ---------- Contrato ----------
  console.log("\n2) Contrato");
  executarContratos("criar", { org: "ORG-INEXISTENTE", inicio: "2026-01-01", fim: "2026-12-31" }, ctx);
  checar("contrato para organização inexistente não é criado", carregar(ARQ_CONTRATOS).length === 0);

  executarContratos("criar", { org: org.id, inicio: "2026-01-01", fim: "2026-12-31" }, ctx);
  const contrato = carregar(ARQ_CONTRATOS)[0];
  checar("criar persiste o contrato", !!contrato);

  executarContratos("atualizar", { id: contrato.id, fim: "2027-06-30", termos: "Termos renovados" }, ctx);
  const contratoAtual = carregar(ARQ_CONTRATOS)[0];
  checar("atualizar altera fim e termos", contratoAtual.dataFim === "2027-06-30" && contratoAtual.termos === "Termos renovados");
  checar("atualizar mantém o início", contratoAtual.dataInicio === "2026-01-01");
  checar("fim anterior ao início é barrado", barrada(() => executarContratos("atualizar", { id: contrato.id, fim: "2025-01-01" }, ctx)));
  executarContratos("listar", { org: org.id }, ctx);
  executarContratos("consultar", { id: contrato.id }, ctx);

  // ---------- Lote ----------
  console.log("\n3) Lote");
  executarLotes("criar", { org: "ORG-INEXISTENTE", nf: "NF-X", transp: "T" }, ctx);
  checar("lote para organização inexistente não é criado", carregar(ARQ_LOTES).length === 0);

  executarLotes("criar", { org: org.id, nf: "NF-0001", transp: "TransRapida" }, ctx);
  const lote = carregar(ARQ_LOTES)[0];
  checar("criar persiste o lote", !!lote);

  executarLotes("atualizar", { id: lote.id, transp: "LogExpress" }, ctx);
  checar("atualizar altera a transportadora", carregar(ARQ_LOTES)[0].transportadora === "LogExpress");
  checar("data futura na atualização é barrada", barrada(() => executarLotes("atualizar", { id: lote.id, data: "2099-01-01" }, ctx)));
  checar("data barrada não altera o lote", carregar(ARQ_LOTES)[0].dataEntrada === lote.dataEntrada);
  executarLotes("listar", { org: org.id }, ctx);
  executarLotes("consultar", { id: lote.id }, ctx);

  // ---------- Equipamento ----------
  console.log("\n4) Equipamento");
  executarEquipamentos("criar", { id: "GC-CRUD-00", lote: "LOT-INEXISTENTE", tipo: "notebook", modelo: "X" }, ctx);
  checar("equipamento para lote inexistente não é criado", carregar(ARQ_EQUIPAMENTOS).length === 0);

  executarEquipamentos("criar", { id: "GC-CRUD-01", lote: lote.id, tipo: "notebook", modelo: "X1" }, ctx);
  executarEquipamentos("criar", { id: "GC-CRUD-02", lote: lote.id, tipo: "monitor", modelo: "M2" }, ctx);
  checar("criar persiste os equipamentos", carregar(ARQ_EQUIPAMENTOS).length === 2);

  executarEquipamentos("atualizar", { id: "GC-CRUD-01", modelo: "X1 Pro" }, ctx);
  const eq1 = carregar(ARQ_EQUIPAMENTOS).find((e) => e.id === "GC-CRUD-01");
  checar("atualizar altera o modelo", eq1.modelo === "X1 Pro");
  checar("atualizar não mexe em estado nem status", eq1.estadoFisico === "B_BOM" && eq1.status === "recebido");
  executarEquipamentos("listar", { lote: lote.id }, ctx);
  executarEquipamentos("consultar", { id: "GC-CRUD-01" }, ctx);

  // ---------- Remoções e integridade referencial (de baixo para cima) ----------
  console.log("\n5) Remoção e integridade referencial");
  checar("não remove organização com contratos/lotes", barrada(() => executarOrganizacoes("remover", { id: org.id }, ctx)));
  checar("não remove lote com equipamentos", barrada(() => executarLotes("remover", { id: lote.id }, ctx)));

  executarEquipamentos("triar", { id: "GC-CRUD-01" }, ctx);
  checar("não remove equipamento já triado", barrada(() => executarEquipamentos("remover", { id: "GC-CRUD-01" }, ctx)));

  executarEquipamentos("remover", { id: "GC-CRUD-02" }, ctx);
  checar("remove equipamento recebido e sem movimentações", !carregar(ARQ_EQUIPAMENTOS).some((e) => e.id === "GC-CRUD-02"));

  executarEquipamentos("criar", { id: "GC-CRUD-03", lote: lote.id, tipo: "tablet", modelo: "T3" }, ctx);
  executarEquipamentos("remover", { id: "GC-CRUD-03" }, ctx);
  checar("remove equipamento recém-criado", !carregar(ARQ_EQUIPAMENTOS).some((e) => e.id === "GC-CRUD-03"));
  const antesInexistente = carregar(ARQ_EQUIPAMENTOS).length;
  executarEquipamentos("remover", { id: "GC-NAO-EXISTE" }, ctx);
  checar("remover id inexistente não altera os dados", carregar(ARQ_EQUIPAMENTOS).length === antesInexistente);

  // Para provar a remoção do lote e da organização, usamos entidades sem dependentes.
  executarLotes("criar", { org: org.id, nf: "NF-0002", transp: "Temp" }, ctx);
  const loteTemp = carregar(ARQ_LOTES).find((l) => l.notaFiscal === "NF-0002");
  executarLotes("remover", { id: loteTemp.id }, ctx);
  checar("remove lote sem equipamentos", !carregar(ARQ_LOTES).some((l) => l.id === loteTemp.id));

  executarContratos("remover", { id: contrato.id }, ctx);
  checar("remove contrato", carregar(ARQ_CONTRATOS).length === 0);

  executarOrganizacoes("criar", { nome: "Org Descartável", cnpj: "45.723.174/0001-10", tipo: "comprador" }, ctx);
  const orgTemp = carregar(ARQ_ORGANIZACOES).find((o) => o.razosocial === "Org Descartável");
  if (orgTemp) {
    executarOrganizacoes("remover", { id: orgTemp.id }, ctx);
    checar("remove organização sem vínculos", !carregar(ARQ_ORGANIZACOES).some((o) => o.id === orgTemp.id));
  } else {
    checar("organização descartável foi criada (CNPJ de teste válido)", false);
  }

  // ---------- Usuário ----------
  console.log("\n6) Usuário");
  executarUsuarios("criar", { usuario: "maria", senha: "SenhaMaria1", papel: "auditor" }, ctx);
  checar("usuário criado consegue logar", autenticar("maria", "SenhaMaria1").papel === "auditor");

  executarUsuarios("atualizar", { usuario: "maria", senha: "NovaSenha99", papel: "gestor_almoxarifado" }, ctx);
  checar("senha antiga deixa de funcionar", !autenticar("maria", "SenhaMaria1").autenticado);
  checar("senha nova funciona e papel mudou", autenticar("maria", "NovaSenha99").papel === "gestor_almoxarifado");
  checar("papel de administrador não pode ser alterado", barrada(() => executarUsuarios("atualizar", { usuario: "admin", papel: "auditor" }, ctx)));
  checar("administrador não pode ser removido", barrada(() => executarUsuarios("remover", { usuario: "admin" }, ctx)));
  executarUsuarios("listar", {}, ctx);

  executarUsuarios("remover", { usuario: "maria" }, ctx);
  checar("usuário removido não loga mais", !autenticar("maria", "NovaSenha99").autenticado);

  // ---------- Permissões e auditoria ----------
  console.log("\n7) Permissões e auditoria");
  checar("auditor pode consultar cadastros", temPermissao("auditor", "consultar_cadastros"));
  checar("auditor não pode cadastrar equipamento (somente leitura)", !temPermissao("auditor", "cadastrar_equipamento"));
  checar("journal íntegro após todas as operações de escrita", verificarIntegridadeJournal() === -1);

  console.log(`\n=== Resultado: ${passos - falhas}/${passos} passos ok ===`);
  process.exitCode = falhas > 0 ? 1 : 0;
}

main();
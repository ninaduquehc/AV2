import { Repositorio } from "../persistence/repositorio";
import { Organizacao } from "../models/organizacao";
import { FabricaEntidades } from "../models/fabrica";
import { ARQ_ORGANIZACOES } from "../config/caminhos";
import { log } from "../utils/logger";
import { registrarTransacao } from "../persistence/journal";

const repo = new Repositorio<Organizacao>(ARQ_ORGANIZACOES);

export function executarOrganizacoes(opcoes: Record<string, string>, ctx: { usuario: string }): void {
  const nome = opcoes["nome"];
  const cnpj = opcoes["cnpj"];
  const tipo = opcoes["tipo"] as any;

  if (!nome || !cnpj || !tipo) {
    log.erro("Uso: organizacao criar --nome <RAZAO_SOCIAL> --cnpj <CNPJ> --tipo <gerador|operador_logistico|desmontadora|comprador>");
    return;
  }

  const lista = repo.carregar();
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  if (lista.some((o) => o.cnpj.replace(/\D/g, "") === cnpjLimpo)) {
    log.erro("Já existe uma organização cadastrada com este CNPJ.");
    return;
  }

  const org = FabricaEntidades.criarOrganizacao(nome, cnpj, tipo);
  
  // Garante a chamada correta do método deJSON se necessário
  const novaLista = [...lista.map((item) => Organizacao.deJSON(item)), org];
  repo.salvar(novaLista);

  registrarTransacao(ctx.usuario, "cadastrar_organizacao", { id: org.id, cnpj: org.cnpj });
  log.sucesso(`Organização '${org.nome}' criada com sucesso! ID: ${org.id}`);
}
export interface ComandoParsed {
  acaoPrincipal: string;
  subAcao: string;
  opcoes: Record<string, string>;
  posicionais: string[];
}

export function parseLinhaComando(linha: string): ComandoParsed {
  // Regex para capturar argumentos mantendo os conteúdos entre aspas unidos
  const regex = /"[^"]*"|\S+/g;
  const partes = (linha.match(regex) || []).map((p) => p.replace(/^"|"$/g, ""));

  const acaoPrincipal = partes[0] || "";
  const subAcao = partes[1] && !partes[1].startsWith("--") ? partes[1] : "";

  const inicioOpcoes = subAcao ? 2 : 1;
  const opcoes: Record<string, string> = {};
  const posicionais: string[] = [];

  for (let i = inicioOpcoes; i < partes.length; i++) {
    const parte = partes[i];
    if (parte.startsWith("--")) {
      const chave = parte.slice(2);
      const proximo = partes[i + 1];
      if (proximo && !proximo.startsWith("--")) {
        opcoes[chave] = proximo;
        i++;
      } else {
        throw new Error(`A flag --${chave} precisa de um valor.`);
      }
    } else {
      posicionais.push(parte);
    }
  }

  return { acaoPrincipal, subAcao, opcoes, posicionais };
}
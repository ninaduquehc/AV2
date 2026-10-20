// Aceita apenas AAAA-MM-DD e rejeita datas inexistentes (ex.: 2026-02-31).
export function parseData(texto: string): Date | null {
  const limpo = texto.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(limpo)) return null;

  const data = new Date(limpo + "T00:00:00.000Z");
  if (isNaN(data.getTime())) return null;

  return data.toISOString().slice(0, 10) === limpo ? data : null;
}
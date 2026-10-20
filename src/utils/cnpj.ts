export function cnpjValido(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, "");

  if (numeros.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  const calcularDigito = (base: string, pesos: number[]): number => {
    const soma = base
      .split("")
      .reduce((acumulador, digito, indice) => acumulador + Number(digito) * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1 = calcularDigito(numeros.slice(0, 12), pesos1);
  const digito2 = calcularDigito(numeros.slice(0, 12) + digito1, pesos2);

  return numeros === numeros.slice(0, 12) + digito1.toString() + digito2.toString();
}
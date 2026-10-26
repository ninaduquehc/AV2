export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
  }
}

// Bloqueio otimista: o equipamento mudou desde que o cliente o leu.
export class ConflitoDeVersaoError extends AppError {
  constructor() {
    super('O equipamento foi modificado por outro usuário ou processo. Recarregue os dados e tente novamente.', 409);
  }
}
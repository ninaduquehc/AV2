import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { AppError } from '../models/erros.js';

export class UsuarioService {
  constructor(private repo = new UsuarioRepository()) {}

  async criar(data: { nome: string; email: string; senha: string; role?: Role }) {
    const emailNormalizado = data.email.trim().toLowerCase();

    const existe = await this.repo.findByEmail(emailNormalizado);
    if (existe) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    return this.repo.create({
      nome: data.nome,
      email: emailNormalizado,
      senha: senhaHash,
      role: data.role || 'OPERADOR',
    });
  }

  async listarTodos() {
    return this.repo.findAll();
  }

  async remover(id: string, usuarioLogadoId?: string) {
    if (usuarioLogadoId && usuarioLogadoId === id) {
      throw new AppError('Operação não permitida: você não pode remover seu próprio usuário.', 403);
    }

    const usuario = await this.repo.findById(id);
    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return this.repo.delete(id);
  }
}
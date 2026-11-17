import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { userRepository } from "../user/user.repository";
import { Rol } from "../user/user.model";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function generarToken(id: string, rol: Rol): string {
  return jwt.sign({ rol }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export const authService = {
  async registrar(datos: {
    nombre?: unknown;
    email?: unknown;
    password?: unknown;
  }) {
    const { nombre, email, password } = datos;

    // Validaciones de negocio
    if (typeof nombre !== "string" || nombre.trim().length < 2) {
      throw new AppError("El nombre es obligatorio (mínimo 2 caracteres)", 400);
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      throw new AppError("El email no es válido", 400);
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new AppError("La contraseña debe tener al menos 8 caracteres", 400);
    }

    if (await userRepository.findByEmail(email.trim())) {
      throw new AppError("El email ya está registrado", 409);
    }

    const hash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const user = await userRepository.create({
      nombre,
      email: email.trim(),
      password: hash,
    });

    return { user, token: generarToken(user.id, user.rol as Rol) };
  },

  async login(datos: { email?: unknown; password?: unknown }) {
    const { email, password } = datos;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      throw new AppError("Email y contraseña son obligatorio", 400);
    }

    const user = await userRepository.findByEmail(email.trim(), true);
    const coincide = user
      ? await bcrypt.compare(password, user.password as string)
      : false;

    if (!user || !coincide) {
      throw new AppError("Credenciales inválidas", 401);
    }

    return { user, token: generarToken(user.id, user.rol as Rol) };
  },
};

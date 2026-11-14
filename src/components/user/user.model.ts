import { Schema, model, InferSchemaType } from "mongoose";

export const ROLES = ["paciente", "admin"] as const;
export type Rol = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "El email no es válido"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      select: false,
    },
    rol: { type: String, enum: ROLES, default: "paciente" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { password, __v, ...rest } = ret as Record<string, unknown>;
        return rest;
      },
    },
  },
);

export type IUser = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);

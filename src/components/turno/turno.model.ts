import { Schema, model, InferSchemaType } from "mongoose";
import { ESPECIALIDADES, ESTADOS, ESTADOS_ACTIVOS } from "./turno.constants";

const turnoSchema = new Schema(
  {
    paciente: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El paciente es obligatorio"],
    },
    especialidad: {
      type: String,
      enum: { values: ESPECIALIDADES, messege: "Especialidad inválida" },
      required: [true, "La especialidad es obligatoria"],
    },
    fecha: { type: Date, required: [true, "La fecha es obligatoria"] },
    estado: { type: String, enum: ESTADOS, default: "pendiente" },
  },
  { timestamps: true },
);

// Indices únicos parciales: solo cuentan los turnos activos.
// 1) un solo turno por especialidad y horario
// 2) un paciente no puede tener dos turnos a la misma hora
const soloActivos = {
  partialFilterExpression: { estado: { $in: ESTADOS_ACTIVOS } },
};
turnoSchema.index(
  { especialidad: 1, fecha: 1 },
  { unique: true, ...soloActivos },
);
turnoSchema.index({ paciente: 1, fecha: 1 }, { unique: true, ...soloActivos });

export type Iturno = InferSchemaType<typeof turnoSchema>;
export const TurnoModel = model("Turno", turnoSchema);

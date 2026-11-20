export const ESPECIALIDADES = [
  "clinica-medica",
  "pediatria",
  "cardiologia",
  "dermatologia",
  "ginecologia",
  "traumatologia",
  "oftalmologia",
  "neurologia",
] as const;
export type Especialidad = (typeof ESPECIALIDADES)[number];

export const ESTADOS = [
  "pendiente",
  "confirmado",
  "cancelado",
  "atendido",
] as const;
export type Estado = (typeof ESTADOS)[number];

//Estados que ocupan un horario
export const ESTADOS_ACTIVOS: Estado[] = ["pendiente", "confirmado"];

// Desde qué estado se puede pasar a cuáles
export const TRANSICIONES: Record<Estado, Estado[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["atendido", "cancelado"],
  cancelado: [],
  atendido: [],
};

export const BLOQUE_MINUTOS = 30;
export const HORAS_MIN_CANCELACION = 2;

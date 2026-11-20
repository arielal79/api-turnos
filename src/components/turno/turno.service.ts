import { AppError } from "../../utils/app-error";
import { Rol } from "../user/user.model";
import { turnoRepository } from "./turno.repository";
import {
  BLOQUE_MINUTOS,
  ESPECIALIDADES,
  ESTADOS,
  Especialidad,
  Estado,
  HORAS_MIN_CANCELACION,
  TRANSICIONES,
} from "./turno.constants";

interface Usuario {
  id: string;
  rol: Rol;
}

const MSG_OCUPADO =
  "Ese horario ya está ocupado para la especialidad, o ya tienes un turno a esa hora";

// ----------helpers----------

// Devuelve el id tanto si el campo viene populado como si no
const idDe = (ref: unknown): string =>
  String((ref as { _id?: unknown })?._id ?? ref);

const definido = (valor: unknown) => valor !== undefined && valor !== "";

function parsearEspecialidad(valor: unknown): Especialidad {
  if (
    typeof valor !== "string" ||
    !(ESPECIALIDADES as readonly string[]).includes(valor)
  ) {
    throw new AppError(
      `Especialidad inválida. Opciones: ${ESPECIALIDADES.join(", ")}`,
      400,
    );
  }
  return valor as Especialidad;
}

function parsearEstado(valor: unknown): Estado {
  if (
    typeof valor !== "string" ||
    !(ESTADOS as readonly string[]).includes(valor)
  ) {
    throw new AppError(`Estado inválido. Opciones: ${ESTADOS.join(", ")}`, 400);
  }
  return valor as Estado;
}

function parsearFecha(valor: unknown): Date {
  const fecha =
    typeof valor === "string" || typeof valor === "number"
      ? new Date(valor)
      : new Date(NaN);
  if (isNaN(fecha.getTime())) {
    throw new AppError(
      "La fecha no es válida(formato ISO, ej: 2026-12-15T10:00:00-03:00)",
      400,
    );
  }
  return fecha;
}

// VALIDACIONES DE NEGOCIO sobre la fecha
function validarFechaNueva(fecha: Date) {
  if (fecha.getTime() <= Date.now()) {
    throw new AppError("La fecha del turno debe ser futura", 400);
  }
  const fueraDeBloque =
    fecha.getUTCMinutes() % BLOQUE_MINUTOS !== 0 ||
    fecha.getUTCSeconds() !== 0 ||
    fecha.getUTCMilliseconds() !== 0;
  if (fueraDeBloque) {
    throw new AppError(
      `La fecha debe coincidir con bloques de ${BLOQUE_MINUTOS} minutos (ej: 10:00, 10:30)`,
      400,
    );
  }
}

// VALIDACIONES DE NEGOCIO sobre el cambio de estado
function validarCambioDeEstado(
  user: Usuario,
  fecha: Date,
  actual: Estado,
  nuevo: Estado,
) {
  if (user.rol === "paciente" && nuevo !== "cancelado") {
    throw new AppError("Los pacientes solo pueden cancelar sus turnos", 403);
  }
  if (!TRANSICIONES[actual].includes(nuevo)) {
    throw new AppError(`No se puede pasar de "${actual}" a "${nuevo}"`, 409);
  }
  if (nuevo === "atendido" && fecha.getTime() > Date.now()) {
    throw new AppError("El turno aún no ocurrió", 400);
  }
  const msFaltantes = fecha.getTime() - Date.now();
  if (
    nuevo === "cancelado" &&
    user.rol === "paciente" &&
    msFaltantes < HORAS_MIN_CANCELACION * 3_600_000
  ) {
    throw new AppError(
      `Solo se puede cancelar con al menos ${HORAS_MIN_CANCELACION} horas de anticipación`,
      400,
    );
  }
}
// Si la base rechaza por índice único (código 11000), respondemos 409 con un mensaje claro
async function conControlDeConflicto<T>(
  operacion: () => Promise<T>,
): Promise<T> {
  try {
    return await operacion();
  } catch (error: any) {
    if (error?.code === 11000) throw new AppError(MSG_OCUPADO, 409);
    throw error;
  }
}

// ---------- casos de uso ----------

async function crear(
  user: Usuario,
  datos: { especialidad?: unknown; fecha?: unknown },
) {
  const especialidad = parsearEspecialidad(datos.especialidad);
  const fecha = parsearFecha(datos.fecha);
  validarFechaNueva(fecha);

  // El paciente sale del token, nunca del body
  return conControlDeConflicto(() =>
    turnoRepository.create({ paciente: user.id, especialidad, fecha }),
  );
}

async function listar(user: Usuario, query: Record<string, unknown>) {
  const filtro: Record<string, unknown> = {};

  // Relación: el paciente solo ve lo suyo. El admin ve todo y puede filtrar por paciente.
  if (user.rol === "paciente") {
    filtro.paciente = user.id;
  } else if (definido(query.pacienteId)) {
    if (
      typeof query.pacienteId !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(query.pacienteId)
    ) {
      throw new AppError("pacienteId inválido", 400);
    }
    filtro.paciente = query.pacienteId;
  }

  // Filtros con req.query: ? estado=...&especialidad=...&desde=...&hasta=...
  if (definido(query.estado)) filtro.estado = parsearEstado(query.estado);
  if (definido(query.especialidad))
    filtro.especialidad = parsearEspecialidad(query.especialidad);
  if (definido(query.desde) || definido(query.hasta)) {
    filtro.fecha = {
      ...(definido(query.desde) && { $gte: parsearFecha(query.desde) }),
      ...(definido(query.hasta) && { $lte: parsearFecha(query.hasta) }),
    };
  }
  return turnoRepository.findAll(filtro);
}

async function obtener(user: Usuario, id: string) {
  const turno = await turnoRepository.findById(id);
  // Si no existe o no es del paciente: 404 en ambos casos, para no revelar que existe
  if (!turno || (user.rol === "paciente" && idDe(turno.paciente) !== user.id)) {
    throw new AppError("Turno no encontrado", 404);
  }
  return turno;
}

async function actualizar(
  user: Usuario,
  id: string,
  datos: { especialidad?: unknown; fecha?: unknown; estado?: unknown },
) {
  const especialidad = parsearEspecialidad(datos.especialidad);
  const fecha = parsearFecha(datos.fecha);
  const estadoNuevo = definido(datos.estado)
    ? parsearEstado(datos.estado)
    : undefined;

  const turno = await obtener(user, id);
  const estadoActual = turno.estado as Estado;

  // Datos del turno (especialidad / fecha): solo se modifican mientras está pendiente
  const fechaCambia = fecha.getTime() !== turno.fecha.getTime();
  if (fechaCambia || especialidad !== turno.especialidad) {
    if (estadoActual !== "pendiente") {
      throw new AppError("Solo se pueden modificar turnos pendientes", 409);
    }
    if (fechaCambia) validarFechaNueva(fecha);
  }
  if (estadoNuevo && estadoNuevo !== estadoActual) {
    validarCambioDeEstado(user, turno.fecha, estadoActual, estadoNuevo);
  }

  const actualizado = await conControlDeConflicto(() =>
    turnoRepository.update(id, {
      especialidad,
      fecha,
      estado: estadoNuevo ?? estadoActual,
    }),
  );
  if (!actualizado) throw new AppError("Turno no encontrado", 404);
  return actualizado;
}

async function eliminar(id: string) {
  const turno = await turnoRepository.delete(id);
  if (!turno) throw new AppError("Turno no encontrado", 404);
}

export const turnoService = { crear, listar, obtener, actualizar, eliminar };

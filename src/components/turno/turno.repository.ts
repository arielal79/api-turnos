import { Types } from "mongoose";
import { TurnoModel } from "./turno.model";
import { Especialidad, Estado } from "./turno.constants";

// Siempre devolvemos el paciente con nombre y email (relación entre modelos)
const POPULATE = { path: "paciente", select: "nombre email" };

export const turnoRepository = {
  async create(data: {
    paciente: string;
    especialidad: Especialidad;
    fecha: Date;
  }) {
    const turno = await TurnoModel.create({
      ...data,
      paciente: new Types.ObjectId(data.paciente),
    });
    return turno.populate(POPULATE);
  },

  findAll(filtro: Record<string, unknown>) {
    return TurnoModel.find(filtro).populate(POPULATE).sort({ fecha: 1 });
  },

  findById(id: string) {
    return TurnoModel.findById(id).populate(POPULATE);
  },

  update(
    id: string,
    data: { especialidad: Especialidad; fecha: Date; estado: Estado },
  ) {
    return TurnoModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(POPULATE);
  },

  delete(id: string) {
    return TurnoModel.findByIdAndDelete(id);
  },
};

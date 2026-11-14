import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB desconectado");
  });
  await mongoose.connect(env.mongoUri);
  console.log(`✅ MongoDB conectado (base: ${mongoose.connection.name})`);
}

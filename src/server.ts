import { app } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/database";

async function main() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`🚀 Servidor en http://localhost:${env.port}`);
  });
}

main().catch((error) => {
  console.error("❌ Error al iniciar:", error.message);
  process.exit(1);
});

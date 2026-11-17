import type { Rol } from "../components/user/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; rol: Rol };
    }
  }
}

export {};

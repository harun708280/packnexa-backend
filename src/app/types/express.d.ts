import { IJWTPayload } from "../types/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

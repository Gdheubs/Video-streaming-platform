import type { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface UserPayload extends JwtPayload {
      id: string;
      email?: string;
      role?: string;
      [key: string]: unknown;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};

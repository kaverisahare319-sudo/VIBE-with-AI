import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const adminAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No admin token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'admin_fallback_secret') as any;

    if (!decoded.isAdmin) {
      res.status(403).json({ error: 'Forbidden: Admin access only' });
      return;
    }

    (req as any).admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }
};

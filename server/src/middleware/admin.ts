import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findEmployeeById } from '../models/attendance';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
  };
}

// Middleware to verify JWT token
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; isAdmin?: boolean };
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      isAdmin: decoded.isAdmin || false
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware to verify admin access (async)
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Double-check admin status from database
    const employee = await findEmployeeById(req.user.id);
    if (!employee || !employee.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

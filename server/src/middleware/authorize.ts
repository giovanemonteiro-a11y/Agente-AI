import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index';

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
      return;
    }

    // super_admin bypasses all role checks
    if (req.user.role === 'super_admin') {
      next();
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

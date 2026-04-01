import { Request, Response, NextFunction } from 'express';

export function authorizeModule(moduleName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
      return;
    }

    // super_admin bypasses all module checks
    if (req.user.role === 'super_admin') {
      next();
      return;
    }

    const userModules = req.user.modules ?? [];
    if (!userModules.includes(moduleName)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Acesso negado. Modulo '${moduleName}' nao disponivel para este usuario.`,
      });
      return;
    }

    next();
  };
}

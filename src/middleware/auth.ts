import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';

declare global {
    namespace Express {
        interface Request {
            user?: { userId: string };
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        req.user = decoded;

        next();
    } catch (error) {
        return next();
    }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }
    next();
};

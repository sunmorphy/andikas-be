import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(400, message);
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(500, message);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }

    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: err,
        });
    }

    console.error('Unexpected error:', err);
    return res.status(500).json({
        success: false,
        error: `Internal server error ${err}`,
    });
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

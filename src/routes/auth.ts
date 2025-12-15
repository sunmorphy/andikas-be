import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { z } from 'zod';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
    password: z.string().min(6),
    name: z.string().min(1),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post('/register', asyncHandler(async (req, res) => {
    const validated = registerSchema.parse(req.body);

    const existing = await db.select().from(users).where(eq(users.email, validated.email));
    if (existing.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Email already registered',
        });
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, validated.username));
    if (existingUsername.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Username already taken',
        });
    }

    const hashedPassword = await hashPassword(validated.password);

    const [newUser] = await db.insert(users).values({
        email: validated.email,
        username: validated.username,
        password: hashedPassword,
        name: validated.name,
    }).returning();

    const token = generateToken(newUser!.id);

    res.status(201).json({
        success: true,
        data: {
            user: {
                id: newUser!.id,
                email: newUser!.email,
                username: newUser!.username,
                name: newUser!.name,
            },
            token,
        },
    });
}));

router.post('/login', asyncHandler(async (req, res) => {
    const validated = loginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, validated.email));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
        });
    }

    const isValid = await comparePassword(validated.password, user.password);

    if (!isValid) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
        });
    }

    const token = generateToken(user.id);

    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        },
    });
}));

router.get('/me', authenticate, requireAuth, asyncHandler(async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found',
        });
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
        },
    });
}));

export default router;

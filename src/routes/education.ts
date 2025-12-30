import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { education, users } from '../db/schema.js';
import { educationSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    const allEducation = userId
        ? await db.select().from(education).where(eq(education.userId, userId))
        : [];

    res.json({
        success: true,
        data: allEducation,
    });
}));

router.get('/user/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const userEducation = await db.select().from(education).where(eq(education.userId, user.id));

    res.json({
        success: true,
        data: userEducation,
    });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const query = userId
        ? db.select().from(education).where(and(eq(education.id, id!), eq(education.userId, userId)))
        : db.select().from(education).where(eq(education.id, id!)).limit(0);

    const [edu] = await query;

    if (!edu) {
        throw new NotFoundError('Education not found');
    }

    res.json({
        success: true,
        data: edu,
    });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const validated = educationSchema.parse(req.body);

    const [newEducation] = await db.insert(education).values({
        ...validated,
        userId: req.user!.userId,
    }).returning();

    res.status(201).json({
        success: true,
        data: newEducation,
    });
}));

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = educationSchema.parse(req.body);

    const [existing] = await db.select().from(education)
        .where(and(eq(education.id, id!), eq(education.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Education not found');
    }

    const [updated] = await db
        .update(education)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(education.id, id!))
        .returning();

    res.json({
        success: true,
        data: updated,
    });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [existing] = await db.select().from(education)
        .where(and(eq(education.id, id!), eq(education.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Education not found');
    }

    await db.delete(education).where(eq(education.id, id!));

    res.json({
        success: true,
        message: 'Education deleted successfully',
    });
}));

export default router;

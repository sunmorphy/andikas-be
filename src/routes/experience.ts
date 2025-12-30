import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { experience, experienceSkills, users } from '../db/schema.js';
import { experienceSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    const allExperience = userId
        ? await db.query.experience.findMany({
            where: eq(experience.userId, userId),
            with: {
                experienceSkills: {
                    with: {
                        skill: true,
                    },
                },
            },
        })
        : [];

    res.json({
        success: true,
        data: allExperience,
    });
}));

router.get('/user/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const userExperience = await db.query.experience.findMany({
        where: eq(experience.userId, user.id),
        with: {
            experienceSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    res.json({
        success: true,
        data: userExperience,
    });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        throw new NotFoundError('Experience not found');
    }

    const exp = await db.query.experience.findFirst({
        where: and(eq(experience.id, id!), eq(experience.userId, userId)),
        with: {
            experienceSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    if (!exp) {
        throw new NotFoundError('Experience not found');
    }

    res.json({
        success: true,
        data: exp,
    });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const validated = experienceSchema.parse(req.body);
    const { skillIds, ...experienceData } = validated;

    const [newExperience] = await db.insert(experience).values({
        ...experienceData,
        userId: req.user!.userId,
    }).returning();

    if (skillIds && skillIds.length > 0) {
        await db.insert(experienceSkills).values(
            skillIds.map(skillId => ({
                experienceId: newExperience!.id,
                skillId,
            }))
        );
    }

    const result = await db.query.experience.findFirst({
        where: eq(experience.id, newExperience!.id),
        with: {
            experienceSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    res.status(201).json({
        success: true,
        data: result,
    });
}));

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = experienceSchema.parse(req.body);
    const { skillIds, ...experienceData } = validated;

    const [existing] = await db.select().from(experience)
        .where(and(eq(experience.id, id!), eq(experience.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Experience not found');
    }

    const [updated] = await db
        .update(experience)
        .set({ ...experienceData, updatedAt: new Date() })
        .where(eq(experience.id, id!))
        .returning();

    await db.delete(experienceSkills).where(eq(experienceSkills.experienceId, id!));

    if (skillIds && skillIds.length > 0) {
        await db.insert(experienceSkills).values(
            skillIds.map(skillId => ({
                experienceId: id!,
                skillId,
            }))
        );
    }

    const result = await db.query.experience.findFirst({
        where: eq(experience.id, id!),
        with: {
            experienceSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    res.json({
        success: true,
        data: result,
    });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [existing] = await db.select().from(experience)
        .where(and(eq(experience.id, id!), eq(experience.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Experience not found');
    }

    await db.delete(experience).where(eq(experience.id, id!));

    res.json({
        success: true,
        message: 'Experience deleted successfully',
    });
}));

export default router;

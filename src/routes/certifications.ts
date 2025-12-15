import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { certifications, certificationSkills } from '../db/schema.js';
import { certificationSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    const allCertifications = userId
        ? await db.query.certifications.findMany({
            where: eq(certifications.userId, userId),
            with: {
                certificationSkills: {
                    with: {
                        skill: true,
                    },
                },
            },
        })
        : [];

    res.json({
        success: true,
        data: allCertifications,
    });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        throw new NotFoundError('Certification not found');
    }

    const cert = await db.query.certifications.findFirst({
        where: and(eq(certifications.id, id!), eq(certifications.userId, userId)),
        with: {
            certificationSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    if (!cert) {
        throw new NotFoundError('Certification not found');
    }

    res.json({
        success: true,
        data: cert,
    });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const validated = certificationSchema.parse(req.body);
    const { skillIds, ...certificationData } = validated;
    const [newCertification] = await db.insert(certifications).values({
        ...certificationData,
        userId: req.user!.userId,
    }).returning();

    if (skillIds && skillIds.length > 0) {
        await db.insert(certificationSkills).values(
            skillIds.map(skillId => ({
                certificationId: newCertification!.id,
                skillId,
            }))
        );
    }

    const result = await db.query.certifications.findFirst({
        where: eq(certifications.id, newCertification!.id),
        with: {
            certificationSkills: {
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
    const validated = certificationSchema.parse(req.body);
    const { skillIds, ...certificationData } = validated;

    const [existing] = await db.select().from(certifications)
        .where(and(eq(certifications.id, id!), eq(certifications.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Certification not found');
    }

    const [updated] = await db
        .update(certifications)
        .set({ ...certificationData, updatedAt: new Date() })
        .where(eq(certifications.id, id!))
        .returning();

    await db.delete(certificationSkills).where(eq(certificationSkills.certificationId, id!));

    if (skillIds && skillIds.length > 0) {
        await db.insert(certificationSkills).values(
            skillIds.map(skillId => ({
                certificationId: id!,
                skillId,
            }))
        );
    }

    const result = await db.query.certifications.findFirst({
        where: eq(certifications.id, id!),
        with: {
            certificationSkills: {
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

    const [existing] = await db.select().from(certifications)
        .where(and(eq(certifications.id, id!), eq(certifications.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Certification not found');
    }

    await db.delete(certifications).where(eq(certifications.id, id!));

    res.json({
        success: true,
        message: 'Certification deleted successfully',
    });
}));

export default router;

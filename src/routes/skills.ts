import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import multer from 'multer';
import { db } from '../db/index.js';
import { skills, users } from '../db/schema.js';
import { skillSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadToR2 } from '../services/r2.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});


router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    const allSkills = userId
        ? await db.select().from(skills).where(eq(skills.userId, userId))
        : [];

    res.json({
        success: true,
        data: allSkills,
    });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const query = userId
        ? db.select().from(skills).where(and(eq(skills.id, id!), eq(skills.userId, userId)))
        : db.select().from(skills).where(eq(skills.id, id!)).limit(0);

    const [skill] = await query;

    if (!skill) {
        throw new NotFoundError('Skill not found');
    }

    res.json({
        success: true,
        data: skill,
    });
}));

router.post('/', requireAuth, upload.single('icon'), asyncHandler(async (req, res) => {
    const validated = skillSchema.parse(req.body);

    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'Icon file is required',
        });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
        });
    }

    const result = await uploadToR2(req.file.buffer, req.file.originalname, user.username, 'skills');

    const [newSkill] = await db.insert(skills).values({
        name: validated.name,
        icon: result.url,
        userId: req.user!.userId,
    }).returning();

    res.status(201).json({
        success: true,
        data: newSkill,
    });
}));

router.put('/:id', requireAuth, upload.single('icon'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = skillSchema.parse(req.body);

    const [existing] = await db.select().from(skills)
        .where(and(eq(skills.id, id!), eq(skills.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Skill not found');
    }

    let iconUrl = existing.icon;

    if (req.file) {
        const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }

        const result = await uploadToR2(req.file.buffer, req.file.originalname, user.username, 'skills');

        iconUrl = result.url;
    }

    const [updated] = await db
        .update(skills)
        .set({ name: validated.name, icon: iconUrl, updatedAt: new Date() })
        .where(eq(skills.id, id!))
        .returning();

    res.json({
        success: true,
        data: updated,
    });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [existing] = await db.select().from(skills)
        .where(and(eq(skills.id, id!), eq(skills.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Skill not found');
    }

    await db.delete(skills).where(eq(skills.id, id!));

    res.json({
        success: true,
        message: 'Skill deleted successfully',
    });
}));

export default router;

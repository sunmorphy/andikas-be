import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import multer from 'multer';
import { db } from '../db/index.js';
import { projects, projectSkills, users } from '../db/schema.js';
import { projectSchema } from '../validators/index.js';
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

    const allProjects = userId
        ? await db.query.projects.findMany({
            where: eq(projects.userId, userId),
            with: {
                projectSkills: {
                    with: {
                        skill: true,
                    },
                },
            },
        })
        : [];

    res.json({
        success: true,
        data: allProjects,
    });
}));

router.get('/user/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, user.id),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    res.json({
        success: true,
        data: userProjects,
    });
}));

router.get('/user/:username/:slug', asyncHandler(async (req, res) => {
    const { username, slug } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const project = await db.query.projects.findFirst({
        where: and(eq(projects.slug, slug!), eq(projects.userId, user.id)),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    if (!project) {
        throw new NotFoundError('Project not found');
    }

    res.json({
        success: true,
        data: project,
    });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        throw new NotFoundError('Project not found');
    }

    const project = await db.query.projects.findFirst({
        where: and(eq(projects.slug, slug!), eq(projects.userId, userId)),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
        },
    });

    if (!project) {
        throw new NotFoundError('Project not found');
    }

    res.json({
        success: true,
        data: project,
    });
}));

router.post('/', requireAuth, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 20 }
]), asyncHandler(async (req, res) => {
    const validated = projectSchema.parse(req.body);
    const { skillIds, publishedAt, ...projectData } = validated;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
        });
    }

    let coverImageUrl = projectData.coverImage;
    let contentImageUrls: string[] = [];

    if (files?.coverImage?.[0]) {
        const result = await uploadToR2(files.coverImage[0].buffer, files.coverImage[0].originalname, user.username, 'projects');

        coverImageUrl = result.url;
    }

    // Upload content images
    if (files?.contentImages) {
        for (const file of files.contentImages) {
            const result = await uploadToR2(file.buffer, file.originalname, user.username, 'projects');

            contentImageUrls.push(result.url);
        }
    }

    const publishedAtDate = publishedAt ? new Date(publishedAt) : null;

    const [newProject] = await db.insert(projects).values({
        ...projectData,
        coverImage: coverImageUrl,
        contentImages: contentImageUrls.length > 0 ? contentImageUrls : null,
        publishedAt: publishedAtDate,
        userId: req.user!.userId,
    }).returning();

    if (skillIds && skillIds.length > 0) {
        await db.insert(projectSkills).values(
            skillIds.map(skillId => ({
                projectId: newProject!.id,
                skillId,
            }))
        );
    }

    const result = await db.query.projects.findFirst({
        where: eq(projects.id, newProject!.id),
        with: {
            projectSkills: {
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

router.put('/:id', requireAuth, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 20 }
]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = projectSchema.parse(req.body);
    const { skillIds, publishedAt, ...projectData } = validated;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const [existing] = await db.select().from(projects)
        .where(and(eq(projects.id, id!), eq(projects.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Project not found');
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
        });
    }

    let coverImageUrl = projectData.coverImage;
    let contentImageUrls: string[] = existing.contentImages || [];

    if (files?.coverImage?.[0]) {
        const result = await uploadToR2(files.coverImage[0].buffer, files.coverImage[0].originalname, user.username, 'projects');

        coverImageUrl = result.url;
    }

    if (req.body.existingContentImages) {
        try {
            contentImageUrls = JSON.parse(req.body.existingContentImages);
        } catch (e) {
            contentImageUrls = [];
        }
    } else {
        contentImageUrls = existing.contentImages || [];
    }

    if (files?.contentImages) {
        for (const file of files.contentImages) {
            const result = await uploadToR2(file.buffer, file.originalname, user.username, 'projects');
            contentImageUrls.push(result.url);
        }
    }

    const publishedAtDate = publishedAt ? new Date(publishedAt) : null;

    const [updated] = await db
        .update(projects)
        .set({
            ...projectData,
            coverImage: coverImageUrl,
            contentImages: contentImageUrls.length > 0 ? contentImageUrls : null,
            publishedAt: publishedAtDate,
            updatedAt: new Date()
        })
        .where(eq(projects.id, id!))
        .returning();

    await db.delete(projectSkills).where(eq(projectSkills.projectId, id!));

    if (skillIds && skillIds.length > 0) {
        await db.insert(projectSkills).values(
            skillIds.map(skillId => ({
                projectId: id!,
                skillId,
            }))
        );
    }

    const result = await db.query.projects.findFirst({
        where: eq(projects.id, id!),
        with: {
            projectSkills: {
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

    const [existing] = await db.select().from(projects)
        .where(and(eq(projects.id, id!), eq(projects.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Project not found');
    }

    await db.delete(projects).where(eq(projects.id, id!));

    res.json({
        success: true,
        message: 'Project deleted successfully',
    });
}));

export default router;

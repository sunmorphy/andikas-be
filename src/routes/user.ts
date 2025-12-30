import { Router } from 'express';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import { db } from '../db/index.js';
import { userDetails, users } from '../db/schema.js';
import { userDetailsSchema } from '../validators/index.js';
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

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }

    const userDetail = await db.query.userDetails.findFirst({
        where: eq(userDetails.userId, userId),
    });

    if (!userDetail) {
        throw new NotFoundError('User details not found');
    }

    res.json({
        success: true,
        data: userDetail,
    });
}));

router.get('/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;
    console.log(username);

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        console.log(username);
        throw new NotFoundError('User not found');
    }

    const userDetail = await db.query.userDetails.findFirst({
        where: eq(userDetails.userId, user.id),
    });

    if (!userDetail) {
        throw new NotFoundError('User details not found');
    }

    res.json({
        success: true,
        data: userDetail,
    });
}));

router.post('/', requireAuth, upload.single('profilePhoto'), asyncHandler(async (req, res) => {
    const validated = userDetailsSchema.parse(req.body);

    const [existing] = await db.select().from(userDetails).where(eq(userDetails.userId, req.user!.userId));
    if (existing) {
        return res.status(400).json({
            success: false,
            error: 'User details already exist. Use PUT to update.',
        });
    }

    let profilePhotoUrl = validated.profilePhoto;

    if (req.file) {
        const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }

        const result = await uploadToR2(req.file.buffer, req.file.originalname, user.username, 'users');

        profilePhotoUrl = result.url;
    }

    const [newUser] = await db.insert(userDetails).values({
        ...validated,
        profilePhoto: profilePhotoUrl,
        userId: req.user!.userId,
    }).returning();

    res.status(201).json({
        success: true,
        data: newUser,
    });
}));

router.put('/', requireAuth, upload.single('profilePhoto'), asyncHandler(async (req, res) => {
    const validated = userDetailsSchema.parse(req.body);

    const [existing] = await db.select().from(userDetails).where(eq(userDetails.userId, req.user!.userId));
    if (!existing) {
        throw new NotFoundError('User details not found. Use POST to create.');
    }

    let profilePhotoUrl = validated.profilePhoto;

    if (req.file) {
        const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }

        const result = await uploadToR2(req.file.buffer, req.file.originalname, user.username, 'users');

        profilePhotoUrl = result.url;
    }

    const [updated] = await db
        .update(userDetails)
        .set({ ...validated, profilePhoto: profilePhotoUrl, updatedAt: new Date() })
        .where(eq(userDetails.id, existing.id))
        .returning();

    res.json({
        success: true,
        data: updated,
    });
}));

export default router;

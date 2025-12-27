import { Router } from 'express';
import multer from 'multer';
import { eq } from 'drizzle-orm';
import { uploadToR2 } from '../services/r2.js';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

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

router.post('/', requireAuth, upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No image file provided',
        });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
        });
    }

    const result = await uploadToR2(req.file.buffer, req.file.originalname, user.username, 'uploads');

    res.json({
        success: true,
        data: {
            url: result.url,
            fileId: result.fileId,
            name: result.name,
            size: result.size,
            width: result.width,
            height: result.height,
        },
    });
}));

export default router;

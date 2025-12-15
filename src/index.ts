import express from 'express';
import cors from 'cors';
import { errorHandler } from './utils/errors.js';
import { authenticate } from './middleware/auth.js';

// Import routes
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import skillsRouter from './routes/skills.js';
import experienceRouter from './routes/experience.js';
import educationRouter from './routes/education.js';
import certificationsRouter from './routes/certifications.js';
import projectsRouter from './routes/projects.js';
import uploadRouter from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(authenticate);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Portfolio API is running' });
});

// API Routes
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/skills', skillsRouter);
app.use('/experience', experienceRouter);
app.use('/education', educationRouter);
app.use('/certifications', certificationsRouter);
app.use('/projects', projectsRouter);
app.use('/upload', uploadRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

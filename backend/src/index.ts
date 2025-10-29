
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import passport from 'passport';
import logger from './utils/logger'; // Import the logger

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
// Compression Middleware
app.use(compression());

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// CORS Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept']
}));

// Simple request logger
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const userId = (req as any).user?._id || (req as any).user?.id;
    res.on('finish', () => {
        const ms = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms${userId ? ` uid=${userId}` : ''}`);
    });
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI!)
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', err));

import './config/passport';
import authRoutes from './routes/auth';

app.use('/auth', authRoutes);

import agentRoutes from './routes/agents';
import trainRoutes from './routes/train';

app.use('/api/agents', agentRoutes);
app.use('/api/train', trainRoutes);

import analyticsRoutes from './routes/analytics';
import chatRoutes from './routes/chat';
import deploymentRoutes from './routes/deployments';
import healthRoutes from './routes/health';
import resourcesRoutes from './routes/resources';
import settingsRoutes from './routes/settings';
import webhookRoutes from './routes/webhooks';
import embedRoutes from './routes/embed';

app.use('/api/deployments', deploymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/embed', embedRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('CortexDesk Backend');
});

import './workers/deploymentWorker';
import './workers/trainingWorker';

// Centralized Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
});

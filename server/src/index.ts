import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'KHU Developers API is running' });
});

// Import routes
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import userRoutes from './routes/users';

app.use('/api/auth', authRoutes);
app.use('/api/associate-applications', applicationRoutes);
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

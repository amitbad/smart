import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { initializeDatabase, getDBType } from './db/index.js';
import { carryForwardActionItems } from './jobs/carryForwardActionItems.js';
import memberRoutes from './routes/members.js';
import skillRoutes from './routes/skills.js';
import designationRoutes from './routes/designations.js';
import locationRoutes from './routes/locations.js';
import actionItemRoutes from './routes/actionItems.js';
import departmentRoutes from './routes/departments.js';
import projectRoutes from './routes/projects.js';
import emailRoutes from './routes/emails.js';
import benchRoutes from './routes/bench.js';
import importantLinksRoutes from './routes/importantLinks.js';
import importantEventsRoutes from './routes/importantEvents.js';
import authRoutes from './routes/auth.js';
import goalCategoriesRoutes from './routes/goalCategories.js';
import goalsRoutes from './routes/goals.js';
import smartNotesRoutes from './routes/smartNotes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/bench', benchRoutes);
app.use('/api/important-links', importantLinksRoutes);
app.use('/api/important-events', importantEventsRoutes);
app.use('/api/goal-categories', goalCategoriesRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/smart-notes', smartNotesRoutes);

app.get('/api/health', (req, res) => {
  const dbType = getDBType();
  res.json({ status: 'ok', message: 'Smart API is running', database: dbType });
});

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`💾 Database: ${getDBType()}`);
    });

    // Schedule carry-forward job to run every day at 12:01 AM
    cron.schedule('1 0 * * *', async () => {
      console.log('⏰ Running scheduled carry-forward job...');
      await carryForwardActionItems();
    }, {
      timezone: 'Asia/Kolkata'
    });

    console.log('📅 Carry-forward job scheduled: Daily at 12:01 AM IST');

    // Run once on startup for testing/catch-up
    setTimeout(async () => {
      console.log('🔄 Running initial carry-forward check...');
      await carryForwardActionItems();
    }, 3000);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

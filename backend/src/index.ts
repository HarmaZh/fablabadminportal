import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import inventoryRoutes from './routes/inventory.routes';
import studentsRoutes from './routes/students.routes';
import classesRoutes from './routes/classes.routes';
import staffRoutes from './routes/staff.routes';
import equipmentRoutes from './routes/equipment.routes';
import attendanceRoutes from './routes/attendance.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'FabLab Admin Portal API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/attendance', attendanceRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS enabled for: ${config.corsOrigin}`);
  console.log(`\n📚 API Documentation:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Auth:       http://localhost:${PORT}/api/auth`);
  console.log(`   Inventory:  http://localhost:${PORT}/api/inventory`);
  console.log(`   Students:   http://localhost:${PORT}/api/students`);
  console.log(`   Classes:    http://localhost:${PORT}/api/classes`);
  console.log(`   Staff:      http://localhost:${PORT}/api/staff`);
  console.log(`   Equipment:  http://localhost:${PORT}/api/equipment`);
  console.log(`   Attendance: http://localhost:${PORT}/api/attendance`);
});

export default app;

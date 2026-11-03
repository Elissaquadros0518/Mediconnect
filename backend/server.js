import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './src/middleware/errorHandler.js';

import doctorRoutes from './src/routes/doctorRoutes.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'https://kind-field-046042f00.3.azurestaticapps.net',
  'https://blue-cliff-0c3f95400.4.azurestaticapps.net',
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'MediConnect Cloud API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MediConnect Cloud Backend running on port ${PORT}`);
});

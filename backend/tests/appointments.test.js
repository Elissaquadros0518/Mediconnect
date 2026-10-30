import request from 'supertest';
import express from 'express';
import appointmentRoutes from '../routes/appointmentRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);

describe('Appointment Booking & Concurrency Tests', () => {
  it('should reject unauthenticated booking requests', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ doctorId: 1, slotId: 1 });
    
    // Without local auth bypass or token, returns 401
    expect(res.status).toBe(401);
  });

  it('should validate required fields for appointment booking', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('x-mock-role', 'PATIENT')
      .set('x-mock-user-id', '1')
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
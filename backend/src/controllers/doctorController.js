import * as doctorRepo from '../repositories/doctorRepo.js';

export async function getDoctors(req, res, next) {
  try {
    const { specialty, search } = req.query;
    const doctors = await doctorRepo.findAllDoctors({ specialty, search });
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    next(err);
  }
}

export async function getDoctorById(req, res, next) {
  try {
    const { id } = req.params;
    const doctor = await doctorRepo.findDoctorById(id);
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
}

export async function getDoctorSlots(req, res, next) {
  try {
    const { id } = req.params;
    const slots = await doctorRepo.findDoctorSlots(id);
    res.status(200).json({ success: true, count: slots.length, data: slots });
  } catch (err) {
    next(err);
  }
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, Stethoscope, User, Video, Building, ArrowLeft, CheckCircle2, ShieldCheck 
} from 'lucide-react';

export default function BookAppointment() {
  const navigate = useNavigate();

  // Mock list of doctors available for booking
  const availableDoctors = [
    { id: 1, name: 'Dr. Sarah Jenkins', specialty: 'Cardiology Specialist', location: 'Cumballa Hill Center, Mumbai' },
    { id: 2, name: 'Dr. Robert Chen', specialty: 'General Medicine & Primary Care', location: 'Bandra West Clinic, Mumbai' },
    { id: 3, name: 'Dr. Ananya Sharma', specialty: 'Pediatrics & Child Care', location: 'Powai Medical Hub, Mumbai' },
    { id: 4, name: 'Dr. Rajesh Nair', specialty: 'Emergency & Critical Triage', location: 'Main Hospital Campus, Mumbai' }
  ];

  // Available time slots
  const timeSlots = ['09:00 AM', '10:30 AM', '11:45 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

  // Form State
  const [selectedDoctor, setSelectedDoctor] = useState(availableDoctors[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState(timeSlots[0]);
  const [consultType, setConsultType] = useState('In-Person');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    if (!date) {
      alert('Please select an appointment date.');
      return;
    }

    setSubmitting(true);

    // Simulate backend / Supabase appointment insertion delay
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 1800);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/patient/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Digital Scheduling
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Book a Specialist Consultation</h1>
        <p className="text-teal-100 text-sm mt-1">Schedule your next in-person visit or telehealth consultation securely.</p>
      </div>

      {/* Booking Form Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        {success ? (
          <div className="py-16 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-xl font-extrabold text-slate-900">Appointment Confirmed!</h3>
            <p className="text-sm text-slate-500">Your appointment has been successfully scheduled and synced with the doctor's calendar.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="space-y-6">
            
            {/* 1. Select Doctor / Specialist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Physician / Specialist
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {availableDoctors.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`border rounded-2xl p-4 cursor-pointer transition flex flex-col justify-between ${
                      selectedDoctor.id === doc.id 
                        ? 'border-teal-600 bg-teal-50/50 shadow-sm' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                        <Stethoscope className={`w-4 h-4 ${selectedDoctor.id === doc.id ? 'text-teal-600' : 'text-slate-400'}`} />
                      </div>
                      <p className="text-xs text-teal-700 font-medium mt-0.5">{doc.specialty}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">{doc.location}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Consultation Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Consultation Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setConsultType('In-Person')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center space-x-2 transition ${
                    consultType === 'In-Person'
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>In-Person Visit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsultType('Telehealth')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center space-x-2 transition ${
                    consultType === 'Telehealth'
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Telehealth Video</span>
                </button>
              </div>
            </div>

            {/* 3. Date and Time Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Appointment Date
                </label>
                <div className="relative">
                  <input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Available Time Slot
                </label>
                <select 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {timeSlots.map((slot, index) => (
                    <option key={index} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Reason for Visit / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Visit / Symptoms (Optional)
              </label>
              <textarea 
                rows="3"
                placeholder="Describe your symptoms or reason for consultation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Submit Action */}
            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow transition text-sm flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <span>Confirming Appointment...</span>
              ) : (
                <span>Confirm & Book Appointment</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
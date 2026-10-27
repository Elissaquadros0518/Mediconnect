import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, Stethoscope, ArrowLeft, CheckCircle2, ShieldCheck, Loader2, AlertCircle 
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedDoctorId = searchParams.get('doctorId');

  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // 1. Load Doctors
  useEffect(() => {
    async function loadDoctors() {
      setLoadingDoctors(true);
      try {
        const docs = await doctorService.getPublicDoctors();
        setAvailableDoctors(docs);
        if (preSelectedDoctorId) {
          const match = docs.find(d => String(d.id) === String(preSelectedDoctorId));
          if (match) setSelectedDoctor(match);
          else if (docs.length > 0) setSelectedDoctor(docs[0]);
        } else if (docs.length > 0) {
          setSelectedDoctor(docs[0]);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, [preSelectedDoctorId]);

  // 2. Load Slots when Doctor or Date changes
  useEffect(() => {
    if (!selectedDoctor?.id) return;
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const slots = await doctorService.getDoctorSlots(selectedDoctor.id, date);
        setAvailableSlots(slots);
        const firstAvailable = slots.find(s => s.status === 'Available');
        setSelectedSlot(firstAvailable || slots[0] || null);
      } catch (err) {
        console.error('Error fetching slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedDoctor?.id, date]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDoctor) {
      setErrorMsg('Please select a physician.');
      return;
    }
    if (!selectedSlot) {
      setErrorMsg('Please select an available consultation slot.');
      return;
    }
    if (selectedSlot.status !== 'Available') {
      setErrorMsg('The selected slot is already booked. Please pick another slot.');
      return;
    }

    setSubmitting(true);

    try {
      await appointmentService.bookAppointment({
        slotId: selectedSlot.id,
        doctorId: selectedDoctor.id,
        reason: notes || 'General Specialist Consultation',
        date,
        time: selectedSlot.time
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Booking error:', err);
      setErrorMsg(err.message || 'Unable to book consultation. Please verify slot availability.');
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-teal-100 text-sm mt-1">
          Atomic Supabase scheduling ensures zero double-booking and instant calendar sync.
        </p>
      </div>

      {/* Booking Form Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        {success ? (
          <div className="py-16 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-xl font-extrabold text-slate-900">Appointment Confirmed!</h3>
            <p className="text-sm text-slate-500">
              Your appointment with <strong className="text-teal-800">{selectedDoctor?.name}</strong> has been booked and saved in PostgreSQL.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="space-y-6">
            
            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Select Doctor / Specialist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Physician / Specialist
              </label>
              {loadingDoctors ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {availableDoctors.map((doc) => (
                    <div 
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`border rounded-2xl p-4 cursor-pointer transition flex flex-col justify-between ${
                        selectedDoctor?.id === doc.id 
                          ? 'border-teal-600 bg-teal-50/50 shadow-sm' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                          <Stethoscope className={`w-4 h-4 ${selectedDoctor?.id === doc.id ? 'text-teal-600' : 'text-slate-400'}`} />
                        </div>
                        <p className="text-xs text-teal-700 font-medium mt-0.5">{doc.specialty}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{doc.qualification}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/50 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Consultation:</span>
                        <span className="font-bold text-slate-800">₹{doc.consultation_fee || 1000}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Select Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Preferred Date
              </label>
              <div className="relative">
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            {/* 3. Select Time Slot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Available Time Slots
              </label>
              {loadingSlots ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-5 h-5 text-teal-600 animate-spin mx-auto" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No availability slots configured for this date.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isAvailable = slot.status === 'Available';
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                          !isAvailable
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot.time}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Consultation Reason / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Visit / Symptoms
              </label>
              <textarea
                rows={3}
                placeholder="Describe your current symptoms, health concerns, or routine review purpose..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot || selectedSlot.status !== 'Available'}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Confirming Slot Reservation...</span>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4" />
                  <span>Confirm & Reserve Appointment</span>
                </>
              )}
            </button>

          </form>
        )}
      </div>

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, Stethoscope, CheckCircle2, Loader2, Star, Award, MapPin, AlertCircle
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedDoctorId = searchParams.get('doctorId');

  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Load Real Verified Doctors Exclusively from Supabase
  useEffect(() => {
    async function loadDoctors() {
      setLoadingDoctors(true);
      setErrorMsg('');
      try {
        const docs = await doctorService.getPublicDoctors();
        const validDocs = docs || [];
        setAvailableDoctors(validDocs);
        
        if (preSelectedDoctorId) {
          const match = validDocs.find(d => String(d.id) === String(preSelectedDoctorId));
          if (match) setSelectedDoctor(match);
        }
      } catch (err) {
        console.error('Error fetching doctors from database:', err);
        setErrorMsg('Failed to load registered doctors from the database. Please ensure your database tables are configured.');
        setAvailableDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, [preSelectedDoctorId]);

  // Load Real Slots from Supabase when Doctor or Date changes
  useEffect(() => {
    if (!selectedDoctor?.id) return;
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const slots = await doctorService.getDoctorSlots(selectedDoctor.id, date);
        const finalSlots = slots || [];
        setAvailableSlots(finalSlots);
        const firstAvailable = finalSlots.find(s => s.status === 'Available');
        setSelectedSlot(firstAvailable || null);
      } catch (err) {
        console.error('Error fetching slots from database:', err);
        setAvailableSlots([]);
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
      setErrorMsg('The selected slot is already booked. Please choose another.');
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
      setTimeout(() => navigate('/patient/dashboard'), 2000);
    } catch (err) {
      console.error('Booking submission error:', err);
      setErrorMsg(err.message || 'Failed to reserve appointment. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = selectedSpecialtyFilter === 'All' 
    ? availableDoctors 
    : availableDoctors.filter(d => d.specialty === selectedSpecialtyFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-1 pb-8 px-4 font-sans">
      
      {/* Header Banner - Enlarged with reduced top padding */}
      <div className="bg-gradient-to-r from-teal-700 via-sky-800 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl mt-1">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Book a Specialist Consultation</h1>
        <p className="text-teal-100 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
          Explore our expert medical board, select your preferred specialist, and schedule your appointment instantly.
        </p>
      </div>

      {/* Expanded Main Content Box */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 shadow-lg min-h-[500px]">
        {success ? (
          <div className="py-20 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-xl font-extrabold text-slate-900">Appointment Confirmed Successfully!</h3>
            <p className="text-sm text-slate-500">
              Your consultation with <strong className="text-teal-800">{selectedDoctor?.name}</strong> on {date} at {selectedSlot?.time} has been reserved. Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="space-y-8">
            
            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* DOCTOR SELECTION SECTION */}
            <div className="space-y-4 border-b border-slate-100 pb-5">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2.5">
                    <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                      <Stethoscope className="w-5 h-5" />
                    </span>
                    <span>Select Your Physician / Specialist</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 ml-11">
                    Choose a verified specialist from the directory below.
                  </p>
                </div>
              </div>

              {/* Clean, horizontally-spaced filter pills with smooth scrolling */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {['All', 'Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Neurology', 'Dermatology', 'Emergency Care'].map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialtyFilter(spec)}
                    className={`text-xs px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedSpecialtyFilter === spec 
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-2 ring-teal-600/20' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              {loadingDoctors ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                  No active verified physicians are currently available in the database.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-3">
                  {filteredDoctors.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setSelectedSlot(null);
                        }}
                        className={`border rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between group ${
                          isSelected 
                            ? 'border-teal-600 bg-teal-50/60 shadow-md ring-2 ring-teal-500/20' 
                            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5">
                          <img 
                            src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'} 
                            alt={doc.name} 
                            className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-sm group-hover:scale-105 transition" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm truncate">{doc.name}</span>
                              <span className="text-[11px] font-bold text-amber-600 flex items-center bg-amber-50 px-1.5 py-0.5 rounded-md">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                                {doc.rating || 4.8}
                              </span>
                            </div>
                            <p className="text-xs text-teal-700 font-semibold">{doc.specialty}</p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{doc.qualification}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Award className="w-3.5 h-3.5 text-slate-400" />
                            <span>{doc.experience || '10 yrs exp'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{doc.location || 'Hospital Branch'}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 2: DATE & TIME SLOTS */}
            {selectedDoctor && (
              <div className="space-y-6 pt-2 animate-fadeIn">
                <div className="bg-teal-50/60 border border-teal-100 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="text-xs text-teal-800 font-semibold uppercase tracking-wider">Selected Specialist</p>
                      <h4 className="text-sm font-bold text-slate-900">{selectedDoctor.name} ({selectedDoctor.specialty})</h4>
                    </div>
                  </div>
                  <span className="text-xs bg-white text-teal-700 font-bold px-3 py-1.5 rounded-xl shadow-sm border border-teal-200">
                    Ready to Book
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Preferred Consultation Date
                    </label>
                    <input 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Reason for Visit / Symptoms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Chest discomfort, routine checkup, fever..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Available Time Slot
                  </label>
                  {loadingSlots ? (
                    <div className="py-6 text-center">
                      <Loader2 className="w-5 h-5 text-teal-600 animate-spin mx-auto" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No active time slots found for this doctor on the selected date.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableSlots.map((slot) => {
                        const isAvailable = slot.status === 'Available';
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                              !isAvailable
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-500/20'
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

                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>{submitting ? 'Confirming Appointment...' : `Confirm & Reserve Appointment with ${selectedDoctor.name}`}</span>
                </button>
              </div>
            )}

          </form>
        )}
      </div>

    </div>
  );
}
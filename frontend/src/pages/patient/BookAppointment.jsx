import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  CheckCircle2,
  Loader2,
  Star,
  Award,
  MapPin,
  AlertCircle,
  UserCheck
} from 'lucide-react';

import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';

// Get date in local timezone instead of UTC
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preSelectedDoctorId = searchParams.get('doctorId');

  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getLocalDateString(tomorrow);
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [slotError, setSlotError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load verified doctors from Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      setLoadingDoctors(true);
      setErrorMsg('');

      try {
        const docs = await doctorService.getPublicDoctors();

        if (cancelled) return;

        const validDocs = docs || [];

        setAvailableDoctors(validDocs);

        if (preSelectedDoctorId) {
          const match = validDocs.find(
            doctor => String(doctor.id) === String(preSelectedDoctorId)
          );

          if (match) {
            setSelectedDoctor(match);
          }
        }
      } catch (err) {
        if (cancelled) return;

        console.error('Error fetching doctors:', err);

        setErrorMsg(
          err.message || 'Failed to load registered doctors.'
        );

        setAvailableDoctors([]);
      } finally {
        if (!cancelled) {
          setLoadingDoctors(false);
        }
      }
    }

    loadDoctors();

    return () => {
      cancelled = true;
    };
  }, [preSelectedDoctorId]);

  // Load available slots whenever doctor or date changes
  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      if (!selectedDoctor?.id || !date) {
        setAvailableSlots([]);
        setSelectedSlot(null);
        return;
      }

      setLoadingSlots(true);
      setSlotError('');
      setAvailableSlots([]);
      setSelectedSlot(null);

      try {
        console.log('Fetching appointment slots...');
        console.log('Doctor profile ID:', selectedDoctor.id);
        console.log('Selected date:', date);

        const slots = await doctorService.getDoctorSlots(
          selectedDoctor.id,
          date
        );

        if (cancelled) return;

        console.log('Slots returned from Supabase:', slots);

        const validSlots = (slots || []).filter(
          slot => slot.status?.toLowerCase() === 'available'
        );

        // Sort slots by start time
        validSlots.sort((a, b) => {
          return new Date(a.startTime) - new Date(b.startTime);
        });

        setAvailableSlots(validSlots);

        if (validSlots.length > 0) {
          setSelectedSlot(validSlots[0]);
        }
      } catch (err) {
        if (cancelled) return;

        console.error('Error fetching appointment slots:', err);

        setAvailableSlots([]);
        setSelectedSlot(null);

        setSlotError(
          err.message || 'Unable to fetch available appointment slots.'
        );
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [selectedDoctor?.id, date]);

  // Handle appointment booking
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

    if (selectedSlot.status?.toLowerCase() !== 'available') {
      setErrorMsg(
        'The selected slot is no longer available. Please choose another.'
      );
      return;
    }

    setSubmitting(true);

    try {
      await appointmentService.bookAppointment({
        slotId: selectedSlot.id,
        doctorId: selectedDoctor.id,
        doctor_id: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        reason: notes.trim() || 'General Specialist Consultation',
        appointment_date: date,
        appointment_time: selectedSlot.time
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Appointment booking error:', err);

      setErrorMsg(
        err.message || 'Failed to reserve appointment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filter doctors by specialty
  const filteredDoctors = selectedSpecialtyFilter === 'All'
    ? availableDoctors
    : availableDoctors.filter(
        doctor => doctor.specialty === selectedSpecialtyFilter
      );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-1 pb-8 px-4 font-sans">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-sky-800 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl mt-1">

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Book a Specialist Consultation
        </h1>

        <p className="text-teal-100 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
          Explore our expert medical board, select your preferred specialist,
          and schedule your appointment.
        </p>

      </div>

      {/* Main Content */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 shadow-lg min-h-[500px]">

        {success ? (

          <div className="py-20 text-center space-y-4">

            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />

            <h3 className="text-xl font-extrabold text-slate-900">
              Appointment Confirmed Successfully!
            </h3>

            <p className="text-sm text-slate-500">
              Your consultation with{' '}
              <strong className="text-teal-800">
                {selectedDoctor?.name}
              </strong>{' '}
              on {date} at {selectedSlot?.time} has been reserved.
              Redirecting to dashboard...
            </p>

          </div>

        ) : (

          <form onSubmit={handleSubmitBooking} className="space-y-8">

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex items-start space-x-2">

                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                <span>{errorMsg}</span>

              </div>
            )}

            {/* DOCTOR SELECTION */}
            <div className="space-y-4 border-b border-slate-100 pb-5">

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

              {/* Specialty Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">

                {[
                  'All',
                  'Cardiology',
                  'General Medicine',
                  'Orthopedics',
                  'Pediatrics',
                  'Neurology',
                  'Dermatology',
                  'Emergency Care'
                ].map(spec => (

                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialtyFilter(spec)}
                    className={`text-xs px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedSpecialtyFilter === spec
                        ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-600/20'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {spec}
                  </button>

                ))}

              </div>

              {/* Loading Doctors */}
              {loadingDoctors ? (

                <div className="py-16 text-center">

                  <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />

                  <p className="text-xs text-slate-400 mt-3">
                    Loading registered physicians...
                  </p>

                </div>

              ) : filteredDoctors.length === 0 ? (

                <div className="py-16 text-center text-slate-500 text-sm bg-slate-50 rounded-2xl border border-slate-100 mt-4">

                  No active verified physicians are currently available.

                </div>

              ) : (

                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 pt-3">

                  {filteredDoctors.map(doc => {

                    const isSelected = selectedDoctor?.id === doc.id;

                    return (

                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setSelectedSlot(null);
                          setAvailableSlots([]);
                          setSlotError('');
                        }}
                        className={`border rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between group ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/60 shadow-md ring-2 ring-teal-500/20'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'
                        }`}
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-start space-x-3.5 min-w-0">

                            <div className="p-3 bg-teal-100/60 text-teal-700 rounded-2xl shrink-0">
                              <UserCheck className="w-6 h-6" />
                            </div>

                            <div className="min-w-0">

                              <h4 className="font-bold text-slate-900 text-base truncate pr-2">
                                {doc.name}
                              </h4>

                              <p className="text-xs text-teal-700 font-semibold">
                                {doc.specialty}
                              </p>

                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {doc.qualification}
                              </p>

                            </div>

                          </div>

                          {doc.rating != null && (

                            <span className="text-xs font-bold text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded-lg shrink-0 border border-amber-100">

                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />

                              {doc.rating}

                            </span>

                          )}

                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">

                          <span className="flex items-center space-x-1">

                            <Award className="w-3.5 h-3.5 text-slate-400" />

                            <span>
                              {doc.experience || (
                                doc.experience_years != null
                                  ? `${doc.experience_years} yrs exp`
                                  : 'Experience not specified'
                              )}
                            </span>

                          </span>

                          {doc.location && (

                            <span className="flex items-center space-x-1">

                              <MapPin className="w-3.5 h-3.5 text-slate-400" />

                              <span>{doc.location}</span>

                            </span>

                          )}

                        </div>

                      </div>

                    );

                  })}

                </div>

              )}

            </div>

            {/* DATE AND SLOT SELECTION */}
            {selectedDoctor && (

              <div className="space-y-6 pt-2 animate-fadeIn">

                {/* Selected Doctor */}
                <div className="bg-teal-50/60 border border-teal-100 p-4 rounded-2xl flex items-center justify-between">

                  <div className="flex items-center space-x-3">

                    <div className="p-2.5 bg-teal-600 text-white rounded-xl">
                      <Stethoscope className="w-5 h-5" />
                    </div>

                    <div>

                      <p className="text-xs text-teal-800 font-semibold uppercase tracking-wider">
                        Selected Specialist
                      </p>

                      <h4 className="text-sm font-bold text-slate-900">
                        {selectedDoctor.name} ({selectedDoctor.specialty})
                      </h4>

                    </div>

                  </div>

                  <span className="text-xs bg-white text-teal-700 font-bold px-3 py-1.5 rounded-xl shadow-sm border border-teal-200">
                    Ready to Book
                  </span>

                </div>

                {/* Date and Reason */}
                <div className="grid sm:grid-cols-2 gap-6">

                  <div>

                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Preferred Consultation Date
                    </label>

                    <input
                      type="date"
                      min={getLocalDateString()}
                      value={date}
                      onChange={e => setDate(e.target.value)}
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
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                    />

                  </div>

                </div>

                {/* Available Slots */}
                <div>

                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Available Time Slot
                  </label>

                  {loadingSlots ? (

                    <div className="py-6 text-center">

                      <Loader2 className="w-5 h-5 text-teal-600 animate-spin mx-auto" />

                      <p className="text-xs text-slate-400 mt-2">
                        Fetching available slots...
                      </p>

                    </div>

                  ) : slotError ? (

                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">
                      {slotError}
                    </div>

                  ) : availableSlots.length === 0 ? (

                    <p className="text-xs text-slate-400 py-3">
                      No available time slots found for this doctor on the selected date.
                    </p>

                  ) : (

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                      {availableSlots.map(slot => {

                        const isAvailable =
                          slot.status?.toLowerCase() === 'available';

                        const isSelected =
                          selectedSlot?.id === slot.id;

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

                {/* Booking Button */}
                <button
                  type="submit"
                  disabled={submitting || loadingSlots || !selectedSlot}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CalendarIcon className="w-4 h-4" />
                  )}

                  <span>
                    {submitting
                      ? 'Confirming Appointment...'
                      : `Confirm & Reserve Appointment with ${selectedDoctor.name}`}
                  </span>

                </button>

              </div>

            )}

          </form>

        )}

      </div>

    </div>
  );
}
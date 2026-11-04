import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Plus, Trash2, CheckCircle2, ShieldCheck,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, X
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function ManageSlots() {
  const { user } = useAuth();

  // This is the doctor_profiles.id, NOT the authentication user ID.
  const doctorProfileId = user?.doctorProfile?.id || null;

  const [selectedDate, setSelectedDate] = useState(() =>
    getLocalDateString(new Date())
  );

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startTimeInput, setStartTimeInput] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(30);

  const [submitting, setSubmitting] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [slotFilter, setSlotFilter] = useState('ALL');

  // Load slots belonging only to the logged-in doctor.
  const loadSlots = useCallback(async () => {
    if (!doctorProfileId) {
      setSlots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await doctorService.getDoctorSlots(
        doctorProfileId,
        selectedDate
      );

      setSlots(data || []);
    } catch (err) {
      console.error('Error loading availability slots:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });

      setErrorMsg(err.message || 'Unable to load availability slots.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [doctorProfileId, selectedDate]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleShiftDate = (days) => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + days);

    setSelectedDate(getLocalDateString(current));
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Create an availability slot.
  const handleAddSlot = async (e) => {
    e.preventDefault();

    setErrorMsg('');
    setSuccessMsg('');

    if (!doctorProfileId) {
      setErrorMsg('Doctor profile not found. Please log in again.');
      return;
    }

    if (!startTimeInput) {
      setErrorMsg('Please select a starting time.');
      return;
    }

    const startDateTime = new Date(
      `${selectedDate}T${startTimeInput}:00`
    );

    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60000
    );

    if (Number.isNaN(startDateTime.getTime())) {
      setErrorMsg('Please select a valid date and time.');
      return;
    }

    if (startDateTime <= new Date()) {
      setErrorMsg('You cannot create an availability slot in the past.');
      return;
    }

    if (endDateTime <= startDateTime) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    setSubmitting(true);

    try {
      await doctorService.createSlot(
        doctorProfileId,
        startDateTime.toISOString(),
        endDateTime.toISOString()
      );

      setSuccessMsg(
        `Availability slot published for ${startDateTime.toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        )}.`
      );

      await loadSlots();
    } catch (err) {
      console.error('Add slot error:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });

      setErrorMsg(
        err.message || 'Unable to publish the availability slot.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete only an available slot.
  const handleDeleteSlot = async (slotId, status) => {
    if (status?.toLowerCase() !== 'available') {
      setErrorMsg('Booked slots cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to remove this availability slot?'
    );

    if (!confirmed) return;

    setDeletingSlotId(slotId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await doctorService.deleteSlot(slotId);

      setSlots(previous =>
        previous.filter(slot => slot.id !== slotId)
      );

      setSuccessMsg('Availability slot successfully removed.');
    } catch (err) {
      console.error('Delete slot error:', err);
      setErrorMsg(err.message || 'Could not delete the slot.');
    } finally {
      setDeletingSlotId(null);
    }
  };

  const filteredSlots = slots.filter(slot => {
    const status = slot.status?.toLowerCase();

    if (slotFilter === 'AVAILABLE') {
      return status === 'available';
    }

    if (slotFilter === 'BOOKED') {
      return status === 'booked';
    }

    return true;
  });

  const todayStr = getLocalDateString(new Date());

  const availableCount = slots.filter(
    slot => slot.status?.toLowerCase() === 'available'
  ).length;

  const bookedCount = slots.filter(
    slot => slot.status?.toLowerCase() === 'booked'
  ).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Physician Schedule & Availability</span>
        </span>

        <h1 className="text-2xl md:text-3xl font-extrabold mt-3">
          Manage Consultation Slots
        </h1>

        <p className="text-teal-100 text-xs md:text-sm mt-1">
          Configure availability windows for patients to book consultations.
        </p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>

          <button onClick={() => setSuccessMsg('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>

          <button onClick={() => setErrorMsg('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Missing doctor profile */}
      {!doctorProfileId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          Your doctor profile has not loaded or is not linked to this account.
          Please log in again or check your doctor profile in Supabase.
        </div>
      )}

      {/* Date navigation */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleShiftDate(-1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-teal-600" />

            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 bg-slate-50"
            />
          </div>

          <button
            type="button"
            onClick={() => handleShiftDate(1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl ${
              selectedDate === todayStr
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setSelectedDate(getLocalDateString(tomorrow));
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600"
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Create slot */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Create Time Slot</span>
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Add consultation windows for patients.
            </p>
          </div>

          <form onSubmit={handleAddSlot} className="space-y-4">

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Selected Date
              </label>

              <input
                type="text"
                disabled
                value={selectedDate}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-600 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Start Time
              </label>

              <input
                type="time"
                required
                value={startTimeInput}
                onChange={e => setStartTimeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Consultation Duration
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      durationMinutes === mins
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !doctorProfileId}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing slot...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Slot to Calendar</span>
                </>
              )}
            </button>
          </form>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">
              Database Safeguards
            </span>
            <p>• Overlapping slots should be rejected by database validation.</p>
            <p>• Booked slots cannot be deleted.</p>
          </div>
        </div>

        {/* Slot list */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <span>Roster for {selectedDate}</span>
              </h3>

              <p className="text-xs text-slate-400 mt-0.5">
                {slots.length} total slots configured
              </p>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'ALL', label: `All (${slots.length})` },
                { id: 'AVAILABLE', label: `Available (${availableCount})` },
                { id: 'BOOKED', label: `Booked (${bookedCount})` }
              ].map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSlotFilter(filter.id)}
                  className={`px-3 py-1 rounded-lg ${
                    slotFilter === filter.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">
                Loading doctor schedule...
              </p>
            </div>
          ) : !doctorProfileId ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-10 h-10 text-red-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm mt-2">
                Doctor profile not found
              </h4>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />

              <h4 className="font-bold text-slate-700 text-sm">
                No slots for this date
              </h4>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No consultation slots are configured for {selectedDate}.
                Use the form to add bookable time windows.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3.5">
              {filteredSlots.map(slot => {
                const isBooked =
                  slot.status?.toLowerCase() === 'booked';

                return (
                  <div
                    key={slot.id}
                    className={`border rounded-2xl p-4 flex justify-between items-center ${
                      isBooked
                        ? 'bg-teal-50/40 border-teal-200'
                        : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl ${
                        isBooked
                          ? 'bg-teal-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-100'
                      }`}>
                        <Clock className="w-4 h-4" />
                      </div>

                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {slot.time}
                        </span>

                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isBooked
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {slot.status}
                          </span>

                          {isBooked && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Patient reserved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isBooked && (
                      <button
                        type="button"
                        disabled={deletingSlotId === slot.id}
                        onClick={() => handleDeleteSlot(slot.id, slot.status)}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
                        title="Remove unbooked slot"
                      >
                        {deletingSlotId === slot.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
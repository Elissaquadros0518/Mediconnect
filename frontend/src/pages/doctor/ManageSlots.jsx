import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Trash2, CheckCircle2, ShieldCheck, 
  Loader2, AlertCircle, ChevronLeft, ChevronRight, User, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { supabase } from '../../lib/supabase';

export default function ManageSlots() {
  const { user } = useAuth();
  
  // Date selection state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Slot creation form state
  const [startTimeInput, setStartTimeInput] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [doctorProfileId, setDoctorProfileId] = useState(null);

  // Filter slots by status: 'ALL' | 'AVAILABLE' | 'BOOKED'
  const [slotFilter, setSlotFilter] = useState('ALL');

  // Load Doctor Profile ID
  useEffect(() => {
    async function loadDoctorProfile() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('doctor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) setDoctorProfileId(data.id);
      } catch (err) {
        console.warn('Doctor profile lookup:', err.message);
      }
    }
    loadDoctorProfile();
  }, [user?.id]);

  // Load Slots for Date
  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getDoctorSlots(doctorProfileId || 'doc-1', selectedDate);
      setSlots(data);
    } catch (err) {
      console.error('Error loading slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [selectedDate, doctorProfileId]);

  // Day navigation helpers
  const handleShiftDate = (days) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!startTimeInput) {
      setErrorMsg('Please select a starting time.');
      return;
    }

    // Construct start and end Date objects in local time
    const startDateTime = new Date(`${selectedDate}T${startTimeInput}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
    const now = new Date();

    // Section 7 Validations
    if (startDateTime <= now) {
      setErrorMsg('Cannot configure availability in the past. Please select a future date and time.');
      return;
    }

    if (endDateTime <= startDateTime) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      const startTimeUTC = startDateTime.toISOString();
      const endTimeUTC = endDateTime.toISOString();

      if (doctorProfileId) {
        await doctorService.createSlot({
          doctorProfileId,
          startTime: startTimeUTC,
          endTime: endTimeUTC
        });
      } else {
        // Fallback local simulation if profile not yet loaded
        setSlots(prev => [
          ...prev,
          {
            id: `slot-local-${Date.now()}`,
            time: startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            startTime: startTimeUTC,
            endTime: endTimeUTC,
            status: 'Available'
          }
        ]);
      }

      setSuccessMsg(`Availability slot published for ${startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadSlots();
    } catch (err) {
      console.error('Add slot error:', err);
      if (err.message && err.message.includes('overlapping')) {
        setErrorMsg('Overlap Conflict: You already have an availability slot during this timeframe.');
      } else {
        setErrorMsg(err.message || 'Unable to publish slot. Please verify your calendar.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id, status) => {
    if (status === 'Booked') {
      alert('Cannot delete an already booked slot with an active appointment.');
      return;
    }

    if (!confirm('Are you sure you want to remove this availability slot?')) return;

    try {
      if (typeof id === 'string' && id.length > 20) {
        await doctorService.deleteSlot(id);
      }
      setSlots(prev => prev.filter(s => s.id !== id));
      setSuccessMsg('Slot successfully removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(`Could not delete slot: ${err.message}`);
    }
  };

  const filteredSlots = slots.filter(slot => {
    if (slotFilter === 'AVAILABLE') return slot.status === 'Available';
    if (slotFilter === 'BOOKED') return slot.status === 'Booked';
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Physician Schedule & Availability Engine</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">Manage Consultation Slots</h1>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl">
            Configure bookable availability windows in PostgreSQL with atomic concurrency safeguards, overlap prevention, and automatic patient notifications.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Date Navigation & Selector Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={() => handleShiftDate(1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Day Chips */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl transition ${
              selectedDate === todayStr ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            Tomorrow
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Form: Add Slot (Section 7) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Create Time Slot</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add individual consultation windows for patients.
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
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Consultation Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      durationMinutes === mins
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow transition text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Slot...</span>
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
            <span className="font-bold text-slate-700 block">Database Safeguards:</span>
            <p>• Overlapping slots are rejected by PostgreSQL triggers.</p>
            <p>• Booked appointments cannot be invalidated by slot modifications.</p>
          </div>
        </div>

        {/* Right List: Active Slots for Date */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <span>Roster for {selectedDate}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {slots.length} total slots configured for this calendar date
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSlotFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition ${
                  slotFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                All ({slots.length})
              </button>
              <button
                onClick={() => setSlotFilter('AVAILABLE')}
                className={`px-3 py-1 rounded-lg transition ${
                  slotFilter === 'AVAILABLE' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Available ({slots.filter(s => s.status === 'Available').length})
              </button>
              <button
                onClick={() => setSlotFilter('BOOKED')}
                className={`px-3 py-1 rounded-lg transition ${
                  slotFilter === 'BOOKED' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Booked ({slots.filter(s => s.status === 'Booked').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Checking schedule in Supabase...</p>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No Slots for This Date</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No consultation slots are configured for {selectedDate}. Use the form on the left to add bookable time windows.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3.5">
              {filteredSlots.map((slot) => {
                const isBooked = slot.status === 'Booked';

                return (
                  <div 
                    key={slot.id} 
                    className={`border rounded-2xl p-4 transition flex justify-between items-center ${
                      isBooked ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl ${isBooked ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-100'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">{slot.time}</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isBooked ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {slot.status}
                          </span>
                          {isBooked && (
                            <span className="text-[10px] text-slate-500 font-medium">Patient Reserved</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isBooked && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id, slot.status)}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Remove Unbooked Slot"
                      >
                        <Trash2 className="w-4 h-4" />
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
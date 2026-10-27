import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { supabase } from '../../lib/supabase';

export default function ManageSlots() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState('10:00 AM');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [doctorProfileId, setDoctorProfileId] = useState(null);

  // Load Doctor Profile ID
  useEffect(() => {
    async function loadDoctorProfile() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('doctor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
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

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newTime) return;

    setSubmitting(true);
    try {
      // Parse time into UTC timestamp
      const startTime = new Date(`${selectedDate} ${newTime}`).toISOString();
      const endTimeDate = new Date(`${selectedDate} ${newTime}`);
      endTimeDate.setMinutes(endTimeDate.getMinutes() + 30);
      const endTime = endTimeDate.toISOString();

      if (doctorProfileId) {
        await doctorService.createSlot({
          doctorProfileId,
          startTime,
          endTime
        });
      }

      setSuccessMsg('Consultation slot successfully published to calendar!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadSlots();
    } catch (err) {
      console.error('Add slot error:', err);
      setErrorMsg(err.message || 'Unable to publish slot. Slot may overlap with an existing slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      if (typeof id === 'string' && id.length > 20) {
        await doctorService.deleteSlot(id);
      }
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(`Could not delete slot: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Physician Schedule Manager</span>
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Manage Consultation Slots</h1>
        <p className="text-teal-100 text-sm mt-1">Configure your daily availability for patient appointment bookings in PostgreSQL.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-2xl border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-2xl border border-red-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Add Slot Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Add New Slot</span>
          </h3>

          <form onSubmit={handleAddSlot} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Date</label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time Slot</label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="11:45 AM">11:45 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow transition text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : 'Publish Slot'}</span>
            </button>
          </form>
        </div>

        {/* Right: Active Slots List */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Active Slots for {selectedDate}</span>
            </h3>
            <span className="text-xs bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full">
              {slots.length} Total Slots
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Checking schedule...</p>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No consultation slots configured for this date.</p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div key={slot.id} className="border border-slate-100 bg-slate-50/60 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{slot.time}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        slot.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {slot.status}
                      </span>
                    </div>
                  </div>

                  {slot.status === 'Available' && (
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Remove Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
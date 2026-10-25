import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ManageSlots() {
  const [selectedDate, setSelectedDate] = useState('2026-11-02');
  const [slots, setSlots] = useState([
    { id: 1, time: '09:00 AM', status: 'Available' },
    { id: 2, time: '10:30 AM', status: 'Booked' },
    { id: 3, time: '11:45 AM', status: 'Available' },
    { id: 4, time: '02:00 PM', status: 'Available' }
  ]);

  const [newTime, setNewTime] = useState('');

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newTime) return;

    const newSlotItem = {
      id: Date.now(),
      time: newTime,
      status: 'Available'
    };

    setSlots([...slots, newSlotItem]);
    setNewTime('');
    alert('New consultation slot added successfully!');
  };

  const handleDeleteSlot = (id) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Physician Schedule Manager</span>
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Manage Consultation Slots</h1>
        <p className="text-teal-100 text-sm mt-1">Configure your daily availability for patient appointment bookings.</p>
      </div>

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
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time Slot</label>
              <input 
                type="text"
                placeholder="e.g. 03:30 PM"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow transition text-xs flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Slot</span>
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

          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="border border-slate-100 bg-slate-50/60 rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl font-bold text-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{slot.time}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      slot.status === 'Booked' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                </div>

                {slot.status === 'Available' && (
                  <button 
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                    title="Remove Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
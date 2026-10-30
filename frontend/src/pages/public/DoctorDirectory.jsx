import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Stethoscope, Star, Calendar, ShieldCheck, ArrowRight, X, Award, CheckCircle2, MessageSquare, Loader2 
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';

export default function DoctorDirectory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [specialties, setSpecialties] = useState(['All']);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [specs, docs] = await Promise.all([
          doctorService.getSpecialties(),
          doctorService.getPublicDoctors({ specialty: selectedSpecialty, search: searchTerm })
        ]);

        setSpecialties(['All', ...specs.map(s => s.name)]);
        setDoctorsList(docs);
      } catch (err) {
        console.error('Error loading doctor directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedSpecialty, searchTerm]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-10 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Medical Specialists</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Meet Our Doctors</h1>
          <p className="text-teal-100 text-sm max-w-xl">
            Book consultations with top-tier verified specialists. Browse available appointments, qualifications, and patient reviews.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0">
          <p className="text-2xl font-black text-teal-200">100%</p>
          <p className="text-xs text-teal-100">Licensed Practitioners</p>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search doctor by name, specialty, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Specialty Filter Badges */}
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSpecialty === spec
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading specialist doctors from Supabase...</p>
        </div>
      ) : doctorsList.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700">No Specialists Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No doctors matched your criteria. Try adjusting your specialty filter or search keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctorsList.map((doc) => (
            <div 
              key={doc.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={doc.img} 
                    alt={doc.name} 
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">{doc.name}</h3>
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                      {doc.specialty}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {doc.bio}
                </p>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-semibold">{doc.experience}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-semibold text-teal-700">₹{doc.consultation_fee || 1000}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-2">
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition"
                >
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/patient/book-appointment?doctorId=${doc.id}`)}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1"
                >
                  <span>Book Visit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <img 
                src={selectedDoctor.img} 
                alt={selectedDoctor.name} 
                className="w-16 h-16 rounded-2xl object-cover border"
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedDoctor.name}</h3>
                <p className="text-xs text-teal-700 font-semibold">{selectedDoctor.specialty}</p>
                <p className="text-xs text-slate-400">{selectedDoctor.qualification}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs text-slate-700">
              <p><strong>Biography:</strong> {selectedDoctor.bio}</p>
              <p><strong>Experience:</strong> {selectedDoctor.experience}</p>
              <p><strong>Consultation Fee:</strong> ₹{selectedDoctor.consultation_fee || 1000}</p>
              <p><strong>Hours:</strong> {selectedDoctor.availability}</p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const docId = selectedDoctor.id;
                  setSelectedDoctor(null);
                  navigate(`/patient/book-appointment?doctorId=${docId}`);
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
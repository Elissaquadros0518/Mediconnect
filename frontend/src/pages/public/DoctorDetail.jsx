import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Star, Award, Calendar, ShieldCheck, Stethoscope, MessageSquare, CheckCircle2, Loader2 
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';

export default function DoctorDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctor() {
      setLoading(true);
      try {
        const doc = await doctorService.getDoctorById(id);
        setDoctor(doc);
      } catch (err) {
        console.error('Error loading doctor details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctor();
  }, [id]);

  const handleBookAppointment = () => {
    navigate(`/patient/book-appointment?doctorId=${id}`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading physician credentials...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Doctor Not Found</h2>
        <button onClick={() => navigate('/doctors')} className="text-sm text-teal-600 font-semibold underline">
          &larr; Return to Doctor Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </button>

      {/* Hero Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Doctor Image */}
        <div className="relative h-64 md:h-full min-h-[260px] rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
          <img 
            src={doctor.img} 
            alt={doctor.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center space-x-1 shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{doctor.rating}</span>
            <span className="text-[10px] text-slate-400">({doctor.reviewsCount})</span>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {doctor.specialty}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Specialist</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{doctor.name}</h1>
            <p className="text-sm font-medium text-slate-500">{doctor.qualification}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-y border-slate-100 py-3 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Experience</p>
              <p className="font-bold text-slate-800 mt-0.5">{doctor.experience}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Consultation Fee</p>
              <p className="font-bold text-teal-700 mt-0.5">₹{doctor.consultation_fee || 1000}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient Rating</p>
              <p className="font-bold text-slate-800 mt-0.5">{doctor.rating} / 5.0</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {doctor.bio}
          </p>

          <div className="pt-2">
            <button
              onClick={handleBookAppointment}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Consultation With Doctor</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
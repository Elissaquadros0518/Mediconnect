import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Star, Award, Calendar, ShieldCheck, Stethoscope, MessageSquare, CheckCircle2 
} from 'lucide-react';

export default function DoctorDetail() {
  const navigate = useNavigate();
  const { id } = useParams(); // Can be used to fetch doctor data dynamically if hooked up to an API

  // Mock detailed doctor profile (matches the roster from the Doctor Directory)
  const [doctor] = useState({
    id: id || 1,
    name: 'Dr. Rajesh Sharma, MD',
    specialty: 'Cardiology',
    qualification: 'DM (Cardiology), AIIMS New Delhi',
    experience: '14 Years Experience',
    rating: 4.9,
    reviewsCount: 142,
    availability: 'Mon - Sat (09:00 AM - 04:00 PM)',
    bio: 'Dr. Rajesh Sharma is a senior interventional cardiologist at MediConnect Hospital with over 14 years of clinical experience. He specializes in complex coronary angioplasty, pacemaker implantations, and advanced heart failure management. Committed to patient-centric care, he leads our cardiac critical care unit.',
    reviews: [
      { author: 'Amit Patel', rating: 5, comment: 'Extremely polite and explained my father’s heart condition with great clarity. Exceptional doctor!' },
      { author: 'Priya Deshmukh', rating: 5, comment: 'Best cardiologist in the hospital. Highly recommended for any cardiac evaluations.' },
      { author: 'Rohan Gupta', rating: 4, comment: 'Very professional staff and timely consultation.' }
    ],
    img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600'
  });

  const handleBookAppointment = () => {
    navigate('/patient/book-appointment');
  };

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

        {/* Doctor Core Meta */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
              {doctor.specialty} Specialist
            </span>
            <h1 className="text-3xl font-black text-slate-900">{doctor.name}</h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">{doctor.qualification}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-teal-700 bg-teal-50/60 px-3 py-1.5 rounded-xl">
              <Award className="w-4 h-4" />
              <span>{doctor.experience}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>MediConnect Hospital Campus</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed pt-2">
            {doctor.bio}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultation Fee</span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block mt-0.5">
                ₹0 (Covered under Hospital Membership)
              </span>
            </div>
            <button 
              onClick={handleBookAppointment}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition text-sm flex items-center justify-center space-x-2"
            >
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

      </div>

      {/* Additional Details Grid: Schedule & Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Hospital Schedule Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <span>Hospital Timings</span>
          </h3>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <span className="font-bold text-slate-800 block">Available Shifts:</span>
            <p className="text-slate-600">{doctor.availability}</p>
            <p className="text-teal-700 font-semibold pt-1">Mode: In-Person & Telehealth Video</p>
          </div>
        </div>

        {/* Patient Reviews Card */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <span>Patient Testimonials ({doctor.reviews.length})</span>
          </h3>

          <div className="space-y-3">
            {doctor.reviews.map((rev, index) => (
              <div key={index} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rev.author}</span>
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 italic leading-relaxed">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
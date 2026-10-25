import React, { useState } from 'react';
import { 
  Search, Stethoscope, Star, Calendar, ShieldCheck, ArrowRight, X, Award, CheckCircle2, MessageSquare 
} from 'lucide-react';

export default function DoctorDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null); // State for the doctor details modal

  // Roster of expert Indian doctors at MediConnect Hospital
  const doctorsList = [
    {
      id: 1,
      name: 'Dr. Rajesh Sharma, MD',
      specialty: 'Cardiology',
      qualification: 'DM (Cardiology), AIIMS New Delhi',
      experience: '14 Years Experience',
      rating: 4.9,
      reviewsCount: 142,
      availability: 'Mon - Sat (09:00 AM - 04:00 PM)',
      bio: 'Expert in interventional cardiology, coronary angioplasty, and advanced heart failure management.',
      reviews: [
        { author: 'Amit Patel', comment: 'Extremely polite and explained my father’s heart condition with great clarity.' },
        { author: 'Priya Deshmukh', comment: 'Best cardiologist in the hospital. Highly recommended!' }
      ],
      img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 2,
      name: 'Dr. Sneha Kulkarni, MBBS, DNB',
      specialty: 'General Medicine',
      qualification: 'Gold Medalist, KEM Hospital Mumbai',
      experience: '9 Years Experience',
      rating: 4.8,
      reviewsCount: 98,
      availability: 'Mon - Fri (10:00 AM - 06:00 PM)',
      bio: 'Specializes in chronic disease management, diabetes care, infectious diseases, and preventive health checks.',
      reviews: [
        { author: 'Rohan Gupta', comment: 'Very thorough during checkups and takes time to listen to symptoms.' }
      ],
      img: 'https://images.unsplash.com/photo-1594824813578-834e062eb1d1?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 3,
      name: 'Dr. Vikram Iyer, MS, MCh',
      specialty: 'Pediatrics',
      qualification: 'Pediatric Specialist, CMC Vellore',
      experience: '12 Years Experience',
      rating: 5.0,
      reviewsCount: 180,
      availability: 'Mon - Sat (08:30 AM - 02:00 PM)',
      bio: 'Dedicated child specialist focusing on neonatal care, childhood immunizations, and developmental pediatrics.',
      reviews: [
        { author: 'Ananya Roy', comment: 'Wonderful with kids! My toddler was not scared at all.' }
      ],
      img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 4,
      name: 'Dr. Pooja Menon, MS',
      specialty: 'Emergency Care',
      qualification: 'Head of Triage, MediConnect Hospital',
      experience: '11 Years Experience',
      rating: 4.9,
      reviewsCount: 215,
      availability: '24/7 On-Duty Roster',
      bio: 'Specialized in critical care trauma response, acute medical stabilization, and emergency triage protocols.',
      reviews: [
        { author: 'Sameer Joshi', comment: 'Prompt emergency handling and very reassuring staff.' }
      ],
      img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 5,
      name: 'Dr. Amit Deshmukh, DM',
      specialty: 'Neurology',
      qualification: 'Consultant Neurologist, NIMHANS',
      experience: '16 Years Experience',
      rating: 4.9,
      reviewsCount: 130,
      availability: 'Tue, Thu, Sat (11:00 AM - 05:00 PM)',
      bio: 'Expert in stroke management, epilepsy care, migraine disorders, and neuro-diagnostics.',
      reviews: [
        { author: 'Meera Nair', comment: 'An exceptional neurologist. Truly grateful for his diagnosis.' }
      ],
      img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 6,
      name: 'Dr. Neha Agarwal, MS (Ortho)',
      specialty: 'Orthopedics',
      qualification: 'Joint Replacement Fellow, Lilavati Hospital',
      experience: '10 Years Experience',
      rating: 4.8,
      reviewsCount: 104,
      availability: 'Mon - Fri (09:30 AM - 03:30 PM)',
      bio: 'Specializing in arthroscopy, sports injuries, knee replacements, and spinal rehabilitation.',
      reviews: [
        { author: 'Karan Malhotra', comment: 'Surgery recovery went smoothly thanks to her guidance.' }
      ],
      img: 'https://images.unsplash.com/photo-1594824813578-834e062eb1d1?auto=format&fit=crop&q=80&w=400'
    }
  ];

  const specialties = ['All', 'Cardiology', 'General Medicine', 'Pediatrics', 'Emergency Care', 'Neurology', 'Orthopedics'];

  // Filtering logic
  const filteredDoctors = doctorsList.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.qualification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-10 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MediConnect Hospital Roster</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Our Expert Medical Specialists</h1>
          <p className="text-teal-100 text-sm max-w-xl">
            Consult top-tier Indian physicians and specialists at MediConnect Hospital. All internal consultations are completely fee-free for registered members.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0">
          <p className="text-2xl font-black">{doctorsList.length}+</p>
          <p className="text-xs text-teal-200">On-Campus Specialists</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input 
            type="text"
            placeholder="Search by doctor name, specialty, or qualifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Specialty Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => setSelectedDoctor(doc)} // Clicking anywhere on the card opens details modal
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Image Header */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img 
                    src={doc.img} 
                    alt={doc.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center space-x-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{doc.rating}</span>
                    <span className="text-[10px] text-slate-400">({doc.reviewsCount})</span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-teal-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {doc.specialty}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-teal-600 transition">{doc.name}</h3>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{doc.qualification}</p>
                    <p className="text-xs font-bold text-teal-700 mt-1">{doc.experience}</p>
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.availability}</span>
                  </div>
                </div>
              </div>

              {/* Footer: Fee Status & Click Hint */}
              <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 bg-slate-50/50">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultation Fee</span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    Free (Hospital Member)
                  </span>
                </div>
                <span className="text-xs font-semibold text-teal-600 group-hover:translate-x-1 transition flex items-center space-x-1">
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No specialists found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search query or specialty category.</p>
          </div>
        )}
      </div>

      {/* --- DOCTOR DETAILS POPUP MODAL --- */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Doctor Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-100 pb-6">
              <img 
                src={selectedDoctor.img} 
                alt={selectedDoctor.name} 
                className="w-24 h-24 rounded-2xl object-cover shadow-md shrink-0" 
              />
              <div className="space-y-1">
                <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedDoctor.specialty} Department
                </span>
                <h2 className="text-2xl font-black text-slate-900">{selectedDoctor.name}</h2>
                <p className="text-xs text-slate-600 font-medium">{selectedDoctor.qualification}</p>
                <div className="flex items-center space-x-3 pt-1 text-xs font-bold text-slate-700">
                  <span className="text-teal-700 flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>{selectedDoctor.experience}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-amber-600">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{selectedDoctor.rating} ({selectedDoctor.reviewsCount} Reviews)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="py-6 space-y-6">
              {/* Bio / About */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About Specialist</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedDoctor.bio}</p>
              </div>

              {/* Schedule & Fees */}
              <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hospital Schedule</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedDoctor.availability}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Consultation Charge</span>
                  <span className="text-xs font-extrabold text-emerald-700 mt-0.5 block">₹0 (Covered under MediConnect Membership)</span>
                </div>
              </div>

              {/* Patient Reviews Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Patient Testimonials & Reviews</span>
                </h4>
                <div className="space-y-3">
                  {selectedDoctor.reviews.map((rev, index) => (
                    <div key={index} className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rev.author}</span>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setSelectedDoctor(null);
                  window.location.href = '/patient/book-appointment';
                }}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center space-x-2"
              >
                <span>Book Appointment With Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
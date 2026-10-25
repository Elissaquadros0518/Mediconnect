import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShieldCheck, Activity, CheckCircle2, Phone, MapPin, Clock, ArrowRight 
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* 1. MAIN BRANDING & LOGIN BAR */}
      <div className="bg-white border-b border-slate-200 py-2 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-teal-600 text-white p-2 rounded-xl shadow">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                MediConnect 
              </h1>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                Cloud-Ready Healthcare Portal
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link 
              to="/login"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION MENU BAR */}
      <nav className="bg-sky-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-12">
          <div className="flex items-center space-x-2 sm:space-x-6 text-sm font-medium overflow-x-auto py-2">
            <button onClick={() => scrollToSection('home')} className="px-2 py-1 hover:text-teal-200 transition">Home</button>
            <button onClick={() => scrollToSection('about')} className="px-2 py-1 hover:text-teal-200 transition">About Us</button>
            <button onClick={() => scrollToSection('specialties')} className="px-2 py-1 hover:text-teal-200 transition">Specialties</button>
            <button onClick={() => scrollToSection('contact')} className="px-2 py-1 hover:text-teal-200 transition">Contact & Emergency</button>
            <Link to="/doctors" className="px-2 py-1 hover:text-teal-200 transition">Find a Doctor</Link>
          </div>

          <div className="bg-sky-600 hover:bg-sky-800 p-2 rounded-full cursor-pointer transition">
            <Search className="w-4 h-4 text-white" />
          </div>
        </div>
      </nav>

      {/* 3. HERO BANNER SECTION */}
      <section id="home" className="relative bg-slate-900 text-white overflow-hidden min-h-[500px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center opacity-30" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-8 py-20 w-full space-y-6">
          <div className="inline-flex items-center space-x-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3.5 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Patient Care & Medical Records</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl">
            Your Healthcare, <span className="text-teal-400">Connected Securely.</span>
          </h2>
          
          <p className="text-slate-300 text-base md:text-lg max-w-2xl">
            Manage appointments, access medical information, and stay connected with healthcare professionals—all in one secure place.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              to="/login" 
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition flex items-center space-x-2"
            >
              <span>Access Login Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => scrollToSection('about')} 
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl backdrop-blur-sm transition"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* 4. ABOUT US SECTION */}
      <section id="about" className="py-20 max-w-7xl mx-auto px-6 md:px-8 w-full border-b border-slate-200">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              About MediConnect
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Simple, Accessible, and Reliable Healthcare
            </h3>
            <p className="text-slate-600 leading-relaxed">
              MediConnect connects patients with medical services seamlessly, empowering you to manage appointments, access records, and consult professionals in one unified platform.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700"><strong>Our Mission:</strong> Simplifying healthcare through technology to make quality services accessible to all.</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700"><strong>Our Vision:</strong> A healthier future where care is always within your reach.</p>
              </div>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200">
            <img 
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800" 
              alt="Doctor patient consultation" 
              className="w-full h-[350px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. SPECIALTIES & DEPARTMENTS SECTION (WITH YOUR DIRECT IMAGE URLS) */}
      <section id="specialties" className="py-20 bg-white border-b border-slate-200 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">Specialties & Departments</h3>
            <p className="text-slate-600 text-sm">
              Explore our core medical departments equipped with digital scheduling and expert care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                title: 'Cardiology', 
                desc: 'Comprehensive heart care and cardiovascular diagnostics.', 
                img: 'https://media.istockphoto.com/id/2142793215/photo/cardiovascular-disease-cvd-doctor-with-heart-human-model-anatomy-for-treatment-patient-in.jpg?s=612x612&w=0&k=20&c=Ne1jDPdIO3IDuJOZDECEL7Tn-JzcSYV6O7QNdqUefpo=' 
              },
              { 
                title: 'General Medicine', 
                desc: 'Primary health consultations and routine wellness checks.', 
                img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600' 
              },
              { 
                title: 'Pediatrics', 
                desc: 'Specialized healthcare for infants, children, and teens.', 
                img: 'https://cdn.pixabay.com/photo/2026/03/14/02/39/tungart7-pediatrician-10172911_1280.jpg' 
              },
              { 
                title: 'Emergency Care', 
                desc: '24/7 urgent triage and rapid appointment dispatch.', 
                img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6-YOvTESbJIU0FqJPrxJY3dR-6kwqNzSiir7NTldRq9hZBShhqvC3uJz-&s=10' 
              }
            ].map((spec, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition group">
                <div className="h-40 overflow-hidden">
                  <img src={spec.img} alt={spec.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-slate-900 mb-1">{spec.title}</h4>
                  <p className="text-xs text-slate-600">{spec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CONTACT & EMERGENCY SECTION */}
      <section id="contact" className="py-20 max-w-7xl mx-auto px-6 md:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">Contact & Emergency Support</h3>
          <p className="text-slate-600 text-sm">
            Reach out to our 24/7 helpdesks, emergency response units, and administrative offices.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Emergency Hotline</h4>
              <p className="text-slate-600 text-sm mb-4">
                Available 24 hours a day, 7 days a week for immediate medical dispatch and critical care queries.
              </p>
            </div>
            <div className="bg-red-50 text-red-700 font-bold p-3 rounded-xl text-center">
              022 2759 1851
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Patient Helpdesk</h4>
              <p className="text-slate-600 text-sm mb-4">
                For appointment scheduling, billing inquiries, and general medical record assistance.
              </p>
            </div>
            <div className="bg-teal-50 text-teal-700 font-bold p-3 rounded-xl text-center">
              022 6273 1946
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Hospital Location</h4>
              <p className="text-slate-600 text-sm mb-4">
                MediConnect Medical Center, Cumballa Hill, Mumbai, Maharashtra 400026.
              </p>
            </div>
            <div className="bg-sky-50 text-sky-700 font-semibold p-3 rounded-xl text-center text-xs">
              Open Mon - Sat: 8:00 AM - 8:00 PM
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm mt-auto border-t border-slate-800">
        <p>&copy; {new Date().getFullYear()} MediConnect Platform. All rights reserved.</p>
      </footer>

    </div>
  );
}
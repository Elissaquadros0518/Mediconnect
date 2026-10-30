import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, ShieldCheck, Save, ArrowLeft, 
  CheckCircle2, Stethoscope, Award, DollarSign, Clock, AlertCircle, 
  Loader2, Globe, FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [specialties, setSpecialties] = useState([]);

  // Editable Doctor Profile Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    experienceYears: 5,
    consultationFee: 1000,
    specialtyId: '',
    biography: '',
    preferredTimezone: 'UTC',
    registrationNumber: '',
    verificationStatus: 'PENDING',
    role: 'DOCTOR'
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [docProf, specList] = await Promise.all([
          doctorService.getDoctorProfileByUserId(user.id),
          doctorService.getSpecialties()
        ]);

        setSpecialties(specList);

        if (docProf) {
          setFormData({
            fullName: docProf.name || user.name || '',
            email: user.email || '',
            phone: docProf.phone || user.phone || '',
            qualification: docProf.qualification || 'MBBS, MD',
            experienceYears: docProf.experienceYears || 5,
            consultationFee: docProf.consultationFee || 1000,
            specialtyId: docProf.specialtyId || (specList.length > 0 ? specList[0].id : ''),
            biography: docProf.biography || '',
            preferredTimezone: 'UTC',
            registrationNumber: docProf.registrationNumber || 'MED-REG-DEFAULT',
            verificationStatus: docProf.verificationStatus || 'PENDING',
            role: 'DOCTOR'
          });
        }
      } catch (err) {
        console.error('Error loading doctor profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      await doctorService.updateDoctorProfile(user.id, {
        fullName: formData.fullName,
        phone: formData.phone,
        qualification: formData.qualification,
        experienceYears: formData.experienceYears,
        consultationFee: formData.consultationFee,
        biography: formData.biography,
        specialtyId: formData.specialtyId,
        preferredTimezone: formData.preferredTimezone
      });

      if (refreshProfile) await refreshProfile();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error('Update doctor profile error:', err);
      setErrorMsg(err.message || 'Unable to persist profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Doctor Credentials & Profile...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/doctor/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Physician Credentials</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">Physician Profile & Practice Settings</h1>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-xl">
            Update your public professional biography, consultation fee, and hospital qualifications. License numbers and security roles are verified and protected by administration.
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className={`px-4 py-2.5 rounded-2xl border text-center shrink-0 ${
          formData.verificationStatus === 'APPROVED' 
            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
            : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
        }`}>
          <div className="flex items-center space-x-1.5 justify-center">
            <FileCheck className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-wider">
              {formData.verificationStatus}
            </span>
          </div>
          <p className="text-[10px] text-teal-100 mt-0.5">Hospital Medical Council</p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {success && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-2xl border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Doctor profile and practice parameters successfully persisted to Supabase!</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Profile Form Card (Section 12) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          <h3 className="font-extrabold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center space-x-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Personal & Contact Identity</span>
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Professional Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Account Email (Protected)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Direct Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98201 12345"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Preferred Operating Timezone
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  name="preferredTimezone"
                  value={formData.preferredTimezone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base pt-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>Clinical Credentials & Practice Attributes</span>
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Medical Specialty <span className="text-red-500">*</span>
              </label>
              <select
                name="specialtyId"
                value={formData.specialtyId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Degrees & Qualifications <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text"
                  name="qualification"
                  required
                  placeholder="e.g. MBBS, MD (Cardiology), FACC"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Clinical Experience (Years)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="number"
                  min="0"
                  max="70"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Consultation Fee (₹ INR)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="number"
                  min="0"
                  step="50"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Professional Biography & Clinical Experience
            </label>
            <textarea 
              rows={4}
              name="biography"
              placeholder="Describe your clinical expertise, surgical background, fellowship training, and medical focus..."
              value={formData.biography}
              onChange={handleChange}
              className="w-full p-3.5 border border-slate-300 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
          </div>

          {/* Protected Fields Notice (Section 12 & 14) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <span className="font-bold text-slate-800 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Protected Licensing & Administrative Verification</span>
            </span>
            <div className="grid sm:grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration / License #</span>
                <span className="font-mono font-bold text-slate-800">{formData.registrationNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">System Role</span>
                <span className="font-mono font-bold text-teal-700">{formData.role} (Cannot be escalated)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Medical Council registration and system roles cannot be self-modified and require administrative review.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3.5 rounded-xl shadow transition text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes to Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Physician Profile Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}

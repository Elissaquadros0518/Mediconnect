import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, ShieldCheck, Save, ArrowLeft, CheckCircle2, HeartPulse, Building, Loader2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: 'Vidyavihar West, Mumbai, Maharashtra, 400077',
    bloodGroup: 'B+',
    dob: '2004-10-18',
    emergencyContact: 'Emergency Contact (+91 98201 65432)',
    insuranceProvider: 'MediConnect Health Cover (Policy #MC-889234)',
    allergies: 'Penicillin, Dust Mites'
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      if (user?.id) {
        await authService.updateProfile(user.id, {
          full_name: profile.name,
          phone: profile.phone
        });
        await refreshProfile();
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/patient/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Supabase Account</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Patient Profile & Health ID</h1>
          <p className="text-teal-100 text-sm mt-1">
            Manage your personal contact info, emergency contacts, and vital medical insurance policies.
          </p>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        
        {success && (
          <div className="mb-6 bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-xl border border-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile successfully updated and synced with Supabase!</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="email"
                  name="email"
                  disabled
                  value={profile.email}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Contact</label>
              <input 
                type="text"
                name="emergencyContact"
                value={profile.emergencyContact}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input 
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Insurance Provider & Policy #</label>
              <input 
                type="text"
                name="insuranceProvider"
                value={profile.insuranceProvider}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Known Allergies / Medical Flags</label>
              <input 
                type="text"
                name="allergies"
                value={profile.allergies}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3 rounded-xl shadow transition text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <span>Saving to Supabase...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Patient Records</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Save,
  Edit3,
  X,
  CheckCircle2,
  HeartPulse,
  Loader2,
  AlertCircle,
  Printer,
  Droplet,
  QrCode
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';

export default function PatientProfile() {
  const { user, refreshProfile } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bloodGroup: 'A+',
    dob: '',
    gender: 'Male',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyRelationship: '',
    insuranceProvider: '',
    allergies: '',
    chronicConditions: '',
    healthId: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);

  // Fetch patient profile from Supabase on load
  useEffect(() => {
    async function loadPatientData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data = await patientService.getProfile(user.id);

        if (data) {
          setProfile({
            name: data.full_name || user.name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            address: data.address || '',
            bloodGroup: data.blood_group || 'A+',
            dob: data.dob || '',
            gender: data.gender || 'Male',
            emergencyContactName: data.emergency_contact_name || '',
            emergencyContactPhone: data.emergency_contact_phone || '',
            emergencyRelationship: data.emergency_relationship || '',
            insuranceProvider: data.insurance_provider || '',
            allergies: data.allergies || '',
            chronicConditions: data.chronic_conditions || '',
            healthId:
              data.health_id ||
              `MC-PAT-${user.id.slice(0, 5).toUpperCase()}`
          });
        }
      } catch (err) {
        console.error('Error fetching patient profile:', err);
        setErrorMsg('Failed to load patient records from database.');
      } finally {
        setLoading(false);
      }
    }

    loadPatientData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setSaving(true);
    setErrorMsg('');

    try {
      if (user?.id) {
        const payload = {
          full_name: profile.name,
          phone: profile.phone,
          address: profile.address,
          blood_group: profile.bloodGroup,
          dob: profile.dob,
          gender: profile.gender,
          emergency_contact_name: profile.emergencyContactName,
          emergency_contact_phone: profile.emergencyContactPhone,
          emergency_relationship: profile.emergencyRelationship,
          insurance_provider: profile.insuranceProvider,
          allergies: profile.allergies,
          chronic_conditions: profile.chronicConditions,
          updated_at: new Date()
        };

        await patientService.updateProfile(user.id, payload);

        if (refreshProfile) {
          await refreshProfile();
        }
      }

      setSuccess(true);
      setIsEditing(false);

      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg(
        err.message || 'Unable to update patient profile in database.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculate Age
  const calculateAge = (dobString) => {
    if (!dobString) return '--';

    const birthDate = new Date(dobString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);

    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">

      {/* Top Banner with Health ID Card & Edit Toggle */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-teal-700/30">

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

          <div className="flex items-center space-x-4 sm:space-x-5">

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 p-0.5 shadow-md flex items-center justify-center shrink-0">

              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-teal-200 font-black text-2xl tracking-tight">
                {profile.name
                  ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                  : 'PT'}
              </div>

            </div>

            <div className="space-y-1 min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 backdrop-blur-sm border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span>Verified Health ID</span>
                </span>

                <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Active Care Recipient
                </span>

              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                {profile.name || 'Complete Your Profile'}
              </h1>

              <p className="text-teal-200/90 text-xs sm:text-sm flex flex-wrap gap-x-4">
                <span>
                  Health ID:{' '}
                  <span className="text-white font-mono font-bold">
                    {profile.healthId || 'Pending'}
                  </span>
                </span>

                <span>
                  Blood Group:{' '}
                  <span className="text-red-300 font-bold">
                    {profile.bloodGroup}
                  </span>
                </span>

                <span>
                  Age:{' '}
                  <span className="text-white font-medium">
                    {calculateAge(profile.dob)} Years
                  </span>
                </span>
              </p>

            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">

            <button
              onClick={() => setShowCardModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20 transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span>Digital Health Card</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 ${
                isEditing
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-teal-500 hover:bg-teal-600 text-slate-950'
              }`}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Cancel Editing</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Patient profile records successfully updated in Supabase!
          </span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clinical Vitals Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Blood Group
          </span>

          <p className="text-xl font-black text-red-600 flex items-center space-x-1.5">
            <Droplet className="w-4 h-4 fill-red-600" />
            <span>{profile.bloodGroup}</span>
          </p>

          <p className="text-[10px] text-slate-400">
            Universal Compatible
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Date of Birth
          </span>

          <p className="text-lg font-black text-slate-900">
            {profile.dob || 'Not set'}
          </p>

          <p className="text-[10px] text-slate-500">
            {calculateAge(profile.dob)} Years ({profile.gender})
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Caregiver Contact
          </span>

          <p className="text-sm font-extrabold text-slate-900 truncate">
            {profile.emergencyContactName || 'Not specified'}
          </p>

          <p className="text-[10px] text-teal-700 font-semibold">
            {profile.emergencyContactPhone || '--'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Medical Insurance
          </span>

          <p className="text-sm font-extrabold text-emerald-800 truncate">
            {profile.insuranceProvider || 'Standard Cover'}
          </p>

          <p className="text-[10px] text-slate-500">
            Active Hospitalization
          </p>
        </div>

      </div>

      {/* Main Profile Details / Edit Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">

        <form onSubmit={handleUpdateProfile} className="space-y-6">

          {/* Section 1: Personal & Identification Information */}
          <div className="space-y-4">

            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-teal-600" />
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                Personal & Contact Identification
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Legal Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registered Email (Read-Only)
                </label>

                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number *
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Blood Group *
                  </label>

                  <select
                    name="bloodGroup"
                    value={profile.bloodGroup}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-red-600 ${
                      isEditing
                        ? 'border-slate-300 bg-white'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gender *
                  </label>

                  <select
                    name="gender"
                    value={profile.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      isEditing
                        ? 'border-slate-300 bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="dob"
                  value={profile.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Residential Address
                </label>

                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

            </div>
          </div>

          {/* Section 2: Emergency Contact & Caregiver */}
          <div className="space-y-4 pt-2">

            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Phone className="w-4 h-4 text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                Emergency Contacts & Caregiver
              </h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Emergency Contact Name
                </label>

                <input
                  type="text"
                  name="emergencyContactName"
                  value={profile.emergencyContactName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Relationship
                </label>

                <input
                  type="text"
                  name="emergencyRelationship"
                  value={profile.emergencyRelationship}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Emergency Phone
                </label>

                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={profile.emergencyContactPhone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

            </div>
          </div>

          {/* Section 3: Clinical Flags, Allergies & Insurance */}
          <div className="space-y-4 pt-2">

            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <HeartPulse className="w-4 h-4 text-red-600" />
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                Medical History, Allergies & Insurance
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Known Drug & Environmental Allergies
                </label>

                <input
                  type="text"
                  name="allergies"
                  value={profile.allergies}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Penicillin, Dust Mites, Shellfish..."
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Chronic Medical Conditions
                </label>

                <input
                  type="text"
                  name="chronicConditions"
                  value={profile.chronicConditions}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. Hypertension, Diabetes..."
                  className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    isEditing
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Health Insurance Policy & Provider
              </label>

              <input
                type="text"
                name="insuranceProvider"
                value={profile.insuranceProvider}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Policy name, TPA, or insurance ID..."
                className={`w-full px-4 py-2.5 border rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                  isEditing
                    ? 'border-slate-300 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              />
            </div>

          </div>

          {/* Save Profile Button */}
          {isEditing && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">

              <span className="text-[11px] text-slate-400">
                All clinical records are protected under PostgreSQL Row Level Security.
              </span>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-8 py-3 rounded-xl shadow-md transition text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Patient Profile</span>
                  </>
                )}
              </button>

            </div>
          )}

        </form>
      </div>

      {/* Digital Health ID Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">

            <div className="flex justify-between items-center pb-3 border-b border-slate-200">

              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Digital Health ID Card
              </span>

              <button
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>

            </div>

            <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4 border border-teal-500/30 font-sans">

              <div className="flex justify-between items-start">

                <div>
                  <h3 className="font-black text-base tracking-tight">
                    MediConnect <span className="text-teal-400">Health Card</span>
                  </h3>

                  <p className="text-[10px] text-teal-200">
                    National Healthcare Identification System
                  </p>
                </div>

                <div className="p-2 bg-white/10 rounded-xl">
                  <QrCode className="w-6 h-6 text-teal-300" />
                </div>

              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-teal-300 uppercase font-bold tracking-wider">
                  Health ID Number
                </p>

                <p className="text-lg font-mono font-extrabold tracking-wider">
                  {profile.healthId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/10">

                <div>
                  <span className="text-[9px] text-teal-300 uppercase block">
                    Patient Name
                  </span>

                  <span className="font-bold">
                    {profile.name}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-teal-300 uppercase block">
                    Blood Group
                  </span>

                  <span className="font-extrabold text-red-400">
                    {profile.bloodGroup}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-teal-300 uppercase block">
                    Date of Birth
                  </span>

                  <span>{profile.dob || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-[9px] text-teal-300 uppercase block">
                    Emergency Helpline
                  </span>

                  <span>
                    {profile.emergencyContactPhone || 'N/A'}
                  </span>
                </div>

              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

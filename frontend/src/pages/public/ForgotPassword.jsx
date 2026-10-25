import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Simulate backend password reset API call (Connect to your Node.js backend here later)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex bg-teal-600 text-white p-3 rounded-2xl shadow-md">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          MediConnect <span className="text-teal-600">Cloud</span>
        </h2>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
          Secure Healthcare Portal Recovery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200 rounded-3xl sm:px-10">
          
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-xl font-extrabold text-slate-900">Check Your Email</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We have sent password recovery instructions securely to <strong className="text-slate-900">{email}</strong>.
              </p>
              <div className="pt-4">
                <Link 
                  to="/login"
                  className="w-full inline-flex justify-center items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Forgot Your Password?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter the email address linked to your MediConnect account and we'll send you a secure reset link.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition text-sm flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Sending Recovery Link...</span>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link 
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
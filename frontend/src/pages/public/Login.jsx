import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'patient';
  
  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Helper to pre-fill test credentials
  const fillRole = (r) => {
    setRole(r);
    setErrorMsg('');
    if (r === 'patient') {
      setEmail('patient@mediconnect.cloud');
      setPassword('Patient@123456');
    } else if (r === 'doctor') {
      setEmail('doctor@mediconnect.cloud');
      setPassword('Doctor@123456');
    } else if (r === 'admin') {
      setEmail('admin@mediconnect.cloud');
      setPassword('Admin@123456');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const loggedInUser = await login({ email, password });
      
      // Authoritative role resolution from PostgreSQL profile, NOT inferred from UI tab or URL
      const targetRole = (loggedInUser?.role || '').toLowerCase();
      if (targetRole === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else if (targetRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (targetRole === 'patient') {
        navigate('/patient/dashboard', { replace: true });
      } else {
        setErrorMsg('Your account profile is pending setup or role could not be verified in the database. Please contact hospital support.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="bg-teal-600 text-white p-3 rounded-2xl shadow-md hover:bg-teal-700 transition">
            <Activity className="w-8 h-8" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Sign in to MediConnect
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Authenticate securely with your Supabase healthcare account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          
          {errorMsg && (
            <div className="mb-6 bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Role Quick Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Quick Role Selection
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                {['patient', 'doctor', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => fillRole(r)}
                    className={`py-2 text-xs font-semibold rounded-lg capitalize transition ${
                      role === r ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-teal-600 hover:text-teal-700 font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700">
                Register here
              </Link>
            </p>
            <div>
              <Link to="/" className="text-xs font-medium text-slate-400 hover:text-slate-600">
                &larr; Back to Public Landing Page
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
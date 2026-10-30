import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Search, Calendar, Phone, ArrowRight, ShieldCheck, 
  ChevronRight, Loader2, FileText, CheckCircle2, UserCheck, Stethoscope
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';

export default function DoctorPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadPatients = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await doctorService.getDoctorPatients(user.id, {
        search: searchTerm,
        page,
        limit: 8
      });
      setPatients(data.patients);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      console.error('Error loading doctor patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [user?.id, searchTerm, page]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Clinical Patient Directory</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">Assigned Patients & Care Vaults</h1>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl">
            Strictly restricted to individuals who have an active or past consultation with your medical practice. Direct access to unauthorized patients is denied by PostgreSQL RLS.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <p className="text-2xl font-black">{totalCount}</p>
          <p className="text-[10px] text-teal-200 uppercase tracking-wider font-bold">Authorized Patients</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text"
            placeholder="Search authorized patient by name, phone, or condition..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {patients.length} of {totalCount} patients
        </div>
      </div>

      {/* Patient Cards / Roster */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Authorized Patient Roster</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Confidential Medical Care Records</span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Checking authorized clinical relationships...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No Patients Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm 
                ? 'No authorized patients matched your search query.' 
                : 'Patients will appear in this directory as soon as they book a consultation with your schedule.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {patients.map((patient) => (
              <div 
                key={patient.id} 
                className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-5 space-y-3.5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 bg-teal-100 text-teal-800 rounded-xl flex items-center justify-center font-black text-base shadow-sm">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm md:text-base">{patient.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{patient.phone}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] bg-teal-50 text-teal-800 font-extrabold px-2.5 py-1 rounded-full border border-teal-100">
                    {patient.completedCount} Consultations
                  </span>
                </div>

                {/* Consultation Details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Consultation</span>
                    <span className="font-semibold text-slate-700">{patient.lastConsultation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Upcoming Schedule</span>
                    <span className="font-semibold text-teal-700">{patient.upcomingAppointment || 'None'}</span>
                  </div>
                </div>

                {/* Reason Note */}
                <p className="text-xs text-slate-600 line-clamp-1">
                  <strong className="text-slate-800">Clinical Focus: </strong>
                  {patient.recentReason}
                </p>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <Link
                    to={`/doctor/visit-summary`}
                    className="text-slate-500 hover:text-teal-700 font-semibold flex items-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Draft Summary</span>
                  </Link>

                  <button
                    onClick={() => navigate(`/doctor/patient-record/${patient.id}`)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1"
                  >
                    <span>Inspect Medical Vault</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 pt-4 border-t border-slate-100 text-xs font-bold">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

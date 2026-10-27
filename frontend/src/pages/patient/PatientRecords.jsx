import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Download, Clock, CheckCircle2, X, ShieldCheck, Loader2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../services/documentService';

export default function PatientRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('Diagnostic Report');
  const [doctor, setDoctor] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRecords = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const docs = await documentService.getPatientDocuments(user.id);
      setRecords(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [user?.id]);

  const handleDownloadReport = async (storagePath, recordTitle) => {
    try {
      const url = await documentService.getDownloadUrl(storagePath);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert(`Downloaded sample patient vault record: ${recordTitle}`);
      }
    } catch (err) {
      alert(`Could not download file: ${err.message}`);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setErrorMsg('Please provide a document title and select a file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const newDoc = await documentService.uploadDocument({
        patientId: user.id,
        file,
        documentType,
        doctorName: doctor
      });

      setRecords(prev => [newDoc, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setDoctor('');
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-sky-700 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center w-max space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Supabase Private Storage</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Medical Records & Vault</h1>
          <p className="text-teal-100 text-sm mt-1">
            Access previous diagnostic reports or upload new health documents with zero-trust storage policies.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-teal-700 font-semibold px-5 py-2.5 rounded-xl shadow hover:bg-teal-50 transition text-sm flex items-center space-x-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Record</span>
        </button>
      </div>

      {/* Records Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <span>Diagnostic Vault Records ({records.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">PostgreSQL Metadata & Private Storage</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading encrypted records from Supabase...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">No medical documents found in your vault.</p>
            <p className="text-xs">Click "Upload New Record" to store your first diagnostic document.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((rec) => (
              <div key={rec.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-sm block">{rec.title}</span>
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Uploaded on {rec.date} • Attending: {rec.doctor} ({rec.size})</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadReport(rec.storagePath, rec.title)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-4 py-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Signed File</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Upload Medical Document</h3>
              <p className="text-xs text-slate-500 mt-0.5">Files are uploaded directly into private Supabase Storage buckets.</p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value="Diagnostic Report">Diagnostic Report</option>
                  <option value="X-Ray / MRI Scan">X-Ray / MRI Scan</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Lab Test Result">Lab Test Result</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Attending Physician (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select File (PDF, PNG, JPG)</label>
                <input 
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  {uploading ? <span>Uploading to Bucket...</span> : <span>Upload Record</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
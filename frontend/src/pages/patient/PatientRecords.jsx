import React, { useState } from 'react';
import { 
  FileText, Upload, Download, Clock, CheckCircle2, X, ShieldCheck 
} from 'lucide-react';

export default function PatientRecords() {
  const [records, setRecords] = useState([
    { id: 101, title: 'Chest X-Ray Report', date: '2026-10-15', doctor: 'Dr. Rajesh Sharma', size: '2.4 MB' },
    { id: 102, title: 'Blood Panel Complete', date: '2026-09-30', doctor: 'Dr. Sneha Kulkarni', size: '1.1 MB' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [doctor, setDoctor] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleDownloadReport = (recordTitle) => {
    alert(`Generating secure AWS S3 presigned URL for: ${recordTitle}... Download will begin shortly.`);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert('Please provide a document title and select a file to upload.');
      return;
    }

    setUploading(true);

    // Simulate direct backend/S3 multipart upload
    setTimeout(() => {
      const newRecord = {
        id: Date.now(),
        title: title,
        date: new Date().toISOString().split('T')[0],
        doctor: doctor || 'Self Uploaded',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };

      setRecords([newRecord, ...records]);
      setUploading(false);
      setIsModalOpen(false);
      setTitle('');
      setDoctor('');
      setFile(null);
      alert('Medical record successfully uploaded and encrypted via AWS S3!');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-teal-600 to-sky-700 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center w-max space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AWS S3 Zero-Trust Storage</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Medical Records & Reports</h1>
          <p className="text-teal-100 text-sm mt-1">Access your previous diagnostic reports or upload new health documents securely.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-teal-700 font-semibold px-5 py-2.5 rounded-xl shadow hover:bg-teal-50 transition text-sm flex items-center space-x-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Record</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <span>Previous Medical History ({records.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Encrypted at Rest</span>
        </div>

        <div className="space-y-4">
          {records.length > 0 ? (
            records.map((rec) => (
              <div key={rec.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-sm block">{rec.title}</span>
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Uploaded on {rec.date} • Attending: {rec.doctor} ({rec.size})</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadReport(rec.title)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-4 py-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download S3 File</span>
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No medical records found in your vault.</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Upload Medical Record</h3>
                <p className="text-xs text-slate-500">Files are encrypted and stored via AWS S3.</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., MRI Scan, Blood Panel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Attending Doctor</label>
                <input 
                  type="text"
                  placeholder="e.g., Dr. Rajesh Sharma"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select File</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 relative">
                  <input 
                    type="file" 
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <FileText className="w-8 h-8 text-teal-600 mx-auto" />
                    {file ? (
                      <p className="text-xs font-bold text-slate-800">{file.name}</p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-700">Click to browse or drop file here</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-1/2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow transition text-sm flex items-center justify-center space-x-2"
                >
                  {uploading ? <span>Uploading...</span> : <span>Upload Record</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
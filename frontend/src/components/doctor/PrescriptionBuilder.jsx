import React, { useState } from 'react';
import { Pill, Plus, Trash2, Printer, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const COMMON_TEMPLATES = [
  {
    name: 'Cardiology / Hypertension Regimen',
    meds: [
      { id: 't1-1', drugName: 'Telmisartan', dosage: '40mg', frequency: 'Once Daily (OD)', duration: '30 Days', instructions: 'Morning after breakfast' },
      { id: 't1-2', drugName: 'Atorvastatin', dosage: '20mg', frequency: 'Once Daily (OD)', duration: '30 Days', instructions: 'At bedtime' },
      { id: 't1-3', drugName: 'Aspirin (Ecosprin)', dosage: '75mg', frequency: 'Once Daily (OD)', duration: '30 Days', instructions: 'After lunch' }
    ]
  },
  {
    name: 'Acute Bacterial Infection & Fever',
    meds: [
      { id: 't2-1', drugName: 'Amoxicillin + Clavulanic Acid (Augmentin)', dosage: '625mg', frequency: 'Twice Daily (BD)', duration: '5 Days', instructions: 'Post meals' },
      { id: 't2-2', drugName: 'Paracetamol', dosage: '650mg', frequency: 'Three Times Daily (TDS / SOS)', duration: '3 Days', instructions: 'For fever or severe pain' },
      { id: 't2-3', drugName: 'Pantoprazole', dosage: '40mg', frequency: 'Once Daily (OD)', duration: '5 Days', instructions: 'Empty stomach in morning' }
    ]
  },
  {
    name: 'Type 2 Diabetes Maintenance',
    meds: [
      { id: 't3-1', drugName: 'Metformin Hydrochloride', dosage: '500mg', frequency: 'Twice Daily (BD)', duration: '30 Days', instructions: 'With breakfast and dinner' },
      { id: 't3-2', drugName: 'Glimepiride', dosage: '1mg', frequency: 'Once Daily (OD)', duration: '30 Days', instructions: '15 mins before breakfast' }
    ]
  },
  {
    name: 'Post-Consultation Pain & Sprain Relief',
    meds: [
      { id: 't4-1', drugName: 'Aceclofenac + Paracetamol', dosage: '100mg / 325mg', frequency: 'Twice Daily (BD)', duration: '3 Days', instructions: 'After food' },
      { id: 't4-2', drugName: 'Thiocolchicoside (Muscle Relaxant)', dosage: '4mg', frequency: 'Twice Daily (BD)', duration: '3 Days', instructions: 'Night' }
    ]
  }
];

export default function PrescriptionBuilder({ 
  medicationsText, 
  onChangeText, 
  doctorInfo, 
  patientName, 
  diagnosis 
}) {
  const [items, setItems] = useState([
    { id: 'med-1', drugName: 'Atorvastatin', dosage: '20mg', frequency: 'Once Daily (OD)', duration: '30 Days', instructions: 'At bedtime' },
    { id: 'med-2', drugName: 'Aspirin', dosage: '75mg', frequency: 'Once Daily (OD)', duration: '30 Days', instructions: 'Post lunch' }
  ]);

  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequency, setFrequency] = useState('Twice Daily (BD)');
  const [duration, setDuration] = useState('5 Days');
  const [instructions, setInstructions] = useState('Post meals');
  const [inputError, setInputError] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Sync formatted text whenever items change
  const syncFormattedText = (updatedList) => {
    setItems(updatedList);
    const textFormatted = updatedList
      .map((item, idx) => `${idx + 1}. ${item.drugName} ${item.dosage} — ${item.frequency} for ${item.duration} (${item.instructions})`)
      .join('\n');
    onChangeText(textFormatted);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!drugName.trim()) {
      setInputError('Please enter medication name.');
      return;
    }
    setInputError('');

    const newItem = {
      id: `med-${Date.now()}`,
      drugName: drugName.trim(),
      dosage,
      frequency,
      duration,
      instructions: instructions || 'As directed by physician'
    };

    const updated = [...items, newItem];
    syncFormattedText(updated);
    setDrugName('');
  };

  const handleRemoveItem = (id) => {
    const updated = items.filter(item => item.id !== id);
    syncFormattedText(updated);
  };

  const handleApplyTemplate = (templateIndex) => {
    if (templateIndex === '') return;
    const selected = COMMON_TEMPLATES[templateIndex];
    if (selected) {
      const cloned = selected.meds.map(m => ({ ...m, id: `med-${Date.now()}-${Math.random()}` }));
      syncFormattedText(cloned);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>Structured Prescription Line-Item Builder</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Formulate itemized drug dosages, timings, and duration for the patient record
          </p>
        </div>

        {/* Quick Prescription Templates Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            onChange={(e) => handleApplyTemplate(e.target.value)}
            defaultValue=""
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="" disabled>Load Standard Rx Template...</option>
            {COMMON_TEMPLATES.map((tmpl, idx) => (
              <option key={idx} value={idx}>{tmpl.name}</option>
            ))}
          </select>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPrintPreview(true)}
              className="bg-white hover:bg-slate-100 text-teal-800 border border-teal-200 rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center space-x-1 shrink-0"
              title="Print Prescription Slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Rx</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Medication Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
          Add New Medication Entry
        </span>

        {inputError && (
          <p className="text-xs text-red-600 font-semibold flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{inputError}</span>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Drug Name */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Medication Name</label>
            <input 
              type="text"
              placeholder="e.g. Amoxicillin, Metformin..."
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dosage</label>
            <input 
              type="text"
              placeholder="e.g. 500mg, 10mg..."
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Once Daily (OD)">Once Daily (OD)</option>
              <option value="Twice Daily (BD)">Twice Daily (BD)</option>
              <option value="Three Times Daily (TDS)">Three Times Daily (TDS)</option>
              <option value="Four Times Daily (QID)">Four Times Daily (QID)</option>
              <option value="As Needed / SOS">As Needed / SOS</option>
              <option value="Alternate Days">Alternate Days</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="3 Days">3 Days</option>
              <option value="5 Days">5 Days</option>
              <option value="7 Days">7 Days</option>
              <option value="10 Days">10 Days</option>
              <option value="14 Days">14 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="60 Days">60 Days</option>
              <option value="90 Days">90 Days</option>
              <option value="Ongoing / Chronic">Ongoing / Chronic</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-1">
          <div className="w-full sm:flex-1">
            <input 
              type="text"
              placeholder="Instructions: e.g. After meals, Empty stomach, Bedtime..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1 shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Active Prescription Table */}
      {items.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <Pill className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500 font-semibold">No prescription line items added yet.</p>
          <p className="text-[11px] text-slate-400">Add medications using the form above or load a pre-set regimen template.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Drug / Strength</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Special Instructions</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {item.drugName} <span className="font-semibold text-teal-700 ml-1">({item.dosage})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{item.frequency}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.duration}</td>
                    <td className="py-2.5 px-3 text-slate-600 italic">{item.instructions}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                        title="Delete medication entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Prescription Slip Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Official Clinical Prescription Slip</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Rx Document */}
            <div className="border border-slate-300 rounded-2xl p-6 space-y-5 bg-white font-sans">
              {/* Hospital Header */}
              <div className="flex justify-between items-start border-b-2 border-teal-600 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">MediConnect <span className="text-teal-600">Hospital</span></h2>
                  <p className="text-[11px] text-slate-500">Department of Clinical Consultations & Digital Health</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-900">{doctorInfo?.name || 'Dr. Rajesh Sharma, MD'}</p>
                  <p className="text-slate-500">{doctorInfo?.specialty || 'Cardiology Specialist'}</p>
                  <p className="text-slate-400 font-mono text-[10px]">Lic: {doctorInfo?.registrationNumber || 'MCI-2012-98421'}</p>
                </div>
              </div>

              {/* Patient Details Row */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{patientName || 'Patient Consultation'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Date</span>
                  <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Primary Clinical Assessment</span>
                  <span className="font-semibold text-slate-800">{diagnosis || 'General Clinical Review'}</span>
                </div>
              </div>

              {/* Rx Symbol and Medications */}
              <div className="space-y-3 pt-2">
                <span className="text-2xl font-black font-serif text-teal-800 block">℞</span>
                <ol className="space-y-2.5 list-decimal list-inside text-xs">
                  {items.map((med) => (
                    <li key={med.id} className="text-slate-800 leading-relaxed pl-1">
                      <strong className="text-slate-900 font-bold">{med.drugName}</strong> ({med.dosage}) — <span className="font-semibold text-teal-700">{med.frequency}</span> for {med.duration}
                      <p className="text-[11px] text-slate-500 italic pl-5">Instructions: {med.instructions}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Doctor Signature */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
                <div className="text-[10px] text-slate-400 max-w-xs">
                  This electronic prescription is authenticated and recorded in the patient encrypted medical vault.
                </div>
                <div className="text-center space-y-1">
                  <div className="w-36 border-b border-slate-400 pb-1">
                    <span className="font-serif italic text-teal-800 font-bold text-sm">Dr. R. Sharma</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">Authorized Physician Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


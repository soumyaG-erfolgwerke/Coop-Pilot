import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const AvvModal = ({ isOpen, onClose, onAccept, userName }) => {
  const [avvForm, setAvvForm] = useState({ name: userName || '', place: '', date: '' });
  
  useEffect(() => {
    if (isOpen) {
      setAvvForm(prev => ({ ...prev, name: userName || '', date: new Date().toLocaleString() }));
    }
  }, [isOpen, userName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Allgemeine Geschäftsbedingungen (AVV)</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-6 space-y-4 overflow-y-auto text-sm text-gray-600 dark:text-gray-300">
          <h4 className="font-semibold text-gray-800 dark:text-white">1. Geltungsbereich</h4>
          <p>Diese Allgemeinen Vertragsbedingungen (AVV) gelten für alle Mitgliedschaften und die damit verbundenen Rechte und Pflichten innerhalb der Genossenschaft.</p>
          
          <h4 className="font-semibold text-gray-800 dark:text-white">2. Mitgliedschaft</h4>
          <p>Die Mitgliedschaft bedarf der Unterzeichnung dieser Erklärung und der Bestätigung durch den Vorstand. Jedes Mitglied verpflichtet sich, die Satzung der Genossenschaft anzuerkennen und danach zu handeln.</p>
          
          <h4 className="font-semibold text-gray-800 dark:text-white">3. Datenschutz</h4>
          <p>Wir verarbeiten Ihre personenbezogenen Daten im Einklang mit den geltenden Datenschutzgesetzen (DSGVO). Ihre Daten werden ausschließlich für Zwecke der Mitgliederverwaltung verwendet.</p>
          
          <h4 className="font-semibold text-gray-800 dark:text-white">4. Haftung</h4>
          <p>Die Genossenschaft haftet nur bei Vorsatz oder grober Fahrlässigkeit. Eine weitergehende Haftung ist ausgeschlossen.</p>
          
          <div className="pt-6 mt-8 border-t border-gray-200 dark:border-slate-700">
            <h4 className="mb-4 font-semibold text-gray-800 dark:text-white">Confirmation Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" value={avvForm.name} readOnly={!!userName} onChange={e => setAvvForm({...avvForm, name: e.target.value})} className={`block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm dark:border-slate-600 focus:outline-none sm:text-sm ${userName ? 'bg-gray-100 cursor-not-allowed dark:bg-slate-600' : 'bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary'}`} placeholder="Full Name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Place</label>
                <input type="text" value={avvForm.place} onChange={e => setAvvForm({...avvForm, place: e.target.value})} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm" placeholder="City" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                <input type="text" value={avvForm.date} readOnly className="block w-full px-3 py-2 mt-1 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed dark:border-slate-600 dark:bg-slate-600 sm:text-sm" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end p-4 space-x-3 border-t dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button 
            onClick={() => {
              if(!avvForm.name || !avvForm.place) {
                toast.error("Please fill in your Name and Place.");
                return;
              }
              onAccept(avvForm);
            }} 
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvvModal;
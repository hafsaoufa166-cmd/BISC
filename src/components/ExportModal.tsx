import React, { useState } from 'react';
import { X, Download, Printer, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { ShiftRecord } from '../types';

interface ExportModalProps {
  records: ShiftRecord[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ records, onClose }) => {
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);

  const handleExportCsv = () => {
    let csv =
      'ID,Date,Shift,Ligne,Produit,Caisses_Realisees,Batches_Pate,Batches_Creme,Batches_Enrobage,Pate_Engagee_Kg,Pate_Theo_Kg,Ecart_Pate_Kg,Ecart_Batches_Pate,Surpoids_G_Pochon,Dechets_Physiques_Kg,Pannes_Min,Temps_Manquant_Min,Pertes_Cadence_Min\n';

    records.forEach((r) => {
      const rec = r.reconciliation;
      csv += `${r.id},${r.date},${r.shift},${r.lineCode},"${r.productName}",${rec.caissesRealisees},${rec.nbBatchesPate},${rec.nbBatchesCreme},${rec.nbBatchesEnrobage},${rec.pateEngageeKg.toFixed(1)},${rec.pateCrueTheoriqueKg.toFixed(1)},${rec.ecartBrutPateKg.toFixed(1)},${rec.ecartBatchesPate.toFixed(2)},${rec.surpoidsPateGParPochon.toFixed(2)},${rec.totalDechetPhysiqueKg.toFixed(1)},${rec.totalDowntimeMin},${rec.tempsManquantTotalMin.toFixed(0)},${rec.tempsPerduPertesCadenceMin.toFixed(0)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_bilan_matiere_biscuiterie_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setExportedStatus('CSV généré et téléchargé !');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_biscuiterie_shift_records_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setExportedStatus('Fichier JSON téléchargé !');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#1E293B] border border-slate-700 rounded-lg max-w-lg w-full p-4 shadow-2xl relative space-y-4">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-500" />
            Exportation & Impression des Bouclages Matière
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Générez les fichiers CSV de synthèse pour le contrôle de gestion ({records.length} shifts disponibles).
          </p>
        </div>

        {exportedStatus && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportedStatus}</span>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2.5">
          
          <button
            onClick={handleExportCsv}
            className="w-full p-3 rounded bg-[#0F172A] hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-tight block group-hover:text-amber-400 transition-colors">
                  Exporter en CSV / Excel
                </span>
                <span className="text-[10px] text-slate-400">Batches pâte/crème/enrobage, surpoids UA, déchets et pannes</span>
              </div>
            </div>
          </button>

          <button
            onClick={handlePrint}
            className="w-full p-3 rounded bg-[#0F172A] hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-tight block group-hover:text-amber-400 transition-colors">
                  Imprimer la Fiche de Synthèse
                </span>
                <span className="text-[10px] text-slate-400">Format d'impression A4 pour affichage usine</span>
              </div>
            </div>
          </button>

          <button
            onClick={handleExportJson}
            className="w-full p-3 rounded bg-[#0F172A] hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-tight block group-hover:text-amber-400 transition-colors">
                  Sauvegarde Brut JSON
                </span>
                <span className="text-[10px] text-slate-400">Format complet pour système d'information usine</span>
              </div>
            </div>
          </button>

        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-tighter border border-slate-700"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};

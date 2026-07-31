import React, { useState } from 'react';
import { ShiftRecord, ShiftType, LineCode, ProductRecipe, DowntimeEvent } from '../types';
import { PlusCircle, Clock, AlertTriangle, Trash2, CheckCircle2, Edit3, ArrowLeft, Scale } from 'lucide-react';
import { calculateMaterialReconciliation, formatNumber, formatInt } from '../utils/calculations';

interface ShiftEntryViewProps {
  products: ProductRecipe[];
  editingRecord?: ShiftRecord | null;
  onSaveShiftRecord: (record: ShiftRecord) => void;
  onCancel: () => void;
}

export const ShiftEntryView: React.FC<ShiftEntryViewProps> = ({
  products,
  editingRecord,
  onSaveShiftRecord,
  onCancel,
}) => {
  const [date, setDate] = useState<string>(
    editingRecord ? editingRecord.date : new Date().toISOString().split('T')[0]
  );
  const [shift, setShift] = useState<ShiftType>(editingRecord ? editingRecord.shift : 'Matin');
  const [lineCode, setLineCode] = useState<LineCode>(editingRecord ? editingRecord.lineCode : 'B3');
  
  // Available products for selected line
  const availableProducts = products.filter((p) => p.lineCode === lineCode);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    editingRecord
      ? editingRecord.productId
      : availableProducts[0]?.id || products[0]?.id || ''
  );

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || availableProducts[0] || products[0];

  const [operatorName, setOperatorName] = useState<string>(
    editingRecord ? editingRecord.operatorName : 'Jean-Marc Dupont'
  );
  const [supervisorName, setSupervisorName] = useState<string>(
    editingRecord ? editingRecord.supervisorName : 'Pierre Alain'
  );

  // Quantities for 8H shift
  const [caissesRealisees, setCaissesRealisees] = useState<number>(
    editingRecord ? editingRecord.reconciliation.caissesRealisees : 1120
  );
  const [nbBatchesPate, setNbBatchesPate] = useState<number>(
    editingRecord ? editingRecord.reconciliation.nbBatchesPate : 4.8
  );
  const [nbBatchesCreme, setNbBatchesCreme] = useState<number>(
    editingRecord ? editingRecord.reconciliation.nbBatchesCreme : 3.6
  );
  const [nbBatchesEnrobage, setNbBatchesEnrobage] = useState<number>(
    editingRecord ? editingRecord.reconciliation.nbBatchesEnrobage : 2.1
  );

  // Stocks En-Cours & Récupération (Début vs Fin de Shift)
  const [nbBatchesPateStockInit, setNbBatchesPateStockInit] = useState<number>(
    editingRecord?.reconciliation.nbBatchesPateStockInit || 0
  );
  const [nbBatchesPateStockFin, setNbBatchesPateStockFin] = useState<number>(
    editingRecord?.reconciliation.nbBatchesPateStockFin || 0
  );

  const [nbBatchesCremeStockInit, setNbBatchesCremeStockInit] = useState<number>(
    editingRecord?.reconciliation.nbBatchesCremeStockInit || 0
  );
  const [nbBatchesCremeStockFin, setNbBatchesCremeStockFin] = useState<number>(
    editingRecord?.reconciliation.nbBatchesCremeStockFin || 0
  );

  const [nbBatchesEnrobageStockInit, setNbBatchesEnrobageStockInit] = useState<number>(
    editingRecord?.reconciliation.nbBatchesEnrobageStockInit || 0
  );
  const [nbBatchesEnrobageStockFin, setNbBatchesEnrobageStockFin] = useState<number>(
    editingRecord?.reconciliation.nbBatchesEnrobageStockFin || 0
  );

  const [justificationStock, setJustificationStock] = useState<string>(
    editingRecord?.reconciliation.justificationStock || ''
  );

  // Poids moyen réel mesuré par composant (g/pochon ou unité) à titre indicatif pour justification
  const [poidsMoyenReelPateG, setPoidsMoyenReelPateG] = useState<number | ''>(
    editingRecord?.reconciliation.poidsMoyenReelPateG ?? ''
  );
  const [poidsMoyenReelCremeG, setPoidsMoyenReelCremeG] = useState<number | ''>(
    editingRecord?.reconciliation.poidsMoyenReelCremeG ?? ''
  );
  const [poidsMoyenReelEnrobageG, setPoidsMoyenReelEnrobageG] = useState<number | ''>(
    editingRecord?.reconciliation.poidsMoyenReelEnrobageG ?? ''
  );

  // Wastes
  const [dechetPateKg, setDechetPateKg] = useState<number>(
    editingRecord ? editingRecord.reconciliation.dechetPateKg : 14
  );
  const [dechetCuissonKg, setDechetCuissonKg] = useState<number>(
    editingRecord ? editingRecord.reconciliation.dechetCuissonKg : 18
  );
  const [dechetEmballageKg, setDechetEmballageKg] = useState<number>(
    editingRecord ? editingRecord.reconciliation.dechetEmballageKg : 9
  );

  // Catégorie Autre Pâte (Pertes Spécifiques à Justifier)
  const [dechetAutrePateKg, setDechetAutrePateKg] = useState<number>(
    editingRecord?.reconciliation.dechetAutrePateKg || 0
  );
  const [categorieAutrePate, setCategorieAutrePate] = useState<string>(
    editingRecord?.reconciliation.categorieAutrePate || ''
  );
  const [motifAutrePate, setMotifAutrePate] = useState<string>(
    editingRecord?.reconciliation.motifAutrePate || ''
  );

  // Catégorie Autre Crème
  const [dechetAutreCremeKg, setDechetAutreCremeKg] = useState<number>(
    editingRecord?.reconciliation.dechetAutreCremeKg || 0
  );
  const [categorieAutreCreme, setCategorieAutreCreme] = useState<string>(
    editingRecord?.reconciliation.categorieAutreCreme || ''
  );
  const [motifAutreCreme, setMotifAutreCreme] = useState<string>(
    editingRecord?.reconciliation.motifAutreCreme || ''
  );

  // Catégorie Autre Enrobage
  const [dechetAutreEnrobageKg, setDechetAutreEnrobageKg] = useState<number>(
    editingRecord?.reconciliation.dechetAutreEnrobageKg || 0
  );
  const [categorieAutreEnrobage, setCategorieAutreEnrobage] = useState<string>(
    editingRecord?.reconciliation.categorieAutreEnrobage || ''
  );
  const [motifAutreEnrobage, setMotifAutreEnrobage] = useState<string>(
    editingRecord?.reconciliation.motifAutreEnrobage || ''
  );

  // Justification Chef d'Équipe sur la Réalisation des Caisses
  const [justificationCaisses, setJustificationCaisses] = useState<string>(
    editingRecord?.reconciliation.justificationCaisses || ''
  );

  // Downtimes
  const [downtimes, setDowntimes] = useState<DowntimeEvent[]>(
    editingRecord ? editingRecord.downtimes : [
      {
        id: 'dt-1',
        category: 'Emballage / Flowpack',
        reason: 'Bourrage couteau d\'emballage et réglage cellule sachet',
        durationMinutes: 25,
        comments: 'Cellule optique nettoyée',
      },
    ]
  );

  const [dtCategory, setDtCategory] = useState<DowntimeEvent['category']>('Emballage / Flowpack');
  const [dtReason, setDtReason] = useState<string>('');
  const [dtDuration, setDtDuration] = useState<number>(15);

  const handleLineChange = (code: LineCode) => {
    setLineCode(code);
    const prods = products.filter((p) => p.lineCode === code);
    if (prods.length > 0) {
      setSelectedProductId(prods[0].id);
    }
  };

  const handleAddDowntime = () => {
    if (!dtReason || dtDuration <= 0) return;
    const newDt: DowntimeEvent = {
      id: `dt-${Date.now()}`,
      category: dtCategory,
      reason: dtReason,
      durationMinutes: Number(dtDuration),
    };
    setDowntimes([...downtimes, newDt]);
    setDtReason('');
    setDtDuration(15);
  };

  const handleRemoveDowntime = (id: string) => {
    setDowntimes(downtimes.filter((d) => d.id !== id));
  };

  // Preview live reconciliation
  const previewReconciliation = calculateMaterialReconciliation(
    selectedProduct,
    caissesRealisees,
    nbBatchesPate,
    nbBatchesCreme,
    nbBatchesEnrobage,
    dechetPateKg,
    dechetCuissonKg,
    dechetEmballageKg,
    downtimes,
    nbBatchesPateStockInit,
    nbBatchesPateStockFin,
    nbBatchesCremeStockInit,
    nbBatchesCremeStockFin,
    nbBatchesEnrobageStockInit,
    nbBatchesEnrobageStockFin,
    justificationStock,
    typeof poidsMoyenReelPateG === 'number' && poidsMoyenReelPateG > 0 ? poidsMoyenReelPateG : undefined,
    typeof poidsMoyenReelCremeG === 'number' && poidsMoyenReelCremeG > 0 ? poidsMoyenReelCremeG : undefined,
    typeof poidsMoyenReelEnrobageG === 'number' && poidsMoyenReelEnrobageG > 0 ? poidsMoyenReelEnrobageG : undefined,
    dechetAutrePateKg,
    categorieAutrePate,
    motifAutrePate,
    dechetAutreCremeKg,
    categorieAutreCreme,
    motifAutreCreme,
    dechetAutreEnrobageKg,
    categorieAutreEnrobage,
    motifAutreEnrobage,
    justificationCaisses
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: ShiftRecord = {
      id: editingRecord ? editingRecord.id : `REC-${date}-${lineCode}-${shift}-${Date.now().toString().slice(-4)}`,
      date,
      shift,
      lineCode,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      operatorName,
      supervisorName,
      reconciliation: previewReconciliation,
      downtimes,
    };

    onSaveShiftRecord(record);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            {editingRecord ? (
              <Edit3 className="w-5 h-5 text-amber-500" />
            ) : (
              <PlusCircle className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-tight">
              {editingRecord ? `Modification de la Production : ${editingRecord.id}` : 'Saisie du Rapport de Production & Bilan Matière (Shift 8h)'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {editingRecord
              ? 'Modifiez les valeurs saisies de ce shift et validez le recalcul automatique du bouclage matière.'
              : 'Saisissez les caisses réalisées, le nombre de pétrins/batches consommés et les déchets pour boucler le bilan matière.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase rounded border border-slate-700 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold uppercase tracking-tight rounded flex items-center space-x-1 shadow-md transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingRecord ? 'Enregistrer Modifications' : 'Valider Shift & Calculer Écarts'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Inputs Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section 1: Contexte Shift */}
          <div className="bg-[#111827] p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
              1. Contexte du Poste & Produit Fabriqué
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Date Journée Production *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0B0F19] text-white border border-slate-800 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Shift (8h) *</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as ShiftType)}
                  className="w-full bg-[#0B0F19] text-white border border-slate-800 rounded px-2.5 py-1.5 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="Matin">Matin (06:00 - 14:00)</option>
                  <option value="Après-midi">Après-midi (14:00 - 22:00)</option>
                  <option value="Nuit">Soir / Nuit (22:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Ligne de Production *</label>
                <select
                  value={lineCode}
                  onChange={(e) => handleLineChange(e.target.value as LineCode)}
                  className="w-full bg-[#0B0F19] text-amber-400 font-bold border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="B3">Ligne B3 (Biscuits Fourrés & Enrobés)</option>
                  <option value="B4">Ligne B4 (Biscuits Secs & Fourrés)</option>
                  <option value="G1">Ligne G1 (Gaufrettes Classiques)</option>
                  <option value="G3">Ligne G3 (Gaufrettes Enrobées)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Produit Fabriqué (Recette) *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#0B0F19] text-white border border-slate-800 rounded px-2.5 py-1.5 font-bold focus:outline-none focus:border-amber-500"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Obj 8h: {p.objectifCaisses8h} caisses)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Opérateur Référent</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full bg-[#0B0F19] text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Données de Production & Batches Consommés (8h) */}
          <div className="bg-[#111827] p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
              2. Production Réalisée & Nombre de Pétrins / Batches Consommés
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-4 bg-[#0B0F19] p-3 rounded border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <label className="block text-amber-400 text-xs uppercase font-bold">Nombre de Caisses Conformes Réalisées *</label>
                  <span className="text-[10px] text-slate-400">Emballées et validées en 8 heures</span>
                </div>
                <input
                  type="number"
                  value={caissesRealisees}
                  onChange={(e) => setCaissesRealisees(Number(e.target.value))}
                  className="w-full sm:w-44 bg-[#111827] text-amber-400 font-mono font-bold text-lg border border-slate-700 rounded px-3 py-1 text-right focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Contrôle Poids Réel Mesuré Séparé (Indicatif): PÂTE, CRÈME, ENROBAGE */}
              <div className="sm:col-span-4 bg-[#0B0F19] p-3.5 rounded-lg border border-cyan-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <label className="text-cyan-400 text-xs uppercase font-bold flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-cyan-400" />
                        Contrôle Poids Réel Mesuré sur Ligne (Séparé Indicatif)
                      </label>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                        Justification Écart Grammage
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Saisie séparée du poids moyen réel (pesée sur ligne g/unit) pour Pâte, Crème et Enrobage afin d'expliquer les surpoids.
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Poids Réel Mesuré:</span>
                    <span className="text-cyan-300 font-bold text-sm">
                      {(((typeof poidsMoyenReelPateG === 'number' ? poidsMoyenReelPateG : selectedProduct.poidsPateCuiteParPochonG) +
                        (typeof poidsMoyenReelCremeG === 'number' ? poidsMoyenReelCremeG : selectedProduct.poidsCremeParPochonG) +
                        (typeof poidsMoyenReelEnrobageG === 'number' ? poidsMoyenReelEnrobageG : selectedProduct.poidsEnrobageParPochonG))).toFixed(1)} g
                    </span>
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Standard: {(selectedProduct.poidsPateCuiteParPochonG + selectedProduct.poidsCremeParPochonG + selectedProduct.poidsEnrobageParPochonG).toFixed(1)} g
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Pâte */}
                  <div className="bg-[#111827] p-2.5 rounded border border-emerald-500/30 space-y-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                      <span className="text-emerald-400">1. Poids Pâte Cuite Réel</span>
                      <span className="text-slate-400 font-mono">Std: {selectedProduct.poidsPateCuiteParPochonG}g</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={poidsMoyenReelPateG}
                        onChange={(e) => setPoidsMoyenReelPateG(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={selectedProduct.poidsPateCuiteParPochonG.toString()}
                        className="w-full bg-[#0F172A] text-emerald-300 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 text-right focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">g</span>
                    </div>
                    {typeof poidsMoyenReelPateG === 'number' && (
                      <span className={`text-[9px] font-mono block ${poidsMoyenReelPateG > selectedProduct.poidsPateCuiteParPochonG ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                        Écart: {(poidsMoyenReelPateG - selectedProduct.poidsPateCuiteParPochonG) > 0 ? '+' : ''}
                        {(poidsMoyenReelPateG - selectedProduct.poidsPateCuiteParPochonG).toFixed(2)}g / unit
                      </span>
                    )}
                  </div>

                  {/* Crème */}
                  <div className="bg-[#111827] p-2.5 rounded border border-blue-500/30 space-y-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                      <span className="text-blue-400">2. Poids Crème Réel</span>
                      <span className="text-slate-400 font-mono">Std: {selectedProduct.poidsCremeParPochonG}g</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        disabled={selectedProduct.batchCremeKg === 0}
                        value={selectedProduct.batchCremeKg > 0 ? poidsMoyenReelCremeG : ''}
                        onChange={(e) => setPoidsMoyenReelCremeG(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={selectedProduct.poidsCremeParPochonG.toString()}
                        className="w-full bg-[#0F172A] text-blue-300 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 text-right disabled:opacity-40 focus:outline-none focus:border-blue-500 text-xs"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">g</span>
                    </div>
                    {typeof poidsMoyenReelCremeG === 'number' && selectedProduct.batchCremeKg > 0 && (
                      <span className={`text-[9px] font-mono block ${poidsMoyenReelCremeG > selectedProduct.poidsCremeParPochonG ? 'text-rose-400 font-bold' : 'text-blue-400'}`}>
                        Écart: {(poidsMoyenReelCremeG - selectedProduct.poidsCremeParPochonG) > 0 ? '+' : ''}
                        {(poidsMoyenReelCremeG - selectedProduct.poidsCremeParPochonG).toFixed(2)}g / unit
                      </span>
                    )}
                  </div>

                  {/* Enrobage */}
                  <div className="bg-[#111827] p-2.5 rounded border border-purple-500/30 space-y-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                      <span className="text-purple-400">3. Poids Enrobage Réel</span>
                      <span className="text-slate-400 font-mono">Std: {selectedProduct.poidsEnrobageParPochonG}g</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        disabled={selectedProduct.batchEnrobageKg === 0}
                        value={selectedProduct.batchEnrobageKg > 0 ? poidsMoyenReelEnrobageG : ''}
                        onChange={(e) => setPoidsMoyenReelEnrobageG(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={selectedProduct.poidsEnrobageParPochonG.toString()}
                        className="w-full bg-[#0F172A] text-purple-300 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 text-right disabled:opacity-40 focus:outline-none focus:border-purple-500 text-xs"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">g</span>
                    </div>
                    {typeof poidsMoyenReelEnrobageG === 'number' && selectedProduct.batchEnrobageKg > 0 && (
                      <span className={`text-[9px] font-mono block ${poidsMoyenReelEnrobageG > selectedProduct.poidsEnrobageParPochonG ? 'text-rose-400 font-bold' : 'text-purple-400'}`}>
                        Écart: {(poidsMoyenReelEnrobageG - selectedProduct.poidsEnrobageParPochonG) > 0 ? '+' : ''}
                        {(poidsMoyenReelEnrobageG - selectedProduct.poidsEnrobageParPochonG).toFixed(2)}g / unit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Nombre Batches Pâte * ({selectedProduct.batchPateKg} kg/batch)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nbBatchesPate}
                  onChange={(e) => setNbBatchesPate(Number(e.target.value))}
                  className="w-full bg-[#0F172A] text-emerald-400 font-mono font-bold text-sm border border-slate-700 rounded px-2.5 py-1.5 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  = {formatNumber(nbBatchesPate * selectedProduct.batchPateKg, 0)} kg Pâte
                </span>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Nombre Batches Crème ({selectedProduct.batchCremeKg > 0 ? `${selectedProduct.batchCremeKg} kg/batch` : 'Sans crème'})
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={selectedProduct.batchCremeKg === 0}
                  value={selectedProduct.batchCremeKg > 0 ? nbBatchesCreme : 0}
                  onChange={(e) => setNbBatchesCreme(Number(e.target.value))}
                  className="w-full bg-[#0F172A] text-blue-400 font-mono font-bold text-sm border border-slate-700 rounded px-2.5 py-1.5 disabled:opacity-40 focus:outline-none"
                />
                {selectedProduct.batchCremeKg > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    = {formatNumber(nbBatchesCreme * selectedProduct.batchCremeKg, 0)} kg Crème
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Nombre Batches Enrobage ({selectedProduct.batchEnrobageKg > 0 ? `${selectedProduct.batchEnrobageKg} kg/batch` : 'Non enrobé'})
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={selectedProduct.batchEnrobageKg === 0}
                  value={selectedProduct.batchEnrobageKg > 0 ? nbBatchesEnrobage : 0}
                  onChange={(e) => setNbBatchesEnrobage(Number(e.target.value))}
                  className="w-full bg-[#0F172A] text-purple-400 font-mono font-bold text-sm border border-slate-700 rounded px-2.5 py-1.5 disabled:opacity-40 focus:outline-none"
                />
                {selectedProduct.batchEnrobageKg > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    = {formatNumber(nbBatchesEnrobage * selectedProduct.batchEnrobageKg, 0)} kg Enrob.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Rendement Four</label>
                <div className="bg-[#0F172A] border border-slate-700 rounded px-2.5 py-1.5 text-center font-mono font-bold text-cyan-400 text-sm">
                  {selectedProduct.rendementFourPercent}%
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Variation & Justification des Stocks (Pâte, Crème, Enrobage) */}
          <div className="bg-[#111827] p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span>3. Stocks d'En-cours / Pâtes de Démarrage & Restes (Justification Indicative)</span>
              </h3>
              <span className="text-[10px] text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40 font-mono">
                Justification Écart
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Saisissez les stocks initial (pâtes de démarrage/reprise) ou final (restes restitués). Ces valeurs sont conservées <strong className="text-cyan-300 font-normal">à titre d'information et de justification</strong> pour expliquer l'écart du bilan matière sans modifier les calculs bruts d'engagement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Stock Pâte */}
              <div className="bg-[#0B0F19] p-3 rounded border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block border-b border-slate-800 pb-1">
                  Pâte (Batches de {selectedProduct.batchPateKg} kg)
                </span>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    + Stock Début (Démarrage/Reprise)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nbBatchesPateStockInit}
                    onChange={(e) => setNbBatchesPateStockInit(Number(e.target.value))}
                    className="w-full bg-[#111827] text-emerald-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    - Stock Fin (Restant Fin Shift)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nbBatchesPateStockFin}
                    onChange={(e) => setNbBatchesPateStockFin(Number(e.target.value))}
                    className="w-full bg-[#111827] text-rose-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1 flex justify-between">
                  <span>Ajustement Net Pâte:</span>
                  <span className={(previewReconciliation.stockPateNetKg || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {(previewReconciliation.stockPateNetKg || 0) > 0 ? '+' : ''}{formatNumber(previewReconciliation.stockPateNetKg || 0, 0)} kg
                  </span>
                </div>
              </div>

              {/* Stock Crème */}
              <div className="bg-[#0B0F19] p-3 rounded border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-blue-400 block border-b border-slate-800 pb-1">
                  Crème ({selectedProduct.batchCremeKg > 0 ? `${selectedProduct.batchCremeKg} kg/batch` : 'Sans crème'})
                </span>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    + Stock Début (Démarrage/Reprise)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={selectedProduct.batchCremeKg === 0}
                    value={selectedProduct.batchCremeKg > 0 ? nbBatchesCremeStockInit : 0}
                    onChange={(e) => setNbBatchesCremeStockInit(Number(e.target.value))}
                    className="w-full bg-[#111827] text-blue-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 disabled:opacity-40 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    - Stock Fin (Restant Fin Shift)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={selectedProduct.batchCremeKg === 0}
                    value={selectedProduct.batchCremeKg > 0 ? nbBatchesCremeStockFin : 0}
                    onChange={(e) => setNbBatchesCremeStockFin(Number(e.target.value))}
                    className="w-full bg-[#111827] text-rose-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 disabled:opacity-40 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                {selectedProduct.batchCremeKg > 0 && (
                  <div className="text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1 flex justify-between">
                    <span>Ajustement Net Crème:</span>
                    <span className={(previewReconciliation.stockCremeNetKg || 0) >= 0 ? 'text-blue-400 font-bold' : 'text-rose-400 font-bold'}>
                      {(previewReconciliation.stockCremeNetKg || 0) > 0 ? '+' : ''}{formatNumber(previewReconciliation.stockCremeNetKg || 0, 0)} kg
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Enrobage */}
              <div className="bg-[#0B0F19] p-3 rounded border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-purple-400 block border-b border-slate-800 pb-1">
                  Enrobage ({selectedProduct.batchEnrobageKg > 0 ? `${selectedProduct.batchEnrobageKg} kg/batch` : 'Non enrobé'})
                </span>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    + Stock Début (Démarrage/Reprise)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={selectedProduct.batchEnrobageKg === 0}
                    value={selectedProduct.batchEnrobageKg > 0 ? nbBatchesEnrobageStockInit : 0}
                    onChange={(e) => setNbBatchesEnrobageStockInit(Number(e.target.value))}
                    className="w-full bg-[#111827] text-purple-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 disabled:opacity-40 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    - Stock Fin (Restant Fin Shift)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={selectedProduct.batchEnrobageKg === 0}
                    value={selectedProduct.batchEnrobageKg > 0 ? nbBatchesEnrobageStockFin : 0}
                    onChange={(e) => setNbBatchesEnrobageStockFin(Number(e.target.value))}
                    className="w-full bg-[#111827] text-rose-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 disabled:opacity-40 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                {selectedProduct.batchEnrobageKg > 0 && (
                  <div className="text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1 flex justify-between">
                    <span>Ajustement Net Enrobage:</span>
                    <span className={(previewReconciliation.stockEnrobageNetKg || 0) >= 0 ? 'text-purple-400 font-bold' : 'text-rose-400 font-bold'}>
                      {(previewReconciliation.stockEnrobageNetKg || 0) > 0 ? '+' : ''}{formatNumber(previewReconciliation.stockEnrobageNetKg || 0, 0)} kg
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                Motif / Justification de la variation de stock en-cours (Optionnel)
              </label>
              <input
                type="text"
                value={justificationStock}
                onChange={(e) => setJustificationStock(e.target.value)}
                placeholder="Ex: Constitution stock début de poste / Restitution bacs crème fin de production..."
                className="w-full bg-[#0B0F19] text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Section 4: Déchets Physiques Mesurés & Pertes Spécifiques (Kg) */}
          <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-700 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-slate-700 pb-2 flex items-center justify-between">
              <span>4. Déchets Physiques Pesés & Pertes Spécifiques (Catégorie Autre)</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">
                Saisie kg & motifs
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Pertes Pâte Pétrin / Formage (kg)</label>
                <input
                  type="number"
                  value={dechetPateKg}
                  onChange={(e) => setDechetPateKg(Number(e.target.value))}
                  className="w-full bg-[#0F172A] text-rose-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Biscuits Cassés / Brûlés Four (kg)</label>
                <input
                  type="number"
                  value={dechetCuissonKg}
                  onChange={(e) => setDechetCuissonKg(Number(e.target.value))}
                  className="w-full bg-[#0F172A] text-rose-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Rebuts Emballage / Pochons (kg)</label>
                <input
                  type="number"
                  value={dechetEmballageKg}
                  onChange={(e) => setDechetEmballageKg(Number(e.target.value))}
                  className="w-full bg-[#0F172A] text-rose-400 font-mono font-bold border border-slate-700 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>
            </div>

            {/* Sub-card: Pertes Spécifiques / Catégorie Autre à Justifier (Pâte) */}
            <div className="bg-[#0F172A] p-3 rounded border border-purple-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[11px] font-bold uppercase text-emerald-400">
                  Justification Pertes PÂTE (Autre / Purgerie / CIP)
                </span>
                <span className="text-[9px] bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-800/40">
                  Déclaration Spécifique Pâte
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Pâte Autre (kg)</label>
                  <input
                    type="number"
                    value={dechetAutrePateKg}
                    onChange={(e) => setDechetAutrePateKg(Number(e.target.value))}
                    className="w-full bg-[#111827] text-emerald-300 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Catégorie Perte Pâte</label>
                  <select
                    value={categorieAutrePate}
                    onChange={(e) => setCategorieAutrePate(e.target.value)}
                    className="w-full bg-[#111827] text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                  >
                    <option value="">-- Sélectionner catégorie --</option>
                    <option value="Essais & Réglages Démarrage">Essais & Réglages Démarrage</option>
                    <option value="Purgerie / Vidange Cuve">Purgerie / Vidange Cuve</option>
                    <option value="Nettoyage Ligne / CIP">Nettoyage Ligne / CIP</option>
                    <option value="Incident Process / Fuite">Incident Process / Fuite</option>
                    <option value="Pâte Altérée / Non Conforme">Pâte Altérée / Non Conforme</option>
                    <option value="Autre Motif Spécifique">Autre Motif Spécifique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Motif Détail Pâte</label>
                  <input
                    type="text"
                    value={motifAutrePate}
                    onChange={(e) => setMotifAutrePate(e.target.value)}
                    placeholder="Ex: Vidange pétrin suite arrêt prolongé..."
                    className="w-full bg-[#111827] text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-card: Pertes Spécifiques CRÈME (si produit avec crème) */}
            {selectedProduct.batchCremeKg > 0 && (
              <div className="bg-[#0F172A] p-3 rounded border border-blue-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-bold uppercase text-blue-400">
                    Justification Pertes CRÈME (Purge / Dosage / Recyclage)
                  </span>
                  <span className="text-[9px] bg-blue-950/80 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-800/40">
                    Déclaration Spécifique Crème
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Crème Autre (kg)</label>
                    <input
                      type="number"
                      value={dechetAutreCremeKg}
                      onChange={(e) => setDechetAutreCremeKg(Number(e.target.value))}
                      className="w-full bg-[#111827] text-blue-300 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Catégorie Perte Crème</label>
                    <select
                      value={categorieAutreCreme}
                      onChange={(e) => setCategorieAutreCreme(e.target.value)}
                      className="w-full bg-[#111827] text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                    >
                      <option value="">-- Sélectionner catégorie --</option>
                      <option value="Purge Doseuse Crème">Purge Doseuse Crème</option>
                      <option value="Réglage Poids Crème Démarrage">Réglage Poids Crème Démarrage</option>
                      <option value="Cuve Crème Périmée / CIP">Cuve Crème Périmée / CIP</option>
                      <option value="Incident Température / Viscosité">Incident Température / Viscosité</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Motif Détail Crème</label>
                    <input
                      type="text"
                      value={motifAutreCreme}
                      onChange={(e) => setMotifAutreCreme(e.target.value)}
                      placeholder="Ex: Purge bac crème changement parfum..."
                      className="w-full bg-[#111827] text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sub-card: Pertes Spécifiques ENROBAGE (si produit enrobé) */}
            {selectedProduct.batchEnrobageKg > 0 && (
              <div className="bg-[#0F172A] p-3 rounded border border-purple-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-bold uppercase text-purple-400">
                    Justification Pertes ENROBAGE (Chocolat / Bain / Fondant)
                  </span>
                  <span className="text-[9px] bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-800/40">
                    Déclaration Spécifique Enrobage
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Enrobage Autre (kg)</label>
                    <input
                      type="number"
                      value={dechetAutreEnrobageKg}
                      onChange={(e) => setDechetAutreEnrobageKg(Number(e.target.value))}
                      className="w-full bg-[#111827] text-purple-300 font-mono font-bold border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Catégorie Perte Enrobage</label>
                    <select
                      value={categorieAutreEnrobage}
                      onChange={(e) => setCategorieAutreEnrobage(e.target.value)}
                      className="w-full bg-[#111827] text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                    >
                      <option value="">-- Sélectionner catégorie --</option>
                      <option value="Vidange Bain Enroberie">Vidange Bain Enroberie</option>
                      <option value="Raclage Tapis / Récupérateur">Raclage Tapis / Récupérateur</option>
                      <option value="Incident Cristallisation / Tempérage">Incident Cristallisation / Tempérage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Motif Détail Enrobage</label>
                    <input
                      type="text"
                      value={motifAutreEnrobage}
                      onChange={(e) => setMotifAutreEnrobage(e.target.value)}
                      placeholder="Ex: Nettoyage racleur bac chocolat..."
                      className="w-full bg-[#111827] text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Arrêts & Pannes (minutes & Pertes) */}
          <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-700 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-700 pb-2 flex items-center justify-between">
              <span>5. Journal des Arrêts & Pannes de Ligne</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">
                Total Arrêts = {previewReconciliation.totalDowntimeMin} min
              </span>
            </h3>

            {/* Existing downtimes */}
            {downtimes.length > 0 && (
              <div className="space-y-1.5">
                {downtimes.map((dt) => {
                  const lostBoxes = selectedProduct.cadenceStandardCaissesParHeure > 0
                    ? Math.round((dt.durationMinutes / 60) * selectedProduct.cadenceStandardCaissesParHeure)
                    : 0;
                  return (
                    <div key={dt.id} className="bg-[#0F172A] p-2.5 rounded border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 uppercase text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                            [{dt.category}]
                          </span>
                          <span className="text-slate-100 font-medium">{dt.reason}</span>
                        </div>
                        {dt.comments && (
                          <span className="text-[10.5px] text-slate-400 italic block pl-1">
                            Note: {dt.comments}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 self-end sm:self-auto font-mono">
                        <span className="text-[11px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                          ~{lostBoxes} caisses perdues
                        </span>
                        <span className="font-mono font-bold text-rose-400">{dt.durationMinutes} min</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDowntime(dt.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Form to add downtime */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div>
                <select
                  value={dtCategory}
                  onChange={(e) => setDtCategory(e.target.value as any)}
                  className="w-full bg-[#0F172A] text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="Emballage / Flowpack">Emballage / Flowpack</option>
                  <option value="Pannes Mécaniques">Pannes Mécaniques</option>
                  <option value="Pannes Électriques">Pannes Électriques</option>
                  <option value="Pâte / Formage">Pâte / Formage</option>
                  <option value="Nettoyage / CIP">Nettoyage / CIP</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Motif de l'arrêt ou de la panne..."
                  value={dtReason}
                  onChange={(e) => setDtReason(e.target.value)}
                  className="w-full bg-[#0F172A] text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={dtDuration}
                  onChange={(e) => setDtDuration(Number(e.target.value))}
                  className="w-16 bg-[#0F172A] text-rose-400 font-mono font-bold border border-slate-700 rounded px-2 py-1 text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDowntime}
                  className="flex-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold uppercase text-[10px] rounded border border-slate-700"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Section 6: Explication & Justification de la Réalisation des Caisses */}
          <div className="bg-[#111827] p-4 rounded-lg border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>6. Explication & Justification de la Réalisation des Caisses (Temps d'Arrêts Déduits)</span>
              </h3>
              <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                Solde Net Manquant: {previewReconciliation.caissesManquantes} caisses
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-[#0B0F19] p-3 rounded border border-slate-800 font-mono">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">1. Objectif 8h Cible Brut:</span>
                <div className="text-slate-100 font-bold text-sm">{selectedProduct.objectifCaisses8h} caisses</div>
                <span className="text-[9.5px] text-slate-500 block">Base poste 480 min</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">2. Imputation Arrêts (-{previewReconciliation.totalDowntimeMin} min):</span>
                <div className="text-rose-400 font-bold text-sm">-{previewReconciliation.caissesPerduesArrets} caisses</div>
                <span className="text-[9.5px] text-rose-300/80 block">{previewReconciliation.totalDowntimeMin} min d'arrêts</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">3. Objectif Net Ajusté:</span>
                <div className="text-cyan-300 font-bold text-sm">{previewReconciliation.objectifAjusteArrets} caisses</div>
                <span className="text-[9.5px] text-cyan-400/80 block">Temps effectif ({480 - previewReconciliation.totalDowntimeMin} min)</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">4. Réalisé vs Solde Manquant:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold text-sm">{caissesRealisees}</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-amber-400 font-bold text-sm">{previewReconciliation.caissesManquantes} manq.</span>
                </div>
                <span className="text-[9.5px] text-amber-300/80 block font-sans">Pertes cadence seule</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                Note / Commentaire Global de Justification Réalisation Caisses (Chef d'Équipe / Régleur)
              </label>
              <textarea
                rows={2}
                value={justificationCaisses}
                onChange={(e) => setJustificationCaisses(e.target.value)}
                placeholder="Ex: Écart net de 1000 caisses après déduction des 2h d'arrêt (panne + nettoyage) imputé au sous-réglement de cadence sur doseuse..."
                className="w-full bg-[#0B0F19] text-slate-200 border border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Live Calculation & Variance Summary Card */}
        <div className="space-y-4">
          <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-700 shadow-inner space-y-3 sticky top-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-700 pb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Synthèse Live des Écarts du Shift
            </h3>

            {/* Caisses & Missing Time */}
            <div className="bg-[#0F172A] p-3 rounded border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Réalisation vs Objectif Net:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {caissesRealisees} / {previewReconciliation.objectifAjusteArrets} caisses
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (caissesRealisees / (previewReconciliation.objectifAjusteArrets || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Objectif Brut 8h:</span>
                  <span className="font-mono font-bold text-slate-200">{selectedProduct.objectifCaisses8h} caisses</span>
                </div>
                <div className="flex items-center justify-between text-rose-400">
                  <span>- Déduction Arrêts ({previewReconciliation.totalDowntimeMin} min):</span>
                  <span className="font-mono font-bold">-{previewReconciliation.caissesPerduesArrets} caisses</span>
                </div>
                <div className="flex items-center justify-between font-bold text-cyan-300 border-t border-slate-800 pt-1">
                  <span>= Objectif Net Ajusté:</span>
                  <span className="font-mono text-sm">{previewReconciliation.objectifAjusteArrets} caisses</span>
                </div>
                <div className="flex items-center justify-between text-amber-400 font-bold border-t border-slate-800/60 pt-1">
                  <span>Solde Caisses Manquantes (Net):</span>
                  <span className="font-mono text-sm">{previewReconciliation.caissesManquantes} caisses</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Temps de cadence perdu:</span>
                  <span className="font-mono font-bold text-rose-300">{formatNumber(previewReconciliation.tempsManquantTotalMin, 0)} min</span>
                </div>
              </div>
            </div>

            {/* EXPLICATION DÉCOMPOSÉE & WATERFALL DÉTAILLÉ BILAN MATIÈRE */}
            {previewReconciliation.pateExplicationBreakdown && (
              <div className="bg-[#0F172A] p-3 rounded border border-cyan-500/50 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                    Explication Décomposée Bilan Matière
                  </span>
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-800/40">
                    Pâte
                  </span>
                </div>

                <div className="flex justify-between items-center font-mono text-[11px] bg-slate-900/90 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-300 font-sans font-bold">Total Consommation Réelle:</span>
                  <span className="font-bold text-emerald-400 text-sm">{formatNumber(previewReconciliation.pateExplicationBreakdown.totalConsommationKg, 0)} kg</span>
                </div>

                {/* Waterfall percentage visual bar */}
                {(() => {
                  const bd = previewReconciliation.pateExplicationBreakdown;
                  const total = bd.totalConsommationKg > 0 ? bd.totalConsommationKg : 1;
                  const pctProd = (bd.productionTheoriqueKg / total) * 100;
                  const pctDem = (Math.max(0, bd.pateDemarrageNetKg) / total) * 100;
                  const pctDech = (bd.dechetPhysiqueKg / total) * 100;
                  const pctPesee = (bd.ecartPeseeKg / total) * 100;
                  const pctAutre = (bd.resteAutreKg / total) * 100;

                  return (
                    <div className="space-y-2 font-mono text-[10.5px]">
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${pctProd}%` }} className="bg-emerald-500 h-full" title="Production Utile Théo" />
                        {pctDem > 0 && <div style={{ width: `${pctDem}%` }} className="bg-cyan-500 h-full" title="Pâtes Démarrage" />}
                        {pctDech > 0 && <div style={{ width: `${pctDech}%` }} className="bg-rose-500 h-full" title="Déchets Pesés" />}
                        {pctPesee > 0 && <div style={{ width: `${pctPesee}%` }} className="bg-amber-500 h-full" title="Écart Pesée" />}
                        {pctAutre > 0 && <div style={{ width: `${pctAutre}%` }} className="bg-purple-500 h-full" title="Autre / À Justifier" />}
                      </div>

                      <div className="space-y-1 text-slate-300 pt-0.5">
                        <div className="flex justify-between">
                          <span className="text-emerald-400">1. Production Utile Théo:</span>
                          <span className="font-bold">{formatNumber(bd.productionTheoriqueKg, 0)} kg ({pctProd.toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-400">2. Pâtes Démarrage / Reprise:</span>
                          <span className="font-bold">{formatNumber(bd.pateDemarrageNetKg, 0)} kg ({pctDem.toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-rose-400">3. Déchets Physiques Pesés:</span>
                          <span className="font-bold">{formatNumber(bd.dechetPhysiqueKg, 0)} kg ({pctDech.toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-400">4. Écart Pesée / Grammage:</span>
                          <span className="font-bold">{formatNumber(bd.ecartPeseeKg, 0)} kg ({pctPesee.toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                          <span className="text-purple-400">5. Catégorie Autre / Reste:</span>
                          <span className="text-purple-300">{formatNumber(bd.resteAutreKg, 0)} kg ({pctAutre.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* EXPLICATION & JUSTIFICATION DÉTAILLÉE DES ARRÊTS DE LIGNE */}
            <div className="bg-[#0F172A] p-3 rounded border border-amber-500/40 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Explication & Justification des Arrêts
                </span>
                <span className="text-[9px] bg-amber-950 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-800/40">
                  {downtimes.length} arrêt(s)
                </span>
              </div>

              {downtimes.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">Aucun arrêt déclaré sur ce poste.</p>
              ) : (
                <div className="space-y-1.5 text-[10.5px] font-mono">
                  {downtimes.map((dt) => {
                    const lostBoxes = selectedProduct.cadenceStandardCaissesParHeure > 0
                      ? Math.round((dt.durationMinutes / 60) * selectedProduct.cadenceStandardCaissesParHeure)
                      : 0;
                    return (
                      <div key={dt.id} className="bg-slate-900/90 p-2 rounded border border-slate-800 space-y-0.5">
                        <div className="flex justify-between text-slate-200">
                          <span className="text-amber-300 font-bold font-sans">[{dt.category}]</span>
                          <span className="text-rose-400 font-bold">{dt.durationMinutes} min (~{lostBoxes} caisses)</span>
                        </div>
                        <div className="text-slate-300 font-sans italic text-[10px]">
                          Motif: {dt.reason}
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-1 border-t border-slate-800 flex justify-between text-[11px] font-bold text-amber-300">
                    <span>Total Perte Arrêts Est.:</span>
                    <span>
                      ~{Math.round((previewReconciliation.totalDowntimeMin / 60) * (selectedProduct.cadenceStandardCaissesParHeure || 0))} caisses
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pesée Moyenne Réelle Mesurée (Indicatif / Justification) */}
            {previewReconciliation.poidsMoyenReelMesureG && (
              <div className="bg-[#0F172A] p-3 rounded border border-cyan-500/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] font-bold uppercase text-cyan-400">
                    Contrôle Poids Réel Mesuré (Indicatif)
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Pesée Ligne</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Poids Mesuré:</span>
                  <span className="font-bold text-cyan-300">{previewReconciliation.poidsMoyenReelMesureG.toFixed(2)} g / unit</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Standard Recette:</span>
                  <span className="text-slate-300 font-bold">
                    {(selectedProduct.poidsPateCuiteParPochonG + selectedProduct.poidsCremeParPochonG + selectedProduct.poidsEnrobageParPochonG).toFixed(2)} g / unit
                  </span>
                </div>
                {(() => {
                  const stdG = selectedProduct.poidsPateCuiteParPochonG + selectedProduct.poidsCremeParPochonG + selectedProduct.poidsEnrobageParPochonG;
                  const deltaG = previewReconciliation.poidsMoyenReelMesureG! - stdG;
                  const deltaPct = stdG > 0 ? (deltaG / stdG) * 100 : 0;
                  return (
                    <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-sans">Écart Pesée / Standard:</span>
                      <span className={deltaG > 0 ? 'text-amber-400 font-bold font-mono' : deltaG < 0 ? 'text-cyan-400 font-bold font-mono' : 'text-emerald-400 font-bold font-mono'}>
                        {deltaG > 0 ? '+' : ''}{deltaG.toFixed(2)} g ({deltaG > 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })()}
                <p className="text-[9.5px] text-slate-400 italic font-sans pt-0.5">
                  * N'altère pas les équivalences théoriques, sert de pièce justificative pour les bilans.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

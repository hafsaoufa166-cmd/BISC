import React, { useState } from 'react';
import { ProductionLineConfig, ShiftRecord, ShiftType, LineCode } from '../types';
import {
  LayoutDashboard,
  Scale,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  RotateCcw,
  PackageCheck,
  CheckCircle2,
  Sun,
  Sunset,
  Moon,
  TrendingUp,
  Layers
} from 'lucide-react';
import { formatNumber, formatInt } from '../utils/calculations';

interface DashboardOverviewProps {
  lines: ProductionLineConfig[];
  records: ShiftRecord[];
  selectedDate: string;
  selectedLineFilter: LineCode | 'all';
  onDateChange: (date: string) => void;
  onFilterLineChange: (line: LineCode | 'all') => void;
  onOpenShiftEntry: (lineCode?: LineCode, shift?: ShiftType) => void;
  onEditShiftRecord: (record: ShiftRecord) => void;
  onDeleteShiftRecord: (id: string) => void;
  onClearDateRecords: (date: string) => void;
  onClearYesterdayRecords: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  lines,
  records,
  selectedDate,
  selectedLineFilter,
  onDateChange,
  onFilterLineChange,
  onOpenShiftEntry,
  onEditShiftRecord,
  onDeleteShiftRecord,
  onClearDateRecords,
  onClearYesterdayRecords,
}) => {
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const activeLines = lines.filter((l) => l.status === 'Active');

  // Filter records for the selected production date
  const recordsForDate = records.filter((r) => r.date === selectedDate);
  const uniqueProductsForDate = Array.from(new Set(recordsForDate.map((r) => r.productName))).filter(Boolean);

  const filteredRecordsForDate = recordsForDate.filter(
    (r) =>
      (selectedLineFilter === 'all' || r.lineCode === selectedLineFilter) &&
      (selectedProductFilter === 'all' || r.productName === selectedProductFilter)
  );

  // Daily product cumulative map for the selected date
  const dailyProductsCumul = React.useMemo(() => {
    const map = new Map<string, {
      productName: string;
      lineCode: LineCode;
      shifts: string[];
      caisses: number;
      batchesPate: number;
      pateEngageeKg: number;
      pateTheoKg: number;
      ecartPateKg: number;
      batchesCreme: number;
      cremeEngageeKg: number;
      batchesEnrobage: number;
      enrobageEngageKg: number;
      dechetsKg: number;
      surpoidsKg: number;
      avgSurpoidsG: number;
      downtimeMin: number;
      downtimes: { id: string; category: string; reason: string; durationMinutes: number; comments?: string; shift: string }[];
    }>();

    filteredRecordsForDate.forEach((r) => {
      const pName = r.productName || 'Produit Inconnu';
      const existing = map.get(pName) || {
        productName: pName,
        lineCode: r.lineCode,
        shifts: [],
        caisses: 0,
        batchesPate: 0,
        pateEngageeKg: 0,
        pateTheoKg: 0,
        ecartPateKg: 0,
        batchesCreme: 0,
        cremeEngageeKg: 0,
        batchesEnrobage: 0,
        enrobageEngageKg: 0,
        dechetsKg: 0,
        surpoidsKg: 0,
        avgSurpoidsG: 0,
        downtimeMin: 0,
        downtimes: [],
      };

      if (!existing.shifts.includes(r.shift)) {
        existing.shifts.push(r.shift);
      }
      existing.caisses += r.reconciliation.caissesRealisees;
      existing.batchesPate += r.reconciliation.nbBatchesPate;
      existing.pateEngageeKg += r.reconciliation.pateEngageeKg;
      existing.pateTheoKg += r.reconciliation.pateCrueTheoriqueKg;
      existing.ecartPateKg += r.reconciliation.ecartBrutPateKg;

      existing.batchesCreme += r.reconciliation.nbBatchesCreme;
      existing.cremeEngageeKg += r.reconciliation.cremeEngageeKg;
      existing.batchesEnrobage += r.reconciliation.nbBatchesEnrobage;
      existing.enrobageEngageKg += r.reconciliation.enrobageEngageKg;

      existing.dechetsKg += r.reconciliation.totalDechetPhysiqueKg;
      existing.surpoidsKg += r.reconciliation.surpoidsPateKg;
      existing.downtimeMin += r.reconciliation.totalDowntimeMin;

      if (r.downtimes && r.downtimes.length > 0) {
        r.downtimes.forEach(d => {
          existing.downtimes.push({ ...d, shift: r.shift });
        });
      }

      map.set(pName, existing);
    });

    map.forEach((item) => {
      const totalPochons = item.caisses * 24;
      item.avgSurpoidsG = totalPochons > 0 ? ((item.surpoidsKg * 0.90) * 1000) / totalPochons : 0;
    });

    return Array.from(map.values());
  }, [filteredRecordsForDate]);

  // Separate records by shift for the selected day
  const matinRecords = filteredRecordsForDate.filter((r) => r.shift === 'Matin');
  const apresMidiRecords = filteredRecordsForDate.filter((r) => r.shift === 'Après-midi');
  const nuitRecords = filteredRecordsForDate.filter((r) => r.shift === 'Nuit');

  // Helper to aggregate stats for a list of records
  const aggregateShiftStats = (shiftRecs: ShiftRecord[]) => {
    const caisses = shiftRecs.reduce((acc, r) => acc + r.reconciliation.caissesRealisees, 0);
    const batchesPate = shiftRecs.reduce((acc, r) => acc + r.reconciliation.nbBatchesPate, 0);
    const batchesCreme = shiftRecs.reduce((acc, r) => acc + r.reconciliation.nbBatchesCreme, 0);
    const batchesEnrobage = shiftRecs.reduce((acc, r) => acc + r.reconciliation.nbBatchesEnrobage, 0);

    const pateEngageeKg = shiftRecs.reduce((acc, r) => acc + r.reconciliation.pateEngageeKg, 0);
    const pateTheoKg = shiftRecs.reduce((acc, r) => acc + r.reconciliation.pateCrueTheoriqueKg, 0);
    const ecartPateKg = pateEngageeKg - pateTheoKg;

    const dechetsKg = shiftRecs.reduce((acc, r) => acc + r.reconciliation.totalDechetPhysiqueKg, 0);
    const surpoidsKg = shiftRecs.reduce((acc, r) => acc + r.reconciliation.surpoidsPateKg, 0);
    
    const totalPochons = shiftRecs.reduce((acc, r) => acc + (r.reconciliation.caissesRealisees * 24), 0);
    const avgSurpoidsG = totalPochons > 0 ? ((surpoidsKg * 0.90) * 1000) / totalPochons : 0;

    const downtimeMin = shiftRecs.reduce((acc, r) => acc + r.reconciliation.totalDowntimeMin, 0);
    const tempsManquantMin = shiftRecs.reduce((acc, r) => acc + r.reconciliation.tempsManquantTotalMin, 0);

    return {
      count: shiftRecs.length,
      caisses,
      batchesPate,
      batchesCreme,
      batchesEnrobage,
      pateEngageeKg,
      pateTheoKg,
      ecartPateKg,
      dechetsKg,
      surpoidsKg,
      avgSurpoidsG,
      downtimeMin,
      tempsManquantMin,
    };
  };

  const matinStats = aggregateShiftStats(matinRecords);
  const apresMidiStats = aggregateShiftStats(apresMidiRecords);
  const nuitStats = aggregateShiftStats(nuitRecords);
  const totalJourneeStats = aggregateShiftStats(filteredRecordsForDate);

  // Get yesterday's date formatted
  const todayObj = new Date(selectedDate);
  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
  const yesterdayCount = records.filter((r) => r.date === yesterdayStr).length;

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Date / Day Control Bar */}
      <div className="bg-[#111827] rounded-lg p-3.5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              Synthèse Journée de Production & Bouclage Matière
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Suivi 24h décomposé par poste (Matin, Après-midi, Soir/Nuit) et Total Journée.
          </p>
        </div>

        {/* Date Selector & Day Clear Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Date Picker */}
          <div className="flex items-center space-x-1.5 bg-[#0B0F19] border border-slate-800 rounded px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Journée :</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-amber-400 font-mono font-bold focus:outline-none cursor-pointer text-xs"
            />
          </div>

          {/* Filter Line */}
          <div>
            <select
              value={selectedLineFilter}
              onChange={(e) => onFilterLineChange(e.target.value as any)}
              className="bg-[#0B0F19] text-slate-200 border border-slate-800 rounded px-2.5 py-1 font-semibold text-xs focus:outline-none"
            >
              <option value="all">Toutes les Lignes (B3, B4, G1, G3)</option>
              {activeLines.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} - {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Product */}
          <div>
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="bg-[#0B0F19] text-emerald-400 border border-slate-800 rounded px-2.5 py-1 font-semibold text-xs focus:outline-none"
            >
              <option value="all">Tous les Produits ({uniqueProductsForDate.length})</option>
              {uniqueProductsForDate.map((pName) => (
                <option key={pName} value={pName}>
                  {pName}
                </option>
              ))}
            </select>
          </div>

          {/* Action: Clear Yesterday / Clear Today */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onClearYesterdayRecords}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-bold text-[10px] uppercase rounded border border-slate-700 transition-colors flex items-center space-x-1"
              title={`Écraser les données de la veille (${yesterdayStr})`}
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Effacer Veille ({yesterdayCount})</span>
            </button>

            {filteredRecordsForDate.length > 0 && (
              <button
                onClick={() => onClearDateRecords(selectedDate)}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-rose-900 text-rose-300 font-bold text-[10px] uppercase rounded border border-slate-700 transition-colors flex items-center space-x-1"
                title="Écraser/Supprimer la journée sélectionnée"
              >
                <Trash2 className="w-3 h-3" />
                <span>Effacer Journée</span>
              </button>
            )}

            <button
              onClick={() => onOpenShiftEntry()}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-tight text-xs rounded flex items-center space-x-1 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Saisir Shift</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 SHIFTS & TOTAL JOURNÉE BREAKDOWN CARDS */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
          <span>Décomposition de la Journée du {selectedDate} (3 Shifts + Total 24h)</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">
            {filteredRecordsForDate.length} shift(s) saisi(s) aujourd'hui
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Shift Matin */}
          <div className="bg-[#111827] p-3.5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase text-slate-100">Shift Matin</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">(06h-14h)</span>
            </div>

            {matinStats.count > 0 ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[10px] font-sans">Caisses:</span>
                  <span className="font-bold text-amber-400 text-sm">{formatInt(matinStats.caisses)} caisses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Batches Pâte:</span>
                  <span className="font-bold text-emerald-400">{matinStats.batchesPate} pétrins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Écart Pâte:</span>
                  <span className={`font-bold ${matinStats.ecartPateKg > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {matinStats.ecartPateKg > 0 ? '+' : ''}{formatNumber(matinStats.ecartPateKg, 1)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Surpoids UA:</span>
                  <span className="font-bold text-amber-300">+{formatNumber(matinStats.avgSurpoidsG, 2)} g/pochon</span>
                </div>
                <div className="flex justify-between text-[11px] border-t border-slate-800 pt-1">
                  <span className="text-slate-400 text-[10px] font-sans">Déchets / Pannes:</span>
                  <span className="text-slate-300">{formatNumber(matinStats.dechetsKg, 0)}kg | {matinStats.downtimeMin}m</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <span className="text-xs text-slate-500 italic block">Shift non saisi</span>
                <button
                  onClick={() => onOpenShiftEntry(undefined, 'Matin')}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-[#0B0F19] hover:bg-slate-800 text-amber-400 border border-slate-800 inline-flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Saisir Matin</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Shift Après-midi */}
          <div className="bg-[#111827] p-3.5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Sunset className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold uppercase text-slate-100">Shift Après-midi</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">(14h-22h)</span>
            </div>

            {apresMidiStats.count > 0 ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[10px] font-sans">Caisses:</span>
                  <span className="font-bold text-amber-400 text-sm">{formatInt(apresMidiStats.caisses)} caisses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Batches Pâte:</span>
                  <span className="font-bold text-emerald-400">{apresMidiStats.batchesPate} pétrins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Écart Pâte:</span>
                  <span className={`font-bold ${apresMidiStats.ecartPateKg > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {apresMidiStats.ecartPateKg > 0 ? '+' : ''}{formatNumber(apresMidiStats.ecartPateKg, 1)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Surpoids UA:</span>
                  <span className="font-bold text-amber-300">+{formatNumber(apresMidiStats.avgSurpoidsG, 2)} g/pochon</span>
                </div>
                <div className="flex justify-between text-[11px] border-t border-slate-800 pt-1">
                  <span className="text-slate-400 text-[10px] font-sans">Déchets / Pannes:</span>
                  <span className="text-slate-300">{formatNumber(apresMidiStats.dechetsKg, 0)}kg | {apresMidiStats.downtimeMin}m</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <span className="text-xs text-slate-500 italic block">Shift non saisi</span>
                <button
                  onClick={() => onOpenShiftEntry(undefined, 'Après-midi')}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-[#0B0F19] hover:bg-slate-800 text-amber-400 border border-slate-800 inline-flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Saisir Après-midi</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Shift Soir / Nuit */}
          <div className="bg-[#111827] p-3.5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase text-slate-100">Shift Soir / Nuit</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">(22h-06h)</span>
            </div>

            {nuitStats.count > 0 ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[10px] font-sans">Caisses:</span>
                  <span className="font-bold text-amber-400 text-sm">{formatInt(nuitStats.caisses)} caisses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Batches Pâte:</span>
                  <span className="font-bold text-emerald-400">{nuitStats.batchesPate} pétrins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Écart Pâte:</span>
                  <span className={`font-bold ${nuitStats.ecartPateKg > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {nuitStats.ecartPateKg > 0 ? '+' : ''}{formatNumber(nuitStats.ecartPateKg, 1)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] font-sans">Surpoids UA:</span>
                  <span className="font-bold text-amber-300">+{formatNumber(nuitStats.avgSurpoidsG, 2)} g/pochon</span>
                </div>
                <div className="flex justify-between text-[11px] border-t border-slate-800 pt-1">
                  <span className="text-slate-400 text-[10px] font-sans">Déchets / Pannes:</span>
                  <span className="text-slate-300">{formatNumber(nuitStats.dechetsKg, 0)}kg | {nuitStats.downtimeMin}m</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <span className="text-xs text-slate-500 italic block">Shift non saisi</span>
                <button
                  onClick={() => onOpenShiftEntry(undefined, 'Nuit')}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-[#0B0F19] hover:bg-slate-800 text-amber-400 border border-slate-800 inline-flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Saisir Soir</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 4: TOTAL JOURNÉE (24H) */}
          <div className="bg-[#111827] p-3.5 rounded-lg border border-amber-500/60 shadow-md flex flex-col justify-between space-y-3 relative">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <div className="flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase text-amber-400">TOTAL JOURNÉE 24H</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Cumul 24h
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-[10px] font-sans">Total Caisses:</span>
                <span className="font-bold text-amber-400 text-base">{formatInt(totalJourneeStats.caisses)} caisses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 text-[10px] font-sans">Total Batches Pâte:</span>
                <span className="font-bold text-emerald-400">{formatNumber(totalJourneeStats.batchesPate, 1)} pétrins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 text-[10px] font-sans">Écart Pâte Cumulé:</span>
                <span className={`font-bold ${totalJourneeStats.ecartPateKg > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalJourneeStats.ecartPateKg > 0 ? '+' : ''}{formatNumber(totalJourneeStats.ecartPateKg, 1)} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300 text-[10px] font-sans">Surpoids Moyen UA:</span>
                <span className="font-bold text-amber-300">+{formatNumber(totalJourneeStats.avgSurpoidsG, 2)} g/pochon</span>
              </div>
              <div className="flex justify-between text-[11px] border-t border-slate-800 pt-1">
                <span className="text-slate-400 text-[10px] font-sans">Total Déchets / Pannes:</span>
                <span className="text-slate-200 font-bold">{formatNumber(totalJourneeStats.dechetsKg, 0)}kg | {totalJourneeStats.downtimeMin}m</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CUMUL DE LA JOURNÉE PAR PRODUIT (SYNTHÈSE 24H GROUPEE PAR PRODUIT) */}
      <div className="bg-[#111827] rounded-lg p-4 border border-amber-500/50 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Cumul de la Journée du {selectedDate} par Produit ({dailyProductsCumul.length} produit(s))
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Synthèse 24h consolidée des volumes et consommations par référence produit
          </span>
        </div>

        {dailyProductsCumul.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F19] text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Produit & Ligne</th>
                  <th className="py-2.5 px-3 text-center">Postes / Shifts</th>
                  <th className="py-2.5 px-3 text-right">Caisses Réalisées</th>
                  <th className="py-2.5 px-3 text-right">Batches Pâte</th>
                  <th className="py-2.5 px-3 text-right">Pâte Réelle (kg)</th>
                  <th className="py-2.5 px-3 text-right">Écart Pâte (kg)</th>
                  <th className="py-2.5 px-3 text-right">Déchets (kg)</th>
                  <th className="py-2.5 px-3 text-right">Surpoids UA</th>
                  <th className="py-2.5 px-3 text-right">Arrêts (min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px] font-medium">
                {dailyProductsCumul.map((item) => {
                  const isEcartPatePos = item.ecartPateKg > 0;
                  return (
                    <tr key={item.productName} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.lineCode}
                          </span>
                          <span>{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-sans">
                          {item.shifts.join(', ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400 text-xs">
                        {formatInt(item.caisses)} caisses
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        {item.batchesPate} pétrins
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200">
                        {formatNumber(item.pateEngageeKg, 0)} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span className={isEcartPatePos ? 'text-rose-400' : 'text-emerald-400'}>
                          {isEcartPatePos ? '+' : ''}{formatNumber(item.ecartPateKg, 1)} kg
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                        {formatNumber(item.dechetsKg, 1)} kg
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                        +{formatNumber(item.avgSurpoidsG, 2)} g
                      </td>
                      <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                        {item.downtimeMin} min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs italic">
            Aucun cumul produit pour les filtres sélectionnés.
          </div>
        )}
      </div>

      {/* Active Production Lines Status Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span>Lignes de Production Activées Usine ({activeLines.length})</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">
            B3 (Fourrés/Enrobés) • B4 (Secs/Fourrés) • G1 (Gaufrettes) • G3 (Gaufrettes Enrobées)
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeLines.map((line) => {
            const lineRecords = filteredRecordsForDate.filter((r) => r.lineCode === line.code);
            const lastRecord = lineRecords[0];

            return (
              <div
                key={line.code}
                className="bg-[#111827] p-3.5 rounded-lg border border-slate-800 shadow-sm hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {line.code}
                    </span>
                    <span className="text-xs font-bold text-slate-100">{line.name}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active"></span>
                </div>

                {lastRecord ? (
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="text-[10px] text-slate-400 font-sans truncate">
                      Dernier produit: <span className="text-slate-200 font-bold">{lastRecord.productName}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-sans">Caisses 8h:</span>
                      <span className="font-bold text-amber-400">
                        {lastRecord.reconciliation.caissesRealisees} caisses
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-sans">Batches Pâte:</span>
                      <span className="font-bold text-emerald-400">
                        {lastRecord.reconciliation.nbBatchesPate} pétrins ({formatNumber(lastRecord.reconciliation.pateEngageeKg, 0)} kg)
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-sans">Surpoids Pièce:</span>
                      <span className={`font-bold ${lastRecord.reconciliation.surpoidsPateGParPochon > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatNumber(lastRecord.reconciliation.surpoidsPateGParPochon, 2)} g / pochon
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic py-2">
                    Aucun shift enregistré pour le {selectedDate} sur la ligne {line.code}
                  </div>
                )}

                <button
                  onClick={() => onOpenShiftEntry(line.code)}
                  className="w-full py-1 text-[11px] font-bold uppercase rounded bg-[#0B0F19] hover:bg-slate-800 text-amber-400 border border-slate-800 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Saisir Shift {line.code}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table of Shift Records with EDIT & DELETE options */}
      <div className="bg-[#111827] rounded-lg border border-slate-800 shadow-sm overflow-hidden space-y-2">
        <div className="p-3 bg-[#0B0F19] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span>Rapports de Production & Bouclages Matière ({filteredRecordsForDate.length} du {selectedDate})</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Modifier ou supprimer chaque saisie ci-dessous
          </span>
        </div>

        {filteredRecordsForDate.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F19]/90 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date & Shift</th>
                  <th className="py-2.5 px-3">Ligne & Produit</th>
                  <th className="py-2.5 px-3 text-right">Caisses Réalisées</th>
                  <th className="py-2.5 px-3 text-right">Batches Pâte</th>
                  <th className="py-2.5 px-3 text-right">Batches Crème</th>
                  <th className="py-2.5 px-3 text-right">Écart Pâte (kg)</th>
                  <th className="py-2.5 px-3 text-right">Déchets (kg)</th>
                  <th className="py-2.5 px-3 text-right">Surpoids (g/pochon)</th>
                  <th className="py-2.5 px-3 text-right">Pannes (min)</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {filteredRecordsForDate.map((r) => {
                  const rec = r.reconciliation;
                  const ecartPatePositive = rec.ecartBrutPateKg > 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-slate-200">{r.date}</div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase">{r.shift}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {r.lineCode}
                          </span>
                          <span className="font-bold text-white truncate max-w-[160px]">{r.productName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">Op: {r.operatorName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        {formatInt(rec.caissesRealisees)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {rec.nbBatchesPate} pétrins
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {rec.nbBatchesCreme > 0 ? `${rec.nbBatchesCreme} b.` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={ecartPatePositive ? 'text-rose-400' : 'text-emerald-400'}>
                          {ecartPatePositive ? '+' : ''}{formatNumber(rec.ecartBrutPateKg, 1)} kg
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-bold">
                        {formatNumber(rec.totalDechetPhysiqueKg, 1)} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                        +{formatNumber(rec.surpoidsPateGParPochon, 2)} g
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-bold">
                        {rec.totalDowntimeMin} min
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onEditShiftRecord(r)}
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                            title="Modifier ce rapport de shift"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteShiftRecord(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Supprimer ce rapport de shift"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Aucune production enregistrée pour la journée du <span className="font-bold text-amber-400">{selectedDate}</span>.
            </p>
            <button
              onClick={() => onOpenShiftEntry()}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold uppercase text-xs rounded inline-flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir le Premier Shift de la Journée</span>
            </button>
          </div>
        )}
      </div>

      {/* EXPLICATION & JUSTIFICATION DÉTAILLÉE DES ARRÊTS DU JOUR */}
      <div className="bg-[#111827] rounded-lg border border-rose-500/40 shadow-sm overflow-hidden space-y-2 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Explication & Justification des Arrêts de Ligne du {selectedDate}
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Détail exhaustif des pannes enregistrées par les régleurs et opérateurs par produit et catégorie d'incident.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded font-bold">
            Total Pannes: {totalJourneeStats.downtimeMin} min
          </span>
        </div>

        {(() => {
          const allDateDowntimes = filteredRecordsForDate.flatMap((r) =>
            (r.downtimes || []).map((d) => ({
              ...d,
              shift: r.shift,
              lineCode: r.lineCode,
              productName: r.productName,
              operatorName: r.operatorName,
            }))
          );

          if (allDateDowntimes.length === 0) {
            return (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                Aucun arrêt ou panne explicite déclaré pour la journée du {selectedDate}.
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0B0F19] text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Shift & Ligne</th>
                    <th className="py-2.5 px-3">Produit Concerné</th>
                    <th className="py-2.5 px-3">Catégorie Panne</th>
                    <th className="py-2.5 px-3">Motif / Cause Déclarée</th>
                    <th className="py-2.5 px-3 text-right">Durée (min)</th>
                    <th className="py-2.5 px-3">Commentaires Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {allDateDowntimes.map((d, idx) => (
                    <tr key={`${d.id}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-amber-400 font-bold uppercase font-mono">{d.shift}</span>
                        <div className="text-[10px] font-mono text-slate-400">Ligne {d.lineCode}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-100">
                        {d.productName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {d.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        {d.reason}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        {d.durationMinutes} min
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] italic">
                        {d.comments || 'Aucun commentaire'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

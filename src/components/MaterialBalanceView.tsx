import React, { useState } from 'react';
import { ShiftRecord, ProductionLineConfig, LineCode } from '../types';
import { Scale, AlertTriangle, Clock, Layers, Flame, ArrowUpRight, FileSpreadsheet, CheckCircle2, PieChart } from 'lucide-react';
import { formatNumber, formatInt } from '../utils/calculations';

interface MaterialBalanceViewProps {
  records: ShiftRecord[];
  lines: ProductionLineConfig[];
}

export const MaterialBalanceView: React.FC<MaterialBalanceViewProps> = ({ records, lines }) => {
  const [selectedLine, setSelectedLine] = useState<LineCode | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Extract list of unique products for dropdown filter
  const uniqueProducts = Array.from(new Set(records.map((r) => r.productName))).filter(Boolean);

  const filteredRecords = records.filter(
    (r) =>
      (selectedLine === 'all' || r.lineCode === selectedLine) &&
      (selectedProduct === 'all' || r.productName === selectedProduct)
  );

  // Group filtered records by Product for daily product-level cumulative breakdown
  const productCumulList = React.useMemo(() => {
    const map = new Map<string, {
      productName: string;
      lineCode: LineCode;
      shiftsCount: number;
      shiftsList: string[];
      caisses: number;
      batchesPate: number;
      batchesCreme: number;
      batchesEnrobage: number;
      pateEngageeKg: number;
      pateTheoKg: number;
      ecartPateKg: number;
      cremeEngageeKg: number;
      cremeTheoKg: number;
      ecartCremeKg: number;
      enrobageEngageKg: number;
      enrobageTheoKg: number;
      ecartEnrobageKg: number;
      totalDechetKg: number;
      surpoidsPateKg: number;
      surpoidsGParPochon: number;
      downtimeMin: number;
      downtimes: { id: string; category: string; reason: string; durationMinutes: number; comments?: string; shift?: string }[];
    }>();

    filteredRecords.forEach((r) => {
      const pName = r.productName || 'Produit Inconnu';
      const existing = map.get(pName) || {
        productName: pName,
        lineCode: r.lineCode,
        shiftsCount: 0,
        shiftsList: [],
        caisses: 0,
        batchesPate: 0,
        batchesCreme: 0,
        batchesEnrobage: 0,
        pateEngageeKg: 0,
        pateTheoKg: 0,
        ecartPateKg: 0,
        cremeEngageeKg: 0,
        cremeTheoKg: 0,
        ecartCremeKg: 0,
        enrobageEngageKg: 0,
        enrobageTheoKg: 0,
        ecartEnrobageKg: 0,
        totalDechetKg: 0,
        surpoidsPateKg: 0,
        surpoidsGParPochon: 0,
        downtimeMin: 0,
        downtimes: [],
      };

      existing.shiftsCount += 1;
      if (!existing.shiftsList.includes(r.shift)) {
        existing.shiftsList.push(r.shift);
      }
      existing.caisses += r.reconciliation.caissesRealisees;
      existing.batchesPate += r.reconciliation.nbBatchesPate;
      existing.batchesCreme += r.reconciliation.nbBatchesCreme;
      existing.batchesEnrobage += r.reconciliation.nbBatchesEnrobage;

      existing.pateEngageeKg += r.reconciliation.pateEngageeKg;
      existing.pateTheoKg += r.reconciliation.pateCrueTheoriqueKg;
      existing.ecartPateKg += r.reconciliation.ecartBrutPateKg;

      existing.cremeEngageeKg += r.reconciliation.cremeEngageeKg;
      existing.cremeTheoKg += r.reconciliation.cremeTheoriqueKg;
      existing.ecartCremeKg += r.reconciliation.ecartBrutCremeKg;

      existing.enrobageEngageKg += r.reconciliation.enrobageEngageKg;
      existing.enrobageTheoKg += r.reconciliation.enrobageTheoriqueKg;
      existing.ecartEnrobageKg += r.reconciliation.ecartBrutEnrobageKg;

      existing.totalDechetKg += r.reconciliation.totalDechetPhysiqueKg;
      existing.surpoidsPateKg += r.reconciliation.surpoidsPateKg;
      existing.downtimeMin += r.reconciliation.totalDowntimeMin;

      if (r.downtimes && r.downtimes.length > 0) {
        r.downtimes.forEach(d => {
          existing.downtimes.push({ ...d, shift: r.shift });
        });
      }

      map.set(pName, existing);
    });

    // Calculate weighted average surpoids for each product
    map.forEach((item) => {
      const totalPochons = item.caisses * 24;
      item.surpoidsGParPochon = totalPochons > 0 ? ((item.surpoidsPateKg * 0.90) * 1000) / totalPochons : 0;
    });

    return Array.from(map.values());
  }, [filteredRecords]);

  // Aggregated totals across filtered records
  const totalCaisses = filteredRecords.reduce((acc, r) => acc + r.reconciliation.caissesRealisees, 0);
  
  // Batches
  const totalBatchesPate = filteredRecords.reduce((acc, r) => acc + r.reconciliation.nbBatchesPate, 0);
  const totalBatchesCreme = filteredRecords.reduce((acc, r) => acc + r.reconciliation.nbBatchesCreme, 0);
  const totalBatchesEnrobage = filteredRecords.reduce((acc, r) => acc + r.reconciliation.nbBatchesEnrobage, 0);

  // Pâte
  const totalPateEngageeKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.pateEngageeKg, 0);
  const totalPateCrueTheoKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.pateCrueTheoriqueKg, 0);
  const ecartPateKg = totalPateEngageeKg - totalPateCrueTheoKg;

  // Crème
  const totalCremeEngageeKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.cremeEngageeKg, 0);
  const totalCremeTheoKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.cremeTheoriqueKg, 0);
  const ecartCremeKg = totalCremeEngageeKg - totalCremeTheoKg;

  // Enrobage
  const totalEnrobageEngageKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.enrobageEngageKg, 0);
  const totalEnrobageTheoKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.enrobageTheoriqueKg, 0);
  const ecartEnrobageKg = totalEnrobageEngageKg - totalEnrobageTheoKg;

  // Stocks En-cours (Initial / Final)
  const totalStockPateNetKg = filteredRecords.reduce((acc, r) => acc + (r.reconciliation.stockPateNetKg || 0), 0);
  const totalStockCremeNetKg = filteredRecords.reduce((acc, r) => acc + (r.reconciliation.stockCremeNetKg || 0), 0);
  const totalStockEnrobageNetKg = filteredRecords.reduce((acc, r) => acc + (r.reconciliation.stockEnrobageNetKg || 0), 0);

  // Wastes
  const totalDechetPateKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.dechetPateKg, 0);
  const totalDechetCuissonKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.dechetCuissonKg, 0);
  const totalDechetEmballageKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.dechetEmballageKg, 0);
  const totalDechetPhysiqueKg = totalDechetPateKg + totalDechetCuissonKg + totalDechetEmballageKg;

  // Overweight / Surpoids
  const totalSurpoidsPateKg = filteredRecords.reduce((acc, r) => acc + r.reconciliation.surpoidsPateKg, 0);
  const totalPochons = filteredRecords.reduce((acc, r) => acc + (r.reconciliation.caissesRealisees * 24), 0);
  const avgSurpoidsGParPochon = totalPochons > 0 ? ((totalSurpoidsPateKg * 0.90) * 1000) / totalPochons : 0;

  // Time & Speed Loss
  const totalDowntimeMin = filteredRecords.reduce((acc, r) => acc + r.reconciliation.totalDowntimeMin, 0);
  const totalTempsManquantMin = filteredRecords.reduce((acc, r) => acc + r.reconciliation.tempsManquantTotalMin, 0);
  const totalPertesCadenceMin = filteredRecords.reduce((acc, r) => acc + r.reconciliation.tempsPerduPertesCadenceMin, 0);

  // Conversion of total Pâte variance
  const avgBatchPateWeightKg = 300; // standard approx
  const ecartBatchesPateEquiv = ecartPateKg / avgBatchPateWeightKg;
  const ecartPochonsPateEquiv = (ecartPateKg * 0.90 * 1000) / 60; // 60g pochon
  const ecartCaissesPateEquiv = ecartPochonsPateEquiv / 24;

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner & Filters */}
      <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-tight">
              Analyse des Écarts Matières, Cumuls & Justification des Arrêts par Produit
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Bouclage matière décomposé par produit, conversion des écarts en batches (pétrins) et justification des arrêts de ligne.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Line */}
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value as any)}
            className="bg-[#0F172A] text-amber-400 border border-slate-700 rounded px-2.5 py-1 text-xs font-bold focus:outline-none"
          >
            <option value="all">Toutes les Lignes (B3, B4, G1, G3)</option>
            <option value="B3">Ligne B3 - Biscuits Fourrés & Enrobés</option>
            <option value="B4">Ligne B4 - Biscuits Secs & Fourrés</option>
            <option value="G1">Ligne G1 - Gaufrettes</option>
            <option value="G3">Ligne G3 - Gaufrettes Enrobées</option>
          </select>

          {/* Filter Product */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-[#0F172A] text-emerald-400 border border-slate-700 rounded px-2.5 py-1 text-xs font-bold focus:outline-none"
          >
            <option value="all">Tous les Produits ({uniqueProducts.length})</option>
            {uniqueProducts.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CUMUL DE LA JOURNÉE PAR PRODUIT (Tableau Synthétique Décomposé par Produit) */}
      <div className="bg-[#1E293B] rounded-lg border border-amber-500/50 shadow-lg overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Cumul de la Journée par Produit ({productCumulList.length} produit(s) analysé(s))
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Affichage agrégé des volumes, batches consommés, écarts kg et surpoids unitaires décomposés par produit.
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded font-bold">
            Total Caisses Cumulées: {formatInt(totalCaisses)} caisses
          </span>
        </div>

        {productCumulList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0F172A] text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Produit & Ligne</th>
                  <th className="py-2.5 px-3 text-center">Shifts</th>
                  <th className="py-2.5 px-3 text-right">Caisses</th>
                  <th className="py-2.5 px-3 text-right">Batches Pâte</th>
                  <th className="py-2.5 px-3 text-right">Pâte Réelle / Théo (kg)</th>
                  <th className="py-2.5 px-3 text-right">Écart Pâte (kg)</th>
                  <th className="py-2.5 px-3 text-right">Crème Réelle (kg)</th>
                  <th className="py-2.5 px-3 text-right">Déchets (kg)</th>
                  <th className="py-2.5 px-3 text-right">Surpoids UA</th>
                  <th className="py-2.5 px-3 text-right">Arrêts (min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium font-mono text-[11px]">
                {productCumulList.map((item) => {
                  const isEcartPatePos = item.ecartPateKg > 0;
                  return (
                    <tr key={item.productName} className="hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.lineCode}
                          </span>
                          <span className="font-bold text-slate-100 text-xs font-sans">{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {item.shiftsList.join(', ')} ({item.shiftsCount}s)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-400 text-xs">
                        {formatInt(item.caisses)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {item.batchesPate} pétrins
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200">
                        {formatNumber(item.pateEngageeKg, 0)} / {formatNumber(item.pateTheoKg, 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={isEcartPatePos ? 'text-rose-400' : 'text-emerald-400'}>
                          {isEcartPatePos ? '+' : ''}{formatNumber(item.ecartPateKg, 1)} kg
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-blue-400 font-bold">
                        {item.cremeEngageeKg > 0 ? `${formatNumber(item.cremeEngageeKg, 0)} kg` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-400 font-bold">
                        {formatNumber(item.totalDechetKg, 1)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-amber-300 font-bold">
                        +{formatNumber(item.surpoidsGParPochon, 2)} g
                      </td>
                      <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                        {item.downtimeMin} min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs">
            Aucune donnée trouvée pour les filtres sélectionnés.
          </div>
        )}
      </div>

      {/* 3 Main Reconciliation Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Écart Pâte & Batches Equiv */}
        <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700 shadow-inner space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between border-b border-slate-700 pb-2">
            <span>1. Bouclage Pâte & Pétrins Consommés</span>
            <span className="font-mono text-emerald-400">{totalBatchesPate} Batches</span>
          </h3>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center bg-[#0F172A] p-2 rounded border border-slate-700">
              <span className="text-slate-400 font-sans">Pâte Engagée Réelle:</span>
              <span className="font-bold text-emerald-400">{formatNumber(totalPateEngageeKg, 0)} kg</span>
            </div>

            {totalStockPateNetKg !== 0 && (
              <div className="flex justify-between items-center bg-[#0F172A] p-2 rounded border border-cyan-500/30 text-[11px]">
                <span className="text-cyan-400 font-sans">Pâtes Démarrage / Restes (Justification Écart):</span>
                <span className="font-bold text-cyan-300">
                  {totalStockPateNetKg > 0 ? '+' : ''}{formatNumber(totalStockPateNetKg, 0)} kg
                </span>
              </div>
            )}

            <div className="flex justify-between items-center bg-[#0F172A] p-2 rounded border border-slate-700">
              <span className="text-slate-400 font-sans">Besoin Théorique Crue:</span>
              <span className="font-bold text-slate-200">{formatNumber(totalPateCrueTheoKg, 0)} kg</span>
            </div>

            <div className="flex justify-between items-center bg-[#0F172A] p-2 rounded border border-slate-700 font-bold">
              <span className="text-slate-300 font-sans">Écart Brut Pâte:</span>
              <span className={ecartPateKg > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {ecartPateKg > 0 ? '+' : ''}{formatNumber(ecartPateKg, 1)} kg
              </span>
            </div>
          </div>

          <div className="bg-amber-500/10 p-3 rounded border border-amber-500/30 space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase text-amber-300 block border-b border-amber-500/20 pb-1">
              Équivalences de l'Écart Pâte
            </span>
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-300">En Nombre de Pétrins / Batches:</span>
              <span className="font-bold text-amber-400">{formatNumber(ecartBatchesPateEquiv, 2)} batches</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-300">En Nombre de Pochons:</span>
              <span className="font-bold text-amber-400">{formatInt(ecartPochonsPateEquiv)} pochons</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-300">En Nombre de Caisses:</span>
              <span className="font-bold text-amber-400">{formatInt(ecartCaissesPateEquiv)} caisses</span>
            </div>
          </div>
        </div>

        {/* Column 2: Crème & Enrobage Reconciliation */}
        <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700 shadow-inner space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between border-b border-slate-700 pb-2">
            <span>2. Bouclage Crème & Enrobage</span>
            <span className="font-mono text-blue-400">{totalBatchesCreme} Batches Crème</span>
          </h3>

          <div className="space-y-2 text-xs font-mono">
            {/* Crème */}
            <div className="bg-[#0F172A] p-2.5 rounded border border-slate-700 space-y-1">
              <span className="text-[10px] text-blue-400 font-bold uppercase block">Section Crème</span>
              <div className="flex justify-between text-slate-300">
                <span>Crème Engagée:</span>
                <span className="font-bold text-blue-400">{formatNumber(totalCremeEngageeKg, 0)} kg ({totalBatchesCreme} b.)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Crème Théorique:</span>
                <span>{formatNumber(totalCremeTheoKg, 0)} kg</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-800 pt-1">
                <span className="text-slate-300">Écart Crème:</span>
                <span className={ecartCremeKg > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {ecartCremeKg > 0 ? '+' : ''}{formatNumber(ecartCremeKg, 1)} kg
                </span>
              </div>
            </div>

            {/* Enrobage */}
            <div className="bg-[#0F172A] p-2.5 rounded border border-slate-700 space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase block">Section Enrobage Chocolat</span>
              <div className="flex justify-between text-slate-300">
                <span>Enrobage Engagé:</span>
                <span className="font-bold text-purple-400">{formatNumber(totalEnrobageEngageKg, 0)} kg ({totalBatchesEnrobage} b.)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Enrobage Théorique:</span>
                <span>{formatNumber(totalEnrobageTheoKg, 0)} kg</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-800 pt-1">
                <span className="text-slate-300">Écart Enrobage:</span>
                <span className={ecartEnrobageKg > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {ecartEnrobageKg > 0 ? '+' : ''}{formatNumber(ecartEnrobageKg, 1)} kg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Explication Écarts : Déchets vs Surpoids UA */}
        <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700 shadow-inner space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between border-b border-slate-700 pb-2">
            <span>3. Décomposition Écart UA & Surpoids Pièce</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </h3>

          <div className="bg-[#0F172A] p-3 rounded border border-slate-700 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-800 pb-1">
              Répartition des Déchets Physiques Pesés ({formatNumber(totalDechetPhysiqueKg, 0)} kg)
            </span>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400 font-sans">Pertes Pâte Pétrin/Formage:</span>
              <span className="font-bold text-rose-400">{formatNumber(totalDechetPateKg, 1)} kg</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400 font-sans">Biscuits Cassés Four:</span>
              <span className="font-bold text-rose-400">{formatNumber(totalDechetCuissonKg, 1)} kg</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400 font-sans">Rebuts Emballage:</span>
              <span className="font-bold text-rose-400">{formatNumber(totalDechetEmballageKg, 1)} kg</span>
            </div>
          </div>

          <div className="bg-amber-500/10 p-3 rounded border border-amber-500/30 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase text-amber-300 block border-b border-amber-500/20 pb-1">
              Surpoids Pièce / Pochon (Écart Poids Unitaire)
            </span>
            <div className="flex justify-between font-mono">
              <span className="text-slate-300 font-sans">Masse Pâte Surpoids Global:</span>
              <span className="font-bold text-amber-400">{formatNumber(totalSurpoidsPateKg, 0)} kg</span>
            </div>
            <div className="flex justify-between font-mono font-bold text-amber-300 text-sm bg-amber-500/20 p-1.5 rounded border border-amber-500/30">
              <span className="font-sans">Dérive Poids Théorique Calculé:</span>
              <span>+{formatNumber(avgSurpoidsGParPochon, 2)} g / pochon</span>
            </div>

            {(() => {
              const recordsWithPoidsMesure = filteredRecords.filter(
                (r) => r.reconciliation.poidsMoyenReelMesureG && r.reconciliation.poidsMoyenReelMesureG > 0
              );
              if (recordsWithPoidsMesure.length === 0) return null;
              const avgPoidsMesureG =
                recordsWithPoidsMesure.reduce((acc, r) => acc + (r.reconciliation.poidsMoyenReelMesureG || 0), 0) /
                recordsWithPoidsMesure.length;
              return (
                <div className="bg-[#0F172A] p-2 rounded border border-cyan-500/40 text-[11px] space-y-1 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-bold font-sans">Poids Moyen Réel Mesuré (Physique):</span>
                    <span className="font-mono font-bold text-cyan-300">{avgPoidsMesureG.toFixed(2)} g</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 italic font-sans">
                    * Pesée laboratoire enregistrée sur {recordsWithPoidsMesure.length} poste(s). Utilisée comme justification physique sans altérer le calcul théorique.
                  </p>
                </div>
              );
            })()}

            <p className="text-[10px] text-slate-400 italic">
              Indique une dérive de pesée sur le presse-pâte ou la rotative au-delà du poids standard unitaire.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION EXPLICATION DÉCOMPOSÉE ET ARBORESCENCE DES ÉCARTS DU BILAN MATIÈRE */}
      <div className="bg-[#1E293B] rounded-lg p-4 border border-cyan-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              Explication Décomposée & Justification des Écarts du Bilan Matière Global
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Décomposition détaillée de la consommation réelle engagée (Production Utile + Démarrage + Déchets + Écart Pesée + Catégorie Autre)
            </p>
          </div>
          <span className="text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 px-3 py-1 rounded">
            Formule: Consommation Réelle = Sum(Composants Expliqués)
          </span>
        </div>

        {/* Breakdown for Pâte */}
        <div className="bg-[#0F172A] p-4 rounded-lg border border-slate-700 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-400 flex items-center gap-2">
              <span>A. Décomposition Pâte (Pétrie / Raw Dough)</span>
            </span>
            <span className="font-mono text-xs text-slate-300">
              Total Engagé Réel: <strong className="text-emerald-400 text-sm">{formatNumber(totalPateEngageeKg, 0)} kg</strong>
            </span>
          </div>

          {(() => {
            const prod = totalPateCrueTheoKg;
            const demarrage = Math.max(0, totalStockPateNetKg);
            const dechet = totalDechetPhysiqueKg;
            const pesee = Math.max(0, totalSurpoidsPateKg);
            const consosExpliquees = prod + demarrage + dechet + pesee;
            const resteAutre = Math.max(0, totalPateEngageeKg - consosExpliquees);
            const total = totalPateEngageeKg > 0 ? totalPateEngageeKg : 1;

            const pctProd = (prod / total) * 100;
            const pctDemarrage = (demarrage / total) * 100;
            const pctDechet = (dechet / total) * 100;
            const pctPesee = (pesee / total) * 100;
            const pctAutre = (resteAutre / total) * 100;

            return (
              <div className="space-y-3 text-xs">
                {/* Visual Waterfall Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Barre de Répartition (%)</span>
                    <span>100% Consommation Réelle</span>
                  </div>
                  <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${pctProd}%` }} className="bg-emerald-500 h-full transition-all" title={`Production Utile: ${formatNumber(prod, 0)} kg (${pctProd.toFixed(1)}%)`} />
                    {pctDemarrage > 0 && (
                      <div style={{ width: `${pctDemarrage}%` }} className="bg-cyan-500 h-full transition-all" title={`Pâtes Démarrage: ${formatNumber(demarrage, 0)} kg (${pctDemarrage.toFixed(1)}%)`} />
                    )}
                    {pctDechet > 0 && (
                      <div style={{ width: `${pctDechet}%` }} className="bg-rose-500 h-full transition-all" title={`Déchets Physiques: ${formatNumber(dechet, 0)} kg (${pctDechet.toFixed(1)}%)`} />
                    )}
                    {pctPesee > 0 && (
                      <div style={{ width: `${pctPesee}%` }} className="bg-amber-500 h-full transition-all" title={`Écart Pesée: ${formatNumber(pesee, 0)} kg (${pctPesee.toFixed(1)}%)`} />
                    )}
                    {pctAutre > 0 && (
                      <div style={{ width: `${pctAutre}%` }} className="bg-purple-500 h-full transition-all" title={`Autre / Non Expliqué: ${formatNumber(resteAutre, 0)} kg (${pctAutre.toFixed(1)}%)`} />
                    )}
                  </div>
                </div>

                {/* Table of components */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                  <div className="bg-[#1E293B] p-2.5 rounded border border-emerald-500/40 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-sans font-bold uppercase block">1. Prod. Utile (Théo)</span>
                    <div className="text-sm font-bold text-slate-100">{formatNumber(prod, 0)} kg</div>
                    <span className="text-[10px] text-emerald-400">{pctProd.toFixed(1)}% du total</span>
                  </div>

                  <div className="bg-[#1E293B] p-2.5 rounded border border-cyan-500/40 space-y-1">
                    <span className="text-[10px] text-cyan-400 font-sans font-bold uppercase block">2. Pâtes Démarrage</span>
                    <div className="text-sm font-bold text-slate-100">{formatNumber(demarrage, 0)} kg</div>
                    <span className="text-[10px] text-cyan-400">{pctDemarrage.toFixed(1)}% du total</span>
                  </div>

                  <div className="bg-[#1E293B] p-2.5 rounded border border-rose-500/40 space-y-1">
                    <span className="text-[10px] text-rose-400 font-sans font-bold uppercase block">3. Déchets Pesés</span>
                    <div className="text-sm font-bold text-slate-100">{formatNumber(dechet, 0)} kg</div>
                    <span className="text-[10px] text-rose-400">{pctDechet.toFixed(1)}% du total</span>
                  </div>

                  <div className="bg-[#1E293B] p-2.5 rounded border border-amber-500/40 space-y-1">
                    <span className="text-[10px] text-amber-400 font-sans font-bold uppercase block">4. Écart Pesée Ligne</span>
                    <div className="text-sm font-bold text-slate-100">{formatNumber(pesee, 0)} kg</div>
                    <span className="text-[10px] text-amber-400">{pctPesee.toFixed(1)}% du total</span>
                  </div>

                  <div className="bg-[#1E293B] p-2.5 rounded border border-purple-500/40 space-y-1">
                    <span className="text-[10px] text-purple-400 font-sans font-bold uppercase block">5. Catégorie Autre</span>
                    <div className="text-sm font-bold text-slate-100">{formatNumber(resteAutre, 0)} kg</div>
                    <span className="text-[10px] text-purple-400">{pctAutre.toFixed(1)}% à justifier</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Breakdown for Crème */}
        {totalCremeEngageeKg > 0 && (
          <div className="bg-[#0F172A] p-4 rounded-lg border border-slate-700 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-blue-400 flex items-center gap-2">
                <span>B. Décomposition Crème</span>
              </span>
              <span className="font-mono text-xs text-slate-300">
                Total Engagé Réel: <strong className="text-blue-400 text-sm">{formatNumber(totalCremeEngageeKg, 0)} kg</strong>
              </span>
            </div>

            {(() => {
              const prod = totalCremeTheoKg;
              const demarrage = Math.max(0, totalStockCremeNetKg);
              const pesee = Math.max(0, ecartCremeKg);
              const consosExpliquees = prod + demarrage;
              const resteAutre = Math.max(0, totalCremeEngageeKg - consosExpliquees - pesee);
              const total = totalCremeEngageeKg > 0 ? totalCremeEngageeKg : 1;

              const pctProd = (prod / total) * 100;
              const pctDemarrage = (demarrage / total) * 100;
              const pctPesee = (pesee / total) * 100;
              const pctAutre = (resteAutre / total) * 100;

              return (
                <div className="space-y-3 text-xs">
                  <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${pctProd}%` }} className="bg-blue-500 h-full" title={`Production Utile: ${formatNumber(prod, 0)} kg`} />
                    {pctDemarrage > 0 && (
                      <div style={{ width: `${pctDemarrage}%` }} className="bg-cyan-500 h-full" title={`Démarrage Crème: ${formatNumber(demarrage, 0)} kg`} />
                    )}
                    {pctPesee > 0 && (
                      <div style={{ width: `${pctPesee}%` }} className="bg-amber-500 h-full" title={`Écart Grammage: ${formatNumber(pesee, 0)} kg`} />
                    )}
                    {pctAutre > 0 && (
                      <div style={{ width: `${pctAutre}%` }} className="bg-purple-500 h-full" title={`Catégorie Autre: ${formatNumber(resteAutre, 0)} kg`} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="bg-[#1E293B] p-2 rounded border border-blue-500/40">
                      <span className="text-[10px] text-blue-400 font-sans font-bold uppercase block">Prod. Crème Théo</span>
                      <div className="font-bold text-slate-100">{formatNumber(prod, 0)} kg ({pctProd.toFixed(1)}%)</div>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded border border-cyan-500/40">
                      <span className="text-[10px] text-cyan-400 font-sans font-bold uppercase block">Stock Démarrage</span>
                      <div className="font-bold text-slate-100">{formatNumber(demarrage, 0)} kg ({pctDemarrage.toFixed(1)}%)</div>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded border border-amber-500/40">
                      <span className="text-[10px] text-amber-400 font-sans font-bold uppercase block">Surpoids Grammage</span>
                      <div className="font-bold text-slate-100">{formatNumber(pesee, 0)} kg ({pctPesee.toFixed(1)}%)</div>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded border border-purple-500/40">
                      <span className="text-[10px] text-purple-400 font-sans font-bold uppercase block">Catégorie Autre</span>
                      <div className="font-bold text-slate-100">{formatNumber(resteAutre, 0)} kg ({pctAutre.toFixed(1)}%)</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Breakdown for Enrobage */}
        {totalEnrobageEngageKg > 0 && (
          <div className="bg-[#0F172A] p-4 rounded-lg border border-slate-700 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-purple-400 flex items-center gap-2">
                <span>C. Décomposition Enrobage Chocolat</span>
              </span>
              <span className="font-mono text-xs text-slate-300">
                Total Engagé Réel: <strong className="text-purple-400 text-sm">{formatNumber(totalEnrobageEngageKg, 0)} kg</strong>
              </span>
            </div>

            {(() => {
              const prod = totalEnrobageTheoKg;
              const demarrage = Math.max(0, totalStockEnrobageNetKg);
              const pesee = Math.max(0, ecartEnrobageKg);
              const consosExpliquees = prod + demarrage;
              const resteAutre = Math.max(0, totalEnrobageEngageKg - consosExpliquees - pesee);
              const total = totalEnrobageEngageKg > 0 ? totalEnrobageEngageKg : 1;

              const pctProd = (prod / total) * 100;
              const pctDemarrage = (demarrage / total) * 100;
              const pctPesee = (pesee / total) * 100;
              const pctAutre = (resteAutre / total) * 100;

              return (
                <div className="space-y-3 text-xs">
                  <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${pctProd}%` }} className="bg-purple-500 h-full" title={`Production Utile: ${formatNumber(prod, 0)} kg`} />
                    {pctDemarrage > 0 && (
                      <div style={{ width: `${pctDemarrage}%` }} className="bg-cyan-500 h-full" title={`Démarrage Enrobage: ${formatNumber(demarrage, 0)} kg`} />
                    )}
                    {pctPesee > 0 && (
                      <div style={{ width: `${pctPesee}%` }} className="bg-amber-500 h-full" title={`Surpoids Enrobage: ${formatNumber(pesee, 0)} kg`} />
                    )}
                    {pctAutre > 0 && (
                      <div style={{ width: `${pctAutre}%` }} className="bg-indigo-500 h-full" title={`Catégorie Autre: ${formatNumber(resteAutre, 0)} kg`} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="bg-[#1E293B] p-2 rounded border border-purple-500/40">
                      <span className="text-[10px] text-purple-400 font-sans font-bold uppercase block">Prod. Enrobage Théo</span>
                      <div className="font-bold text-slate-100">{formatNumber(prod, 0)} kg ({pctProd.toFixed(1)}%)</div>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded border border-cyan-500/40">
                      <span className="text-[10px] text-cyan-400 font-sans font-bold uppercase block">Stock Démarrage</span>
                      <div className="font-bold text-slate-100">{formatNumber(demarrage, 0)} kg ({pctDemarrage.toFixed(1)}%)</div>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded border border-amber-500/40">
                      <span className="text-[10px] text-amber-400 font-sans font-bold uppercase block">Surpoids Enrobage</span>
                      <div className="font-bold text-slate-100">{formatNumber(pesee, 0)} kg ({pctPesee.toFixed(1)}%)</div>
                    </div>
                    <div className="bg-[#1E293B] p-2 rounded border border-indigo-500/40">
                      <span className="text-[10px] text-indigo-400 font-sans font-bold uppercase block">Catégorie Autre</span>
                      <div className="font-bold text-slate-100">{formatNumber(resteAutre, 0)} kg ({pctAutre.toFixed(1)}%)</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Section: Pertes de Cadence & Temps Manquant Breakdown */}
      <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700 shadow-inner space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between border-b border-slate-700 pb-2">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Analyse du Temps Manquant & Diagnostic : Pertes de Cadence vs Pannes Déclarées
          </span>
          <span className="font-mono text-cyan-300">Objectif Caisses 8h vs Réalisé</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#0F172A] p-3 rounded border border-slate-700 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Temps Manquant Total</span>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {formatNumber(totalTempsManquantMin, 0)} min
            </div>
            <p className="text-[10px] text-slate-400">
              Temps nécessaire à la vitesse nominale pour fabriquer le solde de caisses non produites.
            </p>
          </div>

          <div className="bg-[#0F172A] p-3 rounded border border-slate-700 space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-400 block">Part Attribuée aux Pannes</span>
            <div className="text-xl font-bold font-mono text-amber-400">
              {formatNumber(totalDowntimeMin, 0)} min
            </div>
            <p className="text-[10px] text-slate-400">
              Arrêts machines et pannes explicites enregistrés sur le journal de poste.
            </p>
          </div>

          <div className="bg-[#0F172A] p-3 rounded border border-slate-700 space-y-1">
            <span className="text-[10px] font-bold uppercase text-purple-400 block">Part Pertes de Cadence Pure</span>
            <div className="text-xl font-bold font-mono text-purple-400">
              {formatNumber(totalPertesCadenceMin, 0)} min
            </div>
            <p className="text-[10px] text-slate-400">
              Micro-arrêts non saisis et ralentissements de ligne en deçà de la vitesse nominale.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION EXPLICATION & JUSTIFICATION DÉTAILLÉE DU BILAN MATIÈRE SÉPARÉ (PÂTE, CRÈME, ENROBAGE) */}
      <div className="bg-[#1E293B] rounded-lg p-4 border border-emerald-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-2.5 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Justification & Explication Détaillée des Écarts Matières (Pâte, Crème & Enrobage Séparés)
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Motifs d'écarts, quantités déclarées catégorie "Autre", ajustements de stocks en-cours et dérives pesées sur chaque composant.
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded font-bold">
            Pâte: {totalBatchesPate} b. | Crème: {totalBatchesCreme} b. | Enrobage: {totalBatchesEnrobage} b.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card Justification PÂTE */}
          <div className="bg-[#0F172A] p-3.5 rounded-lg border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <span>1. Justification PÂTE</span>
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                {totalBatchesPate} pétrins
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Consommation Réelle:</span>
                <span className="font-bold text-emerald-400">{formatNumber(totalPateEngageeKg, 0)} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Besoin Théorique Crue:</span>
                <span>{formatNumber(totalPateCrueTheoKg, 0)} kg</span>
              </div>
              <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800 pt-1">
                <span>Écart Brut Pâte:</span>
                <span className={ecartPateKg > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {ecartPateKg > 0 ? '+' : ''}{formatNumber(ecartPateKg, 1)} kg ({formatNumber(ecartBatchesPateEquiv, 2)} b.)
                </span>
              </div>
            </div>

            <div className="bg-[#1E293B] p-2.5 rounded border border-slate-800 space-y-1.5 text-[11px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-800 pb-1">
                Motifs & Déclarations Spécifiques Pâte:
              </span>
              {filteredRecords.map((r, idx) => {
                if (!r.reconciliation.motifAutrePate && !r.reconciliation.dechetAutrePateKg && !r.reconciliation.justificationStock) return null;
                return (
                  <div key={`${r.id}-pate-${idx}`} className="space-y-0.5 border-b border-slate-800/60 pb-1 last:border-none">
                    <div className="flex justify-between text-slate-300 font-mono text-[10px]">
                      <span>{r.date} [{r.shift}] - {r.productName}:</span>
                      {r.reconciliation.dechetAutrePateKg ? (
                        <span className="text-emerald-400 font-bold">+{r.reconciliation.dechetAutrePateKg} kg</span>
                      ) : null}
                    </div>
                    {r.reconciliation.categorieAutrePate && (
                      <span className="text-[10px] text-amber-300 block font-sans">
                        [{r.reconciliation.categorieAutrePate}] {r.reconciliation.motifAutrePate}
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredRecords.every(r => !r.reconciliation.motifAutrePate && !r.reconciliation.dechetAutrePateKg) && (
                <span className="text-slate-500 italic text-[10px]">Aucune déclaration "Autre" enregistrée pour la pâte.</span>
              )}
            </div>
          </div>

          {/* Card Justification CRÈME */}
          <div className="bg-[#0F172A] p-3.5 rounded-lg border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase text-blue-400 flex items-center gap-1.5">
                <span>2. Justification CRÈME</span>
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
                {totalBatchesCreme} cuves
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Consommation Réelle:</span>
                <span className="font-bold text-blue-400">{formatNumber(totalCremeEngageeKg, 0)} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Besoin Théorique:</span>
                <span>{formatNumber(totalCremeTheoKg, 0)} kg</span>
              </div>
              <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800 pt-1">
                <span>Écart Brut Crème:</span>
                <span className={ecartCremeKg > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {ecartCremeKg > 0 ? '+' : ''}{formatNumber(ecartCremeKg, 1)} kg
                </span>
              </div>
            </div>

            <div className="bg-[#1E293B] p-2.5 rounded border border-slate-800 space-y-1.5 text-[11px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-800 pb-1">
                Motifs & Déclarations Spécifiques Crème:
              </span>
              {filteredRecords.map((r, idx) => {
                if (!r.reconciliation.motifAutreCreme && !r.reconciliation.dechetAutreCremeKg) return null;
                return (
                  <div key={`${r.id}-creme-${idx}`} className="space-y-0.5 border-b border-slate-800/60 pb-1 last:border-none">
                    <div className="flex justify-between text-slate-300 font-mono text-[10px]">
                      <span>{r.date} [{r.shift}] - {r.productName}:</span>
                      {r.reconciliation.dechetAutreCremeKg ? (
                        <span className="text-blue-400 font-bold">+{r.reconciliation.dechetAutreCremeKg} kg</span>
                      ) : null}
                    </div>
                    {r.reconciliation.categorieAutreCreme && (
                      <span className="text-[10px] text-cyan-300 block font-sans">
                        [{r.reconciliation.categorieAutreCreme}] {r.reconciliation.motifAutreCreme}
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredRecords.every(r => !r.reconciliation.motifAutreCreme && !r.reconciliation.dechetAutreCremeKg) && (
                <span className="text-slate-500 italic text-[10px]">Aucune déclaration "Autre" enregistrée pour la crème.</span>
              )}
            </div>
          </div>

          {/* Card Justification ENROBAGE */}
          <div className="bg-[#0F172A] p-3.5 rounded-lg border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase text-purple-400 flex items-center gap-1.5">
                <span>3. Justification ENROBAGE</span>
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
                {totalBatchesEnrobage} cuves
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Consommation Réelle:</span>
                <span className="font-bold text-purple-400">{formatNumber(totalEnrobageEngageKg, 0)} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Besoin Théorique:</span>
                <span>{formatNumber(totalEnrobageTheoKg, 0)} kg</span>
              </div>
              <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800 pt-1">
                <span>Écart Brut Enrobage:</span>
                <span className={ecartEnrobageKg > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {ecartEnrobageKg > 0 ? '+' : ''}{formatNumber(ecartEnrobageKg, 1)} kg
                </span>
              </div>
            </div>

            <div className="bg-[#1E293B] p-2.5 rounded border border-slate-800 space-y-1.5 text-[11px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-800 pb-1">
                Motifs & Déclarations Spécifiques Enrobage:
              </span>
              {filteredRecords.map((r, idx) => {
                if (!r.reconciliation.motifAutreEnrobage && !r.reconciliation.dechetAutreEnrobageKg) return null;
                return (
                  <div key={`${r.id}-enrob-${idx}`} className="space-y-0.5 border-b border-slate-800/60 pb-1 last:border-none">
                    <div className="flex justify-between text-slate-300 font-mono text-[10px]">
                      <span>{r.date} [{r.shift}] - {r.productName}:</span>
                      {r.reconciliation.dechetAutreEnrobageKg ? (
                        <span className="text-purple-400 font-bold">+{r.reconciliation.dechetAutreEnrobageKg} kg</span>
                      ) : null}
                    </div>
                    {r.reconciliation.categorieAutreEnrobage && (
                      <span className="text-[10px] text-purple-300 block font-sans">
                        [{r.reconciliation.categorieAutreEnrobage}] {r.reconciliation.motifAutreEnrobage}
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredRecords.every(r => !r.reconciliation.motifAutreEnrobage && !r.reconciliation.dechetAutreEnrobageKg) && (
                <span className="text-slate-500 italic text-[10px]">Aucune déclaration "Autre" enregistrée pour l'enrobage.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION EXPLICATION & JUSTIFICATION DÉTAILLÉE DE LA RÉALISATION DES CAISSES (CHEF D'ÉQUIPE) */}
      <div className="bg-[#1E293B] rounded-lg p-4 border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-2.5 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Explication & Justification de la Réalisation des Caisses (Objectifs 8H vs Effet Réel)
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Synthèse des motifs de sous-performance caisses et des explications rédigées par les chefs d'équipe.
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded font-bold">
            Total Caisses Réalisées: {formatInt(totalCaisses)} caisses
          </span>
        </div>

        <div className="space-y-2">
          {filteredRecords.map((r, idx) => {
            return (
              <div key={`${r.id}-caisses-${idx}`} className="bg-[#0F172A] p-3 rounded border border-slate-800 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-1.5 gap-1 font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {r.lineCode}
                    </span>
                    <span className="font-bold text-slate-100 font-sans">{r.productName}</span>
                    <span className="text-slate-400 font-sans">({r.date} • {r.shift})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="text-slate-300">Réalisé: <strong className="text-emerald-400">{r.reconciliation.caissesRealisees} caisses</strong></span>
                    <span className="text-slate-400">Arrêts: <strong className="text-rose-400">{r.reconciliation.totalDowntimeMin} min (-{r.reconciliation.caissesPerduesArrets || 0} c.)</strong></span>
                    <span className="text-slate-300">Obj. Net: <strong className="text-cyan-300">{r.reconciliation.objectifAjusteArrets ?? r.reconciliation.caissesRealisees + r.reconciliation.caissesManquantes} caisses</strong></span>
                    <span className="text-slate-400">Solde Net Manquant: <strong className="text-amber-400">{r.reconciliation.caissesManquantes} caisses</strong></span>
                  </div>
                </div>

                <div className="text-slate-300 font-sans text-[11px] italic bg-[#1E293B] p-2 rounded border border-slate-800">
                  <span className="text-amber-400 font-bold not-italic font-mono text-[10px] block mb-0.5">
                    Note / Justification Chef d'Équipe ({r.operatorName} / {r.supervisorName}):
                  </span>
                  {r.reconciliation.justificationCaisses || r.notes || 'Aucun commentaire spécifique rédigé sur le solde de caisses.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION EXPLICATION & JUSTIFICATION DÉTAILLÉE DES ARRÊTS DE LIGNE */}
      <div className="bg-[#1E293B] rounded-lg p-4 border border-rose-500/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-2 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Explication & Justification Détaillée des Arrêts de Ligne par Produit
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Journal exhaustif des causes de pannes, catégories d'incidents, durées et commentaires saisis sur ligne.
            </p>
          </div>
          <span className="text-xs font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded font-bold">
            Total Pannes: {totalDowntimeMin} min
          </span>
        </div>

        {(() => {
          const allDowntimesWithMeta = filteredRecords.flatMap((r) =>
            (r.downtimes || []).map((d) => ({
              ...d,
              shift: r.shift,
              lineCode: r.lineCode,
              productName: r.productName,
              operatorName: r.operatorName,
              date: r.date,
            }))
          );

          if (allDowntimesWithMeta.length === 0) {
            return (
              <div className="bg-[#0F172A] p-4 rounded text-center text-xs text-slate-400 italic">
                Aucun arrêt ou panne explicite enregistré pour cette sélection.
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0F172A] text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Date & Shift</th>
                    <th className="py-2.5 px-3">Ligne & Produit</th>
                    <th className="py-2.5 px-3">Catégorie Panne</th>
                    <th className="py-2.5 px-3">Motif / Explication Régleur</th>
                    <th className="py-2.5 px-3 text-right">Durée</th>
                    <th className="py-2.5 px-3">Commentaires / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {allDowntimesWithMeta.map((evt, idx) => (
                    <tr key={`${evt.id}-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        <div>{evt.date}</div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase">{evt.shift}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {evt.lineCode}
                          </span>
                          <span className="font-bold text-slate-100">{evt.productName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">Op: {evt.operatorName}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {evt.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 font-bold">
                        {evt.reason}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        {evt.durationMinutes} min
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] italic">
                        {evt.comments || 'Aucun commentaire'}
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

import React from 'react';
import { RefreshCw, PlusCircle, Download, SlidersHorizontal, Scale } from 'lucide-react';
import { ProductionLineConfig } from '../types';

interface HeaderProps {
  lines: ProductionLineConfig[];
  onOpenShiftEntry: () => void;
  onOpenProductConfig: () => void;
  onResetData: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lines,
  onOpenShiftEntry,
  onOpenProductConfig,
  onResetData,
  onExport,
}) => {
  const activeLinesCount = lines.filter((l) => l.status === 'Active').length;

  return (
    <header className="h-auto md:h-13 bg-[#111827] border-b border-slate-800 flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 py-2 md:py-0 shrink-0 sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500 w-7 h-7 rounded flex items-center justify-center font-black text-[#0B0F19] text-xs font-mono shadow-sm">
            BM
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight uppercase text-slate-100 flex items-center gap-2">
              Biscuiterie <span className="text-amber-400">Bilan Matière</span>
              <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider font-semibold">
                Lignes B3 • B4 • G1 • G3
              </span>
            </h1>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-5 border-l border-slate-800 pl-4 ml-2 text-xs">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider leading-none font-bold">Système</span>
            <span className="text-[11px] font-mono text-amber-400 font-semibold mt-0.5">Suivi des Écarts & Pétrins</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider leading-none font-bold">Unité Annexe</span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5">Pâte, Crème & Surpoids</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-2 md:mt-0 w-full md:w-auto justify-end">
        {/* Quick Saisie Shift */}
        <button
          id="new-shift-btn"
          onClick={onOpenShiftEntry}
          className="flex items-center space-x-1.5 py-1.5 px-3 bg-amber-500 text-slate-950 rounded font-bold text-[10px] uppercase tracking-tight hover:bg-amber-400 transition-colors shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Saisir Shift 8h</span>
        </button>

        {/* Fiches Recettes */}
        <button
          id="open-recipes-btn"
          onClick={onOpenProductConfig}
          className="flex items-center space-x-1 text-[10px] uppercase font-bold px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Fiches Recettes</span>
        </button>

        {/* Export Report */}
        <button
          id="export-report-btn"
          onClick={onExport}
          className="flex items-center space-x-1 text-[10px] uppercase font-bold px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        {/* Reset Data */}
        <button
          id="reset-data-btn"
          onClick={onResetData}
          className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          title="Réinitialiser Données Usine"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

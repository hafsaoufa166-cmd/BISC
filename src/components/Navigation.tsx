import React from 'react';
import { LayoutDashboard, PlusCircle, Scale, SlidersHorizontal } from 'lucide-react';

export type TabType = 'overview' | 'shift-entry' | 'material-balance' | 'product-config';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Tableau de Bord Bouclage Matière',
      shortLabel: 'Vue d\'Ensemble',
      icon: LayoutDashboard,
    },
    {
      id: 'shift-entry' as TabType,
      label: 'Saisie de Shift 8H',
      shortLabel: 'Saisie Shift',
      icon: PlusCircle,
      badge: 'Nouveau',
    },
    {
      id: 'material-balance' as TabType,
      label: 'Analyse Approfondie des Écarts (Pâte, Crème, Surpoids, Temps)',
      shortLabel: 'Analyse Écarts',
      icon: Scale,
    },
    {
      id: 'product-config' as TabType,
      label: 'Fiches Techniques Produit & Recettes',
      shortLabel: 'Fiches Recettes',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav className="bg-[#0B0F19] border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs uppercase font-bold tracking-tight whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.badge && !isActive && (
                  <span className="ml-1 px-1 py-0.2 text-[9px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardOverview } from './components/DashboardOverview';
import { ShiftEntryView } from './components/ShiftEntryView';
import { MaterialBalanceView } from './components/MaterialBalanceView';
import { ProductConfigView } from './components/ProductConfigView';
import { ExportModal } from './components/ExportModal';
import { ConfirmModal } from './components/ConfirmModal';

import { ProductionLineConfig, ProductRecipe, ShiftRecord, LineCode, ShiftType } from './types';
import { PRODUCTION_LINES, DEFAULT_PRODUCTS, generateInitialRecords } from './data/mockData';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

export default function App() {
  const [lines, setLines] = useState<ProductionLineConfig[]>(() => {
    const saved = localStorage.getItem('biscuiterie_lines_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return PRODUCTION_LINES;
  });

  const [products, setProducts] = useState<ProductRecipe[]>(() => {
    const saved = localStorage.getItem('biscuiterie_products_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_PRODUCTS;
  });

  const [records, setRecords] = useState<ShiftRecord[]>(() => {
    const saved = localStorage.getItem('biscuiterie_shift_records_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return generateInitialRecords(DEFAULT_PRODUCTS);
  });

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [selectedLineFilter, setSelectedLineFilter] = useState<LineCode | 'all'>('all');
  const [editingRecord, setEditingRecord] = useState<ShiftRecord | null>(null);

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('biscuiterie_shift_records_v2', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('biscuiterie_lines_v2', JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    localStorage.setItem('biscuiterie_products_v2', JSON.stringify(products));
  }, [products]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSaveShiftRecord = (newRecord: ShiftRecord) => {
    const existingIndex = records.findIndex((r) => r.id === newRecord.id);
    if (existingIndex >= 0) {
      const updated = [...records];
      updated[existingIndex] = newRecord;
      setRecords(updated);
      showToast(`Rapport ${newRecord.id} (Shift ${newRecord.shift}) mis à jour avec succès !`);
    } else {
      setRecords([newRecord, ...records]);
      showToast(`Shift ${newRecord.shift} pour la ligne ${newRecord.lineCode} enregistré avec succès !`);
    }

    setEditingRecord(null);
    setSelectedDate(newRecord.date);
    setActiveTab('overview');
  };

  const handleEditShiftRecord = (record: ShiftRecord) => {
    setEditingRecord(record);
    setActiveTab('shift-entry');
  };

  const handleDeleteShiftRecord = (id: string) => {
    setConfirmConfig({
      title: 'Supprimer ce rapport de shift',
      message: `Voulez-vous vraiment supprimer le rapport de production ${id} ?`,
      confirmText: 'Supprimer',
      onConfirm: () => {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        showToast(`Rapport de production ${id} supprimé.`);
        setConfirmConfig(null);
      },
    });
  };

  const handleClearDateRecords = (dateStr: string) => {
    setConfirmConfig({
      title: 'Effacer la journée de production',
      message: `Êtes-vous sûr de vouloir supprimer TOUTES les données de production pour la journée du ${dateStr} ?`,
      confirmText: 'Effacer la Journée',
      onConfirm: () => {
        setRecords((prev) => prev.filter((r) => r.date !== dateStr));
        showToast(`Toutes les données de la journée du ${dateStr} ont été effacées.`);
        setConfirmConfig(null);
      },
    });
  };

  const handleClearYesterdayRecords = () => {
    const todayObj = new Date(selectedDate);
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    const count = records.filter((r) => r.date === yesterdayStr).length;
    if (count === 0) {
      showToast(`Aucune donnée enregistrée pour la veille (${yesterdayStr}).`);
      return;
    }

    setConfirmConfig({
      title: 'Écraser les données de la veille',
      message: `Confirmez-vous la suppression des ${count} rapport(s) de production de la veille (${yesterdayStr}) ?`,
      confirmText: 'Effacer Veille',
      onConfirm: () => {
        setRecords((prev) => prev.filter((r) => r.date !== yesterdayStr));
        showToast(`Les données de la veille (${yesterdayStr}) ont été effacées avec succès !`);
        setConfirmConfig(null);
      },
    });
  };

  const handleResetData = () => {
    setConfirmConfig({
      title: 'Réinitialisation complète Usine',
      message: 'Voulez-vous réinitialiser toutes les données de production et recettes pour repartir à zéro ?',
      confirmText: 'Réinitialiser Tout',
      onConfirm: () => {
        const freshRecords = generateInitialRecords(DEFAULT_PRODUCTS);
        setProducts(DEFAULT_PRODUCTS);
        setLines(PRODUCTION_LINES);
        setRecords(freshRecords);
        setEditingRecord(null);
        localStorage.removeItem('biscuiterie_shift_records_v2');
        localStorage.removeItem('biscuiterie_lines_v2');
        localStorage.removeItem('biscuiterie_products_v2');
        showToast('Toutes les données et recettes ont été réinitialisées !');
        setConfirmConfig(null);
      },
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setConfirmConfig({
      title: 'Supprimer ce Produit du Catalogue',
      message: `Voulez-vous vraiment supprimer définitivement la fiche technique "${prod.name}" (${prod.id}) ?`,
      confirmText: 'Supprimer Produit',
      onConfirm: () => {
        const updated = products.filter((p) => p.id !== productId);
        setProducts(updated);
        showToast(`Produit "${prod.name}" supprimé du catalogue.`);
        setConfirmConfig(null);
      },
    });
  };

  const handleOpenShiftEntry = (lineCode?: LineCode, shift?: ShiftType) => {
    setEditingRecord(null);
    if (lineCode) {
      setSelectedLineFilter(lineCode);
    }
    setActiveTab('shift-entry');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header */}
      <Header
        lines={lines}
        onOpenShiftEntry={() => handleOpenShiftEntry()}
        onOpenProductConfig={() => setActiveTab('product-config')}
        onResetData={handleResetData}
        onExport={() => setIsExportOpen(true)}
      />

      {/* Navigation Bar */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-amber-500 text-slate-900 font-bold px-4 py-2.5 rounded shadow-2xl flex items-center space-x-2 border border-amber-300 text-xs animate-bounce">
          <span className="w-2 h-2 rounded-full bg-slate-900"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {activeTab === 'overview' && (
          <DashboardOverview
            lines={lines}
            records={records}
            selectedDate={selectedDate}
            selectedLineFilter={selectedLineFilter}
            onDateChange={setSelectedDate}
            onFilterLineChange={setSelectedLineFilter}
            onOpenShiftEntry={handleOpenShiftEntry}
            onEditShiftRecord={handleEditShiftRecord}
            onDeleteShiftRecord={handleDeleteShiftRecord}
            onClearDateRecords={handleClearDateRecords}
            onClearYesterdayRecords={handleClearYesterdayRecords}
          />
        )}

        {activeTab === 'shift-entry' && (
          <ShiftEntryView
            products={products}
            editingRecord={editingRecord}
            onSaveShiftRecord={handleSaveShiftRecord}
            onCancel={() => {
              setEditingRecord(null);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'material-balance' && (
          <MaterialBalanceView records={records} lines={lines} />
        )}

        {activeTab === 'product-config' && (
          <ProductConfigView
            products={products}
            onUpdateProducts={(updated) => {
              setProducts(updated);
              showToast('Fiches recettes et ratios mis à jour !');
            }}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="h-8 bg-[#0F172A] border-t border-slate-800 flex items-center px-6 justify-between shrink-0 text-[10px] text-slate-500 font-mono uppercase">
        <div className="flex items-center gap-4">
          <span>Système: Actif</span>
          <span className="text-emerald-500">Bilan Matière Bouclé</span>
        </div>
        <div className="text-slate-500 italic lowercase font-sans">
          © Biscuiterie Industrielle • Lignes B3, B4, G1, G3 (BN & BC réservées)
        </div>
      </footer>

      {/* Modal Export */}
      {isExportOpen && (
        <ExportModal records={records} onClose={() => setIsExportOpen(false)} />
      )}

      {/* Custom Confirmation Modal for Deletion / Clearing Data */}
      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        confirmText={confirmConfig?.confirmText || 'Confirmer'}
        onConfirm={() => {
          if (confirmConfig) {
            confirmConfig.onConfirm();
          }
        }}
        onCancel={() => setConfirmConfig(null)}
      />

    </div>
  );
}

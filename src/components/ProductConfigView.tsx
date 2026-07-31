import React, { useState } from 'react';
import { ProductRecipe, LineCode } from '../types';
import { SlidersHorizontal, Plus, Save, Cookie, Trash2, Edit3, X } from 'lucide-react';
import { formatInt } from '../utils/calculations';

interface ProductConfigViewProps {
  products: ProductRecipe[];
  onUpdateProducts: (products: ProductRecipe[]) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductConfigView: React.FC<ProductConfigViewProps> = ({
  products,
  onUpdateProducts,
  onDeleteProduct,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductRecipe | null>(null);
  const [filterLine, setFilterLine] = useState<LineCode | 'all'>('all');

  const handleStartEdit = (product: ProductRecipe) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const updated = products.map((p) => (p.id === editForm.id ? editForm : p));
    onUpdateProducts(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleAddNewProduct = () => {
    const newId = `PROD-${Date.now().toString().slice(-4)}`;
    const newProd: ProductRecipe = {
      id: newId,
      name: 'Nouveau Produit / Recette',
      lineCode: 'B3',
      category: 'Biscuits Fourrés',
      batchPateKg: 300,
      batchCremeKg: 100,
      batchEnrobageKg: 0,
      rendementFourPercent: 90,
      nbPiecesParPochon: 6,
      poidsPateCuiteParPochonG: 60,
      poidsCremeParPochonG: 24,
      poidsEnrobageParPochonG: 0,
      nbPochonsParCaisse: 24,
      objectifCaisses8h: 1200,
    };
    onUpdateProducts([...products, newProd]);
    handleStartEdit(newProd);
  };

  const filteredProducts = products.filter((p) => filterLine === 'all' || p.lineCode === filterLine);

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner / Filter Bar */}
      <div className="bg-[#111827] rounded-lg p-3.5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              Catalogue & Paramètres Recettes Usine ({products.length})
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Configurez ou supprimez les fiches recettes (poids batches, rendement four, pochons & objectifs 8h).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value as any)}
            className="bg-[#0B0F19] text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-slate-600"
          >
            <option value="all font-mono">Toutes les Lignes ({products.length} produits)</option>
            <option value="B3">Ligne B3 (Biscuits Fourrés & Enrobés)</option>
            <option value="B4">Ligne B4 (Biscuits Secs & Fourrés)</option>
            <option value="G1">Ligne G1 (Gaufrettes)</option>
            <option value="G3">Ligne G3 (Gaufrettes Enrobées)</option>
          </select>

          <button
            onClick={handleAddNewProduct}
            className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-tight rounded flex items-center space-x-1 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Editing Form Panel */}
      {editForm && (
        <div className="bg-[#111827] border border-amber-500/50 rounded-lg p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Cookie className="w-4 h-4 text-amber-400" />
              Édition Fiche Recette : {editForm.name} ({editForm.id})
            </h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  handleCancelEdit();
                  onDeleteProduct(editForm.id);
                }}
                className="px-2.5 py-1 text-[10px] font-bold uppercase bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 flex items-center space-x-1 transition-colors"
                title="Supprimer ce produit"
              >
                <Trash2 className="w-3 h-3" />
                <span>Supprimer</span>
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Fermer</span>
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3.5 py-1 text-[10px] font-bold uppercase bg-amber-500 hover:bg-amber-400 text-slate-950 rounded flex items-center space-x-1 shadow-sm transition-colors"
              >
                <Save className="w-3 h-3" />
                <span>Enregistrer Recette</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Nom Produit *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-[#0B0F19] text-white border border-slate-800 rounded px-2.5 py-1.5 font-semibold focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Ligne de Production *</label>
              <select
                value={editForm.lineCode}
                onChange={(e) => setEditForm({ ...editForm, lineCode: e.target.value as LineCode })}
                className="w-full bg-[#0B0F19] text-white border border-slate-800 rounded px-2.5 py-1.5 font-semibold focus:border-amber-500 focus:outline-none"
              >
                <option value="B3">B3 (Biscuits Fourrés & Enrobés)</option>
                <option value="B4">B4 (Biscuits Secs & Fourrés)</option>
                <option value="G1">G1 (Gaufrettes)</option>
                <option value="G3">G3 (Gaufrettes Enrobées)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Catégorie *</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                className="w-full bg-[#0B0F19] text-white border border-slate-800 rounded px-2.5 py-1.5 font-semibold focus:border-amber-500 focus:outline-none"
              >
                <option value="Biscuits Fourrés">Biscuits Fourrés</option>
                <option value="Biscuits Fourrés Enrobés">Biscuits Fourrés Enrobés</option>
                <option value="Produits Secs">Produits Secs</option>
                <option value="Produits Fourrés">Produits Fourrés</option>
                <option value="Gaufrettes">Gaufrettes</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Objectif Caisses (8h) *</label>
              <input
                type="number"
                value={editForm.objectifCaisses8h}
                onChange={(e) => setEditForm({ ...editForm, objectifCaisses8h: Number(e.target.value) })}
                className="w-full bg-[#0B0F19] text-amber-400 font-mono font-bold border border-slate-800 rounded px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Batch Weights */}
            <div className="sm:col-span-3 lg:col-span-4 bg-[#0B0F19] p-3 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block tracking-wider">
                1. Poids d'un Batch / Pétrin de Matière (kg)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Pâte (kg/batch)</label>
                  <input
                    type="number"
                    value={editForm.batchPateKg}
                    onChange={(e) => setEditForm({ ...editForm, batchPateKg: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-white font-mono border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Crème (kg/batch)</label>
                  <input
                    type="number"
                    value={editForm.batchCremeKg}
                    onChange={(e) => setEditForm({ ...editForm, batchCremeKg: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-white font-mono border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Enrobage (kg/batch)</label>
                  <input
                    type="number"
                    value={editForm.batchEnrobageKg}
                    onChange={(e) => setEditForm({ ...editForm, batchEnrobageKg: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-white font-mono border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Rendement Four (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.rendementFourPercent}
                    onChange={(e) => setEditForm({ ...editForm, rendementFourPercent: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-cyan-400 font-mono font-bold border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Pochon & Caisse Unit Ratios */}
            <div className="sm:col-span-3 lg:col-span-4 bg-[#0B0F19] p-3 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 block tracking-wider">
                2. Composition Théorique du Pochon & Caisse
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Pièces / Pochon</label>
                  <input
                    type="number"
                    value={editForm.nbPiecesParPochon}
                    onChange={(e) => setEditForm({ ...editForm, nbPiecesParPochon: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-white font-mono border border-slate-800 rounded px-2 py-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Pâte Cuite / Pochon (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.poidsPateCuiteParPochonG}
                    onChange={(e) => setEditForm({ ...editForm, poidsPateCuiteParPochonG: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-white font-mono border border-slate-800 rounded px-2 py-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Crème / Pochon (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.poidsCremeParPochonG}
                    onChange={(e) => setEditForm({ ...editForm, poidsCremeParPochonG: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-white font-mono border border-slate-800 rounded px-2 py-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Enrobage / Pochon (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.poidsEnrobageParPochonG}
                    onChange={(e) => setEditForm({ ...editForm, poidsEnrobageParPochonG: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-white font-mono border border-slate-800 rounded px-2 py-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Pochons / Caisse</label>
                  <input
                    type="number"
                    value={editForm.nbPochonsParCaisse}
                    onChange={(e) => setEditForm({ ...editForm, nbPochonsParCaisse: Number(e.target.value) })}
                    className="w-full bg-[#111827] text-amber-300 font-mono font-bold border border-slate-800 rounded px-2 py-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Catalogue Table */}
      <div className="bg-[#111827] rounded-lg border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3 bg-[#0B0F19] border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Fiches Techniques Produits en Base ({filteredProducts.length})
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Modifiez les ratios ou supprimez les références obsolètes
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F19]/90 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Produit & Ligne</th>
                  <th className="py-2.5 px-3">Batch Pâte (kg)</th>
                  <th className="py-2.5 px-3">Batch Crème (kg)</th>
                  <th className="py-2.5 px-3">Batch Enrob. (kg)</th>
                  <th className="py-2.5 px-3 text-center">Rend. Four</th>
                  <th className="py-2.5 px-3 text-center">Pochon (g)</th>
                  <th className="py-2.5 px-3 text-right">Pochons/Caisse</th>
                  <th className="py-2.5 px-3 text-right">Obj. 8H (Caisses)</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredProducts.map((p) => {
                  const isEditing = editingId === p.id;
                  const totalPochonG = p.poidsPateCuiteParPochonG + p.poidsCremeParPochonG + p.poidsEnrobageParPochonG;

                  return (
                    <tr key={p.id} className={isEditing ? 'bg-amber-500/10' : 'hover:bg-slate-800/40 transition-colors'}>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {p.lineCode}
                          </span>
                          <span>{p.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">{p.category} • ID: {p.id}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {p.batchPateKg} kg
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {p.batchCremeKg > 0 ? `${p.batchCremeKg} kg` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {p.batchEnrobageKg > 0 ? `${p.batchEnrobageKg} kg` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">
                        {p.rendementFourPercent}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-200">
                        {totalPochonG} g ({p.poidsPateCuiteParPochonG}g p / {p.poidsCremeParPochonG}g c)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-bold">
                        {p.nbPochonsParCaisse}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-bold">
                        {formatInt(p.objectifCaisses8h)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                            title="Modifier cette recette"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Supprimer ce produit du catalogue"
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
              Aucun produit ne correspond au filtre sélectionné.
            </p>
            <button
              onClick={handleAddNewProduct}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase text-xs rounded inline-flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Nouveau Produit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


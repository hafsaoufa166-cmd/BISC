import { ProductionLineConfig, ProductRecipe, ShiftRecord } from '../types';
import { calculateMaterialReconciliation } from '../utils/calculations';

export const PRODUCTION_LINES: ProductionLineConfig[] = [
  {
    id: 1,
    code: 'B3',
    name: 'Ligne B3 - Biscuits Fourrés & Enrobés',
    type: 'Biscuit',
    allowedCategories: ['Biscuits Fourrés', 'Biscuits Fourrés Enrobés'],
    status: 'Active',
    currentOperator: 'Jean-Marc Dupont',
  },
  {
    id: 2,
    code: 'B4',
    name: 'Ligne B4 - Biscuits Secs & Fourrés',
    type: 'Biscuit',
    allowedCategories: ['Produits Secs', 'Produits Fourrés'],
    status: 'Active',
    currentOperator: 'Fatima Zahra K.',
  },
  {
    id: 3,
    code: 'G1',
    name: 'Ligne G1 - Gaufrettes Classiques',
    type: 'Gaufrette',
    allowedCategories: ['Gaufrettes'],
    status: 'Active',
    currentOperator: 'Karim Benali',
  },
  {
    id: 4,
    code: 'G3',
    name: 'Ligne G3 - Gaufrettes Enrobées',
    type: 'Gaufrette',
    allowedCategories: ['Gaufrettes'],
    status: 'Active',
    currentOperator: 'Sophie Martin',
  },
  {
    id: 5,
    code: 'BN',
    name: 'Ligne BN - (Réservée ultérieurement)',
    type: 'Biscuit',
    allowedCategories: [],
    status: 'Pour plus tard',
  },
  {
    id: 6,
    code: 'BC',
    name: 'Ligne BC - (Réservée ultérieurement)',
    type: 'Biscuit',
    allowedCategories: [],
    status: 'Pour plus tard',
  },
];

export const DEFAULT_PRODUCTS: ProductRecipe[] = [
  {
    id: 'PROD-B3-01',
    name: 'Biscuit Fourré Chocolat (B3)',
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
  },
  {
    id: 'PROD-B3-02',
    name: 'Biscuit Fourré Enrobé Choco Noir (B3)',
    lineCode: 'B3',
    category: 'Biscuits Fourrés Enrobés',
    batchPateKg: 300,
    batchCremeKg: 80,
    batchEnrobageKg: 60,
    rendementFourPercent: 90,
    nbPiecesParPochon: 4,
    poidsPateCuiteParPochonG: 44,
    poidsCremeParPochonG: 16,
    poidsEnrobageParPochonG: 20,
    nbPochonsParCaisse: 24,
    objectifCaisses8h: 1000,
  },
  {
    id: 'PROD-B4-01',
    name: 'Petit Beurre Sec Standard (B4)',
    lineCode: 'B4',
    category: 'Produits Secs',
    batchPateKg: 350,
    batchCremeKg: 0,
    batchEnrobageKg: 0,
    rendementFourPercent: 88,
    nbPiecesParPochon: 8,
    poidsPateCuiteParPochonG: 80,
    poidsCremeParPochonG: 0,
    poidsEnrobageParPochonG: 0,
    nbPochonsParCaisse: 20,
    objectifCaisses8h: 1400,
  },
  {
    id: 'PROD-B4-02',
    name: 'Biscuit Fourré Vanille (B4)',
    lineCode: 'B4',
    category: 'Produits Fourrés',
    batchPateKg: 300,
    batchCremeKg: 90,
    batchEnrobageKg: 0,
    rendementFourPercent: 90,
    nbPiecesParPochon: 6,
    poidsPateCuiteParPochonG: 60,
    poidsCremeParPochonG: 24,
    poidsEnrobageParPochonG: 0,
    nbPochonsParCaisse: 24,
    objectifCaisses8h: 1150,
  },
  {
    id: 'PROD-G1-01',
    name: 'Gaufrette Noisette 5-Pochons (G1)',
    lineCode: 'G1',
    category: 'Gaufrettes',
    batchPateKg: 200,
    batchCremeKg: 120,
    batchEnrobageKg: 0,
    rendementFourPercent: 94,
    nbPiecesParPochon: 5,
    poidsPateCuiteParPochonG: 35,
    poidsCremeParPochonG: 45,
    poidsEnrobageParPochonG: 0,
    nbPochonsParCaisse: 30,
    objectifCaisses8h: 900,
  },
  {
    id: 'PROD-G3-01',
    name: 'Gaufrette Choco-Lait Enrobée (G3)',
    lineCode: 'G3',
    category: 'Gaufrettes',
    batchPateKg: 200,
    batchCremeKg: 120,
    batchEnrobageKg: 40,
    rendementFourPercent: 94,
    nbPiecesParPochon: 5,
    poidsPateCuiteParPochonG: 35,
    poidsCremeParPochonG: 45,
    poidsEnrobageParPochonG: 15,
    nbPochonsParCaisse: 30,
    objectifCaisses8h: 850,
  },
];

const SHIFT_TYPES: ('Matin' | 'Après-midi' | 'Nuit')[] = ['Matin', 'Après-midi', 'Nuit'];

export function generateInitialRecords(products: ProductRecipe[] = DEFAULT_PRODUCTS): ShiftRecord[] {
  const records: ShiftRecord[] = [];
  const today = new Date();
  
  const activeLines = PRODUCTION_LINES.filter((l) => l.status === 'Active');

  // Generate 5 days of shift history for active lines B3, B4, G1, G3
  for (let d = 4; d >= 0; d--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - d);
    const dateStr = dateObj.toISOString().split('T')[0];

    activeLines.forEach((line) => {
      // Find matching products for this line
      const lineProducts = products.filter((p) => p.lineCode === line.code);
      if (lineProducts.length === 0) return;

      SHIFT_TYPES.forEach((shift, shiftIdx) => {
        const product = lineProducts[(d + shiftIdx) % lineProducts.length];
        
        // Realistic simulated shift inputs:
        // Target caisses ~ recipe.objectifCaisses8h (e.g., 1200)
        const targetCaisses = product.objectifCaisses8h;
        const realizationRate = 0.88 + Math.random() * 0.10; // 88% - 98%
        const caissesRealisees = Math.floor(targetCaisses * realizationRate);
        
        // Theoretical dough batches needed = caissesRealisees * (poidsPateCrueEngageeParCaisseKg / batchPateKg)
        const rendementFactor = product.rendementFourPercent / 100;
        const pateCuiteParCaisseKg = (product.nbPochonsParCaisse * product.poidsPateCuiteParPochonG) / 1000;
        const pateCrueParCaisseKg = pateCuiteParCaisseKg / rendementFactor;
        const totalPateCrueTheoKg = caissesRealisees * pateCrueParCaisseKg;
        
        // Add realistic extra consumption (overweight or waste)
        const extraPateKg = 25 + Math.random() * 40; 
        const totalPateRealKg = totalPateCrueTheoKg + extraPateKg;
        const nbBatchesPate = Number((totalPateRealKg / product.batchPateKg).toFixed(1));

        // Crème batches
        let nbBatchesCreme = 0;
        if (product.batchCremeKg > 0) {
          const cremeParCaisseKg = (product.nbPochonsParCaisse * product.poidsCremeParPochonG) / 1000;
          const totalCremeTheoKg = caissesRealisees * cremeParCaisseKg;
          const extraCremeKg = 8 + Math.random() * 15;
          nbBatchesCreme = Number(((totalCremeTheoKg + extraCremeKg) / product.batchCremeKg).toFixed(1));
        }

        // Enrobage batches
        let nbBatchesEnrobage = 0;
        if (product.batchEnrobageKg > 0) {
          const enrobageParCaisseKg = (product.nbPochonsParCaisse * product.poidsEnrobageParPochonG) / 1000;
          const totalEnrobageTheoKg = caissesRealisees * enrobageParCaisseKg;
          const extraEnrobageKg = 5 + Math.random() * 10;
          nbBatchesEnrobage = Number(((totalEnrobageTheoKg + extraEnrobageKg) / product.batchEnrobageKg).toFixed(1));
        }

        // Physical Wastes
        const dechetPateKg = Math.floor(10 + Math.random() * 15);
        const dechetCuissonKg = Math.floor(12 + Math.random() * 20);
        const dechetEmballageKg = Math.floor(8 + Math.random() * 12);

        // Downtimes
        const downtimes = [];
        if (realizationRate < 0.94) {
          const dtDuration = Math.floor(20 + Math.random() * 40);
          downtimes.push({
            id: `dt-${line.code}-${d}-${shiftIdx}`,
            category: 'Emballage / Flowpack' as const,
            reason: 'Bourrage couteau d\'emballage et réglage cellule sachet',
            durationMinutes: dtDuration,
            comments: 'Arrêt mineur ligne emballage',
          });
        }

        const reconciliation = calculateMaterialReconciliation(
          product,
          caissesRealisees,
          nbBatchesPate,
          nbBatchesCreme,
          nbBatchesEnrobage,
          dechetPateKg,
          dechetCuissonKg,
          dechetEmballageKg,
          downtimes
        );

        records.push({
          id: `REC-${dateStr}-${line.code}-S${shiftIdx + 1}`,
          date: dateStr,
          shift,
          lineCode: line.code,
          productId: product.id,
          productName: product.name,
          operatorName: line.currentOperator || 'Opérateur Ligne',
          supervisorName: 'Pierre Alain',
          reconciliation,
          downtimes,
          notes: realizationRate < 0.90 ? 'Légère dérive de poids pâte décelée en début de poste' : undefined,
        });
      });
    });
  }

  return records;
}

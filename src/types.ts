export type ShiftType = 'Matin' | 'Après-midi' | 'Nuit';
export type LineCode = 'B3' | 'B4' | 'G1' | 'G3' | 'BN' | 'BC';

export interface ProductRecipe {
  id: string;
  name: string;
  lineCode: LineCode;
  category: 'Biscuits Fourrés' | 'Biscuits Fourrés Enrobés' | 'Produits Secs' | 'Produits Fourrés' | 'Gaufrettes';
  
  // Batch weights in Kg
  batchPateKg: number;      // Poids d'un batch de pâte (ex: 300 kg)
  batchCremeKg: number;     // Poids d'un batch de crème (ex: 80 kg, 0 si sec)
  batchEnrobageKg: number;  // Poids d'un batch d'enrobage (ex: 50 kg, 0 si non enrobé)
  
  // Oven performance & Yield
  rendementFourPercent: number; // Rendement four % (ex: 90% -> 10% d'évaporation)

  // Unit Ratios (Grammes & Pochons)
  nbPiecesParPochon: number;        // Nb de pièces par pochon (ex: 6)
  poidsPateCuiteParPochonG: number;  // Poids de pâte cuite dans le pochon (g) (ex: 60g)
  poidsCremeParPochonG: number;      // Poids de crème par pochon (g) (ex: 24g)
  poidsEnrobageParPochonG: number;   // Poids d'enrobage par pochon (g) (ex: 16g)
  nbPochonsParCaisse: number;        // Nb de pochons par caisse (ex: 24)
  
  // Shift Target
  objectifCaisses8h: number; // Objectif de caisses produites par 8 heures (ex: 1200 caisses)
}

export interface ProductionLineConfig {
  id: number;
  code: LineCode;
  name: string;
  type: 'Biscuit' | 'Gaufrette';
  allowedCategories: string[];
  status: 'Active' | 'Pour plus tard' | 'En Maintenance' | 'Arrêt Panne';
  currentOperator?: string;
}

export interface DowntimeEvent {
  id: string;
  category: 'Pannes Mécaniques' | 'Pannes Électriques' | 'Pâte / Formage' | 'Emballage / Flowpack' | 'Nettoyage / CIP';
  reason: string;
  durationMinutes: number;
  comments?: string;
}

export interface MaterialReconciliation {
  // Production Output
  caissesRealisees: number;
  
  // Real Material Inputs in Batches
  nbBatchesPate: number;
  nbBatchesCreme: number;
  nbBatchesEnrobage: number;

  // Stock En-Cours & Récupération (Début & Fin de Shift)
  nbBatchesPateStockInit?: number;     // Batches/Bacs de Pâte en stock démarrage
  nbBatchesPateStockFin?: number;      // Batches/Bacs de Pâte restitués en fin de shift
  nbBatchesCremeStockInit?: number;    // Batches/Bacs de Crème en stock démarrage
  nbBatchesCremeStockFin?: number;     // Batches/Bacs de Crème restitués en fin de shift
  nbBatchesEnrobageStockInit?: number; // Batches/Bacs d'Enrobage en stock démarrage
  nbBatchesEnrobageStockFin?: number;  // Batches/Bacs d'Enrobage restitués en fin de shift
  justificationStock?: string;         // Motif/Explication de l'impact stock en-cours
  
  // Real Material Inputs in Kg
  pateEngageeKg: number;
  cremeEngageeKg: number;
  enrobageEngageKg: number;

  // Consumption breakdown with stock impact (Kg)
  pateBruteKg?: number;                // Pâte pétrie brute pendant le shift (kg)
  stockPateNetKg?: number;             // Impact stock net Pâte (+Init -Fin) (kg)
  cremeBruteKg?: number;
  stockCremeNetKg?: number;
  enrobageBrutKg?: number;
  stockEnrobageNetKg?: number;
  
  // Theoretical Needs based on caissesRealisees
  pateCuiteTheoriqueKg: number;
  pateCrueTheoriqueKg: number;
  cremeTheoriqueKg: number;
  enrobageTheoriqueKg: number;
  
  // Physical Wastes (Kg)
  dechetPateKg: number;       // Perte cuve pétrin / formage
  dechetCuissonKg: number;    // Biscuits brûlés / cassés sortie four
  dechetEmballageKg: number;  // Rebuts biscuits / pochons emballage
  totalDechetPhysiqueKg: number;
  
  // Material Variances (Écarts Matières)
  ecartBrutPateKg: number;      // Pâte consommée réelle - Pâte crue théorique
  ecartBrutCremeKg: number;     // Crème consommée réelle - Crème théorique
  ecartBrutEnrobageKg: number;   // Enrobage consommé réel - Enrobage théorique
  
  // Conversion of Variances into Equivalent Batches / Pochons / Caisses
  ecartBatchesPate: number;
  ecartBatchesCreme: number;
  ecartBatchesEnrobage: number;
  
  ecartPochonsPate: number;
  ecartCaissesPate: number;
  ecartPochonsCreme: number;
  
  // Piece Overweight / UA Analysis (Surpoids / Dérive Poids Pièces)
  poidsMoyenReelMesureG?: number;   // Poids moyen réel mesuré total sur ligne (g/pochon) à titre indicatif pour justification
  poidsMoyenReelPateG?: number;     // Poids moyen réel PÂTE mesuré sur ligne (g)
  poidsMoyenReelCremeG?: number;    // Poids moyen réel CRÈME mesuré sur ligne (g)
  poidsMoyenReelEnrobageG?: number; // Poids moyen réel ENROBAGE mesuré sur ligne (g)
  surpoidsPateKg: number;          // Consommation au-delà du théorique + déchets physiques
  surpoidsPateGParPochon: number;  // Dérive poids par pochon en grammes
  surpoidsCremeKg: number;
  surpoidsCremeGParPochon: number;
  
  // Catégories & Pertes Complémentaires "Autre" (Justification Écart Bilan)
  dechetAutrePateKg?: number;           // Déchet / Écart déclaré catégorie Autre (kg)
  categorieAutrePate?: string;          // ex: "Essais & Réglages Démarrage", "Purgerie / Vidange", "Nettoyage Cuve", "Fuite Ligne"
  motifAutrePate?: string;
  
  dechetAutreCremeKg?: number;
  categorieAutreCreme?: string;
  motifAutreCreme?: string;
  
  dechetAutreEnrobageKg?: number;
  categorieAutreEnrobage?: string;
  motifAutreEnrobage?: string;

  // Explication Décomposée de l'Écart Bilan Matière (Waterfall Breakdown)
  pateExplicationBreakdown?: {
    totalConsommationKg: number;
    productionTheoriqueKg: number;
    pateDemarrageNetKg: number;
    dechetPhysiqueKg: number;
    ecartPeseeKg: number;
    resteAutreKg: number;
  };
  cremeExplicationBreakdown?: {
    totalConsommationKg: number;
    productionTheoriqueKg: number;
    cremeDemarrageNetKg: number;
    ecartPeseeKg: number;
    resteAutreKg: number;
  };
  enrobageExplicationBreakdown?: {
    totalConsommationKg: number;
    productionTheoriqueKg: number;
    enrobageDemarrageNetKg: number;
    ecartPeseeKg: number;
    resteAutreKg: number;
  };

  // Shift Time & Missing Production (Pertes de Cadence + Arrêts)
  totalDowntimeMin: number;
  caissesPerduesArrets: number;     // Volume caisses non-produites en raison des arrêts/pannes
  objectifAjusteArrets: number;     // Objectif 8h ajusté net du temps d'arrêt
  caissesManquantes: number;        // Solde net caisses manquantes (Objectif Ajusté - Caisses Réalisées)
  tempsManquantTotalMin: number;    // Temps manquant pour réaliser le solde net de caisses
  tempsPerduPertesCadenceMin: number; // Temps manquant attribué aux pertes de cadence / micro-arrêts
  justificationCaisses?: string;     // Explication / motif chef d'équipe sur l'écart de réalisation des caisses
}

export interface ShiftRecord {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  lineCode: LineCode;
  productId: string;
  productName: string;
  operatorName: string;
  supervisorName: string;
  
  reconciliation: MaterialReconciliation;
  downtimes: DowntimeEvent[];
  notes?: string;
}

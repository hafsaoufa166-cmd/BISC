import { ProductRecipe, DowntimeEvent, MaterialReconciliation } from '../types';

export function calculateMaterialReconciliation(
  recipe: ProductRecipe,
  caissesRealisees: number,
  nbBatchesPate: number,
  nbBatchesCreme: number,
  nbBatchesEnrobage: number,
  dechetPateKg: number,
  dechetCuissonKg: number,
  dechetEmballageKg: number,
  downtimes: DowntimeEvent[],
  nbBatchesPateStockInit: number = 0,
  nbBatchesPateStockFin: number = 0,
  nbBatchesCremeStockInit: number = 0,
  nbBatchesCremeStockFin: number = 0,
  nbBatchesEnrobageStockInit: number = 0,
  nbBatchesEnrobageStockFin: number = 0,
  justificationStock: string = '',
  poidsMoyenReelPateG?: number,
  poidsMoyenReelCremeG?: number,
  poidsMoyenReelEnrobageG?: number,
  dechetAutrePateKg: number = 0,
  categorieAutrePate: string = '',
  motifAutrePate: string = '',
  dechetAutreCremeKg: number = 0,
  categorieAutreCreme: string = '',
  motifAutreCreme: string = '',
  dechetAutreEnrobageKg: number = 0,
  categorieAutreEnrobage: string = '',
  motifAutreEnrobage: string = '',
  justificationCaisses: string = ''
): MaterialReconciliation {
  // 1. Real Material Inputs (Kg)
  const pateBruteKg = nbBatchesPate * recipe.batchPateKg;
  const stockPateNetKg = (nbBatchesPateStockInit - nbBatchesPateStockFin) * recipe.batchPateKg;
  const pateEngageeKg = pateBruteKg;

  const cremeBruteKg = nbBatchesCreme * recipe.batchCremeKg;
  const stockCremeNetKg = (nbBatchesCremeStockInit - nbBatchesCremeStockFin) * recipe.batchCremeKg;
  const cremeEngageeKg = cremeBruteKg;

  const enrobageBrutKg = nbBatchesEnrobage * recipe.batchEnrobageKg;
  const stockEnrobageNetKg = (nbBatchesEnrobageStockInit - nbBatchesEnrobageStockFin) * recipe.batchEnrobageKg;
  const enrobageEngageKg = enrobageBrutKg;

  // 2. Unit Ratios & Theoretical Needs per Caisse
  const rendementFactor = recipe.rendementFourPercent / 100; // e.g., 0.90 for 90%
  const poidsPateCuiteParCaisseKg = (recipe.nbPochonsParCaisse * recipe.poidsPateCuiteParPochonG) / 1000;
  const poidsPateCrueEngageeParCaisseKg = rendementFactor > 0 ? poidsPateCuiteParCaisseKg / rendementFactor : 0;
  const poidsCremeParCaisseKg = (recipe.nbPochonsParCaisse * recipe.poidsCremeParPochonG) / 1000;
  const poidsEnrobageParCaisseKg = (recipe.nbPochonsParCaisse * recipe.poidsEnrobageParPochonG) / 1000;

  // 3. Theoretical Needs for caissesRealisees
  const pateCuiteTheoriqueKg = caissesRealisees * poidsPateCuiteParCaisseKg;
  const pateCrueTheoriqueKg = caissesRealisees * poidsPateCrueEngageeParCaisseKg;
  const cremeTheoriqueKg = caissesRealisees * poidsCremeParCaisseKg;
  const enrobageTheoriqueKg = caissesRealisees * poidsEnrobageParCaisseKg;

  // 4. Physical Wastes (Kg)
  const totalDechetPhysiqueKg = dechetPateKg + dechetCuissonKg + dechetEmballageKg;

  // 5. Material Variances (Écarts)
  const ecartBrutPateKg = pateEngageeKg - pateCrueTheoriqueKg;
  const ecartBrutCremeKg = cremeEngageeKg - cremeTheoriqueKg;
  const ecartBrutEnrobageKg = enrobageEngageKg - enrobageTheoriqueKg;

  // 6. Conversions into Equivalent Batches / Pochons / Caisses
  const ecartBatchesPate = recipe.batchPateKg > 0 ? ecartBrutPateKg / recipe.batchPateKg : 0;
  const ecartBatchesCreme = recipe.batchCremeKg > 0 ? ecartBrutCremeKg / recipe.batchCremeKg : 0;
  const ecartBatchesEnrobage = recipe.batchEnrobageKg > 0 ? ecartBrutEnrobageKg / recipe.batchEnrobageKg : 0;

  const pateCuiteEquivEcartKg = ecartBrutPateKg * rendementFactor;
  const ecartPochonsPate = recipe.poidsPateCuiteParPochonG > 0 ? (pateCuiteEquivEcartKg * 1000) / recipe.poidsPateCuiteParPochonG : 0;
  const ecartCaissesPate = recipe.nbPochonsParCaisse > 0 ? ecartPochonsPate / recipe.nbPochonsParCaisse : 0;

  const ecartPochonsCreme = recipe.poidsCremeParPochonG > 0 ? (ecartBrutCremeKg * 1000) / recipe.poidsCremeParPochonG : 0;

  // 7. Overweight / Piece Weight Drift (Surpoids Pièces / Pochons)
  // Raw dough needed for physical wastes:
  const dechetPateCrueEquivKg = dechetPateKg + (rendementFactor > 0 ? (dechetCuissonKg + dechetEmballageKg) / rendementFactor : 0);
  const surpoidsPateKg = ecartBrutPateKg - dechetPateCrueEquivKg;

  const totalPochonsProduits = caissesRealisees * recipe.nbPochonsParCaisse;
  const surpoidsPateGParPochon = totalPochonsProduits > 0 ? ((surpoidsPateKg * rendementFactor) * 1000) / totalPochonsProduits : 0;

  const surpoidsCremeKg = ecartBrutCremeKg;
  const surpoidsCremeGParPochon = totalPochonsProduits > 0 ? (surpoidsCremeKg * 1000) / totalPochonsProduits : 0;

  // 8. Explicit Variance Breakdown (Arborescence Explication Écart)
  const totalPoidsMoyenReelMesureG = (poidsMoyenReelPateG || 0) + (poidsMoyenReelCremeG || 0) + (poidsMoyenReelEnrobageG || 0);

  // Pâte
  const pateDemarrageNetKg = stockPateNetKg;
  const dechetPhysiquePateKg = dechetPateCrueEquivKg;
  let ecartPeseePateKg = Math.max(0, surpoidsPateKg - dechetAutrePateKg);

  if (poidsMoyenReelPateG && poidsMoyenReelPateG > 0) {
    const deltaG = poidsMoyenReelPateG - recipe.poidsPateCuiteParPochonG;
    if (deltaG > 0 && totalPochonsProduits > 0 && rendementFactor > 0) {
      ecartPeseePateKg = Math.min(
        Math.max(0, surpoidsPateKg),
        (totalPochonsProduits * deltaG / 1000) / rendementFactor
      );
    }
  }

  const consosExpliqueesPate = pateCrueTheoriqueKg + Math.max(0, pateDemarrageNetKg) + dechetPhysiquePateKg + ecartPeseePateKg;
  const resteAutrePateKg = Math.max(0, pateEngageeKg - consosExpliqueesPate) + dechetAutrePateKg;

  const pateExplicationBreakdown = {
    totalConsommationKg: pateEngageeKg,
    productionTheoriqueKg: pateCrueTheoriqueKg,
    pateDemarrageNetKg: pateDemarrageNetKg,
    dechetPhysiqueKg: dechetPhysiquePateKg,
    ecartPeseeKg: ecartPeseePateKg,
    resteAutreKg: resteAutrePateKg,
  };

  // Crème
  const cremeDemarrageNetKg = stockCremeNetKg;
  let ecartPeseeCremeKg = Math.max(0, surpoidsCremeKg - dechetAutreCremeKg);

  if (poidsMoyenReelCremeG && poidsMoyenReelCremeG > 0) {
    const deltaCremeG = poidsMoyenReelCremeG - recipe.poidsCremeParPochonG;
    if (deltaCremeG > 0 && totalPochonsProduits > 0) {
      ecartPeseeCremeKg = Math.min(
        Math.max(0, surpoidsCremeKg),
        (totalPochonsProduits * deltaCremeG / 1000)
      );
    }
  }

  const consosExpliqueesCreme = cremeTheoriqueKg + Math.max(0, cremeDemarrageNetKg) + ecartPeseeCremeKg;
  const resteAutreCremeKg = Math.max(0, cremeEngageeKg - consosExpliqueesCreme) + dechetAutreCremeKg;

  const cremeExplicationBreakdown = {
    totalConsommationKg: cremeEngageeKg,
    productionTheoriqueKg: cremeTheoriqueKg,
    cremeDemarrageNetKg: cremeDemarrageNetKg,
    ecartPeseeKg: ecartPeseeCremeKg,
    resteAutreKg: resteAutreCremeKg,
  };

  // Enrobage
  const enrobageDemarrageNetKg = stockEnrobageNetKg;
  let ecartPeseeEnrobageKg = Math.max(0, ecartBrutEnrobageKg - dechetAutreEnrobageKg);

  if (poidsMoyenReelEnrobageG && poidsMoyenReelEnrobageG > 0) {
    const deltaEnrobageG = poidsMoyenReelEnrobageG - recipe.poidsEnrobageParPochonG;
    if (deltaEnrobageG > 0 && totalPochonsProduits > 0) {
      ecartPeseeEnrobageKg = Math.min(
        Math.max(0, ecartBrutEnrobageKg),
        (totalPochonsProduits * deltaEnrobageG / 1000)
      );
    }
  }

  const consosExpliqueesEnrobage = enrobageTheoriqueKg + Math.max(0, enrobageDemarrageNetKg) + ecartPeseeEnrobageKg;
  const resteAutreEnrobageKg = Math.max(0, enrobageEngageKg - consosExpliqueesEnrobage) + dechetAutreEnrobageKg;

  const enrobageExplicationBreakdown = {
    totalConsommationKg: enrobageEngageKg,
    productionTheoriqueKg: enrobageTheoriqueKg,
    enrobageDemarrageNetKg: enrobageDemarrageNetKg,
    ecartPeseeKg: ecartPeseeEnrobageKg,
    resteAutreKg: resteAutreEnrobageKg,
  };

  // 8. Shift Time & Missing Production (Déduction des Arrêts du Temps de Production 8h)
  const totalDowntimeMin = downtimes.reduce((acc, dt) => acc + dt.durationMinutes, 0);

  // Cadence standard cible (sur poste de 8h = 480 min)
  const totalShiftMinutes = 480;
  const cadenceCibleCaissesParMin = recipe.objectifCaisses8h > 0 ? recipe.objectifCaisses8h / totalShiftMinutes : 0;

  // Caisses non-produites directement imputables aux arrêts/pannes déclarés
  const caissesPerduesArrets = Math.round(totalDowntimeMin * cadenceCibleCaissesParMin);

  // Objectif net de caisses ajusté après déduction du temps d'arrêt
  const objectifAjusteArrets = Math.max(0, Math.round(recipe.objectifCaisses8h - caissesPerduesArrets));

  // Solde net des caisses manquantes (Pertes de cadence pure = Objectif Ajusté - Caisses Réalisées)
  const caissesManquantes = Math.max(0, objectifAjusteArrets - caissesRealisees);

  // Temps manquant résiduel attribuable aux pertes de cadence / sous-vitesse
  const tempsManquantTotalMin = cadenceCibleCaissesParMin > 0 ? caissesManquantes / cadenceCibleCaissesParMin : 0;
  const tempsPerduPertesCadenceMin = tempsManquantTotalMin;

  return {
    caissesRealisees,
    nbBatchesPate,
    nbBatchesCreme,
    nbBatchesEnrobage,
    nbBatchesPateStockInit,
    nbBatchesPateStockFin,
    nbBatchesCremeStockInit,
    nbBatchesCremeStockFin,
    nbBatchesEnrobageStockInit,
    nbBatchesEnrobageStockFin,
    justificationStock,
    pateEngageeKg,
    cremeEngageeKg,
    enrobageEngageKg,
    pateBruteKg,
    stockPateNetKg,
    cremeBruteKg,
    stockCremeNetKg,
    enrobageBrutKg,
    stockEnrobageNetKg,
    pateCuiteTheoriqueKg,
    pateCrueTheoriqueKg,
    cremeTheoriqueKg,
    enrobageTheoriqueKg,
    dechetPateKg,
    dechetCuissonKg,
    dechetEmballageKg,
    totalDechetPhysiqueKg,
    ecartBrutPateKg,
    ecartBrutCremeKg,
    ecartBrutEnrobageKg,
    ecartBatchesPate,
    ecartBatchesCreme,
    ecartBatchesEnrobage,
    ecartPochonsPate,
    ecartCaissesPate,
    ecartPochonsCreme,
    poidsMoyenReelMesureG: totalPoidsMoyenReelMesureG > 0 ? totalPoidsMoyenReelMesureG : undefined,
    poidsMoyenReelPateG: poidsMoyenReelPateG && poidsMoyenReelPateG > 0 ? poidsMoyenReelPateG : undefined,
    poidsMoyenReelCremeG: poidsMoyenReelCremeG && poidsMoyenReelCremeG > 0 ? poidsMoyenReelCremeG : undefined,
    poidsMoyenReelEnrobageG: poidsMoyenReelEnrobageG && poidsMoyenReelEnrobageG > 0 ? poidsMoyenReelEnrobageG : undefined,
    surpoidsPateKg,
    surpoidsPateGParPochon,
    surpoidsCremeKg,
    surpoidsCremeGParPochon,
    dechetAutrePateKg,
    categorieAutrePate,
    motifAutrePate,
    dechetAutreCremeKg,
    categorieAutreCreme,
    motifAutreCreme,
    dechetAutreEnrobageKg,
    categorieAutreEnrobage,
    motifAutreEnrobage,
    pateExplicationBreakdown,
    cremeExplicationBreakdown,
    enrobageExplicationBreakdown,
    totalDowntimeMin,
    caissesPerduesArrets,
    objectifAjusteArrets,
    caissesManquantes,
    tempsManquantTotalMin,
    tempsPerduPertesCadenceMin,
    justificationCaisses,
  };
}

export function formatNumber(val: number, decimals: number = 1): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return val.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatInt(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('fr-FR');
}

// =============================================================================
// Fichier : tests/memo.recette.test.mjs
// Rôle    : Tests de recette indépendants du suivi de mémorisation V2.
//           Ils traduisent les règles métier validées par le professeur et
//           ne doivent PAS être modifiés pour faire passer le code :
//           c'est le code qui s'adapte aux tests.
// Auteur  : Saïd
// Date    : 2026-11-22
// Usage   : node --test tests/memo.recette.test.mjs
// =============================================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
  preparerSeance,
  appliquerSeance,
  rejouer,
  rejouerAvecAvertissements,
  samediDe,
  prochainSamedi,
} from "../src/features/memo/logic.ts";

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

const eleve = (over = {}) => ({
  riwaya: "hafs",
  sens: "fatiha_vers_nas",
  date_debut: "2027-01-02",
  position_origine: 0,
  position_depart: 0,
  rythme: 2,
  quota_revision: 4,
  ...over,
});

const etatInitial = (e) => ({
  position: Math.max(e.position_origine, e.position_depart),
  pointeur_rev: 0,
  cycles_faits: 0,
});

const samediN = (n) => {
  const d = new Date(Date.UTC(2027, 0, 2 + 7 * n));
  return d.toISOString().slice(0, 10);
};

const blocs = (s) => ({
  nd: s.nouveau_de, na: s.nouveau_a,
  rd: s.recent_de, ra: s.recent_a,
  ad: s.ancien_de, aa: s.ancien_a,
});

const etatCourt = (e) => ({ pos: e.position, ptr: e.pointeur_rev, cyc: e.cycles_faits });

/** Déroule des semaines : prépare, saisit, applique. Renvoie les séances et l'état final. */
const derouler = (e, semaines) => {
  let etat = etatInitial(e);
  const seances = [];
  semaines.forEach((sem, i) => {
    const brouillon = preparerSeance(etat, e, samediN(i));
    const seance = {
      ...brouillon,
      nouveau_statut: sem.statut ?? "valide",
      nouveau_atteint: sem.atteint ?? null,
      recent_ok: sem.recent_ok ?? true,
      ancien_ok: sem.ancien_ok ?? null,
    };
    if (sem.blocs) assert.deepEqual(blocs(brouillon), sem.blocs, `semaine ${i + 1} : blocs préparés`);
    etat = appliquerSeance(etat, seance, e);
    if (sem.apres) assert.deepEqual(etatCourt(etat), sem.apres, `semaine ${i + 1} : état après`);
    seances.push(seance);
  });
  return { seances, etat };
};

// Générateur pseudo-aléatoire déterministe (mulberry32)
const prng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------------------------------------------------------------------------
// R1. Scénario réaliste de 11 samedis, calculé à la main
// ---------------------------------------------------------------------------

test("R1 scénario 11 samedis : blocs et état semaine par semaine", () => {
  const e = eleve({ rythme: 2, quota_revision: 4 });
  const { seances, etat } = derouler(e, [
    { statut: "valide",                    blocs: { nd: 0,  na: 2,  rd: 0, ra: 0,  ad: null, aa: null }, apres: { pos: 2,  ptr: 0, cyc: 0 } },
    { statut: "valide",                    blocs: { nd: 2,  na: 4,  rd: 0, ra: 2,  ad: null, aa: null }, apres: { pos: 4,  ptr: 0, cyc: 0 } },
    { statut: "refaire",                   blocs: { nd: 4,  na: 6,  rd: 0, ra: 4,  ad: null, aa: null }, apres: { pos: 4,  ptr: 0, cyc: 0 } },
    { statut: "valide",                    blocs: { nd: 4,  na: 6,  rd: 0, ra: 4,  ad: null, aa: null }, apres: { pos: 6,  ptr: 0, cyc: 0 } },
    { statut: "absent",                    blocs: { nd: 6,  na: 8,  rd: 0, ra: 6,  ad: null, aa: null }, apres: { pos: 6,  ptr: 0, cyc: 0 } },
    { statut: "partiel", atteint: 7,       blocs: { nd: 6,  na: 8,  rd: 0, ra: 6,  ad: null, aa: null }, apres: { pos: 7,  ptr: 0, cyc: 0 } },
    { statut: "valide",                    blocs: { nd: 7,  na: 9,  rd: 0, ra: 7,  ad: null, aa: null }, apres: { pos: 9,  ptr: 0, cyc: 0 } },
    { statut: "valide", ancien_ok: true,   blocs: { nd: 9,  na: 11, rd: 1, ra: 9,  ad: 0,    aa: 1 },    apres: { pos: 11, ptr: 0, cyc: 1 } },
    { statut: "valide", ancien_ok: false,  blocs: { nd: 11, na: 13, rd: 3, ra: 11, ad: 0,    aa: 3 },    apres: { pos: 13, ptr: 0, cyc: 1 } },
    { statut: "valide", ancien_ok: true,   blocs: { nd: 13, na: 15, rd: 5, ra: 13, ad: 0,    aa: 4 },    apres: { pos: 15, ptr: 4, cyc: 1 } },
    { statut: "valide", ancien_ok: true,   blocs: { nd: 15, na: 17, rd: 7, ra: 15, ad: 4,    aa: 7 },    apres: { pos: 17, ptr: 0, cyc: 2 } },
  ]);

  const r = rejouerAvecAvertissements(e, seances);
  assert.deepEqual(r.etat, etat, "le rejeu doit retrouver l'état incrémental");
  assert.equal(r.avertissements.length, 0);
});

// ---------------------------------------------------------------------------
// R2. Élève qui a commencé au milieu (origine > 0)
// ---------------------------------------------------------------------------

test("R2 origine 96 / départ 120 : rien sous l'origine, tour complet en 3 samedis", () => {
  const e = eleve({ position_origine: 96, position_depart: 120, rythme: 2, quota_revision: 8 });
  const { etat } = derouler(e, [
    { ancien_ok: true, blocs: { nd: 120, na: 122, rd: 112, ra: 120, ad: 96,  aa: 104 }, apres: { pos: 122, ptr: 8,  cyc: 0 } },
    { ancien_ok: true, blocs: { nd: 122, na: 124, rd: 114, ra: 122, ad: 104, aa: 112 }, apres: { pos: 124, ptr: 16, cyc: 0 } },
    { ancien_ok: true, blocs: { nd: 124, na: 126, rd: 116, ra: 124, ad: 112, aa: 116 }, apres: { pos: 126, ptr: 0,  cyc: 1 } },
    { ancien_ok: true, blocs: { nd: 126, na: 128, rd: 118, ra: 126, ad: 96,  aa: 104 } },
  ]);
  assert.equal(etat.cycles_faits, 1);
});

// ---------------------------------------------------------------------------
// R3. Invariants sur 300 scénarios aléatoires de 80 samedis
// ---------------------------------------------------------------------------

test("R3 invariants sur 300 scénarios aléatoires", () => {
  const statuts = ["valide", "valide", "valide", "partiel", "refaire", "absent"];
  for (let sc = 0; sc < 300; sc++) {
    const rnd = prng(1000 + sc);
    const origine = Math.floor(rnd() * 200);
    const depart = origine + Math.floor(rnd() * 100);
    const e = eleve({
      riwaya: rnd() < 0.5 ? "hafs" : "warsh",
      position_origine: origine,
      position_depart: Math.min(480, depart),
      rythme: 1 + Math.floor(rnd() * 4),
      quota_revision: 1 + Math.floor(rnd() * 16),
    });

    let etat = etatInitial(e);
    const seances = [];
    for (let w = 0; w < 80; w++) {
      const s = preparerSeance(etat, e, samediN(w));
      const ctx = `scénario ${sc}, semaine ${w + 1}`;

      // Bornes des blocs
      assert.ok(s.nouveau_de === etat.position, `${ctx} : nouveau_de = position`);
      assert.ok(s.nouveau_de <= s.nouveau_a && s.nouveau_a <= 480, `${ctx} : nouveau borné`);
      assert.ok(s.nouveau_a - s.nouveau_de <= e.rythme, `${ctx} : nouveau ≤ rythme`);
      assert.ok(e.position_origine <= s.recent_de && s.recent_de <= s.recent_a, `${ctx} : récent borné`);
      assert.equal(s.recent_a, s.nouveau_de, `${ctx} : récent finit où commence le nouveau`);
      assert.ok(s.recent_a - s.recent_de <= 4 * e.rythme, `${ctx} : récent ≤ 4 semaines`);

      if (s.recent_de === e.position_origine) {
        assert.equal(s.ancien_de, null, `${ctx} : pas d'ancien si zone vide`);
        assert.equal(s.ancien_a, null, `${ctx} : pas d'ancien si zone vide`);
      } else {
        assert.ok(e.position_origine <= s.ancien_de, `${ctx} : ancien ≥ origine`);
        assert.ok(s.ancien_de < s.ancien_a && s.ancien_a <= s.recent_de, `${ctx} : ancien dans la zone`);
        assert.ok(s.ancien_a - s.ancien_de <= e.quota_revision, `${ctx} : ancien ≤ quota`);
        assert.equal(s.ancien_de, e.position_origine + etat.pointeur_rev, `${ctx} : ancien part du pointeur`);
      }

      // Saisie aléatoire
      const r = rnd();
      const statut = r < 0.05 ? null : statuts[Math.floor(rnd() * statuts.length)];
      const seance = {
        ...s,
        nouveau_statut: statut,
        nouveau_atteint: statut === "partiel" ? s.nouveau_de + Math.floor(rnd() * (s.nouveau_a - s.nouveau_de + 1)) : null,
        recent_ok: statut === "absent" ? null : rnd() < 0.8,
        ancien_ok: statut === "absent" || s.ancien_de === null ? null : rnd() < 0.7,
      };

      const avant = etat;
      etat = appliquerSeance(etat, seance, e);
      assert.ok(etat.position >= avant.position, `${ctx} : la position ne recule jamais`);
      assert.ok(etat.position <= 480, `${ctx} : position ≤ 480`);
      assert.ok(etat.cycles_faits >= avant.cycles_faits, `${ctx} : les cycles ne reculent jamais`);
      if (statut === null) assert.deepEqual(etat, avant, `${ctx} : séance non saisie sans effet`);
      seances.push(seance);
    }

    const rj = rejouerAvecAvertissements(e, seances);
    assert.deepEqual(rj.etat, etat, `scénario ${sc} : rejeu = incrémental`);
    assert.equal(rj.avertissements.length, 0, `scénario ${sc} : aucun avertissement sur un parcours cohérent`);
  }
});

// ---------------------------------------------------------------------------
// R4. Couverture : un cycle de révision passe sur TOUT le mémorisé, sans trou
// ---------------------------------------------------------------------------

test("R4 un cycle couvre toute la zone [origine, recent_de[ sans trou ni chevauchement", () => {
  const e = eleve({ position_origine: 40, position_depart: 100, rythme: 2, quota_revision: 6 });
  let etat = etatInitial(e);
  let couverts = [];
  let cyclesVerifies = 0;
  for (let w = 0; w < 60; w++) {
    const s = preparerSeance(etat, e, samediN(w));
    const seance = { ...s, nouveau_statut: "valide", nouveau_atteint: null, recent_ok: true, ancien_ok: true };
    const avant = etat.cycles_faits;
    etat = appliquerSeance(etat, seance, e);
    couverts.push([s.ancien_de, s.ancien_a]);
    if (etat.cycles_faits > avant) {
      let attendu = e.position_origine;
      for (const [de, a] of couverts) {
        assert.equal(de, attendu, `cycle ${etat.cycles_faits} : tranche contiguë`);
        attendu = a;
      }
      assert.equal(attendu, s.recent_de, `cycle ${etat.cycles_faits} : se termine au début du récent`);
      couverts = [];
      cyclesVerifies++;
    }
  }
  assert.ok(cyclesVerifies >= 2, "au moins deux cycles complets vérifiés");
});

// ---------------------------------------------------------------------------
// R5. Absent : RIEN ne bouge (ni position, ni pointeur, ni cycles)
// ---------------------------------------------------------------------------

test("R5 absent : état strictement inchangé, même si ancien_ok est coché par erreur", () => {
  const e = eleve({ position_origine: 0, position_depart: 40, quota_revision: 8 });
  const etat = etatInitial(e);
  const s = preparerSeance(etat, e, samediN(0));
  assert.notEqual(s.ancien_de, null);
  const apres = appliquerSeance(etat, { ...s, nouveau_statut: "absent", nouveau_atteint: null, recent_ok: true, ancien_ok: true }, e);
  assert.deepEqual(apres, etat);
});

// ---------------------------------------------------------------------------
// R6. Partiel : cas limites
// ---------------------------------------------------------------------------

test("R6 partiel : atteint = début, au-delà de la cible, ou non renseigné", () => {
  const e = eleve({ position_depart: 20, rythme: 3 });
  const etat = etatInitial(e);
  const s = preparerSeance(etat, e, samediN(0));
  const avec = (atteint) => appliquerSeance(etat, { ...s, nouveau_statut: "partiel", nouveau_atteint: atteint, recent_ok: true, ancien_ok: null }, e).position;
  assert.equal(avec(20), 20, "atteint = nouveau_de : pas d'avance");
  assert.equal(avec(22), 22, "atteint dans la plage");
  assert.equal(avec(99), 23, "atteint au-delà : borné à nouveau_a");
  assert.equal(avec(null), 20, "atteint non renseigné : pas d'avance");
});

// ---------------------------------------------------------------------------
// R7. Correction d'une séance passée puis régénération des suivantes
// ---------------------------------------------------------------------------

test("R7 correction d'une séance passée : avertissement puis cohérence après régénération", () => {
  const e = eleve({ rythme: 2 });
  const { seances } = derouler(e, [
    { statut: "valide" }, { statut: "refaire" }, { statut: "valide" }, { statut: "valide" },
  ]);
  assert.equal(rejouer(e, seances).position, 6);

  // Le prof corrige la semaine 2 : en fait validée
  const corrigees = seances.map((s, i) => (i === 1 ? { ...s, nouveau_statut: "valide" } : s));
  const avecAvert = rejouerAvecAvertissements(e, corrigees);
  assert.ok(avecAvert.avertissements.length >= 1, "les séances suivantes deviennent incohérentes : avertissement attendu");

  // Régénération des séances suivantes à partir de l'état corrigé, statuts conservés
  let etat = etatInitial(e);
  const regenerees = corrigees.map((s) => {
    const b = preparerSeance(etat, e, s.samedi);
    const r = { ...b, nouveau_statut: s.nouveau_statut, nouveau_atteint: s.nouveau_atteint, recent_ok: s.recent_ok, ancien_ok: s.ancien_ok };
    etat = appliquerSeance(etat, r, e);
    return r;
  });
  const propre = rejouerAvecAvertissements(e, regenerees);
  assert.equal(propre.avertissements.length, 0);
  assert.equal(propre.etat.position, 8);
});

// ---------------------------------------------------------------------------
// R8. Rejeu indépendant de l'ordre fourni et des séances non saisies
// ---------------------------------------------------------------------------

test("R8 rejouer : ordre d'entrée indifférent, séances non saisies ignorées", () => {
  const e = eleve({ position_depart: 30, quota_revision: 3 });
  const { seances, etat } = derouler(e, Array.from({ length: 12 }, (_, i) => ({ statut: i % 4 === 2 ? "refaire" : "valide", ancien_ok: i % 3 !== 0 })));
  const melangees = [...seances].reverse();
  const nonSaisie = { ...preparerSeance(etat, e, samediN(12)), nouveau_statut: null, nouveau_atteint: null, recent_ok: null, ancien_ok: null };
  assert.deepEqual(rejouer(e, [nonSaisie, ...melangees]), etat);
});

// ---------------------------------------------------------------------------
// R9. Élève qui a terminé (480) : seules les révisions continuent
// ---------------------------------------------------------------------------

test("R9 élève terminé : plus de nouveau, la révision ancienne continue de tourner", () => {
  const e = eleve({ position_origine: 0, position_depart: 480, rythme: 2, quota_revision: 40 });
  let etat = etatInitial(e);
  const s = preparerSeance(etat, e, samediN(0));
  assert.equal(s.nouveau_de, 480);
  assert.equal(s.nouveau_a, 480);
  assert.equal(s.recent_de, 472);
  assert.deepEqual([s.ancien_de, s.ancien_a], [0, 40]);

  for (let w = 0; w < 12; w++) {
    const b = preparerSeance(etat, e, samediN(w));
    etat = appliquerSeance(etat, { ...b, nouveau_statut: "valide", nouveau_atteint: null, recent_ok: true, ancien_ok: true }, e);
  }
  assert.equal(etat.position, 480);
  assert.equal(etat.cycles_faits, 1, "472 huitièmes à 40 par semaine : un tour complet en 12 samedis");
});

// ---------------------------------------------------------------------------
// R10. Dates : changements d'heure et passage d'année (Europe/Paris)
// ---------------------------------------------------------------------------

test("R10 samediDe / prochainSamedi : heure d'été, heure d'hiver, nouvel an", () => {
  // Nuit du passage à l'heure d'été (29/03/2026 01:30 à Paris, un dimanche)
  assert.equal(samediDe(new Date("2026-03-29T00:30:00Z")), "2026-03-28");
  // Samedi 24/10/2026 à 23:30 heure de Paris (encore en heure d'été)
  assert.equal(samediDe(new Date("2026-10-24T21:30:00Z")), "2026-10-24");
  assert.equal(prochainSamedi(new Date("2026-10-24T21:30:00Z")), "2026-10-31");
  // 00:30 le dimanche 25/10 à Paris : appartient à la semaine du samedi 24
  assert.equal(samediDe(new Date("2026-10-24T22:30:00Z")), "2026-10-24");
  // Nouvel an : vendredi 01/01/2027
  assert.equal(samediDe(new Date("2027-01-01T12:00:00Z")), "2026-12-26");
  assert.equal(prochainSamedi(new Date("2027-01-01T12:00:00Z")), "2027-01-02");
});

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
import {
  hafsRubNumber,
  positionVersRepere,
  plageVersLibelle,
  plageHizbLibelle,
} from "../src/features/memo/reperes.ts";

const eleve = (over = {}) => ({
  riwaya: "hafs",
  sens: "fatiha_vers_nas",
  date_debut: "2026-01-03",
  position_origine: 0,
  position_depart: 0,
  rythme: 2,
  quota_revision: 2,
  ...over,
});

const etat = (over = {}) => ({
  position: 0,
  pointeur_rev: 0,
  cycles_faits: 0,
  ...over,
});

const saisie = (samedi, over = {}) => ({
  samedi,
  nouveau_statut: "valide",
  nouveau_atteint: null,
  recent_ok: true,
  ancien_ok: null,
  ...over,
});

const buildSessions = (e, samedis, overrides = {}) => {
  let current = etat({ position: e.position_depart });
  const sessions = [];
  for (const samedi of samedis) {
    const draft = preparerSeance(current, e, samedi);
    const seance = {
      ...draft,
      nouveau_statut: "valide",
      nouveau_atteint: null,
      recent_ok: true,
      ancien_ok: null,
      ...(overrides[samedi] ?? {}),
    };
    sessions.push(seance);
    current = appliquerSeance(current, seance, e);
  }
  return { sessions, state: current };
};

test("validé simple", () => {
  const e = eleve();
  const base = etat();
  const d = preparerSeance(base, e, "2026-01-03");
  assert.equal(d.nouveau_de, 0);
  assert.equal(d.nouveau_a, 2);
  assert.equal(d.recent_de, 0);
  assert.equal(d.ancien_de, null);
  assert.equal(d.ancien_a, null);
  const after = appliquerSeance(base, { ...d, ...saisie("2026-01-03") }, e);
  assert.equal(after.position, 2);
});

test("partiel", () => {
  const e = eleve();
  const base = etat();
  const d = preparerSeance(base, e, "2026-01-03");
  const after = appliquerSeance(
    base,
    {
      ...d,
      ...saisie("2026-01-03", {
        nouveau_statut: "partiel",
        nouveau_atteint: 1,
      }),
    },
    e
  );
  assert.equal(after.position, 1);
});

test("refaire puis validé (report)", () => {
  const e = eleve();
  const base = etat();
  const d1 = preparerSeance(base, e, "2026-01-03");
  const afterRefaire = appliquerSeance(
    base,
    { ...d1, ...saisie("2026-01-03", { nouveau_statut: "refaire" }) },
    e
  );
  assert.equal(afterRefaire.position, 0);

  const d2 = preparerSeance(afterRefaire, e, "2026-01-10");
  assert.equal(d2.nouveau_de, 0);
  assert.equal(d2.nouveau_a, 2);

  const afterValid = appliquerSeance(
    afterRefaire,
    { ...d2, ...saisie("2026-01-10") },
    e
  );
  assert.equal(afterValid.position, 2);
});

test("absent", () => {
  const e = eleve();
  const base = etat({ position: 2 });
  const d = preparerSeance(base, e, "2026-01-10");
  const after = appliquerSeance(
    base,
    { ...d, ...saisie("2026-01-10", { nouveau_statut: "absent" }) },
    e
  );
  assert.equal(after.position, 2);
});

test("début : pas de bloc ancien", () => {
  const e = eleve();
  const d = preparerSeance(etat(), e, "2026-01-03");
  assert.equal(d.recent_de, 0);
  assert.equal(d.ancien_de, null);
  assert.equal(d.ancien_a, null);
});

test("pointeur : tour complet -> cycles_faits + 1", () => {
  const e = eleve({ quota_revision: 2 });
  const { sessions, state: five } = buildSessions(e, [
    "2026-01-03",
    "2026-01-10",
    "2026-01-17",
    "2026-01-24",
    "2026-01-31",
  ]);

  assert.equal(five.position, 10);
  assert.equal(five.pointeur_rev, 0);
  assert.equal(five.cycles_faits, 0);
  assert.deepEqual(rejouer(e, sessions), five);

  const d = preparerSeance(five, e, "2026-02-07");
  assert.equal(d.recent_de, 2);
  assert.equal(d.ancien_de, 0);
  assert.equal(d.ancien_a, 2);

  const after = appliquerSeance(
    five,
    {
      ...d,
      ...saisie("2026-02-07", {
        nouveau_statut: "refaire",
        ancien_ok: true,
      }),
    },
    e
  );
  assert.equal(after.pointeur_rev, 0);
  assert.equal(after.cycles_faits, 1);
});

test("ancien non validé : pointeur fixe", () => {
  const e = eleve({ quota_revision: 2 });
  const { state: five } = buildSessions(e, [
    "2026-01-03",
    "2026-01-10",
    "2026-01-17",
    "2026-01-24",
    "2026-01-31",
  ]);
  const d = preparerSeance(five, e, "2026-02-07");
  const after = appliquerSeance(
    five,
    {
      ...d,
      ...saisie("2026-02-07", {
        nouveau_statut: "refaire",
        ancien_ok: false,
      }),
    },
    e
  );
  assert.equal(after.pointeur_rev, 0);
  assert.equal(after.cycles_faits, 0);
});

test("position finale 480 : plus de nouveau", () => {
  const e = eleve({ position_depart: 478 });
  const base = etat({ position: 478 });
  const d = preparerSeance(base, e, "2026-01-03");
  assert.equal(d.nouveau_de, 478);
  assert.equal(d.nouveau_a, 480);

  const after = appliquerSeance(base, { ...d, ...saisie("2026-01-03") }, e);
  assert.equal(after.position, 480);

  const d2 = preparerSeance(after, e, "2026-01-10");
  assert.equal(d2.nouveau_de, 480);
  assert.equal(d2.nouveau_a, 480);
  assert.equal(d2.recent_de, 472);
});

test("correction d'une séance passée -> rejouer", () => {
  const e = eleve();
  const badWeek1 = buildSessions(e, ["2026-01-03"], {
    "2026-01-03": { nouveau_statut: "refaire" },
  });
  const week2 = buildSessions(e, ["2026-01-10"]);

  const bad = [...badWeek1.sessions, ...week2.sessions];
  assert.equal(rejouer(e, bad).position, 2);

  // Correction : semaine 1 validée + bloc de la semaine 2 régénéré (2 -> 4)
  const corrected = [
    { ...badWeek1.sessions[0], nouveau_statut: "valide" },
    { ...week2.sessions[0], nouveau_de: 2, nouveau_a: 4 },
  ];
  assert.equal(rejouer(e, corrected).position, 4);
});

test("origine > 0 : zone ancienne relative à l'origine", () => {
  const e = eleve({
    position_origine: 10,
    position_depart: 24,
    rythme: 2,
    quota_revision: 2,
  });
  const base = etat({ position: 24 });
  const d = preparerSeance(base, e, "2026-01-03");

  assert.equal(d.recent_de, 16);
  assert.equal(d.recent_a, 24);
  assert.equal(d.ancien_de, 10);
  assert.equal(d.ancien_a, 12);

  const after = appliquerSeance(
    base,
    { ...d, ...saisie("2026-01-03", { nouveau_statut: "refaire", ancien_ok: true }) },
    e
  );
  assert.equal(after.pointeur_rev, 2);
});

test("origine = position : rien en révision", () => {
  const e = eleve({
    position_origine: 10,
    position_depart: 10,
    rythme: 2,
    quota_revision: 8,
  });
  const d = preparerSeance(etat({ position: 10 }), e, "2026-01-03");
  assert.equal(d.recent_de, 10);
  assert.equal(d.recent_a, 10);
  assert.equal(d.ancien_de, null);
  assert.equal(d.ancien_a, null);
});

test("tour complet de la zone avec origine > 0", () => {
  const e = eleve({
    position_origine: 10,
    position_depart: 26,
    rythme: 2,
    quota_revision: 4,
  });
  const base = etat({ position: 26 });
  const d1 = preparerSeance(base, e, "2026-01-03");
  assert.equal(d1.recent_de, 18);
  assert.equal(d1.ancien_de, 10);
  assert.equal(d1.ancien_a, 14);

  const after1 = appliquerSeance(
    base,
    { ...d1, ...saisie("2026-01-03", { nouveau_statut: "refaire", ancien_ok: true }) },
    e
  );
  assert.equal(after1.pointeur_rev, 4);
  assert.equal(after1.cycles_faits, 0);

  const d2 = preparerSeance(after1, e, "2026-01-10");
  assert.equal(d2.ancien_de, 14);
  assert.equal(d2.ancien_a, 18);

  const after2 = appliquerSeance(
    after1,
    { ...d2, ...saisie("2026-01-10", { nouveau_statut: "refaire", ancien_ok: true }) },
    e
  );
  assert.equal(after2.pointeur_rev, 0);
  assert.equal(after2.cycles_faits, 1);
});

test("sens non pris en charge refusé", () => {
  const e = { ...eleve(), sens: "nas_vers_fatiha" };
  assert.throws(
    () => preparerSeance(etat(), e, "2026-01-03"),
    /fatiha_vers_nas/
  );
  assert.throws(() => rejouer(e, []), /fatiha_vers_nas/);
});

test("absent : état strictement inchangé même si ancien_ok", () => {
  const e = eleve({ quota_revision: 2 });
  const { state: five } = buildSessions(e, [
    "2026-01-03",
    "2026-01-10",
    "2026-01-17",
    "2026-01-24",
    "2026-01-31",
  ]);
  const d = preparerSeance(five, e, "2026-02-07");
  const after = appliquerSeance(
    five,
    {
      ...d,
      ...saisie("2026-02-07", {
        nouveau_statut: "absent",
        ancien_ok: true,
      }),
    },
    e
  );
  assert.deepEqual(after, five);
});

test("rejouer : avertissement si nouveau_de incohérent", () => {
  const e = eleve();
  const { sessions } = buildSessions(e, ["2026-01-03", "2026-01-10"]);
  const incoherent = sessions.map((seance, index) =>
    index === 1 ? { ...seance, nouveau_de: 99 } : seance
  );

  const result = rejouerAvecAvertissements(e, incoherent);
  assert.equal(result.etat.position, 4);
  assert.equal(result.avertissements.length, 1);
  assert.equal(result.avertissements[0].samedi, "2026-01-10");
  assert.equal(result.avertissements[0].nouveau_de, 99);
  assert.equal(result.avertissements[0].position_attendue, 2);
  assert.equal(rejouer(e, incoherent).position, 4);
});

test("idempotence de rejouer", () => {
  const e = eleve();
  const { sessions } = buildSessions(
    e,
    ["2026-01-03", "2026-01-10", "2026-01-17", "2026-01-24"],
    {
      "2026-01-10": { nouveau_statut: "partiel", nouveau_atteint: 3 },
      "2026-01-17": { nouveau_statut: "absent" },
    }
  );
  assert.deepEqual(rejouer(e, sessions), rejouer(e, sessions));
});

test("samediDe / prochainSamedi (Europe/Paris)", () => {
  assert.equal(samediDe(new Date("2026-10-21T10:00:00Z")), "2026-10-17");
  assert.equal(
    prochainSamedi(new Date("2026-10-21T10:00:00Z")),
    "2026-10-24"
  );
  assert.equal(samediDe(new Date("2026-10-24T10:00:00Z")), "2026-10-24");
  assert.equal(
    prochainSamedi(new Date("2026-10-24T10:00:00Z")),
    "2026-10-31"
  );
  // 22:30 UTC le 21/10 = 00:30 le 22/10 à Paris (jeudi) -> samedi précédent = 17/10
  assert.equal(
    samediDe(new Date("2026-10-21T22:30:00Z")),
    "2026-10-17"
  );
});

const reperes = [
  {
    riwaya: "warsh",
    sens: "fatiha_vers_nas",
    huitieme: 0,
    sourate: 1,
    verset: 1,
    page: 1,
    exact: true,
  },
  {
    riwaya: "warsh",
    sens: "fatiha_vers_nas",
    huitieme: 1,
    sourate: 2,
    verset: 16,
    page: 4,
    exact: true,
  },
  {
    riwaya: "warsh",
    sens: "fatiha_vers_nas",
    huitieme: 2,
    sourate: 2,
    verset: 25,
    page: 5,
    exact: true,
  },
  {
    riwaya: "hafs",
    sens: "fatiha_vers_nas",
    huitieme: 1,
    sourate: 1,
    verset: 1,
    page: 1,
    exact: false,
  },
  {
    riwaya: "hafs",
    sens: "fatiha_vers_nas",
    huitieme: 2,
    sourate: 1,
    verset: 1,
    page: 1,
    exact: true,
  },
];

const surahs = [
  { number: 1, name: "Al-Fatiha", ayahCount: 7 },
  { number: 2, name: "Al-Baqara", ayahCount: 286 },
];

test("reperes : position et libellé de plage", () => {
  const repere = positionVersRepere(reperes, "warsh", "fatiha_vers_nas", 1);
  assert.equal(repere?.sourate, 2);
  assert.equal(repere?.verset, 16);

  const warsh = plageVersLibelle(
    reperes,
    "warsh",
    "fatiha_vers_nas",
    1,
    2,
    surahs
  );
  assert.equal(warsh?.label, "Al-Baqara 16 → 24");
  assert.equal(warsh?.kind, "versets");
  assert.equal(warsh?.exact, true);

  const hafs = plageVersLibelle(
    reperes,
    "hafs",
    "fatiha_vers_nas",
    1,
    2,
    surahs
  );
  assert.equal(hafs?.kind, "pages");
  assert.equal(hafs?.exact, false);
});

test("ancrage Hafs : paires exactes / impaires = position-1", () => {
  // Débuts des quarts 1-based de quran_rubs (fixture d'ancrage).
  const rubStarts = new Map([
    [1, { sourate: 1, verset: 1 }],
    [2, { sourate: 2, verset: 26 }],
    [3, { sourate: 2, verset: 44 }],
    [4, { sourate: 2, verset: 60 }],
    [5, { sourate: 2, verset: 75 }],
    [49, { sourate: 5, verset: 82 }],
    [50, { sourate: 5, verset: 97 }],
    [51, { sourate: 5, verset: 109 }],
    [52, { sourate: 6, verset: 13 }],
    [237, { sourate: 87, verset: 1 }],
    [238, { sourate: 90, verset: 1 }],
    [239, { sourate: 94, verset: 1 }],
    [240, { sourate: 100, verset: 9 }],
  ]);

  const anchors = [
    [0, 1, 1, true],
    [2, 2, 26, true],
    [4, 2, 44, true],
    [6, 2, 60, true],
    [8, 2, 75, true],
    [96, 5, 82, true],
    [98, 5, 97, true],
    [100, 5, 109, true],
    [102, 6, 13, true],
    [472, 87, 1, true],
    [474, 90, 1, true],
    [476, 94, 1, true],
    [478, 100, 9, true],
    [479, 100, 9, false],
    [480, 114, 6, true],
  ];

  for (const [position, sourate, verset, exact] of anchors) {
    if (position === 480) {
      assert.equal(sourate, 114);
      assert.equal(verset, 6);
      assert.equal(exact, true);
      continue;
    }

    const rub = hafsRubNumber(position);
    const start = rubStarts.get(rub);
    assert.ok(start, `quart ${rub} absent de la fixture pour p=${position}`);
    assert.equal(start.sourate, sourate, `p=${position} sourate`);
    assert.equal(start.verset, verset, `p=${position} verset`);
    assert.equal(
      exact,
      position === 0 || position % 2 === 0,
      `p=${position} exact`
    );
  }

  assert.equal(hafsRubNumber(478), hafsRubNumber(479));
  assert.equal(hafsRubNumber(8), 5);
});

test("reperes : libellé hizb", () => {
  assert.equal(plageHizbLibelle(91, 93), "Hizb 12, 3/8 → 5/8");
  assert.equal(plageHizbLibelle(0, 2), "Hizb 1 → 2/8");
  assert.equal(plageHizbLibelle(478, 480), "Hizb 60, 6/8 → Fin");
});

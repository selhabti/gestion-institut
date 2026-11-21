// Reprise propre Mémo V2 : AUCUN historique importé dans `seances`.
// Crée seulement `eleves_memo` (si APPLY=1) avec la position réelle fournie.
//
// Positions : POSITIONS_JSON='{"Khadija Allaoui":[2,1], ...}' (Hizb, /8)
//             ou valeur numérique directe.
//
// Usage :
//   PGURL="postgresql://..." POSITIONS_JSON='...' node scripts/memo-v2-migrate.mjs
//   PGURL="postgresql://..." POSITIONS_JSON='...' APPLY=1 node scripts/memo-v2-migrate.mjs

import { createRequire } from "node:module";
import { clampPosition, preparerSeance } from "../src/features/memo/logic.ts";
import {
  plageHizbLibelle,
  plageVersLibelle,
  positionVersRepere,
} from "../src/features/memo/reperes.ts";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const DATE_DEBUT = "2026-11-28";
const QUOTA = 8;
const SENS = "fatiha_vers_nas";

const STUDENTS = [
  { name: "Khadija Allaoui", riwaya: "hafs", rythme: 2 },
  { name: "Mohammed Bachrioui", riwaya: "hafs", rythme: 3 },
  { name: "Noureddine Bouyous", riwaya: "warsh", rythme: 2 },
  { name: "Karim DJELLALI", riwaya: "hafs", rythme: 2 },
  { name: "Mohamed Daoudi", riwaya: "warsh", rythme: 3 },
  { name: "Mohamed Wassim HALHOULI", riwaya: "hafs", rythme: 2 },
  { name: "Nadia Nachit", riwaya: "hafs", rythme: 2 },
  { name: "Hanan Oulad bouchatta", riwaya: "hafs", rythme: 2 },
  { name: "Issa Sankara", riwaya: "hafs", rythme: 2, position: 480 },
];

const hizbLabel = (position) => {
  const p = clampPosition(position);
  if (p >= 480) return "Fin (480/480)";
  return `Hizb ${Math.floor(p / 8) + 1}, ${p % 8}/8`;
};

const parsePosition = (value) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value) && value.length === 2) {
    const hizb = Number(value[0]);
    const eighth = Number(value[1]);
    if (!Number.isInteger(hizb) || !Number.isInteger(eighth)) return null;
    return clampPosition((hizb - 1) * 8 + eighth);
  }
  const n = Number(value);
  return Number.isFinite(n) ? clampPosition(n) : null;
};

const overrides = process.env.POSITIONS_JSON
  ? JSON.parse(process.env.POSITIONS_JSON)
  : {};

const missing = STUDENTS.filter(
  (student) =>
    parsePosition(
      overrides[student.name] !== undefined
        ? overrides[student.name]
        : student.position
    ) === null
);
if (missing.length > 0) {
  console.log("Positions manquantes (Hizb X, Y/8) :");
  for (const student of missing) {
    console.log(`- ${student.name} (${student.riwaya}) : ?`);
  }
  console.log(
    "\nRelance avec POSITIONS_JSON, ex. POSITIONS_JSON='{\"Issa Sankara\":[61,0]}'"
  );
  process.exit(1);
}

const surahName = (surahs, number) =>
  surahs.find((surah) => surah.number === number)?.name ?? `Sourate ${number}`;

const rangeLabel = (reperes, riwaya, de, a, surahs) =>
  plageVersLibelle(reperes, riwaya, SENS, de, a, surahs);

const showRange = (title, reperes, riwaya, de, a, surahs) => {
  if (de === null || a === null) {
    console.log(`${title} : aucun (zone vide)`);
    return;
  }
  if (de >= a) {
    console.log(`${title} : aucun (${de} → ${a})`);
    return;
  }
  const libelle = rangeLabel(reperes, riwaya, de, a, surahs);
  const approx = libelle && !libelle.exact ? " ≈" : "";
  console.log(
    `${title} : [${de}, ${a}[ → ${
      libelle ? libelle.label : "?"
    }${approx} · ${plageHizbLibelle(de, a)}`
  );
};

(async () => {
  const client = new Client({
    connectionString: process.env.PGURL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const members = await client.query(
    "select id, first_name, last_name, riwaya from public.members"
  );
  const findMember = (name) => {
    const target = name.trim().toLowerCase();
    return members.rows.find(
      (row) =>
        `${row.first_name} ${row.last_name}`.trim().toLowerCase() === target
    );
  };

  const surahRows = await client.query(
    "select number, name_en, name_translit, ayah_count from public.quran_surahs order by number"
  );
  const surahs = surahRows.rows.map((row) => ({
    number: row.number,
    name: row.name_en || row.name_translit,
    ayahCount: row.ayah_count,
  }));

  const reperesByRiwaya = {};
  for (const riwaya of ["hafs", "warsh"]) {
    const rows = await client.query(
      "select riwaya, sens, huitieme, sourate, verset, page, exact from public.reperes where riwaya=$1 and sens=$2 order by huitieme",
      [riwaya, SENS]
    );
    reperesByRiwaya[riwaya] = rows.rows;
  }

  const results = [];

  for (const student of STUDENTS) {
    const member = findMember(student.name);
    if (!member) {
      console.log(`INTROUVABLE : ${student.name}`);
      continue;
    }
    const position = parsePosition(
      overrides[student.name] !== undefined
        ? overrides[student.name]
        : student.position
    );
    const riwaya = student.riwaya;
    const reperes = reperesByRiwaya[riwaya];
    const startRepere = positionVersRepere(reperes, riwaya, SENS, position);

    const eleve = {
      riwaya,
      sens: SENS,
      date_debut: DATE_DEBUT,
      position_depart: position,
      rythme: student.rythme,
      quota_revision: QUOTA,
    };
    const bloc = preparerSeance(
      { position, pointeur_rev: 0, cycles_faits: 0 },
      eleve,
      DATE_DEBUT
    );

    console.log(`\n--- ${student.name} (${riwaya}) ---`);
    console.log(
      `Position départ = ${position} → ${hizbLabel(position)} · ${
        startRepere
          ? `${surahName(surahs, startRepere.sourate)} ${startRepere.verset} (page ${startRepere.page})`
          : "repère introuvable"
      }${startRepere && !startRepere.exact ? " ≈" : ""}`
    );
    console.log(
      `date_debut=${DATE_DEBUT} · rythme=${student.rythme} · quota=${QUOTA} · pointeur=0 · cycles=0`
    );
    showRange(
      "NOUVEAU",
      reperes,
      riwaya,
      bloc.nouveau_de,
      bloc.nouveau_a,
      surahs
    );
    showRange(
      "RÉCENT ",
      reperes,
      riwaya,
      bloc.recent_de,
      bloc.recent_a,
      surahs
    );
    showRange(
      "ANCIEN ",
      reperes,
      riwaya,
      bloc.ancien_de,
      bloc.ancien_a,
      surahs
    );

    results.push({ member, student, position, eleve, bloc });
  }

  if (process.env.APPLY === "1") {
    console.log("\n=== APPLICATION (eleves_memo uniquement, aucune seance) ===");
    await client.query("begin");
    try {
      for (const item of results) {
        await client.query(
          `
          insert into public.eleves_memo
            (eleve_id, riwaya, sens, date_debut, position_depart, rythme,
             quota_revision, position, pointeur_rev, cycles_faits, updated_at)
          values ($1,$2,$3,$4,$5,$6,$7,$8,0,0, now())
          on conflict (eleve_id) do update set
            riwaya = excluded.riwaya,
            sens = excluded.sens,
            date_debut = excluded.date_debut,
            position_depart = excluded.position_depart,
            rythme = excluded.rythme,
            quota_revision = excluded.quota_revision,
            position = excluded.position,
            pointeur_rev = 0,
            cycles_faits = 0,
            updated_at = now()
          `,
          [
            item.member.id,
            item.student.riwaya,
            SENS,
            DATE_DEBUT,
            item.position,
            item.student.rythme,
            QUOTA,
            item.position,
          ]
        );
      }
      await client.query("commit");
      console.log("APPLIQUÉ : eleves_memo créés (aucune séance).");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  } else {
    console.log("\nSIMULATION SEULE (aucune écriture). APPLY=1 pour créer eleves_memo.");
  }

  await client.end();
})().catch((error) => {
  console.error("ABORT", error.message);
  process.exit(1);
});

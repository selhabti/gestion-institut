// =============================================================================
// Fichier : e2e/memo.recette.spec.ts
// Rôle    : Test de bout en bout (Playwright) de la popup Mémo : un élève de
//           test déroule 5 samedis, et l'écran doit afficher exactement les
//           versets attendus. Les attentes ne doivent PAS être modifiées ;
//           seul e2e/helpers.ts (connexion, clics, sélecteurs) est à écrire.
// Auteur  : Saïd
// Date    : 2026-11-22
// Usage   : npx playwright test e2e/memo.recette.spec.ts
//           Toujours contre une base de TEST (branche Neon), jamais la prod.
// =============================================================================

import { test, expect, type Page } from "@playwright/test";
import {
  connexion,
  creerEleveTest,
  ouvrirSamedi,
  lireBlocs,
  saisir,
  lireCycles,
  modifierSeance,
  compterAvertissements,
  supprimerEleveTest,
  type Blocs,
} from "./helpers";

const ELEVE = {
  nom: "E2E TEST HAFS",
  riwaya: "hafs" as const,
  origine: { hizb: 1, huitieme: 0 },
  arrive: { hizb: 3, huitieme: 0 },
  rythme: "1/4" as const,   // 1/4 de hizb par semaine
  revision: "1/2" as const, // 1/2 hizb d'ancien par semaine
  dateDebut: "2027-01-02",
};

const SAMEDIS = ["2027-01-02", "2027-01-09", "2027-01-16", "2027-01-23", "2027-01-30"];

const plage = (de: string, a: string) => ({ de, a });

// Ce que l'écran doit afficher chaque samedi AVANT la saisie
const ATTENDU: Blocs[] = [
  { nouveau: plage("2:142", "2:157"), recent: plage("2:75", "2:141"), ancien: plage("1:1", "2:43") },
  { nouveau: plage("2:158", "2:176"), recent: plage("2:92", "2:157"), ancien: plage("2:44", "2:74") },
  { nouveau: plage("2:158", "2:176"), recent: plage("2:92", "2:157"), ancien: plage("2:75", "2:91") },
  { nouveau: plage("2:158", "2:176"), recent: plage("2:92", "2:157"), ancien: plage("2:75", "2:91") },
  { nouveau: plage("2:177", "2:188"), recent: plage("2:106", "2:176"), ancien: plage("1:1", "2:43") },
];

// Ce que le prof saisit chaque samedi (le 5e samedi n'est pas saisi)
const SAISIES = [
  { nouveau: "valide" as const, recent: true, ancien: true },
  { nouveau: "refaire" as const, recent: true, ancien: true },
  { nouveau: "absent" as const },
  { nouveau: "valide" as const, recent: true, ancien: true },
];

// Nombre de cycles de révision affiché AVANT la saisie de chaque samedi
const CYCLES_ATTENDUS = [0, 0, 0, 0, 1];

test.describe.serial("Popup Mémo : 5 samedis d'un élève de test", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await connexion(page);
    await supprimerEleveTest(page, ELEVE.nom); // reste d'un run précédent éventuel
    await creerEleveTest(page, ELEVE);
  });

  test.afterAll(async () => {
    await supprimerEleveTest(page, ELEVE.nom);
    await page.close();
  });

  for (let i = 0; i < SAMEDIS.length; i++) {
    test(`samedi ${i + 1} (${SAMEDIS[i]})`, async () => {
      await ouvrirSamedi(page, ELEVE.nom, SAMEDIS[i]);
      expect(await lireBlocs(page), `blocs affichés le samedi ${i + 1}`).toEqual(ATTENDU[i]);
      expect(await lireCycles(page), `cycles affichés le samedi ${i + 1}`).toBe(CYCLES_ATTENDUS[i]);
      if (SAISIES[i]) await saisir(page, SAISIES[i]);
    });
  }

  test("absent : récent et ancien ne sont pas saisissables", async () => {
    await ouvrirSamedi(page, ELEVE.nom, SAMEDIS[2]);
    const blocs = await lireBlocs(page);
    expect(blocs.ancien).toEqual(ATTENDU[2].ancien);
    await expect(page.getByTestId("bloc-ancien").getByTestId("btn-ok")).toBeDisabled();
    await expect(page.getByTestId("bloc-recent").getByTestId("btn-ok")).toBeDisabled();
  });

  test("correction du samedi 2 : recalcul ou avertissement visible", async () => {
    await modifierSeance(page, ELEVE.nom, SAMEDIS[1], { nouveau: "valide", recent: true, ancien: true });
    await ouvrirSamedi(page, ELEVE.nom, SAMEDIS[4]);
    const blocs = await lireBlocs(page);
    const recalcule = blocs.nouveau?.de !== ATTENDU[4].nouveau?.de;
    const avertissements = await compterAvertissements(page, ELEVE.nom);
    expect(recalcule || avertissements > 0, "la correction doit se voir : séances recalculées ou avertissement").toBe(true);
  });
});

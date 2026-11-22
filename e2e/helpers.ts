import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Locator, Page } from "@playwright/test";

export type Plage = { de: string; a: string } | null;
export type Blocs = { nouveau: Plage; recent: Plage; ancien: Plage };
export type Saisie = { nouveau: "valide" | "partiel" | "refaire" | "absent"; atteint?: { hizb: number; huitieme: number }; recent?: boolean; ancien?: boolean };

type Profil = {
  nom: string;
  riwaya: "hafs" | "warsh";
  origine: { hizb: number; huitieme: number };
  arrive: { hizb: number; huitieme: number };
  rythme: "1/8" | "1/4" | "1/2" | "1";
  revision: "1/8" | "1/4" | "1/2" | "1";
  dateDebut: string;
};

let envCharge = false;

const chargerEnvE2e = (): void => {
  if (envCharge) return;
  envCharge = true;
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.e2e"), "utf8");
    for (const ligne of raw.split(/\r?\n/)) {
      const trimmed = ligne.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index <= 0) continue;
      const cle = trimmed.slice(0, index).trim();
      let valeur = trimmed.slice(index + 1).trim();
      if (
        (valeur.startsWith('"') && valeur.endsWith('"')) ||
        (valeur.startsWith("'") && valeur.endsWith("'"))
      ) {
        valeur = valeur.slice(1, -1);
      }
      if (process.env[cle] === undefined) process.env[cle] = valeur;
    }
  } catch {
    // .env.e2e absent : le garde-fou ci-dessous s'arrête avec un message clair.
  }
};

chargerEnvE2e();

const BASE_URL = (process.env.E2E_BASE_URL ?? "http://localhost:5173").replace(
  /\/+$/,
  ""
);
const INSTITUT = "attanzil";
const PROD_HOSTS = ["ep-silent-shape-zazgas36", "ep-raspy-meadow-za2q1s4p"];

const url = (chemin: string): string =>
  `${BASE_URL}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;

const sansSecret = (valeur: string): string =>
  valeur.replace(/:\/\/([^:@/]+):[^@/]+@/, "://$1:***@");

const gardeFouBaseTest = (): void => {
  chargerEnvE2e();
  const branche = (process.env.E2E_DB_BRANCH ?? "").trim();
  if (!branche) {
    throw new Error(
      "Garde-fou base de TEST : E2E_DB_BRANCH est absent. Renseigne .env.e2e avec la branche Neon e2e (jamais la prod)."
    );
  }

  const sources = [
    ["E2E_DB_URL", process.env.E2E_DB_URL],
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["VITE_INSTITUT_ATTANZIL_DATA_API_URL", process.env.VITE_INSTITUT_ATTANZIL_DATA_API_URL],
    ["VITE_INSTITUT_ATTANZIL_AUTH_URL", process.env.VITE_INSTITUT_ATTANZIL_AUTH_URL],
    ["VITE_INSTITUT_ZAYED_DATA_API_URL", process.env.VITE_INSTITUT_ZAYED_DATA_API_URL],
    ["VITE_INSTITUT_ZAYED_AUTH_URL", process.env.VITE_INSTITUT_ZAYED_AUTH_URL],
  ] as const;

  const urls = sources
    .map(([nom, valeur]) => ({ nom, valeur: (valeur ?? "").trim() }))
    .filter(({ valeur }) => Boolean(valeur));

  if (urls.length === 0) {
    throw new Error(
      "Garde-fou base de TEST : aucune URL de base/API (E2E_DB_URL, DATABASE_URL ou VITE_INSTITUT_*_DATA_API_URL/AUTH_URL) n'est configurée dans .env.e2e."
    );
  }

  const urlProd = urls.find(({ valeur }) =>
    PROD_HOSTS.some((host) => valeur.includes(host))
  );
  if (urlProd) {
    throw new Error(
      `Garde-fou base de TEST : ${urlProd.nom} pointe vers un endpoint de production (${sansSecret(urlProd.valeur)}). Utilise la branche Neon e2e.`
    );
  }

  const endpoint = (process.env.E2E_BRANCH_ENDPOINT ?? "").trim();
  const marqueur = endpoint || branche;
  const horsBranche = urls.filter(({ valeur }) => !valeur.includes(marqueur));
  if (horsBranche.length > 0) {
    throw new Error(
      `Garde-fou base de TEST : l'identifiant "${marqueur}" est absent de ${horsBranche
        .map(({ nom }) => nom)
        .join(", ")}. Neon n'expose pas l'ID br-... dans les URLs ep-... : ajoute E2E_BRANCH_ENDPOINT=<host ep-... de la branche e2e> dans .env.e2e (ou mets l'endpoint dans E2E_DB_BRANCH), avec les URLs Auth/Data API de cette branche.`
    );
  }

  const email = (process.env.E2E_EMAIL ?? "").trim();
  const password = process.env.E2E_PASSWORD ?? "";
  if (!email || !password) {
    throw new Error(
      "Garde-fou base de TEST : E2E_EMAIL et E2E_PASSWORD doivent être fournis (variables d'environnement, jamais dans le code)."
    );
  }
};

const allerOnglet = async (
  p: Page,
  nom: "Élèves" | "Présences"
): Promise<void> => {
  const onglet = p.getByRole("tab", { name: nom });
  await onglet.waitFor({ state: "visible", timeout: 30_000 });
  await onglet.click();
  await p.waitForTimeout(150);
};

const filtrerMembre = async (p: Page, nom: string): Promise<void> => {
  await allerOnglet(p, "Élèves");
  const toutEffacer = p.getByRole("button", { name: "Tout effacer" });
  if (await toutEffacer.isVisible().catch(() => false)) {
    await toutEffacer.click();
  }
  const chargement = p.getByText("Chargement de la liste...");
  await chargement.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
  const recherche = p.locator("#tag-search");
  await recherche.waitFor({ state: "visible", timeout: 30_000 });
  await recherche.fill(nom);
  await recherche.press("Enter");
  await p
    .getByText(/\d+ résultat\(s\) trouvé\(s\)/)
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => {});
  await p.waitForTimeout(500);
};

const lignePresence = (p: Page, nom: string): Locator =>
  p
    .getByRole("row")
    .filter({ hasText: nom })
    .filter({ has: p.getByTitle("Mémorisation") });

const ligneGestion = (p: Page, nom: string): Locator =>
  p
    .getByRole("row")
    .filter({ hasText: nom })
    .filter({ has: p.getByTitle("Supprimer l'élève") });

const fermerAide = async (p: Page): Promise<void> => {
  await p.waitForTimeout(300);
  const aide = p.getByText("Aide — suivi de mémorisation", { exact: true });
  if (await aide.isVisible().catch(() => false)) {
    const fermer = p.getByRole("button", { name: "Fermer", exact: true });
    if (await fermer.isVisible().catch(() => false)) {
      await fermer.click();
    } else {
      await p.keyboard.press("Escape");
    }
    await aide.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
  }
};

const ouvrirMemoMembre = async (p: Page, nom: string): Promise<void> => {
  await filtrerMembre(p, nom);
  await allerOnglet(p, "Présences");

  let ligne = lignePresence(p, nom);
  if ((await ligne.count()) === 0) {
    await p.waitForTimeout(500);
    ligne = lignePresence(p, nom);
  }
  if ((await ligne.count()) === 0) {
    throw new Error(
      `Élève "${nom}" introuvable dans le tableau des présences (groupe Samedi/Mercredi).`
    );
  }

  await ligne.first().getByTitle("Mémorisation").click();
  await fermerAide(p);

  await p
    .getByRole("button", { name: /Démarrer le suivi/ })
    .or(p.getByRole("tab", { name: "Samedi" }))
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
};

const attendreBlocs = async (p: Page): Promise<void> => {
  const nouveau = p.getByTestId("bloc-nouveau");
  try {
    await nouveau.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    const preparer = p.getByRole("button", { name: "Préparer" });
    if (await preparer.isVisible().catch(() => false)) {
      await preparer.click();
    }
    await nouveau.waitFor({ state: "visible", timeout: 15_000 });
  }
  await p.getByTestId("bloc-recent").waitFor({ state: "visible", timeout: 15_000 });
  await p.getByTestId("bloc-ancien").waitFor({ state: "visible", timeout: 15_000 });
};

const remplirPosition = async (
  p: Page,
  titre: string,
  position: { hizb: number; huitieme: number }
): Promise<void> => {
  const label = p.getByText(titre, { exact: true }).first();
  await label.waitFor({ state: "visible", timeout: 30_000 });
  const champ = label.locator("..");
  const hizb = champ.getByRole("spinbutton", { name: "Hizb" });
  await hizb.fill(String(position.hizb));
  const huitieme = champ.getByRole("combobox");
  await huitieme.click();
  await p
    .getByRole("option", { name: `${position.huitieme}/8`, exact: true })
    .click();
};

const choisirSelect = async (
  p: Page,
  labelTexte: string,
  optionTexte: string
): Promise<void> => {
  const label = p.getByText(labelTexte, { exact: true }).first();
  await label.waitFor({ state: "visible", timeout: 30_000 });
  await label.locator("..").getByRole("combobox").click();
  await p.getByRole("option", { name: optionTexte, exact: true }).click();
};

const LABELS_RYTHME: Record<Profil["rythme"], string> = {
  "1/8": "1/8 de hizb par semaine",
  "1/4": "1/4 de hizb par semaine",
  "1/2": "1/2 hizb par semaine",
  "1": "1 hizb par semaine",
};

const LABELS_REVISION: Record<Profil["revision"], string> = {
  "1/8": "1/8 de hizb d'ancien",
  "1/4": "1/4 de hizb d'ancien",
  "1/2": "1/2 hizb d'ancien",
  "1": "1 hizb d'ancien",
};

export async function connexion(p: Page): Promise<void> {
  gardeFouBaseTest();
  const email = (process.env.E2E_EMAIL ?? "").trim();
  const password = process.env.E2E_PASSWORD ?? "";

  await p.goto(url(`/${INSTITUT}/auth`), { waitUntil: "domcontentloaded" });

  const emailInput = p.getByLabel("Email");
  if (!(await emailInput.isVisible().catch(() => false))) {
    const attanzil = p.getByText("Institut Attanzil", { exact: true });
    if (await attanzil.isVisible().catch(() => false)) {
      await attanzil.click();
    }
  }

  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Mot de passe").fill(password);
  await p.getByRole("button", { name: "Se connecter" }).click();

  try {
    await p
      .getByRole("tab", { name: "Élèves" })
      .waitFor({ state: "visible", timeout: 30_000 });
  } catch {
    throw new Error(
      "Connexion E2E impossible : vérifie E2E_EMAIL/E2E_PASSWORD et la configuration de la branche e2e."
    );
  }
}

export async function creerEleveTest(
  p: Page,
  e: {
    nom: string;
    riwaya: "hafs" | "warsh";
    origine: { hizb: number; huitieme: number };
    arrive: { hizb: number; huitieme: number };
    rythme: "1/8" | "1/4" | "1/2" | "1";
    revision: "1/8" | "1/4" | "1/2" | "1";
    dateDebut: string;
  }
): Promise<void> {
  gardeFouBaseTest();
  const nom = e.nom.trim();

  await p.goto(url(`/${INSTITUT}/dashboard`), {
    waitUntil: "domcontentloaded",
  });
  let ajoute = false;
  for (let essai = 0; essai < 3 && !ajoute; essai += 1) {
    await allerOnglet(p, "Élèves");
    const formulaire = p
      .locator("form")
      .filter({ has: p.getByPlaceholder("Nom de famille") })
      .first();
    await formulaire
      .getByPlaceholder("Prénom", { exact: true })
      .fill("Test");
    await formulaire.getByPlaceholder("Nom de famille").fill(nom);
    await formulaire.getByPlaceholder("Ville de résidence").fill("Test");
    await formulaire
      .getByPlaceholder("Numéro de téléphone")
      .fill("0600000000");

    const mercredi = formulaire.getByText("La méthode Nouraniya", {
      exact: true,
    });
    if (await mercredi.isVisible().catch(() => false)) {
      await mercredi.click();
    }

    await p.waitForTimeout(1_000);
    const exact = formulaire.getByText("Élève déjà existant détecté");
    if (await exact.isVisible().catch(() => false)) {
      await supprimerEleveTest(p, nom);
      continue;
    }

    await formulaire.locator('button[type="submit"]').click();
    try {
      await p
        .getByText("Élève ajouté avec succès !", { exact: true })
        .waitFor({ state: "visible", timeout: 30_000 });
      ajoute = true;
    } catch {
      await supprimerEleveTest(p, nom).catch(() => {});
    }
  }

  if (!ajoute) {
    throw new Error(
      `Impossible de créer l'élève "${nom}" (reste/doublon après nettoyage).`
    );
  }

  await ouvrirMemoMembre(p, nom);

  const demarrer = p.getByRole("button", { name: /Démarrer le suivi/ });
  await demarrer.waitFor({ state: "visible", timeout: 30_000 });
  await remplirPosition(p, "A commencé à", e.origine);
  await remplirPosition(p, "Est arrivé à", e.arrive);

  const dateDebut = p.locator('input[type="date"]:visible').first();
  await dateDebut.fill(e.dateDebut);
  await choisirSelect(p, "Rythme", LABELS_RYTHME[e.rythme]);
  await choisirSelect(
    p,
    "Quota de révision (ancien)",
    LABELS_REVISION[e.revision]
  );

  await demarrer.click();
  await p
    .getByRole("tab", { name: "Samedi" })
    .waitFor({ state: "visible", timeout: 30_000 });

  await p.keyboard.press("Escape");
  await p
    .getByRole("tab", { name: "Samedi" })
    .waitFor({ state: "hidden", timeout: 5_000 })
    .catch(() => {});
}

export async function ouvrirSamedi(
  p: Page,
  n: string,
  d: string
): Promise<void> {
  gardeFouBaseTest();
  const dejaOuvert = await p
    .getByRole("tab", { name: "Samedi" })
    .isVisible()
    .catch(() => false);

  if (!dejaOuvert) {
    await ouvrirMemoMembre(p, n);
  }

  const samedi = p.getByRole("tab", { name: "Samedi" });
  await samedi.waitFor({ state: "visible", timeout: 30_000 });
  await samedi.click();

  const dateInput = p.locator('input[type="date"]:visible').first();
  await dateInput.waitFor({ state: "visible", timeout: 30_000 });
  await dateInput.fill(d);
  await attendreBlocs(p);
}

export async function lireBlocs(p: Page): Promise<Blocs> {
  const lire = async (id: string): Promise<Plage> => {
    const carte = p.getByTestId(id);
    await carte.waitFor({ state: "visible", timeout: 30_000 });
    const de = await carte.getAttribute("data-de");
    const a = await carte.getAttribute("data-a");
    return de && a ? { de, a } : null;
  };

  return {
    nouveau: await lire("bloc-nouveau"),
    recent: await lire("bloc-recent"),
    ancien: await lire("bloc-ancien"),
  };
}

export async function saisir(p: Page, s: Saisie): Promise<void> {
  await p.getByTestId(`btn-${s.nouveau}`).click();

  if (s.nouveau === "partiel" && s.atteint) {
    const combo = p.getByTestId("bloc-nouveau").getByRole("combobox");
    await combo.click();
    const cible = new RegExp(
      `Hizb ${s.atteint.hizb}, ${s.atteint.huitieme}/8`
    );
    await p.getByRole("option", { name: cible }).click();
  }

  if (s.recent !== undefined) {
    await p
      .getByTestId("bloc-recent")
      .getByTestId(s.recent ? "btn-ok" : "btn-ko")
      .click();
  }
  if (s.ancien !== undefined) {
    await p
      .getByTestId("bloc-ancien")
      .getByTestId(s.ancien ? "btn-ok" : "btn-ko")
      .click();
  }

  await p.getByTestId("btn-enregistrer").click();

  const succes = p
    .getByText("Séance enregistrée", { exact: true })
    .last();
  const echec = p
    .getByText("Impossible d'enregistrer la séance", { exact: true })
    .last();
  try {
    await succes.waitFor({ state: "visible", timeout: 30_000 });
  } catch {
    if (await echec.isVisible().catch(() => false)) {
      throw new Error("L'enregistrement de la séance a échoué.");
    }
    throw new Error(
      "Aucune confirmation d'enregistrement de la séance n'est apparue."
    );
  }

  await p.waitForFunction(
    () => {
      const bouton = document.querySelector(
        '[data-testid="btn-enregistrer"]'
      ) as HTMLButtonElement | null;
      return Boolean(bouton && !bouton.disabled);
    },
    undefined,
    { timeout: 30_000 }
  );
}

export async function lireCycles(p: Page): Promise<number> {
  const cycle = p.getByTestId("cycle");
  await cycle.waitFor({ state: "visible", timeout: 30_000 });
  const valeur = await cycle.getAttribute("data-cycles");
  return Number(valeur ?? "0");
}

export async function modifierSeance(
  p: Page,
  n: string,
  d: string,
  s: Saisie
): Promise<void> {
  await ouvrirSamedi(p, n, d);
  await saisir(p, s);
}

export async function compterAvertissements(
  p: Page,
  n: string
): Promise<number> {
  const historique = p.getByRole("tab", { name: "Historique" });
  if (!(await historique.isVisible().catch(() => false))) {
    await ouvrirMemoMembre(p, n);
  }
  await p.getByRole("tab", { name: "Historique" }).click();
  await p
    .getByTestId("avertissement")
    .first()
    .waitFor({ state: "visible", timeout: 5_000 })
    .catch(() => {});
  return p.getByTestId("avertissement").count();
}

export async function supprimerEleveTest(p: Page, n: string): Promise<void> {
  gardeFouBaseTest();
  await p
    .goto(url(`/${INSTITUT}/dashboard`), { waitUntil: "domcontentloaded" })
    .catch(() => {});

  const eleves = p.getByRole("tab", { name: "Élèves" });
  await eleves
    .waitFor({ state: "visible", timeout: 30_000 })
    .catch(() => {});
  if (!(await eleves.isVisible().catch(() => false))) {
    return;
  }

  await filtrerMembre(p, n);

  const gestionAvant = ligneGestion(p, n);
  await gestionAvant
    .first()
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => {});
  if ((await gestionAvant.count()) === 0) return;

  await allerOnglet(p, "Présences");
  const presence = lignePresence(p, n);
  await presence
    .first()
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => {});
  if ((await presence.count()) > 0) {
    await presence.first().getByTitle("Mémorisation").click();
    await fermerAide(p);

    const reglages = p.getByRole("tab", { name: "Réglages" });
    const aReglages = await reglages.isVisible().catch(() => false);
    if (aReglages) {
      await reglages.click();
      p.once("dialog", (dialog) => dialog.accept());
      await p.getByRole("button", { name: "Supprimer le suivi" }).click();
      await p
        .getByText("Suivi de mémorisation supprimé", { exact: true })
        .waitFor({ state: "visible", timeout: 15_000 })
        .catch(() => {});
    }

    await p.keyboard.press("Escape");
    await p
      .getByRole("tab", { name: "Samedi" })
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  await filtrerMembre(p, n);
  const gestion = ligneGestion(p, n);
  await gestion
    .first()
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => {});
  if ((await gestion.count()) === 0) return;

  await gestion.first().getByTitle("Supprimer l'élève").click();
  await p.getByPlaceholder('Tapez "supprimer"').fill("supprimer");
  await p.getByRole("button", { name: "Supprimer définitivement" }).click();
  await p
    .getByText("Membre supprimé", { exact: true })
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => {});
}

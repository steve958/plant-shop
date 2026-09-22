import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const dryRun = process.argv.includes('--dry-run');
const ZASTITA = 'Zaštita bilja';

// Raspodela proizvoda iz „Bašta i domaćinstvo" (Garden oprema i alati)
// u nove podkategorije zaštite bilja. Proizvodi koji nisu navedeni ostaju gde jesu.
const MAPPING = [
  // Rodenticidi
  { id: 'XPjczILbIE3Qhy3MqGoE', name: 'Lepak za miševe', subcategory: 'Rodenticidi' },
  { id: 'hOwE9asunAFWSg9WlPFu', name: 'Ratimor crveni meki mamak za miševe', subcategory: 'Rodenticidi' },
  { id: 'q8A0j4FdDjQlOJFfrzgV', name: 'Ratimor plavi meki mamak za miševe i pacove', subcategory: 'Rodenticidi' },
  { id: 'sUhM361geNsLTKksRQN2', name: 'Ratimor crveni meki mamak za profesionalnu upotrebu', subcategory: 'Rodenticidi' },
  { id: 'urdgQE8xelqs8D2Xa5Un', name: 'Mišolovka trajni mamak SuperCat', subcategory: 'Rodenticidi' },
  { id: 'wfSLctKAO4Po38P48Ndn', name: 'Rattus pelete', subcategory: 'Rodenticidi' },
  // Komunalna higijena
  { id: '566jndfzMCOS7MkGdmL6', name: 'Renfield 10WP', subcategory: 'Komunalna higijena' },
  { id: '8X8KGYoZkyqvP2L6xj1l', name: 'Sprej protiv gmižućih insekata', subcategory: 'Komunalna higijena' },
  { id: 'Rh7WYXUi7Blez4jqaYmv', name: 'Sprej protiv gmižućih insekata', subcategory: 'Komunalna higijena' },
  { id: 'AIZxUkTMFbtzGxonsIRF', name: 'Klopka za kuhinjske moljce sa feromonom', subcategory: 'Komunalna higijena' },
  { id: 'BtP1WUqN6F6fAxq2EXtL', name: 'Sprej protiv letećih insekata - lavanda', subcategory: 'Komunalna higijena' },
  { id: 'FxC3GfUsZcT4UgPMRGpZ', name: 'Pan kreda protiv mrava', subcategory: 'Komunalna higijena' },
  { id: 'Gs8g2r8mZNPBcYdH82yQ', name: 'Panstop za bubašvabe', subcategory: 'Komunalna higijena' },
  { id: 'JIlRuYgsbvCmZiYevYqd', name: 'Gel za mrave', subcategory: 'Komunalna higijena' },
  { id: 'KtuW7jgtWMZji39u2VxD', name: 'Sprej cimici protiv smrdljivih buba martina', subcategory: 'Komunalna higijena' },
  { id: 'L6HssTNsISGRDyk8xib1', name: 'Sprej čuvar garderobe - lavanda kamfor', subcategory: 'Komunalna higijena' },
  { id: 'PYpYxi9rqeVDJFUkq6tG', name: 'Agita wg 10 za muve', subcategory: 'Komunalna higijena' },
  { id: 'RLbM6o6D5xYLxhoG2d16', name: 'Gel za bubašvabe i mrave u kući', subcategory: 'Komunalna higijena' },
  { id: 'yabeU9wkU6EEy7dFHE8e', name: 'Gel za bubašvabe i mrave trostruki udar u špricu', subcategory: 'Komunalna higijena' },
  { id: 'uK8dhFLglgeVsY6ZnYdo', name: 'Sprej protiv paukova Magnatela', subcategory: 'Komunalna higijena' },
  { id: 'sw5kp5iYyLSslcsVJZFs', name: 'Grom za muve', subcategory: 'Komunalna higijena' },
  { id: 'x2O51zrtlUM6ALJd48eW', name: 'Muholovka lepljiva traka za muve', subcategory: 'Komunalna higijena' },
  { id: 'sBmX0iUNtaWE2fxBn6O7', name: 'Kaustična soda', subcategory: 'Komunalna higijena' },
  // Pomoćna sredstva
  { id: '6xWnDdVzUOHnjhu0mggK', name: 'Kudeljni kanap 2,5', subcategory: 'Pomoćna sredstva' },
  { id: 'sojFYHCJzbzZYVAf0UEW', name: 'Kanap od jute kudeljni 2,5/2 tanji', subcategory: 'Pomoćna sredstva' },
  { id: 'AklW35yWK9YqsTmA6VGB', name: 'Čep za stakleni balon', subcategory: 'Pomoćna sredstva' },
  { id: 'NfD5H3AWpwOqCGPGI3CJ', name: 'Konusni plutani čep', subcategory: 'Pomoćna sredstva' },
  { id: 'N8W61ydVirQm3wHf4vh7', name: 'Stakleni balon sa čepom 10L', subcategory: 'Pomoćna sredstva' },
  { id: 'NSKYSzf86JYlrVNRhvkB', name: 'Klin za agrotekstil 18cm', subcategory: 'Pomoćna sredstva' },
  { id: 'pbUAuNjH5ZwgkmvUHVrF', name: 'Klin za agrotekstil od nerđajućeg čelika 3x15cmx3mm', subcategory: 'Pomoćna sredstva' },
  { id: 'iFyn4OV8fQugEfg9Ch7y', name: 'Traka za vezivanje 30m sa nožićem', subcategory: 'Pomoćna sredstva' },
  { id: 'k1sEfri4HrYg9okDXVPt', name: 'Metla sirkova mala', subcategory: 'Pomoćna sredstva' },
  { id: 'mWCNoYSxNU5OP0ib8lqy', name: 'Metla sirkova', subcategory: 'Pomoćna sredstva' },
];

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const resolveProjectId = async () => {
  if (process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT) {
    return process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  }
  try {
    const firebaseRc = JSON.parse(await readFile(resolve(repositoryRoot, '.firebaserc'), 'utf8'));
    return Object.values(firebaseRc.projects || {})[0];
  } catch {
    return undefined;
  }
};

const projectId = await resolveProjectId();
if (!projectId) {
  throw new Error('Set FIREBASE_PROJECT_ID before running. See FIREBASE_SETUP.md.');
}

const resolveCredentialsPath = async () => {
  const candidates = [];
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) candidates.push(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const files = await readdir(repositoryRoot);
  const local = files.find((file) => /firebase-adminsdk.*\.json$/i.test(file));
  if (local) candidates.push(resolve(repositoryRoot, local));
  for (const candidate of candidates) {
    try {
      const serviceAccount = JSON.parse(await readFile(candidate, 'utf8'));
      if (serviceAccount.type === 'service_account' && serviceAccount.project_id === projectId) return candidate;
    } catch { /* try the next candidate */ }
  }
  return undefined;
};

const credentialsPath = await resolveCredentialsPath();
if (!credentialsPath) {
  throw new Error(`Nije pronađen servisni nalog za projekat ${projectId}. Postavite GOOGLE_APPLICATION_CREDENTIALS na odgovarajući JSON fajl.`);
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

const app = initializeApp({ credential: applicationDefault(), projectId });
const database = getFirestore(app);

const updates = [];
let skipped = 0;
for (const entry of MAPPING) {
  const document = await database.collection('products').doc(entry.id).get();
  if (!document.exists) {
    console.log(`[preskočeno] ${entry.id}: dokument ne postoji (${entry.name})`);
    skipped += 1;
    continue;
  }
  const currentName = document.get('name');
  const currentCategory = document.get('category');
  const currentSubcategory = document.get('subcategory');
  if (currentName !== entry.name) {
    console.log(`[preskočeno] ${entry.id}: ime u bazi je „${currentName}", očekivano „${entry.name}"`);
    skipped += 1;
    continue;
  }
  if (currentCategory === ZASTITA && currentSubcategory === entry.subcategory) {
    console.log(`[već raspoređen] ${entry.name}`);
    skipped += 1;
    continue;
  }
  updates.push({ ref: document.ref, entry, from: `${currentCategory} / ${currentSubcategory}` });
}

for (const { entry, from } of updates) {
  console.log(`[${dryRun ? 'dry-run' : 'premeštanje'}] ${entry.name}: ${from}  →  ${ZASTITA} / ${entry.subcategory}`);
}

const remaining = await database.collection('products').where('subcategory', '==', 'Bašta i domaćinstvo').get();
const mappedIds = new Set(MAPPING.map((entry) => entry.id));
const staying = remaining.docs.filter((document) => !mappedIds.has(document.id));
if (staying.length > 0) {
  console.log('\nOstaju u „Bašta i domaćinstvo":');
  staying.forEach((document) => console.log(`  - ${document.get('name')}`));
}

if (dryRun) {
  console.log(`\nSuvo pokretanje — baza nije izmenjena. Za premeštanje: ${updates.length}, preskočeno: ${skipped}.`);
  process.exit(0);
}

if (updates.length > 0) {
  const batch = database.batch();
  updates.forEach(({ ref, entry }) => batch.update(ref, { category: ZASTITA, subcategory: entry.subcategory }));
  await batch.commit();
}
console.log(`\nGotovo. Premešteno: ${updates.length}, preskočeno: ${skipped}.`);

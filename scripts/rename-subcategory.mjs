import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const OLD_SUBCATEGORY = 'Baštenski nameštaj';
const NEW_SUBCATEGORY = 'Bašta i domaćinstvo';
const dryRun = process.argv.includes('--dry-run');

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

const projectId = await resolveProjectId();
if (!projectId) {
  throw new Error('Set FIREBASE_PROJECT_ID before running. See FIREBASE_SETUP.md.');
}

const credentialsPath = await resolveCredentialsPath();
if (!credentialsPath) {
  throw new Error(`Nije pronađen servisni nalog za projekat ${projectId}. Postavite GOOGLE_APPLICATION_CREDENTIALS na odgovarajući JSON fajl.`);
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

const app = initializeApp({ credential: applicationDefault(), projectId });
const database = getFirestore(app);

const snapshot = await database.collection('products').where('subcategory', '==', OLD_SUBCATEGORY).get();
console.log(`Pronađeno proizvoda sa podkategorijom „${OLD_SUBCATEGORY}": ${snapshot.size}`);

if (snapshot.empty) process.exit(0);

if (dryRun) {
  snapshot.forEach((document) => console.log(`[dry-run] ${document.id}: ${document.get('name')}`));
  console.log('Suvo pokretanje — baza nije izmenjena.');
  process.exit(0);
}

const batch = database.batch();
snapshot.forEach((document) => batch.update(document.ref, { subcategory: NEW_SUBCATEGORY }));
await batch.commit();
console.log(`Preimenovano u „${NEW_SUBCATEGORY}": ${snapshot.size} proizvoda.`);

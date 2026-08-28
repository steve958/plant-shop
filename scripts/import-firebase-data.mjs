import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const plantCentarRoot = resolve(process.env.PLANT_CENTAR_PATH || resolve(repositoryRoot, '..', 'plant-centar'));
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
const dryRun = process.argv.includes('--dry-run');
const storageCheckOnly = process.argv.includes('--check-storage');

if (!projectId || !storageBucket) {
  throw new Error('Set FIREBASE_PROJECT_ID and FIREBASE_STORAGE_BUCKET before importing. See FIREBASE_SETUP.md.');
}

if (!dryRun) {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to the full path of the plant-shop service-account JSON file.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(await readFile(credentialsPath, 'utf8'));
  } catch (error) {
    const code = error?.code || 'invalid-json';
    throw new Error(`Cannot read GOOGLE_APPLICATION_CREDENTIALS file: ${credentialsPath} (${code}).`, { cause: error });
  }

  if (serviceAccount.type !== 'service_account') {
    throw new Error(`GOOGLE_APPLICATION_CREDENTIALS is not a Firebase service-account JSON file: ${credentialsPath}`);
  }
  if (serviceAccount.project_id !== projectId) {
    throw new Error(
      `Service-account project mismatch: credentials belong to ${serviceAccount.project_id}, but FIREBASE_PROJECT_ID is ${projectId}.`,
    );
  }
}

const app = initializeApp({ credential: applicationDefault(), projectId, storageBucket });
const database = getFirestore(app);
const bucket = getStorage(app).bucket();

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const products = await readJson(resolve(repositoryRoot, 'migration', 'legacy-export', 'products.json'));
const news = await readJson(resolve(repositoryRoot, 'migration', 'current-news.seed.json'));
const categorySources = await readJson(resolve(repositoryRoot, 'migration', 'category-image-sources.json'));

const fetchImage = async (url) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return null;
    return { buffer: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') };
  } catch { return null; }
};

const uploadBuffer = async (path, buffer, contentType) => {
  const token = randomUUID();
  const file = bucket.file(path);
  // HashStreamValidator in @google-cloud/storage can destroy its stream before
  // surfacing the actual response on some Windows/corporate-network setups.
  // Firebase/GCS still validates the authenticated HTTPS upload server-side;
  // disabling the client checksum avoids that opaque stream failure.
  await file.save(buffer, {
    resumable: false,
    validation: false,
    contentType,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
};

const categoryImageUrls = new Map();
const ensureCategoryImage = async (category) => {
  if (categoryImageUrls.has(category)) return categoryImageUrls.get(category);
  const source = categorySources[category] || categorySources['Garden oprema i alati'];
  const image = await fetchImage(source.url);
  if (!image) throw new Error(`Unable to download category fallback for ${category}: ${source.url}`);
  const extension = image.contentType.includes('png') ? '.png' : '.jpg';
  const url = await uploadBuffer(`migration/category-fallbacks/${category.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}${extension}`, image.buffer, image.contentType);
  categoryImageUrls.set(category, url);
  return url;
};

const migrateProductImages = async (product) => {
  const migrated = [];
  for (const [index, sourceUrl] of (product.images || []).entries()) {
    const image = await fetchImage(sourceUrl);
    if (!image) continue;
    const extension = extname(new URL(sourceUrl).pathname) || (image.contentType.includes('png') ? '.png' : '.jpg');
    migrated.push(await uploadBuffer(`images/${product.productId}-${index}${extension.slice(0, 5)}`, image.buffer, image.contentType));
  }
  return migrated.length ? migrated : [await ensureCategoryImage(product.category)];
};

if (dryRun) {
  console.log(JSON.stringify({ projectId, storageBucket, products: products.length, news: news.length, plantCentarRoot }, null, 2));
  process.exit(0);
}

try {
  const [bucketMetadata] = await bucket.getMetadata();
  console.log(`Storage ready: ${bucketMetadata.name} (${bucketMetadata.location || 'location unavailable'})`);
} catch (error) {
  const code = error?.code || error?.statusCode || 'unknown';
  throw new Error(
    `Cannot access Firebase Storage bucket ${storageBucket} (status ${code}). ` +
    'Confirm GOOGLE_APPLICATION_CREDENTIALS points to a service-account key from this Firebase project. ' +
    'For 402/404 errors, also confirm the Blaze plan, default bucket, and FIREBASE_STORAGE_BUCKET value.',
    { cause: error },
  );
}

if (storageCheckOnly) process.exit(0);

console.log(`Importing ${products.length} products into ${projectId}...`);
for (const [index, product] of products.entries()) {
  const images = await migrateProductImages(product);
  const { productId, ...data } = product;
  await database.collection('products').doc(productId).set({ ...data, images, migratedAt: Timestamp.now() }, { merge: true });
  if ((index + 1) % 20 === 0 || index === products.length - 1) console.log(`Products: ${index + 1}/${products.length}`);
}

console.log(`Importing ${news.length} preserved news items...`);
for (const item of news) {
  const localPath = resolve(plantCentarRoot, item.localImage);
  const buffer = await readFile(localPath);
  const extension = extname(localPath).toLowerCase();
  const contentType = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
  const imageUrl = await uploadBuffer(`news/${item.newsId}-${basename(localPath)}`, buffer, contentType);
  const { newsId, localImage, publishedAt, ...data } = item;
  await database.collection('news').doc(newsId).set({ ...data, imageUrl, publishedAt: Timestamp.fromDate(new Date(publishedAt)), createdAt: Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });
}

console.log('Import complete. Deploy Firestore and Storage rules before opening production access.');

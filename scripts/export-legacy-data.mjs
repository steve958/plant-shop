import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const outputDirectory = resolve(repositoryRoot, 'migration', 'legacy-export');

const legacyConfig = {
  apiKey: process.env.LEGACY_FIREBASE_API_KEY || 'AIzaSyA-Kvmv5HbHZtY5UQvb8OlO_D8Ipg8zm6E',
  authDomain: process.env.LEGACY_FIREBASE_AUTH_DOMAIN || 'web-shop-model.firebaseapp.com',
  projectId: process.env.LEGACY_FIREBASE_PROJECT_ID || 'web-shop-model',
  storageBucket: process.env.LEGACY_FIREBASE_STORAGE_BUCKET || 'web-shop-model.appspot.com',
  messagingSenderId: process.env.LEGACY_FIREBASE_MESSAGING_SENDER_ID || '232308404854',
  appId: process.env.LEGACY_FIREBASE_APP_ID || '1:232308404854:web:237a1f6547c4ea2687e557',
};

const shouldCheckImages = process.argv.includes('--check-images');
const app = initializeApp(legacyConfig, `legacy-export-${Date.now()}`);
const database = getFirestore(app);

const serializeValue = (value) => {
  if (value?.toDate instanceof Function) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeValue(item)]));
  }
  return value;
};

const requestImage = async (url) => {
  if (!url) return { status: 'missing', httpStatus: null, contentType: null };
  try {
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15000) });
    return {
      status: response.ok ? 'available' : 'unavailable',
      httpStatus: response.status,
      contentType: response.headers.get('content-type'),
    };
  } catch (error) {
    return { status: 'unavailable', httpStatus: null, contentType: null, error: error.message };
  }
};

const mapWithConcurrency = async (items, limit, mapper) => {
  const output = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return output;
};

const snapshot = await getDocs(collection(database, 'products'));
const products = snapshot.docs
  .map((productDocument) => ({
    productId: productDocument.id,
    ...serializeValue(productDocument.data()),
  }))
  .sort((first, second) => String(first.name || '').localeCompare(String(second.name || ''), 'sr'));

const imageEntries = products.flatMap((product) =>
  (Array.isArray(product.images) ? product.images : []).map((url, imageIndex) => ({
    productId: product.productId,
    productName: product.name || '',
    imageIndex,
    isPrimary: imageIndex === 0,
    url,
  })),
);

const checkedImages = shouldCheckImages
  ? await mapWithConcurrency(imageEntries, 8, async (image) => ({ ...image, ...(await requestImage(image.url)) }))
  : imageEntries.map((image) => ({ ...image, status: 'not-checked', httpStatus: null, contentType: null }));

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'sr'));
const summary = {
  exportedAt: new Date().toISOString(),
  sourceProjectId: legacyConfig.projectId,
  products: products.length,
  images: checkedImages.length,
  productsWithoutImages: products.filter((product) => !Array.isArray(product.images) || product.images.length === 0).length,
  unavailableImages: checkedImages.filter((image) => image.status === 'unavailable').length,
  categories: unique(products.map((product) => product.category)),
  subcategories: unique(products.map((product) => product.subcategory)),
  manufacturers: unique(products.map((product) => product.manufacturer)),
};

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const productCsvHeader = ['productId', 'name', 'category', 'subcategory', 'manufacturer', 'price', 'onDiscount', 'discountPrice', 'description', 'images'];
const productCsv = [
  productCsvHeader.map(csvEscape).join(','),
  ...products.map((product) => productCsvHeader.map((field) => csvEscape(field === 'images' ? (product.images || []).join(' | ') : product[field])).join(',')),
].join('\n');

const imageCsvHeader = ['productId', 'productName', 'imageIndex', 'isPrimary', 'url', 'status', 'httpStatus', 'contentType', 'error'];
const imageCsv = [
  imageCsvHeader.map(csvEscape).join(','),
  ...checkedImages.map((image) => imageCsvHeader.map((field) => csvEscape(image[field])).join(',')),
].join('\n');

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, 'products.json'), `${JSON.stringify(products, null, 2)}\n`),
  writeFile(resolve(outputDirectory, 'products.csv'), `${productCsv}\n`),
  writeFile(resolve(outputDirectory, 'image-manifest.json'), `${JSON.stringify(checkedImages, null, 2)}\n`),
  writeFile(resolve(outputDirectory, 'image-manifest.csv'), `${imageCsv}\n`),
  writeFile(resolve(outputDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`),
]);

console.log(JSON.stringify(summary, null, 2));

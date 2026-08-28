import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const dryRun = process.argv.includes('--dry-run');
const manufacturerFilter = process.argv.find((value) => value.startsWith('--manufacturer='))?.split('=').slice(1).join('=').trim();
const localEnvironment = Object.fromEntries((await readFile(resolve(repositoryRoot, '.env.local'), 'utf8').catch(() => ''))
  .split(/\r?\n/)
  .map((line) => line.match(/^\s*([^#=]+)=(.*)\s*$/))
  .filter(Boolean)
  .map((match) => [match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, '')]));
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || localEnvironment.VITE_FIREBASE_PROJECT_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || localEnvironment.VITE_FIREBASE_STORAGE_BUCKET;

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const products = await readJson(resolve(repositoryRoot, 'migration', 'legacy-export', 'products.json'));
const overrides = await readJson(resolve(repositoryRoot, 'migration', 'product-image-overrides.json'));

const decodeHtml = (value = '') => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&amp;/g, '&')
  .replace(/&ndash;|&#8211;/g, '-')
  .replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"')
  .replace(/&#0?38;/g, '&');

const canonical = (value = '') => decodeHtml(value)
  .replace(/đ/gi, 'dj')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\b(?:fitofert|kristal|energy)\b/g, ' ')
  .replace(/\b(?:hrana za pse|hrana za macke)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const slugify = (value) => canonical(value).replace(/\s+/g, '-');

const levenshtein = (left, right) => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[right.length];
};

const similarity = (left, right) => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.startsWith(right) || right.startsWith(left)) return 0.94;
  return 1 - (levenshtein(left, right) / Math.max(left.length, right.length));
};

const bestMatch = (name, entries, minimum = 0.72) => {
  const target = canonical(name);
  const ranked = entries
    .map((entry) => ({ entry, score: similarity(target, canonical(entry.name)) }))
    .sort((left, right) => right.score - left.score);
  return ranked[0]?.score >= minimum ? ranked[0] : null;
};

const fetchResponse = async (url, options = {}) => {
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
      headers: { 'user-agent': 'PlantCentarCatalogMigration/1.0', ...(options.headers || {}) },
      ...options,
    });
  } catch {
    return null;
  }
};

const fetchText = async (url) => {
  const response = await fetchResponse(url);
  return response?.ok ? response.text() : null;
};

const fetchJson = async (url) => {
  const response = await fetchResponse(url);
  return response?.ok ? response.json() : null;
};

const extractMetaImage = (html) => {
  const tags = html?.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/(?:property|name)=["'](?:og:image|twitter:image)["']/i.test(tag)) continue;
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) return decodeHtml(content);
  }
  return null;
};

const getFeaturedImage = (item) => item?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
const sourceCache = new Map();

const loadFitofert = async () => {
  if (sourceCache.has('fitofert')) return sourceCache.get('fitofert');
  const data = await fetchJson('https://fitofert.com/wp-json/wp/v2/product?per_page=100&_embed=1');
  const entries = (data || []).map((item) => ({
    name: decodeHtml(item.title?.rendered),
    imageUrl: getFeaturedImage(item),
    pageUrl: item.link,
  })).filter((item) => item.name && item.imageUrl);
  sourceCache.set('fitofert', entries);
  return entries;
};

const loadPremil = async () => {
  if (sourceCache.has('premil')) return sourceCache.get('premil');
  const data = await fetchJson('https://www.premil.rs/wp-json/wp/v2/product?per_page=100&_embed=1');
  const entries = (data || []).filter((item) => !item.link.includes('/en/') && !item.link.includes('/el/')).map((item) => ({
    name: decodeHtml(item.title?.rendered).replace(/^(?:Premil|Herbal)\s+/i, ''),
    imageUrl: getFeaturedImage(item),
    pageUrl: item.link,
  })).filter((item) => item.name && item.imageUrl);
  sourceCache.set('premil', entries);
  return entries;
};

const galenikaOverrides = {
  'bakarni oksihlorid': 'bakarni-oksihlorid-50',
  'bonaca': 'bonaca-ec',
  'bordovska corba': 'bordovska-corba-20-wp',
  'cipkord': 'cipkord-20-ec',
  'kabuki 2 5 ec': 'kabuki-25-ec',
};

const loadGalenikaSlugs = async () => {
  if (sourceCache.has('galenika-slugs')) return sourceCache.get('galenika-slugs');
  const html = await fetchText('https://www.fitofarmacija.rs/proizvodi');
  const slugs = [...new Set([...(html?.matchAll(/href=["'](?:https:\/\/www\.fitofarmacija\.rs)?\/?proizvod\/([^"'/?#]+)/gi) || [])].map((match) => match[1]))];
  const entries = slugs.map((slug) => ({ name: slug.replace(/-/g, ' '), slug }));
  sourceCache.set('galenika-slugs', entries);
  return entries;
};

const resolveGalenika = async (product) => {
  const normalizedName = canonical(product.name);
  const overriddenSlug = galenikaOverrides[normalizedName];
  const entries = await loadGalenikaSlugs();
  const match = overriddenSlug ? { entry: { slug: overriddenSlug }, score: 1 } : bestMatch(product.name, entries, 0.8);
  if (!match) return null;
  const pageUrl = `https://www.fitofarmacija.rs/proizvod/${match.entry.slug}`;
  const html = await fetchText(pageUrl);
  const imageUrl = extractMetaImage(html);
  return imageUrl ? { imageUrl, pageUrl, confidence: match.score, method: 'official-product-page' } : null;
};

const gebiRoutes = [
  [/complete stix/i, '/frendy-hrana-za-pse/poslastice/frendy-complete-stix'],
  [/stapici za dresuru/i, '/frendy-hrana-za-pse/poslastice/frendy-stapici-za-dresuru'],
  [/meaty strips/i, '/frendy-hrana-za-pse/poslastice/frendy-meaty-strips'],
  [/salama sa govedinom/i, '/frendy-hrana-za-pse/salame/frendy-salama-sa-govedinom'],
  [/salama sa piletinom/i, '/frendy-hrana-za-pse/salame/frendy-salama-sa-piletinom'],
  [/konzerva sa govedinom/i, '/frendy-hrana-za-pse/vlazna-hrana/frendy-konzerva-sa-govedinom'],
  [/konzerva sa piletinom/i, '/frendy-hrana-za-pse/vlazna-hrana/frendy-konzerva-sa-piletinom'],
  [/complete menu govedina/i, '/frendy-hrana-za-pse/suva-hrana/frendy-complete-govedina'],
  [/complete menu jagnjetina/i, '/frendy-hrana-za-pse/suva-hrana/frendy-complete-jagnjetina'],
  [/complete menu piletina/i, '/frendy-hrana-za-pse/suva-hrana/frendy-complete-piletina'],
  [/complete menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-complete-curetina'],
  [/active menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-active-menu'],
  [/adult menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-adult-menu'],
  [/hunter menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-hunter-menu'],
  [/junior menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-junior-menu'],
  [/puppy menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-puppy-menu'],
  [/sensitive fish menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-sensitive-fish-menu'],
  [/super sport menu/i, '/frendy-hrana-za-pse/suva-hrana/frendy-super-sport-menu'],
  [/uni dog/i, '/frendy-hrana-za-pse/suva-hrana/uni-dog'],
  [/wendy.*sensitive indoor/i, '/wendy-hrana-za-macke/suva-hrana/wendy-sensitive-indoor'],
  [/wendy.*curetina/i, '/wendy-hrana-za-macke/suva-hrana/wendy-sa-ukusom-curetine'],
  [/wendy.*losos/i, '/wendy-hrana-za-macke/suva-hrana/wendy-sa-ukusom-lososa'],
  [/wendy.*konzerva sa piletinom/i, '/wendy-hrana-za-macke/vlazna-hrana/wendy-konzerva-sa-piletinom'],
  [/wendy.*konzerva sa lososom/i, '/wendy-hrana-za-macke/vlazna-hrana/wendy-konzerva-sa-lososom'],
];

const imageExists = async (url) => {
  const response = await fetchResponse(url, { method: 'HEAD' });
  return Boolean(response?.ok && response.headers.get('content-type')?.startsWith('image/'));
};

const sizeSpecificGebiImage = async (imageUrl, productName) => {
  const targetSize = productName.match(/\b(1|3|5|10|20)\s*kg\b/i)?.[1];
  if (!targetSize) return imageUrl;
  const decoded = decodeURIComponent(imageUrl);
  const candidate = decoded.replace(/\b(?:1|3|5|10|20)\s*kg\b/i, `${targetSize}kg`);
  if (candidate === decoded) return imageUrl;
  const encoded = encodeURI(candidate);
  return await imageExists(encoded) ? encoded : imageUrl;
};

const resolveGebi = async (product) => {
  const normalizedName = canonical(product.name);
  const route = gebiRoutes.find(([pattern]) => pattern.test(normalizedName))?.[1];
  if (!route) return null;
  const pageUrl = `https://shop.gebi.rs${route}`;
  const html = await fetchText(pageUrl);
  const imageUrl = extractMetaImage(html);
  return imageUrl ? {
    imageUrl: await sizeSpecificGebiImage(imageUrl, product.name),
    pageUrl,
    confidence: 1,
    method: 'official-product-page',
  } : null;
};

const bacillomixImages = {
  'bacillo stoper': 'https://bacillomix.com/wp-content/uploads/2024/12/stoperhome.png',
  'bacilomix biotic b': 'https://bacillomix.com/wp-content/uploads/2021/01/BioticHome.png',
  'bacilomix botrix b': 'https://bacillomix.com/wp-content/uploads/2021/01/BotrixHome.png',
  'bacilomix gramino b': 'https://bacillomix.com/wp-content/uploads/2021/01/GraminoHome.png',
  'bacilomix orginal': 'https://bacillomix.com/wp-content/uploads/2021/01/OriginalHome.png',
  'bacilomix razor b': 'https://bacillomix.com/wp-content/uploads/2021/01/RazorHome.png',
  'bacilomix semennops': 'https://bacillomix.com/wp-content/uploads/2021/01/SemennopsHome.png',
};

const resolveBacillomix = (product) => {
  const imageUrl = bacillomixImages[canonical(product.name)];
  return imageUrl ? {
    imageUrl,
    pageUrl: 'https://bacillomix.com/',
    confidence: 1,
    method: 'official-media-library',
  } : null;
};

const resolveAgriFortis = async (product) => {
  const query = product.name.replace(/^Fortis\s+/i, '');
  const media = await fetchJson(`https://agrifortis.rs/wp-json/wp/v2/media?per_page=100&search=${encodeURIComponent(query)}`);
  const entries = (media || []).map((item) => ({
    name: decodeHtml(item.title?.rendered || item.slug),
    imageUrl: item.source_url,
    pageUrl: item.link || 'https://agrifortis.rs/',
  })).filter((item) => item.imageUrl && !/pozadina|rezultat/i.test(item.name));
  const match = bestMatch(product.name, entries, 0.62);
  return match ? { ...match.entry, confidence: match.score, method: 'official-media-library' } : null;
};

const lebosolRoutes = {
  'lebosol bor': '/produkte/blattduenger-auch-bio/lebosol-bor',
  'lebosol calcium forte': '/produkte/blattduenger/lebosol-calcium-forte-sc',
  'lebosol cink 700 sc': '/produkte/blattduenger-auch-bio/lebosol-zink-700-sc',
  'lebosol kalium 450': '/produkte/blattduenger/lebosol-kalium-450',
  'lebosol mangan 500 sc': '/produkte/blattduenger-auch-bio/lebosol-mangan-500-sc',
  'lebosol nutriplant 8 8 6': '/produkte/npk-duenger/lebosol-nutriplant-8-8-6',
  'lebosol pk max 5 1': '/produkte/blattduenger/lebosol-pk-max',
};

const resolveLebosol = async (product) => {
  const route = lebosolRoutes[canonical(product.name)];
  if (!route) return null;
  const pageUrl = `https://www.lebosol.de${route}`;
  const html = await fetchText(pageUrl);
  const productImage = (html?.match(/<img\b[^>]*class=["'][^"']*page-menu-images-img[^"']*["'][^>]*>/i)?.[0] || '')
    .match(/src=["']([^"']+)["']/i)?.[1];
  if (!productImage) return null;
  return {
    imageUrl: new URL(decodeHtml(productImage), pageUrl).href,
    pageUrl,
    confidence: 1,
    method: 'official-product-page',
  };
};

const resolveCatalogImage = async (product) => {
  const override = overrides[product.productId];
  if (override?.imageUrl) return { ...override, confidence: 1, method: 'curated-override' };

  if (product.manufacturer.trim() === 'Galenika Fitofarmacija') return resolveGalenika(product);
  if (product.manufacturer.trim() === 'Fertico') {
    const entries = await loadFitofert();
    const match = bestMatch(product.name, entries, 0.73);
    return match ? { ...match.entry, confidence: match.score, method: 'official-catalog-api' } : null;
  }
  if (product.manufacturer.trim() === 'Premil') {
    const family = product.name.replace(/^.+?\s+-\s+/, '').replace(/\s+\d+(?:[.,]\d+)?\s*(?:kg|gr)\s*$/i, '');
    const entries = await loadPremil();
    const match = bestMatch(family, entries, 0.82);
    return match ? { ...match.entry, confidence: match.score, method: 'official-catalog-api' } : null;
  }
  if (product.manufacturer.trim() === 'Gebi') return resolveGebi(product);
  if (product.manufacturer.trim() === 'Bacilomix') return resolveBacillomix(product);
  if (product.manufacturer.trim() === 'Agri Fortis') return resolveAgriFortis(product);
  if (product.manufacturer.trim() === 'Lebosol') return resolveLebosol(product);
  if (product.manufacturer.trim() === 'Villager' && /bc\s*1250/i.test(product.name)) return {
    localPath: resolve(repositoryRoot, '..', 'plant-centar', 'src', 'assets', 'campaign', 'villager-bc-1250-pe.jpg'),
    pageUrl: 'https://villager.rs/',
    confidence: 1,
    method: 'owner-provided-product-asset',
  };
  return null;
};

const candidates = manufacturerFilter
  ? products.filter((product) => product.manufacturer.trim().toLowerCase() === manufacturerFilter.toLowerCase())
  : products;

console.log(`Resolving official images for ${candidates.length} products${manufacturerFilter ? ` (${manufacturerFilter})` : ''}...`);
const resolved = [];
const unresolved = [];
for (const [index, product] of candidates.entries()) {
  const source = await resolveCatalogImage(product);
  if (source?.imageUrl || source?.localPath) resolved.push({ product, source });
  else unresolved.push(product);
  if ((index + 1) % 20 === 0 || index === candidates.length - 1) console.log(`Resolved: ${index + 1}/${candidates.length}`);
}

const byManufacturer = (items) => Object.fromEntries(Object.entries(items.reduce((summary, item) => {
  const manufacturer = item.product?.manufacturer?.trim() || item.manufacturer?.trim() || 'Unknown';
  summary[manufacturer] = (summary[manufacturer] || 0) + 1;
  return summary;
}, {})).sort(([left], [right]) => left.localeCompare(right)));

console.log(JSON.stringify({
  total: candidates.length,
  resolved: resolved.length,
  unresolved: unresolved.length,
  resolvedByManufacturer: byManufacturer(resolved),
  unresolvedByManufacturer: byManufacturer(unresolved),
}, null, 2));

if (unresolved.length) {
  console.log('\nStill requiring a curated source:');
  for (const product of unresolved) console.log(`- ${product.productId}\t${product.manufacturer.trim()}\t${product.name}`);
}

if (dryRun) process.exit(0);

if (!projectId || !storageBucket) throw new Error('Set FIREBASE_PROJECT_ID and FIREBASE_STORAGE_BUCKET before updating images.');
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to the full path of the plant-shop service-account JSON file.');
const serviceAccount = JSON.parse(await readFile(credentialsPath, 'utf8'));
if (serviceAccount.type !== 'service_account' || serviceAccount.project_id !== projectId) {
  throw new Error(`The service-account JSON must belong to ${projectId}.`);
}

const app = initializeApp({ credential: applicationDefault(), projectId, storageBucket });
const database = getFirestore(app);
const bucket = getStorage(app).bucket();
await bucket.getMetadata();

const contentTypeForPath = (path) => {
  const extension = extname(path).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.avif') return 'image/avif';
  return 'image/jpeg';
};

const downloadImage = async (source) => {
  if (source.localPath) {
    const buffer = await readFile(source.localPath);
    return { buffer, contentType: contentTypeForPath(source.localPath) };
  }
  const url = source.imageUrl;
  const response = await fetchResponse(url);
  const contentType = response?.headers.get('content-type')?.split(';')[0];
  if (!response?.ok || !contentType?.startsWith('image/')) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.length >= 4096 ? { buffer, contentType } : null;
};

const extensionFor = (url, contentType) => {
  let sourcePath = url;
  try { sourcePath = new URL(url).pathname; } catch { /* local filesystem path */ }
  const fromUrl = extname(sourcePath).toLowerCase();
  if (/^\.(?:avif|gif|jpe?g|png|webp)$/.test(fromUrl)) return fromUrl === '.jpeg' ? '.jpg' : fromUrl;
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('avif')) return '.avif';
  return '.jpg';
};

for (const [index, { product, source }] of resolved.entries()) {
  const image = await downloadImage(source);
  if (!image) {
    console.warn(`Skipped invalid image: ${product.name} (${source.imageUrl || source.localPath})`);
    continue;
  }
  const sourcePath = source.imageUrl || source.localPath;
  const path = `images/products/${product.productId}${extensionFor(sourcePath, image.contentType)}`;
  const token = randomUUID();
  await bucket.file(path).save(image.buffer, {
    resumable: false,
    validation: false,
    contentType: image.contentType,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  const imageSource = {
    pageUrl: source.pageUrl,
    method: source.method,
    confidence: Number(source.confidence.toFixed(3)),
    updatedAt: Timestamp.now(),
  };
  if (source.imageUrl) imageSource.originalImageUrl = source.imageUrl;
  await database.collection('products').doc(product.productId).set({
    images: [imageUrl],
    imageSource,
  }, { merge: true });
  if ((index + 1) % 20 === 0 || index === resolved.length - 1) console.log(`Uploaded: ${index + 1}/${resolved.length}`);
}

console.log(`Product image update complete: ${resolved.length} resolved; ${unresolved.length} left unchanged.`);

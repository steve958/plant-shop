import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const email = process.argv[2];
if (!projectId || !email) throw new Error('Usage: npm run admin:grant -- admin@example.com (with FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS set)');

const app = initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
console.log(`Admin access granted to ${email}. Sign out and sign in again so Firebase refreshes the ID token.`);

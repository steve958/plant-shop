# Novi Firebase projekat — Plant Shop i Plant Centar

Jedan novi Firebase projekat služi za oba frontenda. Plant Shop koristi kolekcije `products`, `orders` i `news`, a Plant Centar javno čita samo objavljene dokumente iz `news`.

## 1. Kreiranje projekta u Firebase konzoli

1. Otvorite [Firebase Console](https://console.firebase.google.com/) Google nalogom vlasnika sajta.
2. Izaberite **Create a project**, unesite naziv (na primer `plant-centar-shop`) i zabeležite nepromenljivi Project ID.
3. Otvorite **Databases & Storage → Firestore → Create database**, izaberite regionalnu lokaciju najbližu korisnicima i Production mode.
4. Otvorite **Databases & Storage → Storage → Get started** i kreirajte podrazumevani bucket. Firebase trenutno zahteva Blaze plan za Cloud Storage; postavite budžetska upozorenja pre uključivanja naplate.
5. Otvorite **Security → Authentication → Sign-in method**, uključite samo Email/Password. Kupci ne koriste naloge; ovo je isključivo za administratore.
6. Na Project Overview strani izaberite Web (`</>`), registrujte aplikaciju i kopirajte `firebaseConfig` vrednosti.

## 2. Lokalna konfiguracija oba repozitorijuma

U `plant-shop` kopirajte `.env.example` u `.env.local` i unesite šest vrednosti iz `firebaseConfig`:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Iste vrednosti upišite u `C:\Users\StefanMiljevic\Documents\plant-centar\.env.local`. Oba projekta moraju pokazivati na isti `VITE_FIREBASE_PROJECT_ID` i `VITE_FIREBASE_STORAGE_BUCKET`.

## 3. Firebase CLI i pravila

Iz PowerShell-a u `plant-shop` repozitorijumu:

```powershell
npm install -g firebase-tools
firebase login
firebase projects:list
firebase use --add
firebase deploy --only firestore,storage
```

Kada `firebase use --add` pita za projekat, izaberite novi Project ID i alias `default`. Deploy koristi lokalne `firestore.rules`, `storage.rules` i `firebase.json`.

## 4. Servisni nalog samo za jednokratnu migraciju

1. Firebase Console → Project settings → Service accounts → Generate new private key.
2. Sačuvajte JSON van repozitorijuma. Ne šaljite ga mejlom i nikada ga ne commit-ujte.
3. U istoj PowerShell sesiji postavite:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\bezbedna\lokacija\service-account.json"
$env:FIREBASE_PROJECT_ID="vas-project-id"
$env:FIREBASE_STORAGE_BUCKET="vas-project-id.firebasestorage.app"
```

Prvo proverite plan migracije bez upisa:

```powershell
npm run data:import:dry
```

Zatim pokrenite import 211 proizvoda, fotografija i četiri sačuvane vesti:

```powershell
npm run data:import
```

Importer pokušava da preuzme svaku originalnu fotografiju. Pošto stari bucket trenutno vraća HTTP 402, koristi licenciranu kategorijsku fotografiju iz `migration/category-image-sources.json`. Administrator potom kroz panel menja privremene fotografije tačnim fotografijama proizvoda.

## 5. Prvi administrator

1. Firebase Console → Authentication → Users → Add user.
2. Unesite vlasnikov email i privremenu jaku lozinku koju će vlasnik promeniti.
3. Dodelite `admin` custom claim iz iste bezbedne PowerShell sesije:

```powershell
npm run admin:grant -- vlasnik@example.com
```

Administrator se zatim odjavljuje/prijavljuje na `/admin/prijava` kako bi dobio novi ID token. Nikakva admin lozinka nije smeštena u kodu.

## 6. Provera pre produkcije

1. Storefront učitava proizvode i detalje bez mock cena.
2. Gost može da kreira porudžbinu, ali ne može da čita `orders`.
3. Administrator vidi porudžbine i menja status.
4. Administrator može da kreira, izmeni, objavi i povuče vest.
5. Objavljena vest se vidi u `Aktuelnosti` na Plant Centar sajtu; nacrt se ne vidi.
6. Firestore i Storage Rules u konzoli odgovaraju fajlovima iz repozitorijuma.

Kada je sve potvrđeno, uklonite `legacyConfig` fallback iz `src/components/firebase.ts` da pogrešna ili nepotpuna `.env.local` konfiguracija ne bi tiho povezala staru bazu.

## Zvanična dokumentacija

- [Dodavanje Firebase-a u web aplikaciju](https://firebase.google.com/docs/web/setup)
- [Firestore quickstart](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Cloud Storage za web](https://firebase.google.com/docs/storage/web/start)
- [Email/password Authentication](https://firebase.google.com/docs/auth/web/password-auth)
- [Admin SDK i servisni nalozi](https://firebase.google.com/docs/admin/setup)
- [Custom admin claims](https://firebase.google.com/docs/auth/admin/custom-claims)

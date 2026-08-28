# Secure administrator access

The repository does not contain a legitimate administrator username or password. Do not add credentials to source control or share a personal account.

## Create the first owner-controlled administrator

1. Create or select the new Plant Centar Firebase project and configure the values described in `.env.example`.
2. Enable Email/Password sign-in in Firebase Authentication.
3. Create the owner's account from the Firebase Authentication console. Let the owner choose the password and reset it immediately if anybody else handled setup.
4. Use a trusted server environment (Firebase Admin SDK or a callable Cloud Function restricted to the project owner) to add the custom claim `{ admin: true }`.
5. Deploy and verify `firestore.rules` and Storage rules before importing the owner-provided product catalog.
6. Administrators sign in at `/admin/prijava`. There is no customer login or registration.

## Required rule behavior

- Anyone may read published products.
- Guests may create a correctly shaped new order, but may never read, update, list, or delete orders.
- Only a token with the `admin` custom claim may create, edit, or delete products and product images.
- Only an administrator may read orders and change their status.
- Public clients must never be able to set custom claims.

## Local visual review

During development, `/admin/panel?preview=admin` opens a read-only admin preview. This route is compiled out of production behavior through `import.meta.env.DEV`, and all mutations inside the panel are disabled while preview mode is active. It is not an administrator login and must not be treated as one.

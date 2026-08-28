# Plant Shop Firebase replacement

The storefront now reads Firebase web configuration from `.env.local`. The old
`web-shop-model` project remains only as a temporary fallback while the new
project is prepared.

## Recommended project structure

- `products`: catalog records keyed by stable SKU or generated document ID.
- `categories`: centrally managed categories and subcategories.
- `manufacturers`: brand names, logos, descriptions, and publication status.
- `orders`: complete order documents with customer snapshot, line items, totals,
  delivery data, timestamps, and status history.
- `admins` (optional): display preferences for administrators. Authorization is
  always enforced through Firebase custom claims, never through this document.
- `importJobs`: spreadsheet import summary, validation errors, creator, and time.
- Storage folders: `products/{productId}/` and `imports/{importJobId}/`.

## Migration sequence

1. Create a new Firebase project under the owner's Google account or company
   organization.
2. Enable Email/Password Authentication for administrators only, plus Firestore and Storage.
3. Register a web application and copy its six public configuration values into
   `.env.local` using `.env.example`.
4. Deploy restrictive Firestore and Storage rules before adding real data.
5. Create the first administrator account and assign its admin privilege through
   a trusted server-side process.
6. Import a small test catalog, verify storefront queries, guest checkout,
   order creation and the admin order inbox, then import the complete spreadsheet.
7. Remove `legacyConfig` from `src/components/firebase.ts` after validation.

Creating the external Firebase project requires the owner's account/workspace
selection. No new cloud project is created automatically by the frontend.

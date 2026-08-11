# Nothingbuh Fabrics — Setup Guide

This is a complete, multi-page e-commerce store with a real **Supabase** backend
(auth, database, storage, admin). It ships with demo fabrics so you can preview
**every page immediately** — it becomes fully live the moment you add your keys.

---

## 0. Preview it right now (no setup)

Because the pages use clean URLs (`/shop`, `/product`, …), don't just double-click
the files — run a tiny local server from inside the project folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Everything works on demo data. Sign-in, orders and admin show a friendly
"connect Supabase" notice until you finish the steps below.

---

## 1. Create your Supabase project

1. Go to **supabase.com** → create a free project.
2. Open **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd.supabase.co`)
   - **anon public** key

The anon key is **safe** to put in the browser — Row Level Security (in
`sql/schema.sql`) is what protects your data.

## 2. Create the database

1. In Supabase open **SQL Editor**.
2. Paste the entire contents of **`sql/schema.sql`** and **Run**.
   (Creates all tables, security rules, triggers and the image storage bucket.)
3. *(Optional)* Paste **`sql/seed.sql`** and **Run** to load a starter catalog
   of demo fabrics. **Delete these later** and add your real Instagram fabrics
   from the admin dashboard — the demo prices are placeholders.

## 3. Add your keys

Open **`js/config.js`** and fill in:

```js
SUPABASE_URL:      "https://YOUR-PROJECT.supabase.co",
SUPABASE_ANON_KEY: "your-anon-public-key",
WA_NUMBER:         "2348012345678",   // your WhatsApp, country code, no +
```

Save. The whole site is now live against your database.

## 4. Make yourself the admin

1. Open the site and **Register** with your email (create your account).
2. Back in Supabase **SQL Editor**, run (use your email):

```sql
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'you@example.com');
```

3. Visit **`/admin`** — you now control the whole store.

---

## 5. What the admin can do (`/admin`)

- **Products** — add / edit / delete, set price & sale price, stock, mark as
  Featured / Best Seller / New Arrival, enable or disable, and upload / delete
  product images (stored in Supabase Storage).
- **Categories & Collections** — create, edit, delete.
- **Orders** — view every order, see customer details, change order status
  (Pending → Confirmed → Processing → Shipped → Delivered / Cancelled) and
  update payment status.
- **Customers** — everyone who registered.
- **Subscribers** — your newsletter list.
- **Reviews** — approve, hide or delete customer reviews.
- **Homepage** — edit and toggle the announcement bar.

---

## 6. Payments (Paystack / Flutterwave)

The checkout is **payment-ready but does not fake success**. Placing an order
creates a real order row with `payment_status = 'pending'`. Bank transfer works
out of the box (you confirm payment, then mark it `paid` in admin).

To add card payments, plug your Paystack or Flutterwave public key into the
checkout's payment step and update the order's `payment_status` to `paid`
**only after** the provider verifies the transaction. Never mark an order paid
before verification, and never put secret keys in the frontend.

---

## 7. Google sign-in (optional)

Enable it in **Supabase → Authentication → Providers → Google**, then the
"Continue with Google" button on the login page works.

---

## 8. Deploy

Any static host works. Clean URLs are pre-configured:

- **Vercel** — `vercel.json` (cleanUrls) is included. Just import the folder.
- **Netlify** — drop the folder in; `netlify.toml` is included.
- **Apache** — `.htaccess` is included.

After deploying, set your live domain in **Supabase → Authentication → URL
Configuration** (Site URL + redirect URLs) so email confirmation and password
reset links point to your domain.

---

## File map

```
index.html            Home (trimmed, conversion-focused)
shop.html             All products + search / filters / sort
collections.html      Collections grid
new-arrivals.html     New arrivals
best-sellers.html     Best sellers
product.html          Product detail (?slug=…)
cart.html             Cart
checkout.html         Checkout (creates real orders)
login / register / forgot-password / reset-password
account/index.html    Customer dashboard
admin/index.html      Admin dashboard (protected)
about.html  contact.html
css/styles.css        Shared design system
js/config.js          <-- YOUR KEYS GO HERE
js/app.js             Storefront engine (chrome, cart, catalog)
js/auth.js            Authentication + account
js/admin.js           Admin dashboard
sql/schema.sql        Database + security + storage  (run first)
sql/seed.sql          Demo catalog (optional)
```

Questions on any step — happy to walk through it.

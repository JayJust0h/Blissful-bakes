# 🎂 Blissful Bakes — Order App

A Next.js web app for Blissful Bakes to handle cake and cupcake orders with an admin panel.

## Features

- 🛍️ **Customer Menu** — Browse all cakes & cupcakes with size/price options
- 🛒 **Shopping Cart** — Add items, adjust quantities
- 📝 **Order Form** — Customer details collection
- ✅ **Order Confirmation** — Order ID + WhatsApp/Call direct links
- 🔐 **Admin Panel** — `/admin` route with token-protected access
- 📊 **Order Management** — View all orders, filter by status, update status

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/blissful-bakes.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **"Deploy"**

### 3. Set Environment Variable

In Vercel Dashboard → Your Project → **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `ADMIN_TOKEN` | `your-secret-password-here` |

Then **Redeploy** the project.

### 4. Access Admin Panel

Go to `https://your-app.vercel.app/admin` and enter your `ADMIN_TOKEN`.

## Local Development

```bash
cp .env.example .env.local
# Edit .env.local and set ADMIN_TOKEN

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⚠️ Important Note on Data Persistence

The current setup uses **in-memory storage** (orders reset on each server restart/deploy). For a production app with persistent orders, integrate one of:

- **[Vercel KV](https://vercel.com/storage/kv)** (Redis) — easiest, stays on Vercel
- **[Supabase](https://supabase.com)** — free PostgreSQL database
- **[PlanetScale](https://planetscale.com)** — free MySQL database
- **[MongoDB Atlas](https://www.mongodb.com/atlas)** — free MongoDB

## Order Flow

```
Menu → Cart → Customer Details → Place Order → Confirmation (WhatsApp link)
```

## Admin Status Flow

```
Pending → Confirmed → Baking → Ready → Delivered
Any status → Cancelled
```

## Contact

Blissful Bakes: +254714391314

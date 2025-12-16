# exc.fun teaser

Modern Solana teaser site with a PostgreSQL backend that assigns a warrior number per connected wallet.

## Structure
- `backend/`: Node/Express API, PostgreSQL persistence.
- `frontend/`: Vite + React + TypeScript landing page with Solana wallet adapters.

## Backend
### Environment
Copy `backend/env.example` to `backend/.env` (or set env vars in Railway). Set either `DATABASE_URL` (preferred) or the standard `PG*` env vars. Enable SSL (useful on Railway) with `PGSSL=true`.

```
PORT=4000
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
PGSSL=true
```

### Run
```
cd backend
npm install
npm start
```
Creates table `warriors` if missing. `POST /warriors` accepts `{ address }`, upserts by address, and returns `{ warriorNumber }` (dense rank by insert order). `GET /health` checks DB connectivity.

## Frontend
Copy `frontend/env.example` to `frontend/.env` (or set env vars in Railway) and set `VITE_API_BASE` to your backend URL.

Run locally:
```
cd frontend
npm install
npm run dev
```

## Deploying on Railway
- Deploy backend as a Node service with a PostgreSQL add-on; expose `PORT` and `DATABASE_URL`, set `PGSSL=true` if SSL is required.
- Deploy frontend as a static/Vite build with `VITE_API_BASE` pointing to the backend's public URL.

## Wallets
Wallet options included: Phantom, Solflare, Backpack, Glow. Ledger and other hardware-specific adapters are omitted to avoid USB deps.


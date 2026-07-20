# Political Economy RPG

## Run locally

```bash
npm install
npm run dev
```

The game loads its reference data from `db.json` and stores save games in the
browser, so a separate API server is not required.

To use `json-server` instead, start it with `npm run server` and set:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

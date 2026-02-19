# Cloud Profile (Optional)

This project is local-first by default.  
If you want cloud deployment, use the `cloud` profile without changing local workflows.

## 1. Required environment variables

- `DEPLOY_PROFILE=cloud`
- `API_TOKEN=<secure token>`
- `NEXT_PUBLIC_APP_URL=<public url>`

## 2. Recommended environment variables

- `DATABASE_PATH=/var/data/helix.db` (persistent volume path)
- `API_CORS_ORIGIN=https://your-domain.example`

## 3. Build and validate

```bash
DEPLOY_PROFILE=cloud npm run cloud:check
DEPLOY_PROFILE=cloud npm run build:cloud
```

## 4. Deploy (Vercel)

```bash
vercel login
DEPLOY_PROFILE=cloud npm run deploy:preview
DEPLOY_PROFILE=cloud npm run deploy:prod
```

Or with token:

```bash
DEPLOY_PROFILE=cloud VERCEL_TOKEN=xxx vercel --yes --token "$VERCEL_TOKEN"
DEPLOY_PROFILE=cloud VERCEL_TOKEN=xxx vercel --prod --yes --token "$VERCEL_TOKEN"
```

## 5. Runtime

```bash
DEPLOY_PROFILE=cloud npm run start
```

## Notes

- Cloud profile is optional and does not affect local development defaults.
- SQLite remains the active storage engine in this profile.

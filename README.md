# Scriber

A quote studio and personal manifestation writing app built with React, TypeScript, Vite, Express, Firebase, and Google Gemini.

## App Links

- Repository: [cl-a-ra/Scriber](https://github.com/cl-a-ra/Scriber)
- Local app: [http://localhost:3010](http://localhost:3010) after starting the development server.
- Hosted app: [https://scriber-2kre.onrender.com](https://scriber-2kre.onrender.com).

## Features

- Curated inspiration, personalized AI quotes, and a quote studio.
- Manifestation writing, saved quotes, bookmarks, and personal themes.
- Google sign-in with account-scoped Firebase storage and offline sync queues.
- Guest writing stored separately on the device, with confirmed import into an account.
- Installable progressive web app with cached assets for offline use. AI generation requires a network connection and a configured server key.

## Local Setup

Use Node.js 22 or newer. The commands below use PowerShell; on other platforms, use `npm` instead of `npm.cmd` and your shell's copy command.

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Do not overwrite an existing `.env`. Open [http://localhost:3010](http://localhost:3010). Development startup fails if port 3010 is already occupied.

Set `GEMINI_API_KEY` privately in `.env` to enable AI generation. Obtain a key from [Google AI Studio](https://aistudio.google.com/apikey). Without a key, AI endpoints return HTTP 503; curated quotes and offline templates remain available. Never commit `.env` or put the key in a `VITE_` variable, which would expose it to browsers.

The repository tracks `bun.lock`; Render installs with `bun install --frozen-lockfile`. Use that command locally with Bun installed when you need the same locked dependency versions as deployment.

## Configuration

See [.env.example](.env.example) for the full setup notes.

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server-only credential for AI generation. |
| `GEMINI_MODEL` | Explicit Gemini model selection; availability and quotas depend on the account. |
| `PORT` | Production HTTP port; defaults to `3010`. Render supplies its own port. |
| `HOST` | Server bind address; defaults to `0.0.0.0`. |
| `TRUST_PROXY_HOPS` | Verified reverse-proxy depth; use `0` locally. The Render blueprint sets `3`. |
| `VITE_USE_FIREBASE_EMULATORS` | Set to `true` for development against local Firebase emulators. Ignored in production. |

Local configuration selects `gemini-3.8-flash`; the Render blueprint selects `gemini-3.1-flash-lite`. The server does not silently switch models.

## Firebase And Data

Client configuration is in [firebase-applet-config.json](firebase-applet-config.json). Enable Google as an authentication provider and authorize `localhost`, `127.0.0.1`, and the final hosted app hostname in Firebase Authentication.

Signed-in profiles, preferences, quotes, bookmarks, drafts, and manifestations are owner-scoped. Pending writes retry on reconnect or focus, and Profile offers a **Sync now** action. Signing out hides account data but retains its offline cache on the device. Guest data remains separate, and changing the app origin does not migrate device-only writing.

Deploy the client and security rules together when changing their data contract. The checked-in Firebase deployment configuration targets Scriber's named database:

```powershell
npm.cmd exec -- firebase login
npm.cmd exec -- firebase deploy --only firestore:rules --project natural-land-slxdt
```

Use an account authorized for this project. CLI deployment requires Firebase Rules permissions and `serviceusage.services.use`.

For isolated local testing, install Java 21 or newer and run:

```powershell
npm.cmd run emulators
```

Set `VITE_USE_FIREBASE_EMULATORS=true` in `.env.local`, then start the development server in another terminal. Demo accounts do not access production data.

## Verification

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:firebase
```

`lint` runs TypeScript checking. `test` covers server and local data logic. `test:firebase` starts the Auth and Firestore emulators and checks security rules; it requires Java 21 or newer.

## Production And Deployment

```powershell
npm.cmd run build
npm.cmd start
```

The build creates frontend assets in `dist/` and the server bundle in `build/`. The production server serves both the app and `/api`; `npm.cmd run preview` serves only the static frontend and is not a full application server.

To deploy on Render:

1. Connect this GitHub repository using **New > Blueprint** and [render.yaml](render.yaml).
2. Supply `GEMINI_API_KEY` privately when prompted. The blueprint uses a free Node web service.
3. Wait for the build and `/api/health` health check to succeed.
4. Copy the service's public URL from Render and authorize its hostname in Firebase Authentication.
5. Open the app and verify Google sign-in and AI generation.

The blueprint enables automatic deployment of commits on `main`. Render must be connected to GitHub for automatic deployment; services created from a public clone without that connection need manual deployment. Free services sleep after inactivity, so the first request may be slow or time out while the service wakes.

## Project Layout

- [src/App.tsx](src/App.tsx): application shell.
- [src/components](src/components): app views and reusable UI.
- [src/lib](src/lib): local persistence, cloud sync, Firebase, and AI client logic.
- [src/server](src/server): API routes, validation, and Gemini integration.
- [src/firebase/rules.test.ts](src/firebase/rules.test.ts): emulator-backed security-rule tests.
- [server.ts](server.ts): production HTTP server.
- [firestore.rules](firestore.rules): account data access rules.
- [vite.config.ts](vite.config.ts): development API integration, build, and PWA configuration.
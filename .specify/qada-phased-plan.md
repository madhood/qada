# Qada — Phased SpecKit Plan

Roadmap of feature specs for the Qada app (make up missed prayers & fasts).

---

## Core Data Model (shared context for all specs)

- Store a **completed count per prayer type** (fajr, dhuhr, asr, maghrib, isha) and a **completed fast count**.
- Home salah header = `min(all 5 prayer counts)` rendered as **years / months / days** (month = 30 days — confirm in clarify).
- Each prayer row shows its **surplus** = `count − min` (read-only number) with `+` / `−` buttons.
- Fast section shows its count as y/m/d with `+` / `−` and **no number**.
- **Debt** (missed days) is stored separately and is NEVER shown on the home screen.

---

## Phase 1 — Core Tracking (MVP, offline-only)

### Spec 001 — Home Screen Counters
- Salah section: derived y/m/d progress header + 5 prayer rows (fajr, dhuhr, asr, maghrib, isha), each with surplus number and `+` / `−`.
- `+` needs no confirmation; shows a rotating congratulation / du'a message.
- `−` requires a kind confirmation dialog (encouraging tone, never shaming).
- Numbers are display-only, never directly editable.
- Fast section: y/m/d progress + `+` / `−`, no number shown.
- **Hard constraint:** salah + fast sections fit in one viewport on any screen — no scrolling.
- Worked example (acceptance scenario): counts 40/41/40/42/40 → header "1 month, 10 days"; surpluses 0/1/0/2/0. After `−` on fajr (confirmed) → 39/41/40/42/40 → header "1 month, 9 days"; surpluses 0/2/1/3/1.

### Spec 002 — Debt Entry & Progress
- Dedicated screen(s) to enter/estimate missed salah days and missed fast days (e.g., date-range or manual entry).
- Progress view: completed vs. debt — visible only here, opt-in, encouraging framing.
- Debt is editable/adjustable later without losing completed counts.

### Spec 003 — Local Persistence & Count Logic
- IndexedDB as offline source of truth; app fully functional with no network.
- Count/derivation logic (min, surplus, y/m/d formatting, +/− mutations) fully unit-tested (constitutionally required).
- Safe against crashes/refresh mid-update; no lost or double-counted taps.

---

## Phase 2 — Auth & Sync

### Spec 004 — Google Sign-In
- Google Identity Services, browser OAuth flow, `drive.appdata` scope only.
- Sign-in required before use; no other account system.
- Tokens handled per Google guidance, never logged or committed.

### Spec 005 — Google Drive Sync
- Local-first: local writes always succeed; sync to user's Drive appDataFolder when online.
- Conflict-safe merge (preserve user's most recent intent per counter); resilient to interrupted syncs — failed sync never corrupts or discards local data.
- Sync logic covered by automated tests (constitutionally required).

---

## Phase 3 — i18n, RTL & PWA

### Spec 006 — Internationalization & Direction
- i18n layer backing every user-facing string (no hardcoded copy); Arabic + English first.
- `dir` auto-derived from locale; CSS logical properties only; full RTL/LTR mirroring.
- Locale-aware numerals, dates, Hijri/Gregorian formatting.

### Spec 007 — Installable PWA & Offline Shell
- Web app manifest + service worker; installable to home screen.
- App shell cached — opens and functions fully offline.

### Spec 008 — Accessibility & Performance
- Color contrast, keyboard operability, screen-reader labels, reduced-motion support.
- Usable within seconds on a mid-range phone over 3G; bundle budget enforced.

---

## Phase 4 — Polish & Launch

### Spec 009 — Encouragement Content
- Curated library of congratulation messages / du'as for `+` actions and milestones (i18n-backed).

### Spec 010 — Deploy & Release
- Static build to Cloudflare Pages; CI runs `npm run lint` + `npm run check` + tests.
- Bundle-size audit; final constitution review gate (no backend, scope unchanged, RTL/a11y verified).

---

## Open Questions (resolve in `/clarify`)

1. Is a "month" a fixed 30 days for y/m/d formatting?
2. Should `−` be blocked (or extra-confirmed) when it would reduce the minimum (i.e., surplus is 0)?
3. How is debt estimated — manual number, date range (puberty → started praying), or both?
4. Are fasts tracked in days only, or also with a per-Ramadan breakdown?
5. Which locales ship at launch beyond Arabic and English?

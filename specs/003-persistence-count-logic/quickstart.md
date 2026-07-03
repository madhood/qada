# Quickstart & Validation: Local Persistence & Count Logic

How to run feature 003 and prove it satisfies the spec. Persistence sits behind the Spec 001/002
stores; their screens are unchanged.

## Prerequisites

- Specs 001 and 002 in place (counters + debt stores and screens).
- No new dependencies to install (uses the built-in `localStorage`).

## Run

```bash
npm run dev                 # http://localhost:3000
npm run test                # persistence.test.ts + store.test.ts + calc tests (FR-014 / SC-007)
npm run check && npm run lint
npm run build && npm run preview   # static output (Constitution III)
```

## Manual validation script

Use DevTools → Application → Local Storage (key `qada.progress.v1`) and the Network "Offline"
toggle. All checks must pass.

| # | Action | Expected | Spec ref |
|---|--------|----------|----------|
| 1 | Record counts (e.g. tap prayers to 40/41/40/42/40) and set prayer debt 500; note `qada.progress.v1` | The key holds a JSON record with those values | FR-001, US1-AS1 |
| 2 | DevTools → Network → Offline, then record another prayer | The tap succeeds and the stored count updates with no network | FR-002, US1-AS2 |
| 3 | Fully close the tab/app and reopen (still offline) | Every count and debt is restored exactly as left | FR-001, SC-001, US1-AS1/AS3 |
| 4 | On a count of 40, tap `+` 10 times within 3s; then read `qada.progress.v1` | Stored count is exactly 50; on-screen number matches storage | FR-004, FR-006, SC-002, US2-AS1 |
| 5 | On a count of 0, tap `−` | Stored value stays 0 (never negative) | FR-005, US2-AS3 |
| 6 | Edit the stored value to `{ not json` in DevTools, reload | App loads a clean zero state, no crash, no garbage numbers | FR-011, edge "corrupted" |
| 7 | Edit stored `prayers.fajr` to `-3` and `fasts` to `2.9`, reload | Loads `fajr 0`, `fasts 2` (clamped) — never negative/fractional | FR-005/011 |
| 8 | Derived checks: counts 40/41/40/42/40 | Salah progress "1 month, 10 days"; surpluses 0/1/0/2/0 | FR-007/008/010, US3-AS1 |
| 9 | Derived checks: fast/completed 730 days | Formats "2 years, 10 days" | FR-010, US3-AS2 |
| 10 | Derived checks: debt 500, completed 120 | Remaining 380, 24% (clamped, never >100% or negative) | FR-009, US3-AS3, SC-004 |
| 11 | All counts and debt 0 | Progress "0 days", surpluses 0, remaining 0, no errors | US3-AS4 |
| 12 | Open the app in two tabs; change a count in tab A | Tab B converges to the new value (no inconsistent total) | FR-015, edge "concurrent tabs" |
| 13 | Simulate blocked storage: in console run `Storage.prototype.setItem = () => { throw new Error() }`, then record a tap | A calm banner appears ("Progress may not be saved"); the tap still works in-session; no silent loss | FR-012, SC-005, edge "unavailable" |
| 14 | Set a very large value (`fasts: 40000`) in storage, reload | Stored and displayed without overflow/precision loss | edge "very large" |
| 15 | Set stored `version` to `0` (or remove it), reload | Data is migrated/coerced to the current schema with no loss | FR-013, SC-006, edge "schema evolution" |

## Success-criteria coverage

- **SC-001** (offline close/reopen restores 100%): checks 1–3.
- **SC-002** (10 taps → exactly 50): check 4 + extended `store.test.ts`.
- **SC-003** (derived matrix incl. 0 and ≥10,000): checks 8–11, 14 + `calc.test.ts`.
- **SC-004** (never negative / never >100%): checks 5, 7, 10 + calc tests.
- **SC-005** (unavailable surfaces, 0% silent loss): check 13.
- **SC-006** (data survives updates / migration): check 15 + `migrate` tests.
- **SC-007** (automated tests cover count+derivation and pass): `npm run test`.

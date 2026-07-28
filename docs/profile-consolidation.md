# Profile module consolidation — decision table

Audit of the duplicated master-data UIs. **Nothing has been deleted.** This
records what exists and what it costs, so the cuts can be decided deliberately.

Generated 2026-07-27 against `main`.

## The three stacks

| Stack | Location | Mechanism | Entry point |
|---|---|---|---|
| A | `src/app/dashboard/profiles/*` | API routes (`/api/profiles/*`) | Profiles hub (`/dashboard/profiles`) |
| B | `src/app/dashboard/master-profile/*` | Server actions (`actions.ts`) | Sidebar |
| C | `src/app/dashboard/admin/master-profile/*` | Server actions | Sidebar |

Stack **C does not overlap with A or B** except for Finished Good. It owns
Customer, Supplier, Tax and Finished Good and is otherwise not part of the
duplication problem.

The important finding is that **both A and B are live**: the sidebar sends users
to stack B, while the Profiles hub page sends them to stack A. Two different
screens edit the same rows, so whichever one a user happens to open determines
which validation and field set they get.

## Duplicated pairs

| Model | Stack A (API) | Stack B (actions) | In sidebar | In hub | Recommendation |
|---|---|---|---|---|---|
| Main Process | `profiles/main-process` (582 LOC) | `master-profile/main-process` (699 LOC) | B | A | Keep **B**, redirect A |
| Main Process (2nd copy) | `profiles/main-processes` (598 LOC) | — | — | — | **Delete** — orphaned, no inbound link |
| Material Type | `profiles/material-types` (598) | `master-profile/material-type` (584) | B | A | Keep **B**, redirect A |
| Joint | `profiles/joint-profiles` (598) | `master-profile/joint` (641) | B | A | Keep **B**, redirect A |
| Welding Type | `profiles/welding-types` (598) | `master-profile/welding-type` (586) | B | A | Keep **B**, redirect A |
| Painting Method | `profiles/painting-method` (598) | `master-profile/painting-method` (586) | B | A | Keep **B**, redirect A |
| Process Profile | `profiles/process-profiles` (779) | `master-profile/process-profile` (860) | B | A | Keep **B**, redirect A |
| Finished Good | `profiles/finished-good` (763) | `admin/master-profile/finished-good` (667) | C | A | **Decide** — both in nav |

Roughly **4,500 LOC** of stack-A duplicates could be retired.

### Why "keep B" for the first six

Not because server actions are better than API routes, but because:

1. The sidebar is the primary navigation, and it points at B.
2. B is consistently the larger implementation (extra validation and fields).
3. `main-processes` proves stack A already drifted into a second stale copy.

The counter-argument is real: stack A has REST endpoints under
`/api/profiles/*` that stack B lacks, so anything integrating over HTTP depends
on A. **Deleting A's pages does not require deleting A's API routes** — keep
`/api/profiles/*` and delete only `src/app/dashboard/profiles/<model>/`.

### Finished Good needs a decision

The only pair where **both entries are in the sidebar**, so users see two
"Finished Good Profile" links today. `profiles/finished-good` is larger (763 vs
667 LOC). This one genuinely needs someone who knows which screen the business
uses.

## Fixed in this pass

Six tiles on the Profiles hub pointed at routes that exist in neither a static
directory nor `PROFILE_REGISTRY`, so they fell through to `[type]` and rendered
**"Invalid Profile — the profile type does not exist"**. They now point at the
pages that actually own each model:

| Hub tile | Was (dead) | Now |
|---|---|---|
| Employee | `/dashboard/profiles/employee` | `/dashboard/master-profile/employee` |
| Tax | `/dashboard/profiles/tax` | `/dashboard/admin/master-profile/tax` |
| Customer | `/dashboard/profiles/customer` | `/dashboard/admin/master-profile/customer` |
| Supplier | `/dashboard/profiles/supplier` | `/dashboard/admin/master-profile/supplier` |
| Material | `/dashboard/profiles/material` | `/dashboard/master-profile/material` |
| Failure Mode | `/dashboard/profiles/failure-mode` | `/dashboard/master-profile/failure-mode` |

Also fixed: `PROFILE_REGISTRY` now carries a `fields` array per profile type.
The generic `[type]` page previously hardcoded
`type === "currency" ? CURRENCY_FIELDS : []`, so any other registered type would
have rendered an empty form. Field configs for all seven registered types now
live in `src/lib/profiles-schema.ts`.

> Note: a static route always beats the `[type]` segment, so `uom`, `machine`,
> `bank`, `elcometer`, `payment-term` and `finished-good` still resolve to their
> own hand-written pages. Their registry entries back the API and stand ready if
> those bespoke pages are retired.

## Incoterm — still built, removed from the spec

Spec v1.1 removed Incoterm, but it remains fully implemented and reachable:

- `IncotermProfile` model in `prisma/schema.prisma`
- `INCOTERM_PROFILE` module in `src/lib/modules.config.ts`
- Pages at `src/app/dashboard/profiles/incoterm/`
- API at `src/app/api/profiles/incoterm/`
- A live sidebar link and a hub tile

**Not removed here**, because removing it means a destructive migration and it
is unclear whether existing documents reference incoterms. Suggested order when
you decide to cut it: drop the nav link and hub tile first (makes it
unreachable, reversible in one commit), confirm no rows reference it, then drop
the module, routes and model.

## Suggested sequence

1. Delete `profiles/main-processes` — orphaned, zero inbound links, zero risk.
2. Decide Finished Good, remove the losing sidebar entry.
3. For the six pairs: `redirect()` the stack-A page to its stack-B equivalent,
   ship it, and delete the stack-A page a release later once nothing 404s.
4. Keep `/api/profiles/*` regardless — it is the only REST surface for this data.
5. Retire Incoterm as described above.

# FITPRISE EMS — Specification

Source: *Vision One — Requirement Documentation v1.1* (Enhanzcom, 21 Jun 2017).
This is a clean, module-by-module restatement for engineering use. Each file below is the **single source of truth** for its area — do not re-read the PDF unless a file is ambiguous.

## What the system does

FITPRISE is an Enterprise Management System for **Vision One Pte Ltd** (and **Vision Laser Pte Ltd**) — a fabrication / welding / spray-painting shop. It tracks:

1. **Sales delivery status** — from sales order through work order to delivery + Certificate of Conformity.
2. **Production routing & process parameters** — scan in/out at a production terminal; capture welding / spray painting / machining parameters; supervisor confirmation; QC sign-off.
3. **Purchasing cost per work order** — material PO + subcon PO tied (optionally) to a work order so total job cost can be computed.

**Explicitly out of scope:** quotation management, inventory/stock balance tracking, in-system rework (rework is done offline), external NCR (customer returns become a new sales order).

## End-to-end workflow

```
Sales Order ── (confirm) ──> Work Order (auto-generated per batch)
                                 │
        ┌────────── routing-process planning ──────────┐
        │                                              │
   Material PR → PO → Approval → GR (→ Goods Return)   │  Subcon PO → Approval
        │                                              │     → Subcon Request Form (SRF)
        │                                              │     → Subcon Return Tracking (SRT)
        └────────── Production Terminal scan IN/OUT ───┤
                          │                            │
              capture process parameters ─────────────►│
                          │
              Supervisor: Process Parameter Confirmation
                          │
                  All routing processes done
                          │
                       QC Approval (pass/fail; fail → NCR, rework offline)
                          │
                    Delivery Order (manual DO number)
                          │
                    COC (Welding / Spray Paint / Pressure / Final)
```

Two purchase flavors, each can be **with-WO** or **without-WO**:
- **Material/non-material purchase** — PR is mandatory, then PO → GR → optional Goods Return.
- **Subcon purchase** — no PR; PO must tie to a specific routing process (when with-WO); SRF acts as delivery note to subcon; SRT receives items back. A routing process can only start once subcon items for it are **fully received**.

## Companies (multi-tenant rules)

- `Vision One Pte Ltd` — can create PO with or without work order.
- `Vision Laser Pte Ltd` — can only create PO **without** work order.
- Single shared database; companies are rows in Company Profile (no separate DBs).

## Cross-cutting rules

- **No DELETE anywhere** — Void only. Running numbers must stay contiguous.
- **Backdating is never allowed** on entry dates; forward-dating usually is.
- **Exchange rate** is always the latest from Currency Profile at the moment the transaction is created; transaction date does not affect which rate is used. Once a downstream doc (GR, SRT…) is created the rate is frozen.
- **Approval** applies only to Purchase Order (material) and Purchase Order — Subcon. Two tiers, value-banded, configured in Approval Level Profile. PR, SO, WO, NCR, GR, GR-Return, SRF, SRT, DO need no approval. COC needs one check + one approval.
- **Email notification** is sent on PR submit and on PO approval transitions. Approved material PO is auto-emailed to supplier with PDF attached. Approved subcon PO is **not** auto-sent — purchaser sends it manually.
- **Printouts:** Calibri 10, PDF, blank A4 (no pre-printed letterhead). Black = static; blue = dynamic. Delivery Label is a 102×51 mm sticker.

## Number formats

| Doc | Format | Example | Reset |
|---|---|---|---|
| Sales Order | `8XXXXX-RN` | `800003-R2` | never (rolls 8→9 at 899999) |
| Work Order | `8XXXXX-A-B` | `800003-2-3` | tied to SO |
| Purchase Requisition | `PRYYXXXXX-RN` | `PR1700003-R2` | yearly |
| Purchase Order (material **and** subcon, shared sequence) | `POYYXXXXX-RN` | `PO1700003-R2` | yearly |
| Goods Receive | `GRYYXXXXX` | `GR1700003` | yearly |
| Goods Return | `RTNYYXXXXX` | `RTN1700003` | yearly |
| Subcon Request Form | `SRFYYXXXXX` | `SRF1700003` | yearly |
| Subcon Return Tracking | `SRTYYXXXXX` | `SRT1700003` | yearly |
| Non-Conformance Report | `NCRYYYYMMXX` | `NCR20170605` | monthly |
| Certificate of Conformity | `COCYYXXXXX` | `COC1700003` | yearly |
| Delivery Order | user-entered, not generated | — | — |

## Files in this directory

| File | Covers |
|---|---|
| [profiles.md](profiles.md) | All 21 master-data / reference modules (Company, Employee, Customer, Supplier, Material, Process, Machine, Failure Mode, …) |
| [sales-order.md](sales-order.md) | Sales Order (header / item / batch) |
| [work-order.md](work-order.md) | Work Order, In-Process, Routing Process, Employee timesheet, welding/painting/machining parameter capture |
| [production-terminal.md](production-terminal.md) | Scan IN/OUT terminal; rules and parameter entry forms |
| [qc-and-ncr.md](qc-and-ncr.md) | Process Parameter Confirmation, QC Approval, Non-Conformance Report |
| [purchasing.md](purchasing.md) | Purchase Requisition, Purchase Order, PO Approval, Goods Receive, Goods Return |
| [subcon.md](subcon.md) | PO-Subcon, PO-Subcon Approval, Subcon Request Form, Subcon Return Tracking |
| [delivery-and-coc.md](delivery-and-coc.md) | Delivery Order, Certificate of Conformity (4 types) |
| [printouts.md](printouts.md) | All PDF/label printouts: WO, Delivery Label, NCR, PO, PO-Subcon, SRF, COC×3, PR |
| [reports.md](reports.md) | Sales, Work Order Costing, NCR, Purchasing, Subcon Purchasing reports |

## Conventions used in module files

Each module section uses this layout:

```
## <Module Name>

**Purpose:** one-line.
**Used by:** which other modules consume this.

### Rules
- bullet list of business rules

### Fields  (table verbatim from source: # / Field / Type / Source / Mand / Unique / Notes)

### Status flow (if applicable)
Draft → ... → Closed
```

Notes:
- `Active/Inactive` status with activate-via-button + "default Active" is universal on profiles and is omitted from the per-module rules to reduce noise.
- All key fields marked "Once saved, cannot be changed" in the source remain immutable post-create.
- `Incoterm Profile` was removed in v1.1 (struck through in source). The `Incoterm` field on Sales Order is also removed.

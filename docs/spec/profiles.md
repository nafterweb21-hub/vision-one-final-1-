# Profile Modules

Reference / master data. Universal rules (omitted from each section below):

- Every profile has Active/Inactive status with activate-via-button; default Active.
- Fields marked "Once saved, cannot be changed" are immutable after create.
- Profiles whose dropdowns are used in operation modules: the operation module is allowed to create new entries directly when the value isn't found, **for these profiles only** — Material Type, Welding Type, Joint, Machine, Painting Method, Failure Mode. Everything else requires going to the profile first.

---

## 1. Company Profile

**Used by:** all printouts, PR, PO, PO-Subcon, GR, RTN, SRF, SRT.

**Rules**
- Single shared DB — companies are rows, not separate databases.
- `Allow to create PO for WO` flag governs whether the company can tie POs to work orders. Vision One = ticked; Vision Laser = unticked.
- `AS9100 Requirement Note Required?` flag toggles the AS9100 supplier note block on PO / PO-Subcon / SRF / PR printouts.

**Fields**
| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Company Name | Text | User | Y | Y | |
| 2 | Address | Multi-text | User | Y | N | |
| 3 | Phone No | Text | User | Y | N | |
| 4 | Fax No | Text | User | Y | N | |
| 5 | Email | Text | User | N | N | |
| 6 | Website | Text | User | N | N | |
| 7 | ROC No | Text | User | N | N | |
| 8 | GST Registration No | Text | User | Y | N | |
| 9 | Upload URL | Read-only | — | Y | N | |
| 10 | File Upload | Hyperlink | — | — | — | |
| 11 | Logo Name | Text | User | Y | N | |
| 12 | Footer Name | Text | User | Y | N | |
| 13 | Allow to create PO for WO | Checkbox | User | N | N | Default unticked |
| 14 | AS9100 Requirement Note Required? | Checkbox | User | N | N | Default unticked |
| 15 | Status | Read-only | System | — | — | Active/Inactive |

---

## 2. Employee Profile

**Used by:** Approval Person, Sales Order (Salesperson), PR/PO/GR/RTN (Creator/Purchaser), Production Terminal, NCR (Requestor/Responsible Party/etc.), Process Parameter Confirmation, COC.

**Rules**
- Employee is not necessarily a system user.
- `Employee Name` is immutable once saved.
- `NRIC / FIN` is sourced from another Employee Profile entry (?? — per source) and is used on COC printouts.

**Fields**
| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Employee Code | Text | User | Y | Y | |
| 2 | Employee Name | Text | User | Y | N | Immutable |
| 3 | NRIC / FIN | Dropdown | Employee Profile | Y | Y | For COC printout |
| 4 | Designation | Text | User | N | N | |
| 5 | Email | Text | User | Y | N | For email notifications |
| 6 | Mobile No | Text | User | N | N | |
| 7 | Gender | Choice | — | N | N | Male / Female |
| 8 | Contact No | Text | User | N | N | |
| 9 | Employment Type | Choice | — | N | Y | Citizen / PR / Employment Pass / S Pass / Work Permit |
| 10 | Status | Read-only | System | — | — | |

---

## 3. Approval Level Profile

**Used by:** PO (material) and PO-Subcon. Not PR, not WO.

**Rules**
- Defines value bands (Min Range / Max Range, 2 decimals) and assigns approver(s) to each band.
- One band can have multiple approvers; any one of them can approve a PO in that band.
- Two-tier example from source:
  - Tier 1: $0.00–$499.99
  - Tier 2: $500.00–$1,000,000.00
- For tier-2 POs, tier-1 must approve first, then tier-2.

**Fields (band)**
| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Module | Dropdown | Fixed | Y | N | |
| 2 | Action/Button | Dropdown | Fixed | N | N | |
| 3 | Min Range | Numeric | User | N | N | 2 decimals |
| 4 | Max Range | Numeric | User | N | N | 2 decimals |
| 5 | Status | Read-only | — | — | — | |

**Fields (Approval Person)**
| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Approval Person | Dropdown | User Profile | Y | Y | |
| 2 | Email | Read-only | System | — | — | |
| 3 | Status | Read-only | — | — | — | |

---

## 4. Tax Profile

**Used by:** Sales Order, PO, PO-Subcon.

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Tax Type | Text | User | Y | Y | Immutable. e.g. `GST @ 7%` |
| 2 | Tax Rate | Numeric | User | Y | N | 3 decimals |
| 3 | Status | Read-only | — | — | — | |

---

## 5. Currency Profile

**Used by:** Sales Order, PO, PO-Subcon (and downstream GR/RTN/SRT inherit).

**Rules**
- Exchange rate updated as needed. All transactions snap the **latest** rate at create time. Transaction date is irrelevant.
- If no rate defined for a currency, system aborts the transaction with a prompt.
- Foreign currency values convert to SGD using this rate.
- One currency can be marked default.

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Currency Code | Text | User | Y | Y | Immutable. e.g. `MYR` |
| 2 | Currency Name | Text | User | Y | Y | Immutable. e.g. `Malaysia Ringgit` |
| 3 | Exchange Rate | Numeric | User | Y | N | 3 decimals |
| 4 | Status | Read-only | — | — | — | |
| 5 | Default | Checkbox | User | N | N | Default unticked |

---

## 6. Customer Profile

**Used by:** Sales Order, NCR, Delivery Order, COC.

**Rules**
- Customer must be created in this profile before use elsewhere.
- A customer has multiple Contact Persons and multiple Addresses. Each set has exactly one Default.
- `Customer Code` and `Customer Name` are immutable.

**Fields (header)** — Customer Code (Text, Y, Y, immutable) · Customer Name (Text, Y, Y, immutable) · Remarks (Multi-text, N, N) · Status.

**Contact Person** — Contact Person (Y, N), Tel No, Mobile No, Fax No, Email, Designation, Status, Default (exactly one).

**Address** — Address (Y, Y), Status, Default (exactly one).

---

## 7. Supplier Profile

Structure identical to Customer Profile (header + Contact Person + Address with one Default each). Used by PR, PO, PO-Subcon, GR, RTN, SRF, SRT. New supplier must exist here before use in PO.

---

## 8. UOM Profile

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | UOM | Text | User | Y | Y | Immutable. e.g. `Piece`, `Pair`, `Box` |
| 2 | Remarks | Multi-text | User | N | N | |
| 3 | Status | Read-only | — | — | — | |

Used by Material profile, SO, PR, PO. (Material itself has no UOM; UOM is specified per PO.)

---

## 9. Payment Term Profile

**Used by:** Sales Order (reference only).

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Term | Text | User | Y | Y | Immutable. e.g. `COD` |
| 2 | Day | Numeric | User | Y | N | Integer |
| 3 | Remark | Multi-text | User | N | N | |
| 4 | Status | Read-only | — | — | — | |

---

## 10. Material Category Profile

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Category | Text | User | Y | Y | Immutable |
| 2 | Remark | Multi-text | User | N | N | |
| 3 | Status | Read-only | — | — | — | |

Used by Material Profile.

---

## 11. Material Profile

**Used by:** PR, PO (a PR/PO line can also be free-text not from the profile).

**Rules**
- Material must exist here before use in POs (when picking from profile).
- Different suppliers may have different descriptions/UOMs; the supplier-specific description is captured on the PO line, but Material Profile holds the agreed internal part no / description.
- **No UOM** is tied to a material — UOM is per-PO.
- Material can be deactivated even when there's an open receipt pending.

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Part No | Text | User | N | Y | Immutable |
| 2 | Description | Multi-text | User | Y | Y | Immutable |
| 3 | Shape | Text | User | Y | N | |
| 4 | Size | Text | User | N | N | |
| 5 | Material Category | Dropdown | Material Category | Y | N | |
| 6 | Remark | Multi-text | User | N | N | |
| 7 | Status | Read-only | — | — | — | |

---

## 12. Finished Good Profile

**Used by:** Sales Order (Part No dropdown).

**Rules**
- Must exist before use in Sales Order.
- No UOM (no quantity tracking required).

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Part No | Text | User | N | Y | Immutable |
| 2 | Description | Multi-text | User | Y | Y | Immutable |
| 3 | Remark | Multi-text | User | N | N | |
| 4 | Status | Read-only | — | — | — | |

---

## 13. Material Type Profile

Single field `Type` (Y, Y, immutable; e.g. `Stainless Steel`) + Remark + Status.
Used in Work Order welding parameter. Allow inline create from the operation module.

---

## 14. Welding Type Profile

Single field `Type` (Y, Y, immutable; e.g. `SMAW`) + Remark + Status.
Used in Work Order welding parameter. Allow inline create.

---

## 15. Joint Profile

Single field `Joint` (Y, Y, immutable; e.g. `Spot Weld`) + Remark + Status.
Used in Work Order welding parameter. Allow inline create.

---

## 16. Machine Profile

**Used by:** Work Order welding/machining parameter capture, Production Terminal.

**Rules**
- Allow inline create from operation module.
- Each routing process ties to only one process-parameter type.
- `Machine Category` filters which machines appear in welding vs machining parameter dropdowns.

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Machine Code | Text | User | Y | Y | Immutable |
| 2 | Machine No | Text | User | Y | N | |
| 3 | Brand | Text | User | Y | N | |
| 4 | Model | Text | User | Y | N | |
| 5 | Current | Text | User | N | N | |
| 6 | S/No | Text | User | N | N | |
| 7 | Machine Type | Fixed Choice | — | N | N | CNC / Convention |
| 8 | Operation Type | Fixed Choice | — | N | N | Milling / Turning |
| 9 | Remark | Multi-text | User | N | N | |
| 10 | Upload | Hyperlink | Upload File | — | — | |
| 11 | Machine Category | Fixed Choice | — | Y | N | Welding Machine / Machine — filters into WO parameter dropdowns |
| 12 | Status | Read-only | — | — | — | |

---

## 17. Elcometer Profile

**Used by:** Process Parameter Confirmation (Spray Painting). Elcometer must exist here before use.

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Elcometer Serial No | Text | User | Y | Y | Immutable. e.g. `ELCO001` |
| 2 | Remark | Multi-text | User | N | N | |
| 3 | Status | Read-only | — | — | — | |

---

## 18. Main Process Profile

**Used by:** Work Order, PO-Subcon, monthly planning, NCR.

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Main Process | Text | User | Y | Y | Immutable. e.g. `Sizing of Materials` |
| 2 | Remark | Multi-text | User | N | N | |
| 3 | Status | Read-only | — | — | — | |

---

## 19. Painting Method Profile

Single field `Painting Method` (Y, Y, immutable; e.g. `Gunkote`, `Antiskid`) + Remark + Status. Used by COC. Allow inline create from COC.

---

## 20. ~~Incoterm Profile~~ (removed in v1.1)

Struck through in source. The corresponding Incoterm field on Sales Order is also removed.

---

## 21. Process Profile (Routing Process)

**Used by:** Work Order, PO-Subcon, terminal scanning, monthly planning, NCR.

**Rules**
- One row = one routing process under a Main Process, with a cost-per-minute.
- The three checkboxes (Welding / Spray Painting / Machining) determine **which** parameter form is shown to the worker on scan-out at the production terminal. At most one applies per row.

| # | Field | Type | Source | Mand | Uniq | Notes |
|---|---|---|---|---|---|---|
| 1 | Main Process | Dropdown | Main Process | Y | N | Immutable |
| 2 | Routing Process | Text | User | — | — | Immutable |
| 3 | Welding | Checkbox | User | N | N | Ticked → welding parameter on scan out |
| 4 | Spray Painting | Checkbox | User | N | N | Ticked → spray painting parameter on scan out |
| 5 | Machining | Checkbox | User | N | N | Ticked → machining parameter on scan out |
| 6 | Cost Per Minute | Numeric | User | Y | N | 2 decimals |
| 7 | Remark | Multi-text | User | N | N | |
| 8 | Status | Read-only | — | — | — | |

---

## 22. Failure Mode Profile

Single field `Failure Mode` (Y, Y, immutable; e.g. `Coating`, `Welding Defect`, `Dimensional`) + Remark + Status. Used by NCR. Allow inline create from NCR.

# QC & Non-Conformance

Three closely related modules: **Process Parameter Confirmation** (supervisor sign-off on parameter capture), **QC Approval** (pass/fail the WO item), **Non-Conformance Report** (record rejected quantity; rework happens offline).

---

## Process Parameter Confirmation

**Purpose:** Supervisor confirms the parameters captured at the Production Terminal.

### Rules

- **Read-only** module. Any parameter modification must be done in Work Order → In Process → Routing Process → Process Parameter by an authorized user.
- Only items pending confirmation appear here. Users with access see all pending items.
- Three forms: Welding, Spray Painting, Machining — structures mirror the Work Order parameter forms.

### Action flow

1. Select record(s).
2. Optionally change `Confirm By` (defaults to login employee).
3. For Spray Painting: select `Elcometer Serial No` (from Elcometer Profile, **mandatory**).
4. Click `[Confirm]`.
5. Record is removed from this module; info populates back to WO parameter row (incl. `Status`, `Confirmed By`, `Confirmed Date`, and for spray painting: `Elcometer Name` + `Elcometer Serial No`).

### Field tables

Welding / Spray Painting / Machining tables mirror the Work Order Process Parameter tables but every field is Read-only (sourced from Production Terminal). The only user-editable items are:

- All forms: `Confirmed By` (Dropdown, Employee, default login)
- Spray Painting only: `Elcometer Serial No` (Dropdown, Elcometer, Mandatory)

---

## QC Approval

**Purpose:** QC department passes or fails the WO item as a whole.

### Rules

- **Read-only** display (structure identical to Work Order). No editing.
- Only pending or rejected WO items appear here.
- Approve/Reject the **whole WO quantity** — no partial acceptance quantity.
- **On Approve:** record leaves this module; `QC Acceptance / QC By / QC Date` populate back to WO. WO becomes Completed; delivery allowed.
- **On Reject:** record stays here pending offline fix and re-approval.

### Action flow

1. Select record(s).
2. Click `[Approve]` or `[Reject]`.

### Fields (subset — most are mirrors of Work Order)

The only user action is the `QC` activate button: Approved / Rejected (Mandatory, Yes). Everything else (Work Order No, Date, Customer, Internal Quotation No, Customer PO Ref, Project Code, Delivery Date, Job Description, Qty, Amount, Remark, Process, Upload, Status) is read-only from Work Order.

The nested **In Process** and **Routing Process** tables are likewise full mirrors of the WO equivalents, all read-only.

---

## Non-Conformance Report (NCR)

**Purpose:** internal record of rejected quantity from a routing process. **No external NCR** — customer returns / changes become a new sales order.

### Rules

- **1 NCR : 1 WO : 1 Routing Process.** One WO or one routing process can have multiple NCRs.
- NCR can be created when WO Status ∈ {Proceed, Pending for QC} **OR** QC Status = Rejected.
- One NCR can document multiple problems / root causes / corrective actions / preventive actions / follow-ups.
- One NCR can have multiple disposition decisions:
  `[NCR Quantity] = [Rework Qty] + [Use As Is Qty] + [Scrap Qty] + [Other Qty]`.
- All rework is **offline**. The system does not track rework cost.
- WO can advance to the next routing process even before the NCR is submitted (using the original full quantity).
- NCR quantity per voucher ≤ WO quantity. But you can issue **another** NCR voucher for the same quantity.
- **No approval, no email notification.**
- NCR can be printed; typical flow is print → other parties fill the hardcopy → requestor enters it back into the system for analytics.
- `Failure Mode` is a checkbox-multi-select from Failure Mode Profile.
- `Reason to Justify` is enabled only when `Corrective Action = No`.
- `Verified / Confirmed By` and its `Date` are mandatory **before submission** (even though the column-level mandatory flag is "No").

### Number format

`NCRYYYYMMXX` → e.g. `NCR20170605`. `XX` is a 2-digit running sequence **reset monthly**.

### Status flow

`Draft → Closed | Void`.

### Steps to create

1. Select Customer, Work Order No, In-Process Description, Main Process, Routing Process.
2. Enter quantity, problem and related info.
3. System assigns NCR No.

### Fields

| # | Field | Type | Source | Mand | Notes |
|---|---|---|---|---|---|
| 1 | NCR No | Read-only | System | — | `NCRYYYYMMXX` |
| 2 | NCR Date | Date | User | Y | Default today; editable within same year/month |
| 3 | Customer | Dropdown | Customer | Y | |
| 4 | Work Order No | Dropdown | Work Order | Y | |
| 5 | Customer Ref No | Read-only | from SO via WO | — | |
| 6 | Project Code | Read-only | from SO via WO | — | |
| 7 | Drawing No | Read-only | from SO via WO | — | = SO Part No |
| 8 | Product Description | Read-only | from SO via WO | — | = SO Description |
| 9 | In-Process Description | Dropdown | from WO | Y | only completed or WIP |
| 10 | Main Process | Dropdown | filtered by In-Process | Y | only completed or WIP |
| 11 | Routing Process | Dropdown | filtered by Main | Y | only completed or WIP |
| 12 | Requestor | Dropdown | Employee | Y | default login |
| 13 | Responsible Party | Dropdown | Employee | N | |
| 14 | Description of Non-Conformance / Problem | Multi-text | User | Y | |
| 15 | NCR Quantity | Numeric | User | Y | = Rework + Use-As-Is + Scrap + Other |
| 16 | Rework Quantity | Numeric | User | N | Disposition, 0 dec |
| 17 | Use-As-Is Quantity | Numeric | User | N | 0 dec |
| 18 | Scrap Quantity | Numeric | User | N | 0 dec |
| 19 | Other Decisions | Text | — | N | |
| 20 | Other Quantity | Numeric | User | N | 0 dec |
| 21 | Customer Acceptance for Use-As-Is | Fixed Choice | — | N | No / Yes |
| 22 | Department | Fixed Choice | — | N | Laser Cutting / Bending / Machining / Welding / Painting / Assembly / Others |
| 23 | Failure Mode | Checkbox | Failure Mode Profile | N | Multi |
| 24 | Corrective Action | Fixed Choice | — | N | No / Yes |
| 25 | Reason to Justify | Multi-text | User | N | Enabled only if Corrective Action = No |
| 26 | Root Cause | Multi-text | User | N | |
| 27 | Responsible Staff | Dropdown | Employee | N | |
| 28 | Date | Date | User | N | |
| 29 | Corrective / Preventive Action | Multi-text | User | N | |
| 30 | Responsible Staff | Dropdown | Employee | N | |
| 31 | Date | Date | User | N | |
| 32 | Follow-Up / Verification of Correction | Multi-text | User | N | |
| 33 | Action Taken | Fixed Choice | — | N | Acceptable / Not Acceptable |
| 34 | Verified / Confirmed By | Dropdown | Employee | N* | *Mandatory before submission |
| 35 | Date | Date | User | N* | *Mandatory before submission |
| 36 | Status | Read-only | — | — | Draft / Void / Closed |

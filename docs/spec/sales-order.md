# Sales Order

**Purpose:** capture a confirmed sales order. (Quotation is offline; attachments can be uploaded.)
**Feeds:** Work Order, NCR, Delivery Order, COC, all reports.

## Rules

- **No access control on viewing:** all salespersons see/edit each other's SOs.
- **No printout** from the system.
- **No DELETE** — use Void.
- **No Discount column.**
- **Approval is not required.**
- **Exchange rate** comes from Currency Profile (latest).
- **Revision** allowed only while no work order has been created yet. Revision increments by 1; old revision row gets `Status = Old Version`.
- Customer must already exist in Customer Profile.
- Three-level structure: **Sales Order → Item → Batch**. Each Item batch is tied to **exactly one** Work Order; no merging batches into one WO.
- On SO confirmation, a Work Order No is **auto-generated** per batch (but the WO must still be created in the Work Order module to start operations).
- **Stop Purchase** button at batch level halts further purchasing tied to that batch.
- Purchaser can issue any Purchase Order (including PO-Subcon) once the SO is confirmed.
- **`No Routing Process` tickbox** (batch level): used when a PO-Subcon is required for this batch *with* a work order *but without* an in-house routing process — bypasses routing and goes direct to purchase.
- All purchases tied to this SO can be capped via `Stop Purchase`.

## Number format

`8XXXXX-RN` → e.g. `800003-R2`. The leading `8` rolls to `9` when 899999 is reached. `XXXXX` is a 5-digit running sequence with **no yearly reset**. `R` + `N` = revision number.

The auto-generated Work Order No per batch is `8XXXXX-A-B` where A = sequential part-no index within the SO, B = batch index within that part.

## Status flow

`Draft → Confirmed → (Revised → Old Version) | Closed | Void`

## Fields — Sales Order (header)

| # | Field | Type | Source | Mand | Notes |
|---|---|---|---|---|---|
| 1 | Sales Order No | Read-only | System | — | `8XXXXX-RN` |
| 2 | Revision | Read-only | System | — | Starts at 0; +1 per revision |
| 3 | Date | Date | User | Y | Default today; forward OK, backdate not allowed |
| 4 | Salesperson | Dropdown | Employee | Y | Default = login user |
| 5 | Customer | Dropdown | Customer | Y | |
| 6 | Customer PO Ref | Text | User | N | |
| 7 | Project Code | Text | User | N | |
| 8 | ~~Incoterm~~ | — | — | — | **Removed in v1.1** |
| 9 | Payment Term | Dropdown | Payment Term | N | |
| 10 | Other Payment Detail | Text | User | N | |
| 11 | Ref Contract | Text | User | N | |
| 12 | Currency | Dropdown | Currency | Y | |
| 13 | Exchange Rate | Read-only | System (latest) | — | 3 decimals |
| 14 | Amount Before Tax | Read-only | Computed | — | 2 decimals; sum of items |
| 15 | Tax Type | Dropdown | Tax | Y | |
| 16 | Tax Rate | Read-only | Computed | — | 3 decimals |
| 17 | Tax Amount | Read-only | Computed | — | 2 decimals |
| 18 | Amount After Tax | Read-only | Computed | — | 2 decimals |
| 19 | Contact Person | Dropdown | Customer Contact | Y | |
| 20 | Fax | Text | User | N | |
| 21 | Tel | Text | User | N | |
| 22 | Email | Text | User | Y | |
| 23 | Deliver To | Dropdown | Customer Address | N | |
| 24 | Bill To | Dropdown | Customer Address | N | |
| 25 | Remark | Multi-text | User | N | |
| 26 | Status | Read-only | — | — | Draft / Void / Confirmed / Revised / Old Version / Closed |
| 27 | Upload | Hyperlink | — | — | |

## Fields — Sales Order Item

| # | Field | Type | Source | Mand | Notes |
|---|---|---|---|---|---|
| 1 | Part No | Dropdown | Finished Good | Y | |
| 2 | Description | Read-only | from Part No | — | |
| 3 | Quantity | Read-only | Σ of batches | — | Integer |
| 4 | UOM | Read-only | from Part No | — | |
| 5 | Unit Price | Numeric | User | Y | 2 decimals |
| 6 | Amount | Read-only | Qty × Unit Price | — | 2 decimals |
| 7 | Internal Quotation No | Text | User | Y | |
| 8 | Vendor Material No | Text | User | N | |
| 9 | Material Specification | Multi-text | User | N | |
| 10 | Estimate No | Text | User | N | |
| 11 | Remark | Multi-text | User | N | |
| 12 | Upload | Hyperlink | — | — | |

## Fields — Sales Order Item Batch

| # | Field | Type | Source | Mand | Notes |
|---|---|---|---|---|---|
| 1 | Part No | Read-only | from Item | — | |
| 2 | Quantity | Numeric | User | Y | Integer |
| 3 | UOM | Read-only | from Item | — | |
| 4 | Delivery Date | Date | User | Y | |
| 5 | Work Order No | Read-only | System | — | Generated on SO confirmation |
| 6 | Remark | Multi-text | User | N | |
| 7 | No Routing Process | Tickbox | User | N | Default No — bypass routing for direct subcon |
| 8 | Upload | Hyperlink | — | — | |

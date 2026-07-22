# Production Terminal

**Purpose:** workstation UI where workers scan into and out of work-order routing processes. Tracks status and time spent per process; captures welding / spray painting / machining parameters on scan out.

**No user license required** to operate the terminal.

## Scan IN

1. Worker scans Work Order No (barcode from Work Order Sheet printout).
2. Right panel shows summary of WO + customer + delivery info.
3. Worker selects In-Process Description → Main Process → Routing Process → Employee Name.
4. Click `[SCAN IN]`.

### Scan IN rules

- WO must be in status **Proceed**; routing process must not be Pending-for-QC or Completed.
- If the routing process is tagged as subcon: subcon PO quantity must be **fully received** first.
- One worker may scan into **multiple** routing processes (different in-processes) at once.
- One worker may scan into multiple work orders at once.
- Machine is specified at scan-OUT (alongside parameters), not at IN.
- One worker can operate multiple machines within a single IN→OUT span.
- One machine can simultaneously run multiple routing processes across same or different WOs.
- **Duplicate routing process under one in-process**: if there are several rows of the same Main Process + Routing Process in one In-Process, the system auto-assigns the **earliest not-yet-completed** row when the worker scans in.

  Example: under in-process `Sub-Assy`, rows 2/4/5 are all `Sizing of Material / Sawing`. Row 2 is Completed, row 4 is WIP, row 5 is New. Worker scanning into `Sizing of Material / Sawing` is assigned to **row 4** (earliest non-completed).

## Scan OUT

1. Worker scans Work Order No.
2. Verify summary, select In-Process / Main Process / Routing Process / Employee.
3. Click `[SCAN OUT]`.
4. Enter **work-order-worth-of-quantity completed**.
5. System shows the appropriate parameter form (Welding / Spray Painting / Machining) if the routing process is so flagged.
6. Enter parameters.
7. Click `[OK to SCAN OUT]`.

### Scan OUT rules

- WO must be in status **Proceed**.
- Worker must have previously scanned in.
- Total completed quantity across all scans cannot exceed WO quantity.

On scan OUT, the WO → In-Process → Routing Process → Employee/Parameter rows are updated.

## Process Parameter form fields (entered at scan OUT)

### Welding

| # | Field | Type | Source | Mand | Notes |
|---|---|---|---|---|---|
| 1 | Type of Material | Dropdown | Material Type | N | |
| 2 | Type of Welding | Dropdown | Welding Type | Y | |
| 3 | Welding Machine | Dropdown | Machine (Welding) | Y | Y |
| 4–8 | Machine No / Brand / Model / Current / S/No | Read-only | from Machine | — | |
| 9 | Type of Joint | Dropdown | Joint | N | |
| 10 | Electrode Type | Text | User | N | |
| 11 | Welding Position | Fixed Choice | — | N | `1F/2F/3F/4F/1G/2G/3G/4G/5G/6G` |
| 12 | Welding Joint | Numeric | User | N | 0 dec |
| 13 | Welding Size (mm) | Numeric | User | N | 0 dec |
| 14 | Voltage (V) | Numeric | User | N | 0 dec |
| 15 | Current (A) | Numeric | User | N | 0 dec |
| 16 | Cooling Time (mins) | Numeric | User | N | 0 dec |
| 17 | Pre Heating (°C) | Numeric | User | N | 0 dec |
| 18 | Post Heating (°C) | Numeric | User | N | 0 dec |
| 19 | Heat Treatment (HRC) | Numeric | User | N | 0 dec |
| 20 | Remark | Multi-text | User | N | |

### Spray Painting

Header: Paint Tank Pressure (psi, Y, 0 dec), Spray Nozzle Size (Ø, Y, 0 dec), Type of Paint (Y), Remark.

Three blocks: **A. Surface Preparation (Blasting / Power Tool / Solvent)** — Start/End Date Time, General Weather (Dry/Wet), Environmental Temperature, Relative Humidity, Abrasive Type, Sandpaper Grit (last two: "For Sand Blasting Only"). **B. Primer Coat** — Start/End Date Time, Weather (Dry/Wet), Env Temp, Rel Humidity, Paint Batch No, Expiry Date, DFT Measurement Result. **C. Top Coat** — same as Primer + Abrasive Type, Sandpaper Grit, Adhesive Test Result. Additional Remark at the end.

All Spray Painting fields are non-mandatory.

### Machining

| # | Field | Type | Source | Mand | Notes |
|---|---|---|---|---|---|
| 1 | Machine Serial No | Dropdown | Machine | Y | Y |
| 2–6 | Machine No/Name / Type / Brand / Model / Operation Type | Read-only | from Machine | — | |
| 7 | CNC Program No | Text | User | N | |
| 8 | Test Run | Text | User | N | |
| 9 | Special Tooling | Text | User | N | |
| 10 | Part Runtime (Hr) | Numeric | User | N | 0 dec |
| 11 | Part Runtime (Mins) | Numeric | User | N | 0 dec |
| 12 | Tool List | Hyperlink | — | — | drills into Tool List sub-table |
| 13 | Remark | Multi-text | User | N | |

**Tool List sub-table:** single column `Tool List` (Numeric, Y, 1 dec).

# Reports

Universal rules:

- **Excel export** for all reports.
- **Up-to-date** snapshots — no historical / point-in-time data.
- Title block: report name, company name, `Generated on <datetime>`.

---

## 1. Sales Report

**Definition:** sales figures and delivery status per sales product, scoped by SO date range.

**Search by:** SO No · SO Date Range · Customer · Salesperson · Part No · Part Description · Work Order No.

**Group by:** SO No → Part No → individual Batch.
**Sort by:** SO No, then WO No.

**Columns:** SO No · SO Date · Salesperson · Customer · Customer PO Ref · Project Code · Currency · Exchange Rate · Tax Type · Tax Rate · Before Tax · Tax · After Tax · Part No · Description · Item Qty · UOM · Unit Price · Item Amount · Internal Quo No · Vendor Material No · Material Spec · Batch Qty · Delivery Date · WO No · WO Status · QC Acceptance · Delivered Qty · Not Delivered Qty · Delivered Amount · Not Delivered Amount.

---

## 2. Work Order Costing Report

**Definition:** summary of WO costing — manpower, purchasing, subcon costs. **Only Completed WOs** appear.

**Search by:** Customer · Project Code · Customer Ref No · Job Description · WO No.

**Columns:** Customer · Project Code · Customer Ref · Currency · Exchange Rate · Job Description · UOM · Unit Price · WO No · WO Date · Internal Quo No · Delivery Date · Qty · Amount · Man Hour · **Sales Amt** · **Manpower Cost** · **Purchasing Cost** · **Subcon Cost** · **Total Cost** · Margin Amt · Margin %.

All cost columns in **local currency**. Margin = Sales − Total Cost.

---

## 3. Non-Conformance Report

**Definition:** all NCR rows per work order.

**Search by:** Customer · Work Order · Job Description · In-Process Description · Main Process · Routing Process · Department.

**Sort by:** Work Order → Main Process → Routing Process.

**Columns:** Customer · Customer PO Ref · WO No · WO Date · Job Description · In-Process Description · Main Process · Routing Process · NCR Qty · Department · Responsible Party · Problem · **Disposition Decision (Qty)**: Rework / Use-As-Is / Scrap / Other Decision / Other Qty · Customer Acceptance for Use-As-Is · Failure Mode · Root Cause · Corrective/Preventive Action · Action Taken.

---

## 4. Purchasing Report

**Definition:** all issued material POs (excludes subcon) and delivery status. Outstanding qty past due date is **highlighted in RED**.

**Search by:** Company · PO No · PO Status · PO Date Range · Supplier · Part No · Part Description.

**Group by / Sort by:** PO No.

**Columns:** Company · PO No · PO Date · PO Status · Purchaser · Supplier · WO No · PR No · Currency · Exchange Rate · Before Tax · Tax Type · Tax Rate · Tax Amt · After Tax · Part No · Descr · UOM · Qty · Unit Price · Amount · Total Received · Total Returned · NETT Received · **Outstanding Not Delivered** (red if past Delivery Date) · Delivery Date.

---

## 5. Subcon Purchasing Report

**Definition:** all issued subcon POs and delivery status. Outstanding qty past due date highlighted in **RED**.

**Search by:** Company · PO No · PO Status · PO Date Range · Supplier · Item Description · Main Process · Routing Process.

**Group by / Sort by:** PO No.

**Columns:** Company · PO No · PO Date · PO Status · Purchaser · Supplier · WO No · PR No · Currency · Exchange Rate · Before Tax · Tax Type · Tax Rate · Tax Amt · After Tax · In-Process Description · Main Process · Routing Process · Descr · Hardness · Thickness · UOM · Qty · Unit Price · Amount · Qty Acknowledged by Subcon · Qty Returned by Subcon · **Outstanding** (Not Acknowledged + Not Returned, red if overdue) · Delivery Date.

---

## Monthly Schedule Report (referenced in Work Order §3.2.2)

**Definition:** target completion dates of each routing process per WO.
**Refresh:** auto every 5 minutes.

> The source doc does not give a column list for the Monthly Schedule report. Treat the spec as TODO: derive columns from Work Order → In-Process → Routing Process (Target Completion Date, Status, etc.) until clarified.

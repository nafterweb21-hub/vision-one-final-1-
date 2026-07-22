import os

filepath = "src/lib/quotations.ts"
with open(filepath, 'r') as f:
    content = f.read()

# Add IDs and timestamps
content = content.replace("  return prisma.quotation.create({", "  return prisma.quotation.create({\n    data: {\n      id: require(\"crypto\").randomUUID(),")
content = content.replace("    data: {\n      quotationNo,", "      quotationNo,")
content = content.replace("      uploadUrl: cleanStr(input.uploadUrl),", "      uploadUrl: cleanStr(input.uploadUrl),\n      updatedAt: new Date(),")

content = content.replace("    return tx.quotation.update({", "    return tx.quotation.update({")
content = content.replace("        uploadUrl: cleanStr(input.uploadUrl),", "        uploadUrl: cleanStr(input.uploadUrl),\n        updatedAt: new Date(),")

content = content.replace('        data: { status: "Issued" },', '        data: { status: "Issued", updatedAt: new Date() },')
content = content.replace('        data: { status: "Confirmed" },', '        data: { status: "Confirmed", updatedAt: new Date() },')
content = content.replace('        data: { status: "Void" },', '        data: { status: "Void", updatedAt: new Date() },')
content = content.replace('          data: { status: "Old Version" },', '          data: { status: "Old Version", updatedAt: new Date() },')
content = content.replace('          data: { salesOrderId: so.id, status: "Converted" },', '          data: { salesOrderId: so.id, status: "Converted", updatedAt: new Date() },')

content = content.replace("        const newRev = await tx.quotation.create({", "        const newRev = await tx.quotation.create({")
content = content.replace("            quotationNo: q.quotationNo,", "            id: require(\"crypto\").randomUUID(),\n            quotationNo: q.quotationNo,")
content = content.replace("            uploadUrl: q.uploadUrl,", "            uploadUrl: q.uploadUrl,\n            updatedAt: new Date(),")

content = content.replace("        const so = await tx.salesOrder.create({", "        const so = await tx.salesOrder.create({")
content = content.replace("            orderNo,", "            id: require(\"crypto\").randomUUID(),\n            orderNo,")
content = content.replace("            remark: q.remark,", "            remark: q.remark,\n            updatedAt: new Date(),")

# QuotationItem relations in create
content = content.replace("      items: {", "      QuotationItem: {")
content = content.replace("        items: {", "        QuotationItem: {")
content = content.replace("            items: {", "            QuotationItem: {")

# SalesOrderItem in create SO
content = content.replace("            QuotationItem: {\n              create: q.items.map((it) => ({", "            SalesOrderItem: {\n              create: q.QuotationItem.map((it: any) => ({")

# QuotationItem relations in include
content = content.replace("    include: { items: true },", "    include: { QuotationItem: true },")

# q.items
content = content.replace("q.items.map((it) =>", "q.QuotationItem.map((it: any) =>")
content = content.replace("q.items.filter((it) =>", "q.QuotationItem.filter((it: any) =>")

# add IDs to QuotationItem/SalesOrderItem creates inside mapped array
content = content.replace("          unitPrice: new Prisma_Decimal", "          id: require(\"crypto\").randomUUID(),\n          updatedAt: new Date(),\n          unitPrice: new Prisma_Decimal")
content = content.replace("            unitPrice: new Prisma_Decimal", "            id: require(\"crypto\").randomUUID(),\n            updatedAt: new Date(),\n            unitPrice: new Prisma_Decimal")
content = content.replace("                unitPrice: it.unitPrice,", "                id: require(\"crypto\").randomUUID(),\n                updatedAt: new Date(),\n                unitPrice: it.unitPrice,")
content = content.replace("                partId: it.partId!,", "                id: require(\"crypto\").randomUUID(),\n                updatedAt: new Date(),\n                partId: it.partId!,")

with open(filepath, 'w') as f:
    f.write(content)
print("quotations.ts patched")

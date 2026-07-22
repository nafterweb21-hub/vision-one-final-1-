import os
filepath = "src/lib/quotations.ts"
with open(filepath, "r") as f: content = f.read()

# Replace relations
content = content.replace("items: {", "QuotationItem: {")
content = content.replace("include: { items: true }", "include: { QuotationItem: true }")
content = content.replace("QuotationItem: {\n              create: q.items.map((it) =>", "SalesOrderItem: {\n              create: q.QuotationItem.map((it: any) =>")
content = content.replace("q.items.map((it) =>", "q.QuotationItem.map((it: any) =>")
content = content.replace("q.items.filter((it) =>", "q.QuotationItem.filter((it: any) =>")

with open(filepath, "w") as f: f.write(content)
print("Quotation relations fixed")

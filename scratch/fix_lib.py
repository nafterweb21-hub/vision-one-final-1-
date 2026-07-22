import os
import re

lib_dir = "src/lib"

def process_file(filename):
    filepath = os.path.join(lib_dir, filename)
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Replace relation names
    content = content.replace("include: { category: true }", "include: { MaterialCategory: true }")
    content = content.replace("include: { mainProcess: true }", "include: { MainProcess: true }")
    content = content.replace("include: {\n      items:", "include: {\n      QuotationItem:")
    content = content.replace("items: {", "QuotationItem: {")
    content = content.replace("items: [", "QuotationItem: [")
    content = content.replace("items: {", "SalesOrderItem: {") # We will replace QuotationItem back to SalesOrderItem contextually below if needed
    
    # Specifically in quotations.ts:
    if filename == "quotations.ts":
        content = content.replace("items: { create:", "QuotationItem: { create:")
        content = content.replace("items: { deleteMany:", "QuotationItem: { deleteMany:")
        content = content.replace("QuotationItem: { create: po.items", "SalesOrderItem: { create: po.QuotationItem")
        # Fix parameter implicit any
        content = re.sub(r'\(it\)', '(it: any)', content)
        content = content.replace("items:", "QuotationItem:") # Rough replace, let's refine it manually via TS errors
        
    # Inject id and updatedAt in create
    def add_id_updated_at(m):
        block = m.group(2)
        if "id:" not in block:
            block = '\n        id: require("crypto").randomUUID(),' + block
        if "updatedAt:" not in block:
            block = block.rstrip() + ',\n        updatedAt: new Date()\n      '
        return m.group(1) + block + m.group(3)

    content = re.sub(
        r'(await prisma\.[a-zA-Z]+\.create\(\{[\s\S]*?data:\s*\{)([\s\S]*?)(\}\s*\})',
        add_id_updated_at,
        content
    )

    # Inject updatedAt in update
    def add_updated_at(m):
        block = m.group(2)
        if "updatedAt:" not in block:
            block = block.rstrip() + ',\n        updatedAt: new Date()\n      '
        return m.group(1) + block + m.group(3)

    content = re.sub(
        r'(await prisma\.[a-zA-Z]+\.update(?:Many)?\(\{[\s\S]*?data:\s*\{)([\s\S]*?)(\}\s*\})',
        add_updated_at,
        content
    )

    if original != content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {filename}")

for f in ["materials.ts", "painting-methods.ts", "payment-terms.ts", "process-profiles.ts", "welding-types.ts"]:
    process_file(f)

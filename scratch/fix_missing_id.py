import os
import re

def fix_missing(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, "r") as f: content = f.read()
    original = content

    def patch_create(m):
        prefix = m.group(1)
        block = m.group(2)
        suffix = m.group(3)
        if "id:" not in block:
            block = '\n        id: require("crypto").randomUUID(),' + block
        if "updatedAt:" not in block:
            block = block.rstrip() + ',\n        updatedAt: new Date()\n      '
        return prefix + block + suffix

    def patch_update(m):
        prefix = m.group(1)
        block = m.group(2)
        suffix = m.group(3)
        if "updatedAt:" not in block:
            block = block.rstrip() + ',\n        updatedAt: new Date()\n      '
        return prefix + block + suffix

    content = re.sub(r'((?:return|await)\s+prisma\.[a-zA-Z]+\.create(?:Many)?\(\s*\{[\s\S]*?data:\s*\{)([\s\S]*?)(\}\s*(?:,|\}))', patch_create, content)
    content = re.sub(r'((?:return|await)\s+tx\.[a-zA-Z]+\.create(?:Many)?\(\s*\{[\s\S]*?data:\s*\{)([\s\S]*?)(\}\s*(?:,|\}))', patch_create, content)
    
    content = re.sub(r'((?:return|await)\s+prisma\.[a-zA-Z]+\.update(?:Many)?\(\s*\{[\s\S]*?data:\s*\{)([\s\S]*?)(\}\s*(?:,|\}))', patch_update, content)
    content = re.sub(r'((?:return|await)\s+tx\.[a-zA-Z]+\.update(?:Many)?\(\s*\{[\s\S]*?data:\s*\{)([\s\S]*?)(\}\s*(?:,|\}))', patch_update, content)

    if original != content:
        with open(filepath, "w") as f: f.write(content)
        print(f"Patched {filepath}")

files = [
    "employee.ts",
    "failure-mode-profiles.ts",
    "joint-profiles.ts",
    "material-types.ts",
    "materials.ts",
    "painting-methods.ts",
    "payment-terms.ts",
    "process-profiles.ts",
    "quotations.ts",
    "welding-types.ts"
]

for f in files:
    fix_missing("src/lib/" + f)

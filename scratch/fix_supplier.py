import re
import os

file_path = "src/app/dashboard/admin/master-profile/supplier/actions.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add updatedAt to updates
content = re.sub(
    r'(await prisma\.[a-zA-Z]+\.update(?:Many)?\(\{[\s\S]*?data:\s*\{)([\s\S]*?)(\})',
    lambda m: m.group(1) + m.group(2) + ('' if 'updatedAt' in m.group(2) else '  updatedAt: new Date(),\n      ') + m.group(3),
    content
)

# Add id and updatedAt to creates
def process_create(m):
    prefix = m.group(1)
    body = m.group(2)
    suffix = m.group(3)
    
    if 'id:' not in body:
        body = '  id: require("crypto").randomUUID(),\n      ' + body
    if 'updatedAt:' not in body:
        body = body + '  updatedAt: new Date(),\n      '
        
    return prefix + body + suffix

content = re.sub(
    r'(await prisma\.[a-zA-Z]+\.create\(\{[\s\S]*?data:\s*\{)([\s\S]*?)(\})',
    process_create,
    content
)

with open(file_path, "w") as f:
    f.write(content)
print("Updated successfully")

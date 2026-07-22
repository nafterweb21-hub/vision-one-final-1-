import re

file_path = "src/app/dashboard/admin/master-profile/supplier/actions.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix the missing commas
content = re.sub(
    r'(remarks: remarks\.trim\(\) \|\| null)\s*updatedAt:',
    r'\1, updatedAt:',
    content
)
content = re.sub(
    r'(status: supplier\.status === "Active" \? "Inactive" : "Active")\s*updatedAt:',
    r'\1, updatedAt:',
    content
)
content = re.sub(
    r'(isDefault: false)\s*updatedAt:',
    r'\1, updatedAt:',
    content
)
content = re.sub(
    r'(isDefault: true)\s*updatedAt:',
    r'\1, updatedAt:',
    content
)
content = re.sub(
    r'(status: contact\.status === "Active" \? "Inactive" : "Active")\s*updatedAt:',
    r'\1, updatedAt:',
    content
)
content = re.sub(
    r'(address: address\.trim\(\))\s*updatedAt:',
    r'\1, updatedAt:',
    content
)
content = re.sub(
    r'(status: addr\.status === "Active" \? "Inactive" : "Active")\s*updatedAt:',
    r'\1, updatedAt:',
    content
)

with open(file_path, "w") as f:
    f.write(content)
print("Commas fixed")

import os
import re

directory = 'src/app'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'params.id' not in content:
        return

    if 'use(params)' in content or 'await params' in content or 'React.use(params)' in content:
        return

    print(f"Patching {filepath}")

    is_client = '"use client"' in content or "'use client'" in content

    # Fix the type of params if it's typed
    content = re.sub(r'params\s*:\s*\{\s*id\s*:\s*string\s*\}', r'params: Promise<{ id: string }>', content)
    # Sometimes it's typed as { params: any }
    content = re.sub(r'(\{\s*params\s*\})\s*:\s*any', r'\1: { params: Promise<any> }', content)

    # Insert the unwrapping
    unwrap_stmt = 'React.use(params)' if is_client else 'await params'
    
    # Find the export default function ... {
    # It might be async if it's a server component
    # We will match the signature until the opening brace
    pattern = r'(export default (?:async )?function \w+\s*\([^)]*params[^)]*\)\s*\{)'
    
    def replacer(match):
        return match.group(1) + f'\n  const {{ id }} = {unwrap_stmt};\n'

    new_content = re.sub(pattern, replacer, content)

    if new_content == content:
        print(f"  Failed to patch signature for {filepath}")
        return

    # Replace all params.id with id
    new_content = new_content.replace('params.id', 'id')
    
    # Also ensure React is imported if we are using React.use
    if is_client and 'React.use' in new_content and 'import React' not in new_content and 'import * as React' not in new_content:
        # Just add import React from "react"; at the top after "use client"
        new_content = new_content.replace('"use client";', '"use client";\nimport React from "react";')
        new_content = new_content.replace("'use client';", "'use client';\nimport React from \"react\";")

    with open(filepath, 'w') as f:
        f.write(new_content)

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('page.tsx'):
            process_file(os.path.join(root, file))

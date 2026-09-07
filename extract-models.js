const fs = require('fs');
const content = fs.readFileSync('prisma/schema.prisma', 'utf16le'); // or utf8
let text = content.toString();
if (text.includes('\0')) { text = fs.readFileSync('prisma/schema.prisma', 'utf16le'); } else { text = fs.readFileSync('prisma/schema.prisma', 'utf8'); }

const models = text.split(/model\s+/);
models.shift(); // remove everything before first model

for (const m of models) {
  if (m.startsWith('PurchaseOrder ') || m.startsWith('PurchaseOrderItem ') || m.startsWith('GoodsReceiveItem ')) {
    console.log('model ' + m.split('\n}')[0] + '\n}');
  }
}

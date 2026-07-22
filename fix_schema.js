const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(/model UomProfile \{[\s\S]*?\}/, (match) => {
  return match.replace(/\}$/, '  poItemsPoUom PurchaseOrderItem[] @relation("PoItemPoUom")\n  poItemsInternalUom PurchaseOrderItem[] @relation("PoItemInternalUom")\n}');
});
fs.writeFileSync('prisma/schema.prisma', schema);

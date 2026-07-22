const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(/@relation\("PrRequestedBy", fields: \[requestedById\], references: \[id\]\)/, '@relation(fields: [requestedById], references: [id])');
schema = schema.replace(/@relation\("PoPurchaser", fields: \[purchaserId\], references: \[id\]\)/, '@relation(fields: [purchaserId], references: [id])');

fs.writeFileSync('prisma/schema.prisma', schema);

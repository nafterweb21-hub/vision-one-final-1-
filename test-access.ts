const { canAccess, ACCESS_RULES } = require('./src/lib/access.ts');
console.log(canAccess("/dashboard/qc/ncr", "ADMIN"));

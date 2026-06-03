const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customerProfile.findFirst();
  const salesperson = await prisma.employee.findFirst();
  const currency = await prisma.currency.findFirst();
  const paymentTerm = await prisma.paymentTermProfile.findFirst();
  const fg = await prisma.finishedGoodProfile.findFirst();
  const uom = await prisma.uomProfile.findFirst();

  const res = await fetch("http://localhost:3000/api/sales/sales-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: new Date().toISOString(),
      salespersonId: salesperson.id,
      customerId: customer.id,
      paymentTermId: paymentTerm.id,
      currencyId: currency.id,
      status: "Confirmed",
      amountBeforeTax: 100,
      taxAmount: 0,
      amountAfterTax: 100,
      items: [
        {
          partId: fg.id,
          uomId: uom.id,
          quantity: 1,
          unitPrice: 100,
          batches: [
            {
              quantity: 1,
              deliveryDate: new Date().toISOString()
            }
          ]
        }
      ]
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employee = await prisma.employee.findFirst();
  const currency = await prisma.currency.findFirst();
  const taxType = await prisma.taxProfile.findFirst();
  const uom = await prisma.uomProfile.findFirst() || await prisma.uomProfile.create({ data: { uomCode: 'PCS', uomName: 'Pieces', status: 'Active' } });

  // Ensure "nafter" Company exists
  let nafter = await prisma.companyProfile.findFirst({ where: { companyName: { contains: 'nafter', mode: 'insensitive' } } });
  if (!nafter) {
    nafter = await prisma.companyProfile.create({
      data: {
        companyName: 'nafter',
        address: '123 Nafter St',
        phoneNo: '12345678',
        faxNo: '12345678',
        gstRegistrationNo: 'GST-123',
        uploadUrl: '',
        logoName: '',
        footerName: ''
      }
    });
  }

  // Ensure "FASHION HUBS" Company exists
  let fashion = await prisma.companyProfile.findFirst({ where: { companyName: { contains: 'FASHION HUBS', mode: 'insensitive' } } });
  if (!fashion) {
    fashion = await prisma.companyProfile.create({
      data: {
        companyName: 'FASHION HUBS',
        address: '456 Fashion Ave',
        phoneNo: '87654321',
        faxNo: '87654321',
        gstRegistrationNo: 'GST-456',
        uploadUrl: '',
        logoName: '',
        footerName: ''
      }
    });
  }

  // Ensure Supplier exists
  let supplier = await prisma.supplierProfile.findFirst();
  if (!supplier) {
    supplier = await prisma.supplierProfile.create({
      data: {
        supplierName: 'General Supplier',
        address: '789 Supp Rd',
        phoneNo: '1111111',
        faxNo: '1111111',
        email: 'supp@supp.com'
      }
    });
  }

  // Create Regular PO for nafter
  await prisma.purchaseOrder.create({
    data: {
      poNo: 'PO-REG-001',
      date: new Date(),
      companyId: nafter.id,
      supplierId: supplier.id,
      currencyId: currency.id,
      exchangeRate: 1.0,
      taxTypeId: taxType.id,
      taxRate: 0.1,
      purchaserId: employee.id,
      type: 'MATERIAL',
      status: 'Confirmed',
      items: {
        create: [
          {
            material: 'PART-A',
            description: 'Nafter Part A',
            quantity: 100,
            poUomId: uom.id,
            unitPrice: 5.5,
            amount: 550.0,
            internalQuantity: 100
          }
        ]
      }
    }
  });

  // Create Subcon PO for FASHION HUBS
  await prisma.purchaseOrder.create({
    data: {
      poNo: 'PO-SUB-001',
      date: new Date(),
      companyId: fashion.id,
      supplierId: supplier.id,
      currencyId: currency.id,
      exchangeRate: 1.0,
      taxTypeId: taxType.id,
      taxRate: 0.1,
      purchaserId: employee.id,
      type: 'SUBCON',
      status: 'Confirmed',
      items: {
        create: [
          {
            material: 'PART-B',
            description: 'Fashion Hubs Subcon Part B',
            quantity: 200,
            poUomId: uom.id,
            unitPrice: 10.0,
            amount: 2000.0,
            internalQuantity: 200
          }
        ]
      }
    }
  });

  // Create Subcon PO for nafter just in case they search nafter in Subcon
  await prisma.purchaseOrder.create({
    data: {
      poNo: 'PO-SUB-002',
      date: new Date(),
      companyId: nafter.id,
      supplierId: supplier.id,
      currencyId: currency.id,
      exchangeRate: 1.0,
      taxTypeId: taxType.id,
      taxRate: 0.1,
      purchaserId: employee.id,
      type: 'SUBCON',
      status: 'Confirmed',
      items: {
        create: [
          {
            material: 'PART-C',
            description: 'Nafter Subcon Part C',
            quantity: 300,
            poUomId: uom.id,
            unitPrice: 15.0,
            amount: 4500.0,
            internalQuantity: 300
          }
        ]
      }
    }
  });

  console.log("Mock data seeded successfully!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

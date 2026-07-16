"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nextDocumentNo } from "@/lib/document-numbering";
import { withRevision } from "@/lib/document-numbering.config";

export async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { customerName: true } },
        currency: { select: { code: true } },
      },
    });
    return { success: true, data: JSON.parse(JSON.stringify(invoices)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        customer: true,
        contactPerson: true,
        billTo: true,
        paymentTerm: true,
        currency: true,
        taxType: true,
        preparedBy: true,
        items: true,
        deliveryOrders: {
          include: {
            deliveryOrder: true,
          },
        },
      },
    });
    if (!invoice) throw new Error("Invoice not found");
    return { success: true, data: JSON.parse(JSON.stringify(invoice)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceFormData() {
  try {
    const [companies, customers, paymentTerms, currencies, taxes, employees, uoms, parts, banks] = await Promise.all([
      prisma.companyProfile.findMany({ where: { status: "Active" } }),
      prisma.customerProfile.findMany({ where: { status: "Active" }, include: { addresses: true, contactPersons: true } }),
      prisma.paymentTermProfile.findMany({ where: { status: "Active" } }),
      prisma.currency.findMany({ where: { status: "Active" } }),
      prisma.taxProfile.findMany({ where: { status: "Active" } }),
      prisma.employee.findMany({ where: { status: "ACTIVE" }, include: { user: true } }),
      prisma.uomProfile.findMany({ where: { status: "Active" } }),
      prisma.finishedGoodProfile.findMany({ where: { status: "Active" } }),
      prisma.bankProfile.findMany({ where: { status: "Active" } })
    ]);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify({ companies, customers, paymentTerms, currencies, taxes, employees, uoms, parts, banks }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPendingDOs(customerId: string) {
  try {
    // Fetch DOs for this customer that are 'Submitted' and not yet linked to an active Invoice
    // In our schema, we can check if it has any invoiceLinks where invoice is not Voided/Old Version
    const dos = await prisma.deliveryOrder.findMany({
      where: {
        customerId,
        status: "Submitted",
        invoiceLinks: {
          none: {
            invoice: {
              status: { notIn: ["Void", "Old Version"] },
            },
          },
        },
      },
      include: {
        items: true,
        salesOrder: { select: { orderNo: true } },
      },
    });
    return { success: true, data: JSON.parse(JSON.stringify(dos)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDOItemsForInvoice(doIds: string[]) {
  try {
    // Fetch items from the selected DOs and calculate pricing based on Sales Order
    const doItems = await prisma.deliveryOrderItem.findMany({
      where: {
        deliveryOrderId: { in: doIds },
      },
      include: {
        workOrder: {
          include: {
            customer: true,
          },
        },
        deliveryOrder: {
          include: {
            salesOrder: {
              include: {
                items: {
                  include: {
                    batches: true,
                  },
                },
              },
            },
          },
        },
        uom: true,
      },
    });

    const processedItems = doItems.map((item, index) => {
      // Find matching SO item based on Work Order
      // Work Order usually links to SalesOrderItemBatch which links to SalesOrderItem
      let soUnitPrice = 0;
      let partId = null;
      let description = item.workOrder.jobDescription || "";

      const soItems = item.deliveryOrder.salesOrder.items;
      for (const soItem of soItems) {
        const batch = soItem.batches.find((b) => b.workOrderNo === item.workOrderNo);
        if (batch) {
          soUnitPrice = Number(soItem.unitPrice || 0);
          partId = soItem.partId;
          break;
        }
      }

      const quantity = Number(item.quantity || 0);
      const amount = quantity * soUnitPrice;

      return {
        lineNo: index + 1,
        workOrderNo: item.workOrderNo,
        partId,
        description,
        quantity,
        uomId: item.uomId,
        unitPrice: soUnitPrice,
        amount,
        remark: "",
        hsnCode: "",
      };
    });

    return { success: true, data: processedItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createInvoice(data: any) {
  try {
    // Calculate Due Date based on Payment Term
    const paymentTerm = await prisma.paymentTermProfile.findUnique({
      where: { id: data.paymentTermId },
    });

    const invoiceDate = new Date(data.invoiceDate);
    const dueDate = new Date(invoiceDate);
    if (paymentTerm) {
      dueDate.setDate(dueDate.getDate() + paymentTerm.days);
    }

    // The number is taken and the invoice written in one transaction: the
    // counter's row lock only holds for as long as the transaction does.
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNo = await nextDocumentNo(tx, "INVOICE", {
        companyId: data.companyId,
        isTaken: async (no) => (await tx.invoice.count({ where: { invoiceNo: no } })) > 0,
      });

      return tx.invoice.create({
        data: {
          invoiceNo,
          revision: 0,
          invoiceDate,
          companyId: data.companyId,
          invoiceType: data.invoiceType,
          customerId: data.customerId,
          contactPersonId: data.contactPersonId,
          tel: data.tel,
          fax: data.fax,
          email: data.email,
          billToId: data.billToId,
          paymentTermId: data.paymentTermId,
          dueDate,
          currencyId: data.currencyId,
          exchangeRate: data.exchangeRate,
          amountBeforeTax: data.amountBeforeTax,
          taxTypeId: data.taxTypeId,
          taxRate: data.taxRate,
          taxAmount: data.taxAmount,
          amountAfterTax: data.amountAfterTax,
          balanceDue: data.amountAfterTax,
          bankDetails: data.bankDetails,
          remark: data.remark,
          preparedById: data.preparedById,
          poNo: data.poNo,
          vehicleNumber: data.vehicleNumber,
          status: "Draft",
          items: {
            create: data.items.map((item: any) => ({
              lineNo: item.lineNo,
              workOrderNo: item.workOrderNo,
              partId: item.partId,
              description: item.description,
              quantity: item.quantity,
              uomId: item.uomId,
              unitPrice: item.unitPrice,
              amount: item.amount,
              remark: item.remark,
              hsnCode: item.hsnCode,
            })),
          },
          deliveryOrders: {
            create: data.doIds.map((doId: string) => ({
              deliveryOrderId: doId,
            })),
          },
        },
      });
    });

    revalidatePath("/dashboard/sales/invoice");
    return { success: true, data: JSON.parse(JSON.stringify(invoice)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoice(id: string, data: any) {
  try {
    const paymentTerm = await prisma.paymentTermProfile.findUnique({
      where: { id: data.paymentTermId },
    });
    
    const invoiceDate = new Date(data.invoiceDate);
    const dueDate = new Date(invoiceDate);
    if (paymentTerm) {
      dueDate.setDate(dueDate.getDate() + paymentTerm.days);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceDate,
        companyId: data.companyId,
        invoiceType: data.invoiceType,
        customerId: data.customerId,
        contactPersonId: data.contactPersonId,
        tel: data.tel,
        fax: data.fax,
        email: data.email,
        billToId: data.billToId,
        paymentTermId: data.paymentTermId,
        dueDate,
        currencyId: data.currencyId,
        exchangeRate: data.exchangeRate,
        amountBeforeTax: data.amountBeforeTax,
        taxTypeId: data.taxTypeId,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        amountAfterTax: data.amountAfterTax,
        balanceDue: data.amountAfterTax,
        bankDetails: data.bankDetails,
        remark: data.remark,
        preparedById: data.preparedById,
        poNo: data.poNo,
        vehicleNumber: data.vehicleNumber,
        items: {
          deleteMany: {},
          create: data.items.map((item: any) => ({
            lineNo: item.lineNo,
            workOrderNo: item.workOrderNo,
            partId: item.partId,
            description: item.description,
            quantity: item.quantity,
            uomId: item.uomId,
            unitPrice: item.unitPrice,
            amount: item.amount,
            remark: item.remark,
            hsnCode: item.hsnCode,
          })),
        },
        deliveryOrders: {
          deleteMany: {},
          create: data.doIds.map((doId: string) => ({
            deliveryOrderId: doId,
          })),
        },
      },
    });

    revalidatePath("/dashboard/sales/invoice");
    return { success: true, data: JSON.parse(JSON.stringify(invoice)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitInvoice(id: string) {
  try {
    await prisma.invoice.update({
      where: { id },
      data: { status: "Submitted" },
    });
    revalidatePath("/dashboard/sales/invoice");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function voidInvoice(id: string) {
  try {
    await prisma.invoice.update({
      where: { id },
      data: { status: "Void" },
    });
    revalidatePath("/dashboard/sales/invoice");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reviseInvoice(id: string, data: any) {
  try {
    const oldInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        deliveryOrders: true,
      },
    });

    if (!oldInvoice) throw new Error("Invoice not found");

    // Mark old invoice as 'Old Version'
    await prisma.invoice.update({
      where: { id },
      data: { status: "Old Version" },
    });

    // A revision keeps the original's number and only bumps the -R tail, so it
    // does not consume a new sequence from the counter.
    const newRevision = oldInvoice.revision + 1;
    const newInvoiceNo = withRevision(oldInvoice.invoiceNo, newRevision);

    const paymentTerm = await prisma.paymentTermProfile.findUnique({
      where: { id: data.paymentTermId },
    });
    
    const invoiceDate = new Date(data.invoiceDate);
    const dueDate = new Date(invoiceDate);
    if (paymentTerm) {
      dueDate.setDate(dueDate.getDate() + paymentTerm.days);
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: newInvoiceNo,
        revision: newRevision,
        invoiceDate,
        companyId: data.companyId,
        invoiceType: data.invoiceType,
        customerId: data.customerId,
        contactPersonId: data.contactPersonId,
        tel: data.tel,
        fax: data.fax,
        email: data.email,
        billToId: data.billToId,
        paymentTermId: data.paymentTermId,
        dueDate,
        currencyId: data.currencyId,
        exchangeRate: data.exchangeRate,
        amountBeforeTax: data.amountBeforeTax,
        taxTypeId: data.taxTypeId,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        amountAfterTax: data.amountAfterTax,
        balanceDue: data.amountAfterTax,
        bankDetails: data.bankDetails,
        remark: data.remark,
        preparedById: data.preparedById,
        poNo: data.poNo,
        vehicleNumber: data.vehicleNumber,
        status: "Draft",
        items: {
          create: data.items.map((item: any) => ({
            lineNo: item.lineNo,
            workOrderNo: item.workOrderNo,
            partId: item.partId,
            description: item.description,
            quantity: item.quantity,
            uomId: item.uomId,
            unitPrice: item.unitPrice,
            amount: item.amount,
            remark: item.remark,
            hsnCode: item.hsnCode,
          })),
        },
        deliveryOrders: {
          create: oldInvoice.deliveryOrders.map((doLink) => ({
            deliveryOrderId: doLink.deliveryOrderId,
          })),
        },
      },
    });

    revalidatePath("/dashboard/sales/invoice");
    return { success: true, data: JSON.parse(JSON.stringify(invoice)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

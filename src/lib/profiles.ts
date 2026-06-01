import { prisma } from "@/lib/prisma";

import { PROFILE_REGISTRY } from "./profiles-schema";
export { PROFILE_REGISTRY };

// Central helper to dynamically query the Prisma model
function getPrismaModel(modelName: string) {
  const model = (prisma as any)[modelName];
  if (!model) {
    throw new Error(`Prisma model '${modelName}' not found`);
  }
  return model;
}

export async function getProfileItems(type: string, search = "", activeOnly = false) {
  const meta = PROFILE_REGISTRY[type];
  if (!meta) throw new Error(`Invalid profile type: ${type}`);

  const model = getPrismaModel(meta.modelName);

  const where: any = {};

  if (activeOnly) {
    where.status = "Active";
  }

  if (search && meta.searchFields.length > 0) {
    where.OR = meta.searchFields.map((field) => ({
      [field]: {
        contains: search,
      },
    }));
  }

  const queryOptions: any = {
    where,
    orderBy: {
      createdAt: "desc",
    },
  };

  if (meta.includes) {
    queryOptions.include = meta.includes;
  }

  return await model.findMany(queryOptions);
}

export async function createProfileItem(type: string, data: any) {
  const meta = PROFILE_REGISTRY[type];
  if (!meta) throw new Error(`Invalid profile type: ${type}`);

  const model = getPrismaModel(meta.modelName);

  // Validate mandatory fields
  for (const field of meta.mandatoryFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new Error(`Field '${field}' is mandatory`);
    }
  }

  // Validate unique fields
  for (const field of meta.uniqueFields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
      const existingItem = await model.findFirst({
        where: { [field]: data[field] },
      });
      if (existingItem) {
        throw new Error(`${meta.displayName} with this ${field} already exists.`);
      }
    }
  }

  // Pre-process field types (parse float/decimal/boolean)
  const processedData = prepareDataForDB(type, data);

  // Currency specific rules
  if (type === "currency") {
    if (processedData.isDefault === true) {
      return await prisma.$transaction(async (tx: any) => {
        // 1. Unset existing defaults
        await tx.currency.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
        // 2. Create the new currency with default: true
        return await tx.currency.create({
          data: processedData,
        });
      });
    } else {
      // Check if there are any currencies. If none, force this one to be default
      const count = await model.count();
      if (count === 0) {
        processedData.isDefault = true;
      }
    }
  }

  return await model.create({
    data: processedData,
  });
}

export async function updateProfileItem(type: string, id: string, data: any) {
  const meta = PROFILE_REGISTRY[type];
  if (!meta) throw new Error(`Invalid profile type: ${type}`);

  const model = getPrismaModel(meta.modelName);

  // Fetch existing item to check immutability
  const existing = await model.findUnique({ where: { id } });
  if (!existing) throw new Error(`Item with id '${id}' not found`);

  // Verify immutability of immutableFields
  for (const field of meta.immutableFields) {
    if (data[field] !== undefined && data[field] !== existing[field]) {
      throw new Error(`Field '${field}' is immutable once saved`);
    }
  }

  // Validate unique fields
  for (const field of meta.uniqueFields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
      const duplicate = await model.findFirst({
        where: {
          [field]: data[field],
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new Error(`${meta.displayName} with this ${field} already exists.`);
      }
    }
  }

  const processedData = prepareDataForDB(type, data);

  // Currency specific rules
  if (type === "currency") {
    if (processedData.isDefault === true) {
      return await prisma.$transaction(async (tx: any) => {
        // 1. Unset existing defaults
        await tx.currency.updateMany({
          where: { isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
        // 2. Update this currency to be default
        return await tx.currency.update({
          where: { id },
          data: processedData,
        });
      });
    } else if (existing.isDefault === true && processedData.isDefault === false) {
      throw new Error("At least one currency must be set as default. Set another currency as default first.");
    }
    if (existing.isDefault === true && processedData.status === "Inactive") {
      throw new Error("Cannot deactivate the default currency. Please assign another currency as default first.");
    }
  }

  return await model.update({
    where: { id },
    data: processedData,
  });
}

export async function toggleProfileItemStatus(type: string, id: string) {
  const meta = PROFILE_REGISTRY[type];
  if (!meta) throw new Error(`Invalid profile type: ${type}`);

  const model = getPrismaModel(meta.modelName);

  const existing = await model.findUnique({ where: { id } });
  if (!existing) throw new Error(`Item with id '${id}' not found`);

  const nextStatus = existing.status === "Active" ? "Inactive" : "Active";

  // Prevent deactivating default currency
  if (type === "currency" && existing.isDefault === true && nextStatus === "Inactive") {
    throw new Error("Cannot deactivate the default currency. Please assign another currency as default first.");
  }

  return await model.update({
    where: { id },
    data: { status: nextStatus },
  });
}

export async function deleteProfileItem(type: string, id: string) {
  const meta = PROFILE_REGISTRY[type];
  if (!meta) throw new Error(`Invalid profile type: ${type}`);

  const model = getPrismaModel(meta.modelName);

  const existing = await model.findUnique({ where: { id } });
  if (!existing) throw new Error(`Item with id '${id}' not found`);

  if (type === "currency" && existing.isDefault === true) {
    throw new Error("Cannot delete the default currency. Please assign another currency as default first.");
  }

  return await model.delete({
    where: { id },
  });
}

// Convert numbers, decimals, and booleans correctly
function prepareDataForDB(type: string, data: any): any {
  const result = { ...data };

  if (type === "currency") {
    if (result.exchangeRate !== undefined) result.exchangeRate = parseFloat(result.exchangeRate);
    if (result.isDefault !== undefined) result.isDefault = Boolean(result.isDefault);
  }

  // Remove system audit fields if sent by client
  delete result.id;
  delete result.createdAt;
  delete result.updatedAt;

  return result;
}

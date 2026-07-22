/**
 * Reconciles the AppModule table with `src/lib/modules.config.ts`.
 *
 * Run after adding or removing a module: `npx tsx scripts/sync-modules.ts`
 * Access control is fail-closed, so a module missing from the database cannot
 * be granted to any role and its pages will 403 for everyone but ADMIN.
 */
// Must precede the prisma import — it reads DATABASE_URL at module load.
import 'dotenv/config';
import { APP_MODULES, MODULE_RENAMES } from '../src/lib/modules.config';
import { prisma } from '../src/lib/prisma';

const SUPER_ROLE = 'ADMIN';

/** Rename before upserting, so the prune step does not drop the old row. */
async function applyRenames() {
  for (const [from, to] of Object.entries(MODULE_RENAMES)) {
    const [oldRow, newRow] = await Promise.all([
      prisma.appModule.findUnique({ where: { code: from } }),
      prisma.appModule.findUnique({ where: { code: to } }),
    ]);

    if (!oldRow) continue;

    if (newRow) {
      // Both exist: the new row is authoritative, drop the stale one.
      await prisma.appModule.delete({ where: { code: from } });
      console.log(`Dropped duplicate module ${from} (${to} already present).`);
      continue;
    }

    await prisma.appModule.update({ where: { code: from }, data: { code: to } });
    console.log(`Renamed module ${from} -> ${to} (grants preserved).`);
  }
}

async function main() {
  await applyRenames();
  console.log(`Syncing ${APP_MODULES.length} modules...`);

  for (const def of APP_MODULES) {
    const data = {
      name: def.name,
      group: def.group,
      pathPrefix: def.pathPrefixes[0],
    };

    await prisma.appModule.upsert({
      where: { code: def.code },
      update: data,
      create: { code: def.code, ...data },
    });
  }

  // Drop modules that no longer exist in the registry. RolePermission cascades
  // on module delete, so stale grants go with them.
  const known = APP_MODULES.map((m) => m.code);
  const removed = await prisma.appModule.deleteMany({
    where: { code: { notIn: known } },
  });
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} stale module(s).`);
  }

  // ADMIN bypasses permission checks in code, but keep its rows complete so the
  // roles screen reflects reality.
  const adminRole = await prisma.roleProfile.findUnique({ where: { name: SUPER_ROLE } });
  if (adminRole) {
    const modules = await prisma.appModule.findMany({ select: { id: true } });
    const grant = {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canExport: true,
    };

    for (const mod of modules) {
      await prisma.rolePermission.upsert({
        where: { roleId_moduleId: { roleId: adminRole.id, moduleId: mod.id } },
        update: grant,
        create: { roleId: adminRole.id, moduleId: mod.id, ...grant },
      });
    }
    console.log(`${SUPER_ROLE} permissions synced across ${modules.length} modules.`);
  } else {
    console.warn(`No ${SUPER_ROLE} role found — skipping permission grant.`);
  }

  console.log('Modules synced successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

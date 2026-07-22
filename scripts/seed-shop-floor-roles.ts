/**
 * Grants the shop-floor roles their terminals.
 *
 *   npm run seed:shop-floor-roles
 *
 * Idempotent: re-running only re-asserts the grants below. It never removes a
 * permission the role holds on another module, so an existing QC role keeps its
 * NCR and inspection access.
 *
 * Run `npm run sync:modules` first — these grants reference modules by code.
 */
// Must precede the prisma import — it reads DATABASE_URL at module load.
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

type Grant = { v?: boolean; c?: boolean; e?: boolean; d?: boolean; a?: boolean; x?: boolean };

const ROLES: { name: string; remark: string; grants: Record<string, Grant> }[] = [
  {
    name: 'WELDER',
    remark: 'Shop-floor operator. Production Terminal only.',
    // Operators record work against a job: they view the terminal and create
    // timesheet/production entries, but never edit or delete history.
    grants: { PRODUCTION_TERMINAL: { v: true, c: true } },
  },
  {
    name: 'QC',
    remark: 'Quality control. QC Terminal and inspection outcomes.',
    grants: { QC_TERMINAL: { v: true, c: true, e: true } },
  },
];

async function main() {
  for (const spec of ROLES) {
    const role = await prisma.roleProfile.upsert({
      where: { name: spec.name },
      update: {},
      create: { name: spec.name, remark: spec.remark, status: 'Active', permissions: [] },
    });

    for (const [code, grant] of Object.entries(spec.grants)) {
      const appModule = await prisma.appModule.findUnique({ where: { code } });
      if (!appModule) {
        console.warn(`  ! module ${code} not found — run "npm run sync:modules" first. Skipping.`);
        continue;
      }

      const data = {
        canView: !!grant.v,
        canCreate: !!grant.c,
        canEdit: !!grant.e,
        canDelete: !!grant.d,
        canApprove: !!grant.a,
        canExport: !!grant.x,
      };

      await prisma.rolePermission.upsert({
        where: { roleId_moduleId: { roleId: role.id, moduleId: appModule.id } },
        update: data,
        create: { roleId: role.id, moduleId: appModule.id, ...data },
      });

      console.log(`  ${spec.name} -> ${code} (${Object.keys(grant).join(', ')})`);
    }
  }

  console.log('\nShop-floor roles seeded. Assign users to them on the Users screen.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

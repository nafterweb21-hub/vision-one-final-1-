import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * One-off cleanup: remove duplicate routing processes within an in-process.
 *
 * A duplicate = same (inProcessId, mainProcessId, routingProcessId). For each
 * such group we keep the "best" row (most progress, then lowest SN) and delete
 * the rest — but ONLY when a deletable row has no dependent records
 * (timesheets, NCRs, PO items). Rows with dependents are reported and skipped.
 *
 * Pass --apply to actually delete; without it, this is a dry run.
 */

const APPLY = process.argv.includes("--apply");
const STATUS_RANK: Record<string, number> = { Completed: 3, WIP: 2, New: 1 };

async function main() {
  const inProcesses = await prisma.workOrderInProcess.findMany({
    include: {
      routingProcesses: {
        include: {
          _count: {
            select: { productionTimesheets: true, Ncr: true, purchaseOrderItems: true },
          },
          mainProcess: { select: { process: true } },
          routingProcess: { select: { routingProcess: true } },
        },
      },
    },
  });

  const toDelete: { id: string; sn: string; ip: string; label: string }[] = [];
  const blocked: { id: string; sn: string; ip: string; label: string; reason: string }[] = [];

  for (const ip of inProcesses) {
    const groups = new Map<string, typeof ip.routingProcesses>();
    for (const rp of ip.routingProcesses) {
      const key = `${rp.mainProcessId ?? ""}|${rp.routingProcessId ?? ""}`;
      const arr = groups.get(key) ?? [];
      arr.push(rp);
      groups.set(key, arr);
    }

    for (const [, rows] of groups) {
      if (rows.length < 2) continue;

      // Rank: keep highest status, then lowest numeric SN, then oldest.
      const sorted = [...rows].sort((a, b) => {
        const r = (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0);
        if (r !== 0) return r;
        const snA = parseInt(a.sn, 10);
        const snB = parseInt(b.sn, 10);
        if (Number.isFinite(snA) && Number.isFinite(snB) && snA !== snB) return snA - snB;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      const [keep, ...extras] = sorted;
      const label = `${keep.mainProcess?.process ?? "?"} / ${keep.routingProcess?.routingProcess ?? "?"}`;
      console.log(
        `\nIn-process ${ip.sn} "${ip.description}" — duplicate: ${label}\n` +
          `  KEEP  SN ${keep.sn} (${keep.status})`,
      );

      for (const rp of extras) {
        const deps =
          rp._count.productionTimesheets + rp._count.Ncr + rp._count.purchaseOrderItems;
        if (deps > 0) {
          const reason =
            `has ${rp._count.productionTimesheets} timesheet(s), ` +
            `${rp._count.Ncr} NCR(s), ${rp._count.purchaseOrderItems} PO item(s)`;
          console.log(`  SKIP  SN ${rp.sn} (${rp.status}) — ${reason}`);
          blocked.push({ id: rp.id, sn: rp.sn, ip: ip.description, label, reason });
        } else {
          console.log(`  DELETE SN ${rp.sn} (${rp.status})`);
          toDelete.push({ id: rp.id, sn: rp.sn, ip: ip.description, label });
        }
      }
    }
  }

  console.log(
    `\n${toDelete.length} row(s) to delete, ${blocked.length} skipped (have dependents).`,
  );

  if (!toDelete.length) {
    console.log("Nothing to delete.");
    return;
  }

  if (!APPLY) {
    console.log("\nDry run — re-run with --apply to delete the rows above.");
    return;
  }

  const result = await prisma.routingProcess.deleteMany({
    where: { id: { in: toDelete.map((d) => d.id) } },
  });
  console.log(`\nDeleted ${result.count} duplicate routing process row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

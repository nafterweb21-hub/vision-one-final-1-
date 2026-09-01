const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vision_one' });

async function main() {
  const woResult = await pool.query(`SELECT * FROM "WorkOrder" WHERE "workOrderNo" = 'WO-SO-2026-0005-001'`);
  const wo = woResult.rows[0];
  console.log("Work Order:", wo);

  if (wo) {
    const ipResult = await pool.query(`SELECT * FROM "WorkOrderInProcess" WHERE "workOrderNo" = $1`, [wo.workOrderNo]);
    console.log("WorkOrderInProcess:", ipResult.rows);

    for (let ip of ipResult.rows) {
      const rpResult = await pool.query(`SELECT rp.* FROM "RoutingProcess" rp WHERE rp."inProcessId" = $1 ORDER BY rp.sn ASC`, [ip.id]);
      console.log(`Routing Processes for InProcess ${ip.id}:`, rpResult.rows);
      
      for (let rp of rpResult.rows) {
        const ptResult = await pool.query(`SELECT * FROM "ProductionTimesheet" WHERE "routingProcessId" = $1`, [rp.id]);
        if (ptResult.rows.length) console.log(`Timesheets for RP ${rp.id}:`, ptResult.rows);

        const qcResult = await pool.query(`SELECT * FROM "QualityControl" WHERE "routingProcessId" = $1`, [rp.id]);
        if (qcResult.rows.length) console.log(`QC for RP ${rp.id}:`, qcResult.rows);
      }
    }
  }
}

main().catch(console.error).finally(() => pool.end());

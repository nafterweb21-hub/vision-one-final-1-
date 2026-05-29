import { prisma } from "@/lib/prisma";
import ProcessParameterList from "./components/ProcessParameterList";

export default async function ProcessParameterPage() {
  const timesheets = await prisma.productionTimesheet.findMany({
    where: {
      OR: [
        { weldingParameter: { status: "Pending" } },
        { sprayParameter: { status: "Pending" } },
        { machiningParameter: { status: "Pending" } }
      ]
    },
    include: {
      employee: true,
      weldingParameter: true,
      sprayParameter: true,
      machiningParameter: true,
      routingProcess: {
        include: {
          inProcess: {
            include: {
              workOrder: {
                include: {
                  customer: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' }
  });

  const elcometers = await prisma.elcometerProfile.findMany({
    where: { status: "Active" },
    orderBy: { serialNo: 'asc' }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Process Parameter Confirmation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and confirm process parameters for production.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <ProcessParameterList 
          timesheets={JSON.parse(JSON.stringify(timesheets))} 
          employees={employees} 
          elcometers={elcometers} 
        />
      </div>
    </div>
  );
}

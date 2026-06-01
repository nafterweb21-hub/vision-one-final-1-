import { getPendingParameters, getConfirmationOptions } from "./actions";
import ClientPage from "./ClientPage";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProcessParameterConfirmationPage() {
  const session = await auth();
  
  let employeeId = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true },
    });
    employeeId = user?.employee?.id || null;
  }

  const parameters = await getPendingParameters();
  const options = await getConfirmationOptions();

  return (
    <ClientPage 
      parameters={parameters} 
      options={options} 
      currentEmployeeId={employeeId} 
    />
  );
}

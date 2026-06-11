import QcDashboardClient from "./components/QcDashboardClient";
import { getAwaitingInspection, getActiveWorkOrders, getReworkForReinspection } from "./actions";

export const dynamic = "force-dynamic";

export default async function QcDashboardPage() {
  const awaitingInspection = await getAwaitingInspection();
  const activeWorkOrders = await getActiveWorkOrders();
  const reworks = await getReworkForReinspection();

  return (
    <QcDashboardClient 
      initialAwaiting={awaitingInspection} 
      initialWorkOrders={activeWorkOrders} 
      initialReworks={reworks}
    />
  );
}

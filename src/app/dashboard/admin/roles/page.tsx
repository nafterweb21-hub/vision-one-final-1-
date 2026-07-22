import RolesClient from "./roles-client";
import AccessDenied from "./access-denied";
import { getRoles, isAdmin } from "./data";

export default async function RolesPage() {
  if (!(await isAdmin())) return <AccessDenied />;

  return <RolesClient roles={await getRoles()} />;
}

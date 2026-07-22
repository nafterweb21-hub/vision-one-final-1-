import RoleForm, { type RoleFormValues } from "../role-form";
import AccessDenied from "../access-denied";
import { getModules, getRole, isAdmin, toPermissionMap } from "../data";

export default async function NewRolePage({
  searchParams,
}: {
  searchParams: Promise<{ cloneFrom?: string }>;
}) {
  if (!(await isAdmin())) return <AccessDenied />;

  const { cloneFrom } = await searchParams;
  const modules = await getModules();

  let initial: RoleFormValues = { name: "", remark: "", status: "Active", permissions: {} };

  if (cloneFrom) {
    const source = await getRole(cloneFrom);
    // A stale clone link just falls back to a blank form rather than 404ing.
    if (source) {
      initial = {
        name: `${source.name} (COPY)`,
        remark: source.remark ?? "",
        status: source.status === "Inactive" ? "Inactive" : "Active",
        permissions: toPermissionMap(source),
      };
    }
  }

  return (
    <RoleForm
      modules={modules}
      initial={initial}
      title={cloneFrom ? "Clone Role" : "Add New Role"}
      submitLabel="Create Role"
    />
  );
}

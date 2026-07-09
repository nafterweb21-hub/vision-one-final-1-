import { notFound } from "next/navigation";
import RoleForm from "../../role-form";
import AccessDenied from "../../access-denied";
import { getModules, getRole, isAdmin, toPermissionMap } from "../../data";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) return <AccessDenied />;

  const { id } = await params;
  const [role, modules] = await Promise.all([getRole(id), getModules()]);

  if (!role) notFound();

  return (
    <RoleForm
      modules={modules}
      initial={{
        id: role.id,
        name: role.name,
        remark: role.remark ?? "",
        status: role.status === "Inactive" ? "Inactive" : "Active",
        permissions: toPermissionMap(role),
      }}
      title={`Edit Role — ${role.name}`}
      submitLabel="Save Changes"
    />
  );
}

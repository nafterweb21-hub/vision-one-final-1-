import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserFormClient from "../../components/UserFormClient";
import { prisma } from "@/lib/prisma";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return redirect("/dashboard/admin/users");
  }

  const initialData = {
    id: user.id,
    name: user.name || "",
    email: user.email,
    password: "", // never prefill password
    role: user.role,
    isActive: user.isActive,
    employeeId: user.employeeId || "",
  };

  return <UserFormClient currentUserId={session.user.id} initialData={initialData} />;
}

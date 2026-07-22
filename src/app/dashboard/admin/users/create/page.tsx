import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserFormClient from "../components/UserFormClient";

export default async function CreateUserPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  return <UserFormClient currentUserId={session.user.id} />;
}

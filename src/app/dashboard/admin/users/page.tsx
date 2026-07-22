import { auth } from "@/lib/auth";

import UsersClient from "./users-client";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
        <h1 className="text-2xl font-bold text-blue-900">Access denied</h1>
        <p className="mt-2 text-sm text-blue-500">
          Only administrators can manage users.
        </p>
      </div>
    );
  }
  return <UsersClient currentUserId={session.user.id} />;
}

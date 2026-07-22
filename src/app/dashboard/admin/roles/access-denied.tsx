export default function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
      <h1 className="text-2xl font-bold text-blue-900">Access denied</h1>
      <p className="mt-2 text-blue-500">You must be an administrator to view this page.</p>
    </div>
  );
}

import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function ForbiddenPage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m0-10a4 4 0 014 4v3H8v-3a4 4 0 014-4z M5 11h14v9H5z"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-blue-900">Access denied</h1>
        <p className="mt-2 text-sm text-blue-600">
          Your role doesn&apos;t allow access to this page.
          {from && (
            <>
              {" "}
              <span className="font-mono text-blue-400">({from})</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-blue-400">
          Contact an administrator if you think this is a mistake.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

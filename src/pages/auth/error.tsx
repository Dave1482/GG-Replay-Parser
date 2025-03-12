import { useRouter } from "next/router";

export default function ErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Authentication Error
        </h1>
        <p className="mb-4 text-gray-600">
          {error || "An error occurred during authentication"}
        </p>
        <button
          onClick={() => router.push("/auth/signin")}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

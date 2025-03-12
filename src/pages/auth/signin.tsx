import { GetServerSideProps } from "next";
import { getProviders, signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";

export default function SignIn({ providers }: { providers: any }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Sign in to continue</h1>
        {Object.values(providers).map((provider: any) => (
          <button
            key={provider.id}
            onClick={() => signIn(provider.id)}
            className="flex w-full items-center justify-center rounded-md bg-[#7289da] px-4 py-2 text-white hover:bg-[#6277c0]"
          >
            Sign in with {provider.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const providers = await getProviders();

  return {
    props: {
      providers,
    },
  };
};

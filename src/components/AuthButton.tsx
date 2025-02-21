import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export const AuthButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt="User avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="text-sm">{session.user?.name}</span>
        <button
          onClick={() => signOut()}
          className="btn bg-red-500 text-white hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("discord")}
      className="btn flex items-center gap-2 bg-[#5865F2] text-white hover:bg-[#4752C4]"
    >
      Sign in with Discord
    </button>
  );
};

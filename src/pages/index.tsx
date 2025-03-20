import { RlHead } from "@/components/head";
import { ParsingToggle, Replay } from "@/features/replay";
import { Welcome } from "@/components/Welcome";
import { Header } from "@/components/Header";
import { useSession } from "next-auth/react";
import { useHydrateUiStore } from "@/stores/uiStore";

const Home = () => {
  useHydrateUiStore();
  const { status } = useSession();

  return (
    <>
      <Header />
      <main className="p-4">
        <RlHead />
        {status === "authenticated" ? (
          <div className="mx-auto space-y-4">
            <ParsingToggle />
            <Replay />
          </div>
        ) : (
          <Welcome />
        )}
      </main>
    </>
  );
};

export default Home;

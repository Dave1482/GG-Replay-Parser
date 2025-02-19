4import { RlHead } from "@/components/head";
import { ParsingToggle, Replay } from "@/features/replay";
import { GithubIcon } from "@/components/icons";
import type { NextPage } from "next";
import { useHydrateUiStore } from "@/stores/uiStore";

const Home: NextPage = () => {
  useHydrateUiStore();

  return (
    <main className="p-4">
      <RlHead />
      <div className="mx-auto max-w-prose space-y-4">
        <div className="grid grid-cols-[1fr_32px] gap-2 md:gap-6">
          <h1 className="text-2xl font-bold">Rocket League Replay Parser</h1>
          <div>
            <a href="https://github.com/Dave1482/rl-web">
              <GithubIcon alt="Rocket League Replay Parser website Github Repo" />
            </a>
          </div>
        </div>
        <p className="text-lg">Test</p>
        <ParsingToggle />
      </div>
      <Replay />
    </main>
  );
};

export default Home;

import { AuthButton } from "./AuthButton";

export const Welcome = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-8 text-center">
      <h1 className="text-4xl font-bold">
        Welcome to Goop Gaming Replay Parser
      </h1>

      <div className="space-y-4 text-lg">
        <p>
          This tool helps Goop Gaming analyze Rocket League replay files for
          tournament matches and competitive play.
        </p>
        <p>
          This is made possible by the Boxcars Rust framework located here:
          https://github.com/nickbabcock/boxcars{" "}
        </p>
        <p>
          Upload your .replay files to get detailed statistics, player
          performance metrics, and game analysis across multiple matches.
        </p>
        <p>Features:</p>
        <ul className="list-inside list-disc space-y-2">
          <li>Analyze up to 7 replay files at once</li>
          <li>View aggregate statistics across multiple games</li>
          <li>Track team performance and individual player stats</li>
          <li>Export replay data to JSON format</li>
        </ul>
      </div>

      <div className="mt-8 space-y-4">
        <p className="text-xl font-semibold">
          Sign in with Discord to get started:
        </p>
        <div className="flex justify-center">
          <AuthButton />
        </div>
      </div>
    </div>
  );
};

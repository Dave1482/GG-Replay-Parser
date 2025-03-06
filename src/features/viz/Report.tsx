import { useState } from "react";
import { Graph } from "./Graph";
import { Description } from "./Description";
import { TeamScores } from "./TeamScores";
import { DownloadReplayJson } from "./DownloadReplayJson";
import { AggregateStats } from "./AggregateStats";
import { useReplays } from "../replay/replayStore";
import { useAggregateStats } from "../replay/replayStore";

export const Report = () => {
  const replays = useReplays();
  const [currentPage, setCurrentPage] = useState(1); // Always start at first replay uploaded
  const allStats = useAggregateStats();
  if (replays.length === 0) {
    return null;
  }
  if (allStats.team0Wins === 0) {
    return null;
  }
  if (allStats.team1Wins === 0) {
    return null;
  }

  // Show aggregate stats on page 1 when there are multiple replays entered to the system
  const totalPages = replays.length > 1 ? replays.length + 1 : 1;

  if (currentPage === 1 && replays.length > 1) {
    // Calculate total goals for each team across all replays
    const totalTeamGoals = replays.reduce(
      (acc, replay) => {
        acc.team0 += replay.data.properties.Team0Score || 0;
        acc.team1 += replay.data.properties.Team1Score || 0;
        return acc;
      },
      { team0: 0, team1: 0 },
    );

    return (
      <div className="mt-8 flex flex-col space-y-6">
        <div className="text-center">
          <h2 className="mb-1 text-2xl font-semibold">Series Total</h2>
          <h3 className="text-2xl">Score:</h3>
        </div>
        <TeamScores
          team0score={allStats.team0Wins}//{totalTeamGoals.team0}
          team1score={allStats.team1Wins}//{totalTeamGoals.team1}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        <AggregateStats />
      </div>
    );
  }

  // Adjust the replay index based on whether we're showing aggregate stats
  const replayIndex = replays.length > 1 ? currentPage - 2 : currentPage - 1;
  const replay = replays[replayIndex];
  const stats = replay.data.properties.PlayerStats;

  return (
    <div className="mt-8 flex flex-col space-y-6">
      <div className="text-center">
        <h2 className="mb-1 text-2xl font-semibold">{replay.input.name()}</h2>
        <h3 className="text-2xl">Score:</h3>
      </div>
      <TeamScores
        team0score={replay.data.properties.Team0Score}
        team1score={replay.data.properties.Team1Score}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <DownloadReplayJson replay={replay} />
      {stats !== undefined ? (
        <Description
          gameType={replay.data.game_type}
          PlayerStats={stats}
          {...replay.data.properties}
        />
      ) : null}
      {stats !== undefined ? (
        <div className="flex flex-wrap place-content-center gap-10">
          <Graph
            key="Player Scores"
            title="Player Scores"
            defaultMax={1000}
            valFn={(x) => x.Score}
            scores={stats}
          />
          <Graph
            key="Player Goals"
            title="Player Goals"
            defaultMax={4}
            valFn={(x) => x.Goals}
            scores={stats}
          />
          <Graph
            key="Player Assists"
            title="Player Assists"
            defaultMax={4}
            valFn={(x) => x.Assists}
            scores={stats}
          />
          <Graph
            key="Player Saves"
            title="Player Saves"
            defaultMax={4}
            valFn={(x) => x.Saves}
            scores={stats}
          />
          <Graph
            key="Player Shots"
            title="Player Shots"
            defaultMax={8}
            valFn={(x) => x.Shots}
            scores={stats}
          />
        </div>
      ) : null}
    </div>
  );
};

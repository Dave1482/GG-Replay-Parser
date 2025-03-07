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
  const team0Wins = allStats?.team0Wins;
  const team1Wins = allStats?.team1Wins;

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
      { team0: 0, team1: 0 }
    );

    return (
      <div className="mt-8 flex flex-col space-y-6">
        <div className="text-center">
          <h2 className="mb-1 text-2xl font-semibold">Series Total</h2>
          <h3 className="text-2xl">Score:</h3>
        </div>
        <TeamScores
          team0score={team0Wins}
          team1score={team1Wins}
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
          {...

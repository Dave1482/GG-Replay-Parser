import { useAggregateStats, useReplays } from "../replay/replayStore";

interface TeamStats {
  goals: number;
  shots: number;
  saves: number;
  assists: number;
  score: number;
  playerNames: string[];
}

const TeamStatsDisplay = ({
  stats,
  teamName,
}: {
  stats: TeamStats;
  teamName: string;
}) => (
  <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
    <h3 className="mb-4 text-2xl font-bold">{teamName}</h3>
    <div className="space-y-3">
      <div>
        <h4 className="text-lg font-semibold">Players</h4>
        <p>{stats.playerNames.join(", ")}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Goals</h4>
          <p className="text-xl font-bold">{stats.goals}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Shots</h4>
          <p className="text-xl font-bold">{stats.shots}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Saves</h4>
          <p className="text-xl font-bold">{stats.saves}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-600 dark:text-gray-400">Assists</h4>
          <p className="text-xl font-bold">{stats.assists}</p>
        </div>
      </div>
      <div>
        <h4 className="text-sm text-gray-600 dark:text-gray-400">
          Average Score
        </h4>
        <p className="text-xl font-bold">
          {Math.round(stats.score / stats.playerNames.length)}
        </p>
      </div>
    </div>
  </div>
);

export const AggregateStats = () => {
  const stats = useAggregateStats();
  const replays = useReplays();

  if (!stats || replays.length === 0) return null;

  // Calculate team statistics across all games
  const teamStats = replays.reduce(
    (acc: { team0: TeamStats; team1: TeamStats }, replay) => {
      const players = replay.data.properties.PlayerStats;

      if (players) {
        // First, update the player rosters for each team to include all players
        players.forEach((player) => {
          const team = player.Team === 0 ? "team0" : "team1";
          if (!acc[team].playerNames.includes(player.Name)) {
            acc[team].playerNames.push(player.Name);
          }
        });

        // Initialize the game stats
        const gameStats = {
          team0: { goals: 0, shots: 0, saves: 0, assists: 0, score: 0 },
          team1: { goals: 0, shots: 0, saves: 0, assists: 0, score: 0 },
        };

        // Sum up stats for each team in this game
        players.forEach((player) => {
          const team = player.Team === 0 ? "team0" : "team1";
          gameStats[team].goals += player.Goals;
          gameStats[team].shots += player.Shots;
          gameStats[team].saves += player.Saves;
          gameStats[team].assists += player.Assists;
          gameStats[team].score += player.Score;
        });

        // Add this game's stats to the totals
        acc.team0.goals += gameStats.team0.goals;
        acc.team0.shots += gameStats.team0.shots;
        acc.team0.saves += gameStats.team0.saves;
        acc.team0.assists += gameStats.team0.assists;
        acc.team0.score += gameStats.team0.score;

        acc.team1.goals += gameStats.team1.goals;
        acc.team1.shots += gameStats.team1.shots;
        acc.team1.saves += gameStats.team1.saves;
        acc.team1.assists += gameStats.team1.assists;
        acc.team1.score += gameStats.team1.score;
      }

      return acc;
    },
    {
      team0: {
        goals: 0,
        shots: 0,
        saves: 0,
        assists: 0,
        score: 0,
        playerNames: [],
      },
      team1: {
        goals: 0,
        shots: 0,
        saves: 0,
        assists: 0,
        score: 0,
        playerNames: [],
      },
    },
  );

  return (
    <div className="mt-8 flex flex-col space-y-6">
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-semibold">Series Statistics</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {stats.totalGames} Games Played • {stats.winPercentage}% Win Rate
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TeamStatsDisplay stats={teamStats.team0} teamName="Blue Team" />
        <TeamStatsDisplay stats={teamStats.team1} teamName="Orange Team" />
      </div>
    </div>
  );
};

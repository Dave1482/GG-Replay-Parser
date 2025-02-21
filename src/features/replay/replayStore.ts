import { ParseMode } from "@/stores/uiStore";
import { create } from "zustand";
import { ParsedReplay, ParseInput, Replay } from "../worker";

class ReplayInput {
  constructor(public readonly input: ParseInput) {}
  path = () => {
    if (typeof this.input === "string") {
      return this.input;
    } else {
      return this.input.name;
    }
  };

  name = () => {
    const path = this.path();
    return path.slice(path.lastIndexOf("/") + 1);
  };

  jsonName = () => this.name().replace(".replay", ".json");
}

interface ParseRequest {
  input: ParseInput;
}

interface ParseArg {
  input: ReplayInput;
}

type ParseResult =
  | {
      kind: "success";
    }
  | {
      kind: "error";
      error: unknown;
    };

type ParseState = { kind: "initial" } | (ParseArg & ParseResult);

export interface ReplayYield extends ParseArg {
  data: Replay;
  networkErr: string | null;
  mode: ParseMode;
}

interface AggregateStats {
  totalGames: number;
  averageScore: number;
  totalGoals: number;
  winPercentage: number;
}

interface ReplayStore {
  latest: ParseState;
  replays: ReplayYield[]; // Array to store multiple replays for our pagination
  aggregateStats: AggregateStats | null;
  actions: {
    parseError: (error: unknown, req: ParseRequest) => void;
    parsed: (data: ParsedReplay, mode: ParseMode, req: ParseRequest) => void;
    clearReplays: () => void;
  };
}

const useReplayStore = create<ReplayStore>()((set) => ({
  latest: { kind: "initial" },
  replays: [],
  aggregateStats: null,
  actions: {
    parseError: (error, { input }) =>
      set(() => ({
        latest: { kind: "error", error, input: new ReplayInput(input) },
      })),
    parsed: ({ replay, ...rest }, mode, { input }) => {
      set((state) => {
        // Limit to 7 replays
        if (state.replays.length >= 7) {
          return state;
        }

        const newReplay = {
          data: replay,
          ...rest,
          mode,
          input: new ReplayInput(input),
        };

        const updatedReplays = [...state.replays, newReplay];
        const aggregateStats = calculateAggregateStats(updatedReplays);

        return {
          latest: { kind: "success", input: new ReplayInput(input) },
          replays: updatedReplays,
          aggregateStats,
        };
      });
    },
    clearReplays: () => set(() => ({ replays: [], aggregateStats: null })),
  },
}));

// Helper function to calculate aggregate stats
const calculateAggregateStats = (replays: ReplayYield[]): AggregateStats => {
  if (replays.length === 0) {
    return {
      totalGames: 0,
      averageScore: 0,
      totalGoals: 0,
      winPercentage: 0,
    };
  }

  let totalGoals = 0;
  let totalScore = 0;
  let wins = 0;

  replays.forEach((replay) => {
    // Calculate goals directly from team scores
    const team0Score = replay.data.properties.Team0Score || 0;
    const team1Score = replay.data.properties.Team1Score || 0;
    totalGoals += team0Score + team1Score;

    const playerStats = replay.data.properties.PlayerStats;
    if (playerStats && playerStats.length > 0) {
      const userStats = playerStats[0];
      const userTeam = userStats.Team;

      if (userTeam === 0 && team0Score > team1Score) wins++;
      if (userTeam === 1 && team1Score > team0Score) wins++;

      let gameTotal = 0;
      playerStats.forEach((player) => {
        if (player.Team === userTeam) {
          gameTotal += player.Score;
        }
      });
      totalScore += gameTotal;
    }
  });

  return {
    totalGames: replays.length,
    averageScore: Math.round(totalScore / replays.length),
    totalGoals,
    winPercentage: Math.round((wins / replays.length) * 100),
  };
};

export const useReplayActions = () => useReplayStore((state) => state.actions);
export const useLatestParse = () => useReplayStore((state) => state.latest);
export const useReplays = () => useReplayStore((state) => state.replays);
export const useAggregateStats = () =>
  useReplayStore((state) => state.aggregateStats);
export const useParsedReplay = () => {
  const replays = useReplays();
  return replays.length > 0 ? replays[replays.length - 1] : null;
};

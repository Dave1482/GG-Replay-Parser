export interface Replay {
  major_version: number;
  minor_version: number;
  net_version: number | null;
  game_type: string;
  properties: HeaderProperties;
}

export interface HeaderProperties {
  TeamSize: number;
  Team0Score?: number;
  Team1Score?: number;
  Goals: Goal[];
  PlayerStats?: PlayerStat[];
  Date: string;
  RecordFPS: number;
  NumFrames: number;
}

export interface Goal {
  PlayerName: string;
  frame: number;
  PlayerTeam: number;
}

export interface PlayerStat {
  Team: number;
  bBot: boolean;
  Goals: number;
  Shots: number;
  Score: number;
  Saves: number;
  Assists: number;
  Demos: number;
  DemolishFx: number;
  OnlineID: string;
  Platform: {
    kind: string;
    value: string;
  };
  Name: string;
}

export interface ParsedReplay {
  networkErr: string | null;
  replay: Replay;
}

export interface ReplayFile {
  raw: string;
  replay: Replay;
  name: string;
  parseMs: number;
}

export interface ReplayJsonOptions {
  pretty: boolean;
}

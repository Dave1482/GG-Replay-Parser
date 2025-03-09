import { Replay, ParsedReplay, ReplayJsonOptions } from "./types";
import * as wasmModule from "../../../crate/pkg/rl_wasm";
//import { TextDecoder } from 'text-encoding'; // Only needed if TextDecoder is not globally available.
type RLMod = typeof wasmModule;

// The parser assumes that the wasm bundle has been fetched and compiled before
// any of these functions are executed

// Utility function outside the class (you can move it inside if needed)
function findDemolishExtended(data: any): any | null {
  if (typeof data !== 'object' || data === null) return null;

  // Check if the object matches the desired structure
  if (
    data.attribute?.DemolishExtended
  ) {
    return data;
  }

  // Recursively check nested objects and arrays
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const result = findDemolishExtended(data[key]);
      if (result) return result;
    }
  }

  return null;
}

export class ReplayParser {
  private mod: RLMod;
  private replay: wasmModule.Replay | undefined;

  constructor(mod: RLMod) {
    this.mod = mod;
  }

  public parse(data: Uint8Array): ParsedReplay {
    this.replay = this.mod.parse(data);

    // Parse full JSON data for replay
    const replayData = JSON.parse(JSON.stringify(this.replay.full_json(false)));

    // Use the findDemolishExtended function to locate specific data
    const demolishExtended = findDemolishExtended(replayData);
    if (demolishExtended) {
      console.log("Found DemolishExtended:", demolishExtended);
    } else {
      console.log("DemolishExtended not found.");
    }

    return {
      // Use header_json for the replay summary
      replay: JSON.parse(this.replay.header_json(false)) as Replay,
      networkErr: this.replay.network_err() ?? null,
    };
  }

  public replayJson({ pretty }: ReplayJsonOptions): Uint8Array {
    if (this.replay === undefined) {
      throw new Error("replay must be defined");
    }
    return this.replay.full_json(pretty);
  }
}

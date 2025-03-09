import { Replay, ParsedReplay, ReplayJsonOptions } from "./types";
import * as wasmModule from "../../../crate/pkg/rl_wasm";
type RLMod = typeof wasmModule;

// The parser assumes that the wasm bundle has been fetched and compiled before
// any of these functions are executed
export class ReplayParser {
  private mod: RLMod;
  private replay: wasmModule.Replay | undefined;

  constructor(mod: RLMod) {
    this.mod = mod;
  }

  /**
   * Searches for all instances of `DemolishExtended` in a large Uint8Array.
   */
  private findAllDemolishExtendedInLargeUint8Array(data: Uint8Array): any[] {
  const results: any[] = [];
  const decoder = new TextDecoder("utf-8");
  const chunkSize = 1024 * 1024; // 1 MB chunk size
  const overlapSize = 1023; // Increased overlap size for boundary issues
  let partialString = ""; // Stores decoded data including overlap

  function recursiveSearch(obj: any): void {
    if (typeof obj !== "object" || obj === null) return;

    // Check if the object matches the desired structure
    if (
      obj.attribute?.DemolishExtended
    ) {
      results.push(obj);
    }

    // Recursively search nested objects and arrays
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        recursiveSearch(obj[key]);
      }
    }
  }

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize);
    const decodedChunk = decoder.decode(chunk, { stream: true });
    partialString += decodedChunk;

    try {
      const startIdx = partialString.indexOf("{");
      const endIdx = partialString.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        const jsonString = partialString.slice(startIdx, endIdx + 1);
        const parsedData = JSON.parse(jsonString);
        recursiveSearch(parsedData);
        partialString = partialString.slice(endIdx + 1); // Keep remaining data
      } else {
        console.log("Skipping incomplete JSON fragment.");
      }
    } catch (error) {
      console.error("JSON parsing error, moving to the next chunk:", error);
    }

    partialString = partialString.slice(-overlapSize);
  }

  return results;
}

  /**
   * Parses the replay data and looks for all instances of `DemolishExtended`.
   */
  public parse(data: Uint8Array): ParsedReplay {
    this.replay = this.mod.parse(data);

    // Find all instances of DemolishExtended in large Uint8Array
    const demolishExtendedInstances = this.findAllDemolishExtendedInLargeUint8Array(data);

    if (demolishExtendedInstances.length > 0) {
      console.log("Found instances of DemolishExtended:", demolishExtendedInstances);
    } else {
      console.log("No instances of DemolishExtended found.");
    }

    return {
      replay: JSON.parse(this.replay.header_json(false)) as Replay,
      networkErr: this.replay.network_err() ?? null,
    };
  }

  /**
   * Retrieves the replay JSON with formatting options.
   */
  public replayJson({ pretty }: ReplayJsonOptions): Uint8Array {
    if (this.replay === undefined) {
      throw new Error("replay must be defined");
    }
    return this.replay.full_json(pretty);
  }
}

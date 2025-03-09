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
  private findAllDemolishExtendedInLargeUint8Array(
    data: Uint8Array
  ): any[] {
    const results: any[] = [];
    const decoder = new TextDecoder("utf-8");
    const chunkSize = 1024 * 1024; // 1 MB chunk size
    const overlapSize = 100; // Keep the last 100 bytes of each chunk for overlap
    let partialString = ""; // Stores decoded data including overlap

    // Helper function to recursively search for DemolishExtended in parsed JSON data
    function recursiveSearch(obj: any): void {
      if (typeof obj !== "object" || obj === null) return;

      // Check if the object matches the desired structure
      if (
        obj.actor_id === 149 &&
        obj.stream_id === 64 &&
        obj.object_id === 292 &&
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
      // Extract the current chunk
      const chunk = data.subarray(i, i + chunkSize);

      // Decode the chunk and prepend any leftover data from the last iteration
      const decodedChunk = decoder.decode(chunk, { stream: true });
      partialString += decodedChunk;

      // Attempt to parse valid JSON and search for matching objects
      try {
        const startIdx = partialString.indexOf("{");
        const endIdx = partialString.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonString = partialString.slice(startIdx, endIdx + 1);
          const parsedData = JSON.parse(jsonString);
          recursiveSearch(parsedData);
          partialString = partialString.slice(endIdx + 1); // Keep remaining data for the next iteration
        }
      } catch (error) {
        // Handle parsing errors silently and move to the next chunk
        console.error("JSON parsing error, moving to the next chunk:", error);
      }

      // Retain the last few bytes for overlap with the next chunk
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

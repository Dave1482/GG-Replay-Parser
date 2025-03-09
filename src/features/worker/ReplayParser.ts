import { Replay, ParsedReplay, ReplayJsonOptions } from "./types";
import * as wasmModule from "../../../crate/pkg/rl_wasm";
type RLMod = typeof wasmModule;

// The parser assumes that the wasm bundle has been fetched and compiled before
// any of these functions are executed

// Utility function outside the class (you can move it inside if needed)
function findDemolishExtended(data: any): any | null {
  if (typeof data !== 'object' || data === null) return null;

  // Check if the object matches the desired structure
  if (data.attribute?.DemolishExtended) {
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

// New utility function to search large Uint8Array data in chunks
function searchInLargeUint8ArrayWithOverlap(
  data: Uint8Array,
  searchString: string
): string | null {
  const decoder = new TextDecoder("utf-8");
  const chunkSize = 1024 * 1024; // 1 MB chunk size
  const overlapSize = 1023; // Keep the last 100 bytes of each chunk for overlap
  let partialString = ""; // Stores decoded data including overlap

  for (let i = 0; i < data.length; i += chunkSize) {
    // Extract the current chunk
    const chunk = data.subarray(i, i + chunkSize);

    // Decode the chunk and prepend any leftover data from the last iteration
    const decodedChunk = decoder.decode(chunk, { stream: true });
    partialString += decodedChunk;

    // Check for the target string in the concatenated data
    if (partialString.includes(searchString)) {
      console.log(`Found "${searchString}" in data!`);

      // Extract context around the match (e.g., 50 characters before and after)
      const startIdx = partialString.indexOf(searchString);
      const context = partialString.slice(
        Math.max(0, startIdx - 50), // Include 50 characters before the match
        startIdx + searchString.length + 50 // Include 50 characters after the match
      );

      return context;
    }

    // Retain the last few bytes for overlap with the next chunk
    partialString = partialString.slice(-overlapSize);
  }

  console.log(`"${searchString}" not found in data.`);
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
    const replayData = JSON.parse(JSON.stringify(this.replay.full_json(true)));

    // Use the new function to search for DemolishExtended within large Uint8Array
    const searchString = "DemolishExtended";
    const context = searchInLargeUint8ArrayWithOverlap(data, searchString);

    if (context) {
      console.log(`Context around "${searchString}":\n`, context);
    } else {
      console.log(`"${searchString}" not found in the replay data.`);
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

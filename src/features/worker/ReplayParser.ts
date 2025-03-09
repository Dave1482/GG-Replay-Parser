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
   * Searches for a specific string within a large Uint8Array in manageable chunks,
   * ensuring boundary overlaps are handled.
   */
  private searchInLargeUint8ArrayWithOverlap(
    data: Uint8Array,
    searchString: string
  ): string | null {
    const decoder = new TextDecoder("utf-8");
    const chunkSize = 1024 * 1024; // 1 MB chunk size
    const overlapSize = 100; // Keep the last 100 bytes of each chunk for overlap
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

  /**
   * Parses the `DemolishExtended` object from the found context.
   */
  private parseDemolishExtended(context: string): any | null {
    try {
      // Parse the JSON object if the context contains valid JSON
      const startIdx = context.indexOf("{"); // Find the start of the JSON object
      const endIdx = context.lastIndexOf("}"); // Find the end of the JSON object

      if (startIdx !== -1 && endIdx !== -1) {
        const jsonString = context.slice(startIdx, endIdx + 1);
        const demolishExtendedObject = JSON.parse(jsonString);

        console.log("Parsed DemolishExtended Object:", demolishExtendedObject);
        return demolishExtendedObject;
      } else {
        console.error("Failed to parse DemolishExtended: JSON boundaries not found.");
      }
    } catch (error) {
      console.error("Error while parsing DemolishExtended object:", error);
    }

    return null;
  }

  /**
   * Parses the replay data and looks for specific structures like DemolishExtended.
   */
  public parse(data: Uint8Array): ParsedReplay {
    this.replay = this.mod.parse(data);

    // Use the search function to find DemolishExtended within large Uint8Array
    const searchString = "DemolishExtended";
    const context = this.searchInLargeUint8ArrayWithOverlap(data, searchString);

    if (context) {
      console.log(`Context around "${searchString}":\n`, context);

      // Parse the specific DemolishExtended object
      const demolishExtended = this.parseDemolishExtended(context);

      if (demolishExtended) {
        console.log("Successfully parsed DemolishExtended object:", demolishExtended);
      }
    } else {
      console.log(`"${searchString}" not found in the replay data.`);
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

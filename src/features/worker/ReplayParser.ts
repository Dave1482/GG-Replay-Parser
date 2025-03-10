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
  private findSpecificAttributesInUpdatedActors(data: Uint8Array): string {
  const results: any[] = [];
  const decoder = new TextDecoder("utf-8");
  const chunkSize = 5 * 1024 * 1024; // 5 MB chunk size
  const overlapSize = 1023; // For boundary issues
  let partialString = ""; // Stores decoded data including overlap

  function extractSpecificAttributes(updatedActors: any[]): void {
    for (const actor of updatedActors) {
      if (actor.attribute?.DemolishExtended || actor.attribute?.RigidBody) {
        results.push(actor); // Add the whole actor object if it matches
      }
    }
  }

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize);
    const decodedChunk = decoder.decode(chunk, { stream: true });
    partialString += decodedChunk;

    try {
      // Extract and parse valid JSON fragments
      const startIdx = partialString.indexOf("{");
      const endIdx = partialString.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        const jsonString = partialString.slice(startIdx, endIdx + 1);
        try {
          const parsedData = JSON.parse(jsonString);

          // Navigate to "network_frames" -> "frames" -> "updated_actors" and process
          if (
            parsedData.network_frames &&
            parsedData.network_frames.frames &&
            Array.isArray(parsedData.network_frames.frames)
          ) {
            for (const frame of parsedData.network_frames.frames) {
              if (frame.updated_actors && Array.isArray(frame.updated_actors)) {
                extractSpecificAttributes(frame.updated_actors);
              }
            }
          }
        } catch (innerError) {
          console.error("Inner JSON parsing error, but continuing with valid fragments:", innerError);
        }
        partialString = partialString.slice(endIdx + 1); // Keep remaining data
      } else {
        console.log("Skipping incomplete JSON fragment.");
      }
    } catch (outerError) {
      console.error("Outer JSON parsing error, moving to the next chunk:", outerError);
    }

    // Retain the last portion of this chunk for boundary checks with the next one
    partialString = partialString.slice(-overlapSize);
  }

  return JSON.stringify(results, null, 2); // Pretty-print the results
}

/**
 * Parses replay data to filter for actors with specific attributes and logs the results.
 */
public parse(data: Uint8Array): { parsedReplay: ParsedReplay; filteredActors: any[] } {
  this.replay = this.mod.parse(data);

  // Find all actors with DemolishExtended or RigidBody attributes
  const filteredActors = this.findSpecificAttributesInUpdatedActors(data);
  const parsedFilteredActors = JSON.parse(filteredActors);

  if (parsedFilteredActors.length > 0) {
    console.log(`Found ${parsedFilteredActors.length} matching actors:`);
    parsedFilteredActors.forEach((actor: any, index: number) => {
      console.log(`Actor ${index + 1}:`, actor);
    });
  } else {
    console.log("No matching actors found.");
  }

  return {
    parsedReplay: {
      replay: JSON.parse(this.replay.header_json(false)) as Replay,
      networkErr: this.replay.network_err() ?? null,
    },
    filteredActors: parsedFilteredActors,
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

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
  private findAllDemolishExtendedInNetworkFrames(data: Uint8Array): any[] {
  const results: any[] = [];
  const decoder = new TextDecoder("utf-8");
  const chunkSize = 1024 * 1024; // 1 MB chunk size
  const overlapSize = 1023; // For boundary issues
  let partialString = ""; // Stores decoded data including overlap

  function extractDemolishExtended(frames: any[]): void {
    for (const frame of frames) {
      if (frame.attribute?.DemolishExtended) {
        results.push(frame); // Store the entire frame containing DemolishExtended
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

        // Navigate to "network_frames" -> "frames" and process
        if (parsedData.network_frames && Array.isArray(parsedData.network_frames.frames)) {
          extractDemolishExtended(parsedData.network_frames.frames);
        }

        partialString = partialString.slice(endIdx + 1); // Keep remaining data
      } else {
        console.log("Skipping incomplete JSON fragment.");
      }
    } catch (error) {
      console.error("JSON parsing error, moving to the next chunk:", error);
    }

    // Retain the last portion of this chunk for boundary checks with the next one
    partialString = partialString.slice(-overlapSize);
  }

  return results; // Return extracted frames containing "DemolishExtended" as an array
}

/**
 * Parses the replay data and displays all instances of `DemolishExtended` in full.
 */
public parse(data: Uint8Array): ParsedReplay {
  this.replay = this.mod.parse(data);

  // Find all instances of DemolishExtended in network_frames
  const demolishExtendedInstances = this.findAllDemolishExtendedInNetworkFrames(data);

  if (demolishExtendedInstances.length > 0) {
    console.log(`Found ${demolishExtendedInstances.length} instances of DemolishExtended:`);
    demolishExtendedInstances.forEach((instance: any, index: number) => {
      console.log(`Instance ${index + 1}:`, JSON.stringify(instance, null, 2));
    });
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

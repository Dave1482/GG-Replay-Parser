import { downloadData } from "@/utils/downloadData";
import { useReplayParser, workerQueryOptions } from "@/features/worker";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParseMode, usePrettyPrint, useUiActions } from "@/stores/uiStore";
import { useIsActionInFlight } from "@/hooks";
import { ReplayYield } from "../replay/replayStore";
import { useState, useEffect } from "react";

interface DownloadReplayJsonProps {
  replay: ReplayYield;
}

//import React, { useEffect, useState } from "react";

interface DemolitionEvent {
  attackerName: string;
  victimName: string;
  frameNumber: number;
}

interface PlayerMapping {
  [actorId: string]: string;
}

interface GetFilteredJsonDataProps {
  replay: ReplayYield; // The full replay JSON data
}

export const GetFilteredJsonData = ({ replay }: DownloadReplayJsonProps) => {
  const parser = useReplayParser(); // Get the parser instance
  const [demolitionEvents, setDemolitionEvents] = useState<DemolitionEvent[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  const extractDemolitionEvents = (jsonData: any) => {
    const actorToPlayer: PlayerMapping = {};
    const demolitionEvents: DemolitionEvent[] = [];
    const seenDemolitions: { [key: string]: number } = {};

    // Build actor-to-player mapping
    const frames = jsonData?.network_frames?.frames || [];
    frames.forEach((frame: any) => {
      (frame.replications || []).forEach((replication: any) => {
        const actorId = replication.actor_id?.value;
        if (!actorId || !replication?.value?.updated) return;

        replication.value.updated.forEach((update: any) => {
          if (update.name === "Engine.PlayerReplicationInfo:PlayerName") {
            const playerName = update.value?.string;
            if (playerName) {
              actorToPlayer[actorId] = playerName;
              console.log(`Processing actorId: ${playerName} = ${actorId}`); // Output actorId to console
            }
          }
        });
      });
    });

    // Detect demolitions
    frames.forEach((frame: any, frameIdx: number) => {
      (frame.replications || []).forEach((replication: any) => {
        (replication.value?.updated || []).forEach((update: any) => {
          if (update.name?.includes("DemolishExtended")) {
            const demoData = update.value?.actor?.attribute?.DemolishExtended;

            if (demoData) {
              const attackerId = demoData.attacker.actor;
              const victimId = demoData.victim.actor;

              if (attackerId && victimId) {
                const attackerName =
                  actorToPlayer[attackerId] || `Unknown(${attackerId})`;
                const victimName =
                  actorToPlayer[victimId] || `Unknown(${victimId})`;

                const demoKey = `${attackerName}-${victimName}`;
                const lastFrame = seenDemolitions[demoKey] || -999;

                if (frameIdx - lastFrame > 120) {
                  seenDemolitions[demoKey] = frameIdx;
                  demolitionEvents.push({
                    attackerName,
                    victimName,
                    frameNumber: frameIdx,
                  });
                }
              }
            }
          }
        });
      });
    });

    return demolitionEvents;
  };

  useEffect(() => {
    const fetchDemolitionEvents = async () => {
      try {
        setIsLoading(true);

        let jsonData: any;

        // Fetch JSON data depending on the replay mode
        if (replay.mode === "local") {
          const { data } = await parser().replayJson({ pretty: false });
          jsonData = JSON.parse(new TextDecoder().decode(data));
        } else {
          const form = new FormData();
          form.append("file", replay.input.input);

          const resp = await fetch("/api/json", {
            method: "POST",
            body: form,
          });

          if (!resp.ok) throw new Error("Failed to fetch JSON data");

          const responseData = new Uint8Array(await resp.arrayBuffer());
          jsonData = JSON.parse(new TextDecoder().decode(responseData));
        }

        // Process demolition events
        const demolitions = extractDemolitionEvents(jsonData);
        setDemolitionEvents(demolitions);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching or processing replay data:", error);
        setIsLoading(false);
      }
    };

    fetchDemolitionEvents();
  }, [parser, replay]);

  if (isLoading) {
    return (
      <div className="grid place-items-center">
        <p className="text-gray-500 text-lg">Processing data...</p>
      </div>
    );
  }

  return (
    <div className="grid place-items-center space-y-4">
      <h3 className="font-bold text-lg">Demolition Summary:</h3>
      {demolitionEvents.length > 0 ? (
        <div>
          <h4 className="font-medium text-md">Chronological Events:</h4>
          <ul className="list-disc pl-5">
            {demolitionEvents.map((event, index) => (
              <li key={index}>
                Frame {event.frameNumber}: {event.attackerName} →{" "}
                {event.victimName}
              </li>
            ))}
          </ul>

          <h4 className="font-medium text-md mt-4">Leaderboard:</h4>
          <ul className="list-disc pl-5">
            {Object.entries(
              demolitionEvents.reduce((counts: Record<string, number>, event) => {
                counts[event.attackerName] =
                  (counts[event.attackerName] || 0) + 1;
                return counts;
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .map(([name, count], index) => (
                <li key={index}>
                  {name}: {count} demolition{count !== 1 ? "s" : ""}
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <p>No demolitions found in this replay.</p>
      )}
    </div>
  );
};

export const GetFullJsonData = ({ replay }: DownloadReplayJsonProps) => {
  const parser = useReplayParser(); // Get the parser instance
  const { setPrettyPrint } = useUiActions(); // Action to toggle pretty print
  const prettyPrint = usePrettyPrint(); // Current pretty print state

  const [dataByReplay, setDataByReplay] = useState<Record<string, any>>({}); // Store full data per replay
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        setIsLoading(true); // Set loading to true while fetching data

        let replayKey: string;

        // Check if replay.input.input is a File or a string
        if (typeof replay.input.input === "string") {
          replayKey = replay.input.input; // Use string directly as key
        } else {
          // If it's a File, construct the key
          replayKey = `${replay.input.input.name}_${replay.input.input.lastModified}`;
        }

        // Check if data for this replay is already fetched
        if (dataByReplay[replayKey]) {
          setIsLoading(false); // Data is already available, stop loading
          return;
        }

        if (replay.mode === "local") {
          const { data } = await parser().replayJson({ pretty: prettyPrint });
          const jsonData = JSON.parse(new TextDecoder().decode(data));

          setDataByReplay((prev) => ({
            ...prev,
            [replayKey]: jsonData,
          }));
        } else {
          const params = new URLSearchParams({ pretty: prettyPrint.toString() });
          const form = new FormData();
          form.append("file", replay.input.input as File);

          const resp = await fetch(`/api/json?${params}`, { method: "POST", body: form });
          if (!resp.ok) throw new Error("Edge runtime unable to return JSON");

          const responseData = new Uint8Array(await resp.arrayBuffer());
          const jsonData = JSON.parse(new TextDecoder().decode(responseData));

          setDataByReplay((prev) => ({
            ...prev,
            [replayKey]: jsonData,
          }));
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching or processing data:", error);
        setIsLoading(false);
      }
    };

    fetchFullData();
  }, [parser, replay.mode, prettyPrint, replay.input.input]);

  const currentReplayKey =
    typeof replay.input.input === "string"
      ? replay.input.input
      : `${replay.input.input.name}_${replay.input.input.lastModified}`;

  const jsonData = dataByReplay[currentReplayKey] || null;

  if (isLoading) {
    return (
      <div className="grid place-items-center">
        <p className="text-gray-500 text-lg">Loading replay data...</p>
      </div>
    );
  }

  return (
    <div className="grid place-items-center space-y-4">
      {/* Toggle Pretty Print */}
      <label>
        <input
          className="mr-1 rounded focus:outline focus:outline-2 focus:outline-blue-600"
          type="checkbox"
          checked={prettyPrint}
          onChange={(e) => setPrettyPrint(e.target.checked)}
        />
        Pretty print
      </label>

      {/* Render Full JSON Data */}
      <div>
        <h3 className="font-bold text-lg">Replay JSON Data:</h3>
        {jsonData ? (
          <pre className="text-sm overflow-auto">
            {JSON.stringify(jsonData, null, prettyPrint ? 2 : 0)}
          </pre>
        ) : (
          <p>No data found for the current replay.</p>
        )}
      </div>
    </div>
  );
};


export const DownloadReplayJson = ({ replay }: DownloadReplayJsonProps) => {
  const parser = useReplayParser();
  const { setPrettyPrint } = useUiActions();
  const workerBusy = useIsActionInFlight();
  const currentMode = useParseMode();
  const prettyPrint = usePrettyPrint();

  const workerQuery = useQuery({
    queryKey: ["json", prettyPrint, replay.input.path()],
    ...workerQueryOptions,
    queryFn: async () => {
      const { data } = await parser().replayJson({ pretty: prettyPrint });
      downloadData(data, replay.input.jsonName());

      // I don't want this large data cached
      return null;
    },
    gcTime: 0,
    enabled: false,
  });

  const edgeQuery = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        pretty: prettyPrint.toString(),
      });
      const form = new FormData();
      form.append("file", replay.input.input);

      const resp = await fetch(`/api/json?${params}`, {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        throw new Error("edge runtime unable to return json");
      }
      downloadData(await resp.arrayBuffer(), replay.input.jsonName());
      return null;
    },
    gcTime: 0,
  });

  return (
    <div className="grid place-items-center">
      <button
        className="btn border-2 border-gray-300 bg-gray-50 focus-visible:outline-blue-600 active:bg-gray-200 enabled:hover:border-blue-400 enabled:hover:bg-blue-50 disabled:opacity-40 dark:text-slate-700"
        disabled={workerBusy || replay.mode != currentMode}
        onClick={() => {
          currentMode === "local" ? workerQuery.refetch() : edgeQuery.mutate();
        }}
      >
        Convert Replay to JSON
      </button>
      <label>
        <input
          className="mr-1 rounded focus:outline focus:outline-2 focus:outline-blue-600"
          type="checkbox"
          checked={prettyPrint}
          onChange={(e) => setPrettyPrint(e.target.checked)}
          disabled={workerBusy || replay.mode != currentMode}
        />
        Pretty print
      </label>
    </div>
  );
};

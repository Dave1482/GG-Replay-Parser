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

export const GetFilteredJsonData = ({ replay }: DownloadReplayJsonProps) => {
  const parser = useReplayParser(); // Get the parser instance
  const { setPrettyPrint } = useUiActions(); // Action to toggle pretty print
  const prettyPrint = usePrettyPrint(); // Current pretty print state

  const [filteredDataByReplay, setFilteredDataByReplay] = useState<Record<string, any[]>>({}); // Store filtered data per replay
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  const filterDemolishExtendedFrames = (jsonData: any) => {
    const filteredFrames = jsonData?.network_frames?.frames?.flatMap((frame: any) =>
      frame?.updated_actors?.filter((actor: any) => actor?.attribute?.DemolishExtended)
    );
    return filteredFrames || [];
  };

  useEffect(() => {
    const fetchFilteredData = async () => {
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
        if (filteredDataByReplay[replayKey]) {
          setIsLoading(false); // Data is already available, stop loading
          return;
        }

        if (replay.mode === "local") {
          const { data } = await parser().replayJson({ pretty: prettyPrint });
          const jsonData = JSON.parse(new TextDecoder().decode(data));
          const filteredFrames = filterDemolishExtendedFrames(jsonData);

          setFilteredDataByReplay((prev) => ({
            ...prev,
            [replayKey]: filteredFrames,
          }));
        } else {
          const params = new URLSearchParams({ pretty: prettyPrint.toString() });
          const form = new FormData();
          form.append("file", replay.input.input as File);

          const resp = await fetch(`/api/json?${params}`, { method: "POST", body: form });
          if (!resp.ok) throw new Error("Edge runtime unable to return JSON");

          const responseData = new Uint8Array(await resp.arrayBuffer());
          const jsonData = JSON.parse(new TextDecoder().decode(responseData));
          const filteredFrames = filterDemolishExtendedFrames(jsonData);

          setFilteredDataByReplay((prev) => ({
            ...prev,
            [replayKey]: filteredFrames,
          }));
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching or filtering data:", error);
        setIsLoading(false);
      }
    };

    fetchFilteredData();
  }, [parser, replay.mode, prettyPrint, replay.input.input]);

  const currentReplayKey =
    typeof replay.input.input === "string"
      ? replay.input.input
      : `${replay.input.input.name}_${replay.input.input.lastModified}`;

  const filteredData = filteredDataByReplay[currentReplayKey] || [];

  if (isLoading) {
    return (
      <div className="grid place-items-center">
        <p className="text-gray-500 text-lg">Loading filtered data...</p>
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

      {/* Render Filtered Data */}
      <div>
        <h3 className="font-bold text-lg">Filtered Data:</h3>
        {filteredData.length > 0 ? (
          <pre className="text-sm overflow-auto">
            {JSON.stringify(filteredData, null, prettyPrint ? 2 : 0)}
          </pre>
        ) : (
          <p>No filtered data found for the current replay.</p>
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

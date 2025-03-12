import { downloadData } from "@/utils/downloadData";
import { useReplayParser, workerQueryOptions } from "@/features/worker";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParseMode, usePrettyPrint, useUiActions } from "@/stores/uiStore";
import { useIsActionInFlight } from "@/hooks";
import { ReplayYield, DemolitionEvent } from "../replay/replayStore";
import { useState, useEffect } from "react";
import { ReplayAnalyzer } from "../replay/ReplayAnalyzer";

interface DownloadReplayJsonProps {
  replay: ReplayYield;
}

export const GetFilteredJsonData = ({ replay }: DownloadReplayJsonProps) => {
  const parser = useReplayParser(); // Parser instance
  const { setPrettyPrint } = useUiActions(); // Pretty print toggle action
  const prettyPrint = usePrettyPrint(); // Pretty print state

  const [filteredData, setFilteredData] = useState<any[]>([]); // Store filtered demolition data
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Use ReplayAnalyzer to extract demolitions
  const filterDemolishExtendedFrames = (jsonData: any): DemolitionEvent[] => {
    const analyzer = new ReplayAnalyzer();
  
    // Build actor mappings and find demolitions
    analyzer.buildActorMappings(jsonData);
    const demolitions = analyzer.findDemolitions(jsonData);
  
    return demolitions; // Ensure it matches DemolitionEvent[]
  };

  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        const { data } = await parser().replayJson({ pretty: prettyPrint });
        const jsonData = JSON.parse(new TextDecoder().decode(data));
        const demolitions = filterDemolishExtendedFrames(jsonData);
  
        // Update local state
        setFilteredData(demolitions);
      } catch (error) {
        console.error("Error processing replay data:", error);
      }
    };
  
    fetchFilteredData();
  }, [parser, prettyPrint, replay]);

  // Display a loading message until data is ready
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
          onChange={(e) => setPrettyPrint(e.target.checked)} // Update pretty print state
        />
        Pretty print
      </label>

      {/* Render Demolitions */}
      <div>
        <h3 className="font-bold text-lg">Demolitions:</h3>
        {filteredData.length > 0 ? (
          <ul className="text-sm overflow-auto">
            {filteredData.map((demo, index) => (
              <li key={index}>
                <strong>{demo.attackerName}</strong> demolished <strong>{demo.victimName}</strong> at frame{" "}
                <strong>{demo.frameNumber}</strong>.
              </li>
            ))}
          </ul>
        ) : (
          <p>No demolitions found for the current replay.</p>
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

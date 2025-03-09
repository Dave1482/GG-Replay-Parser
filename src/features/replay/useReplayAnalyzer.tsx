import { useState } from "react";
import { ReplayAnalyzer } from "./ReplayAnalyzer"; // Update the path if necessary

// Define a type for the demolition events
export type DemolitionEvent = {
  attacker: string;
  victimName: string;
  frameNumber: number;
};

export const useReplayAnalyzer = () => {
  const [busy, setBusy] = useState(false);
  const [demolitionEvents, setDemolitionEvents] = useState<DemolitionEvent[]>([]);

  // Explicitly type the state
  const analyzeFile = (file: File) => {
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        console.log("Replay content:", content);
        const analyzer = new ReplayAnalyzer();
        analyzer.analyzeReplayContent(content);
        const events = analyzer.findDemolitions(JSON.parse(content)); // Get demolition events
        setDemolitionEvents(events); // Assign the events to the state
        console.log("Replay analysis completed!");
      } catch (error) {
        console.error("Error analyzing replay:", error);
      } finally {
        setBusy(false);
      }
    };
    reader.readAsText(file);
  };

  return { analyzeFile, busy, demolitionEvents };
};

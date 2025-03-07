import { useState } from "react";
import { ReplayAnalyzer } from "./ReplayAnalyzer"; // Update the path if necessary

// Define a type for the demolition events
type DemolitionEvent = {
    attackerName: string;
    victimName: string;
    frameNumber: number;
};

export const useReplayAnalyzer = () => {
    const [busy, setBusy] = useState(false);
    const [demolitionEvents, setDemolitionEvents] = useState<DemolitionEvent[]>([]); // Explicitly type the state

    const analyzeFile = (file: File) => {
        setBusy(true);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const content = reader.result as string;
                const analyzer = new ReplayAnalyzer();
                const events = analyzer.getDemolitionEvents(content);
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

/*ReplayAnalyzer.prototype.analyzeReplayContent = function (content) {
    try {
        const replayData = JSON.parse(content);
        this.exploreJsonStructure(replayData);
        this.buildActorMappings(replayData);
        const demolitionEvents = this.findDemolitions(replayData);
        this.printDemolitionSummary(demolitionEvents);
    } catch (error) {
        console.error("Error analyzing replay content:", error);
    }
};
*/

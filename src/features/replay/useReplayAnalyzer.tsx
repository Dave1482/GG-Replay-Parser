import { useState } from "react";
import { ReplayAnalyzer } from "./ReplayAnalyzer"; // Make sure to adjust the path as needed

export const useReplayAnalyzer = () => {
    const [busy, setBusy] = useState(false);
    const [demolitionEvents, setDemolitionEvents] = useState([]);

    const analyzeFile = (file: File) => {
        setBusy(true);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const content = reader.result as string;
                const analyzer = new ReplayAnalyzer();
                const events = analyzer.getDemolitionEvents(content);
                setDemolitionEvents(events);
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

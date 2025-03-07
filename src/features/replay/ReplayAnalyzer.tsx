ReplayAnalyzer.prototype.analyzeReplayContent = function (content) {
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

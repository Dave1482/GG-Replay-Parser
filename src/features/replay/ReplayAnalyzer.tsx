import fs from "fs";

export class ReplayAnalyzer {
    private actorToPlayer: Record<string, string> = {};
    private seenDemolitions: Record<string, number> = {};

    exploreJsonStructure(data: any, path: string = "", maxDepth: number = 3, currentDepth: number = 0): void {
        if (currentDepth >= maxDepth) return;
        if (typeof data === "object" && data !== null) {
            if (Array.isArray(data)) {
                console.log(`${"  ".repeat(currentDepth)}[List] ${path} (length: ${data.length})`);
                if (data.length > 0 && currentDepth < maxDepth - 1) {
                    this.exploreJsonStructure(data[0], `${path}[0]`, maxDepth, currentDepth + 1);
                }
            } else {
                Object.entries(data).forEach(([key, value]) => {
                    const currentPath = path ? `${path}.${key}` : key;
                    console.log(`${"  ".repeat(currentDepth)}[Dict] ${currentPath}`);
                    if (typeof value === "object" && value !== null) {
                        this.exploreJsonStructure(value, currentPath, maxDepth, currentDepth + 1);
                    } else {
                        console.log(`${"  ".repeat(currentDepth + 1)}Type: ${typeof value}`);
                    }
                });
            }
        }
    }

    buildActorMappings(replayData: any): void {
        const frames = replayData?.network_frames?.frames || [];
        frames.forEach((frame: any, frameIdx: number) => {
            (frame.replications || []).forEach((replication: any) => {
                if (!replication?.value?.updated) return;
                const actorId = replication.actor_id?.value;
                if (!actorId) return;
                replication.value.updated.forEach((update: any) => {
                    const name = update.name;
                    if (name === "Engine.PlayerReplicationInfo:PlayerName") {
                        const playerName = update.value?.string;
                        if (playerName) {
                            this.actorToPlayer[actorId] = playerName;
                            console.log(`Found player: ${playerName} (ID: ${actorId})`);
                        }
                    }
                });
            });
        });
        console.log(`Found ${Object.keys(this.actorToPlayer).length} player mappings`);
    }

    findDemolitions(replayData: any): any[] {
        const demolitionEvents: any[] = [];
        const frames = replayData?.network_frames?.frames || [];
        console.log(`\nAnalyzing ${frames.length} frames for demolitions...`);
        frames.forEach((frame: any, frameIdx: number) => {
            (frame.replications || []).forEach((replication: any) => {
                (replication.value?.updated || []).forEach((update: any) => {
                    if (update.name?.includes("Demolish")) {
                        const demoData = update.value?.demolish
                            || update.value?.custom_demolish?.demolish
                            || update.value?.custom_demolish_extended?.custom_demolish?.demolish;
                        if (demoData) {
                            const attackerId = demoData.attacker_actor_id;
                            const victimId = demoData.victim_actor_id;
                            if (attackerId && victimId) {
                                const attacker = this.actorToPlayer[attackerId] || `Unknown(${attackerId})`;
                                const victimName = this.actorToPlayer[victimId] || `Unknown(${victimId})`;
                                const demoKey = `${attacker}-${victimName}`;
                                const lastFrame = this.seenDemolitions[demoKey] || -999;
                                if (frameIdx - lastFrame > 120) {
                                    this.seenDemolitions[demoKey] = frameIdx;
                                    demolitionEvents.push({
                                        attacker,
                                        victimName,
                                        frameNumber: frameIdx,
                                    });
                                    console.log(`Found demolition: ${attacker} -> ${victimName}`);
                                }
                            }
                        }
                    }
                });
            });
        });
        return demolitionEvents;
    /*
        findDemolitions(parsedContent: any): DemolitionEvent[] {
          const demolitions: DemolitionEvent[] = [];
        
          if (parsedContent && parsedContent.frames) {
            for (const frame of parsedContent.frames) {
              if (frame.event === "demolition") {
                demolitions.push({
                  attacker: frame.attacker,
                  victim: frame.victim,
                  time: frame.time,
                });
              }
            }
          }
        
          return demolitions;*/
    }

    printDemolitionSummary(events: any[]): void {
        if (events.length === 0) {
            console.log("\nNo demolitions found in this replay.");
            return;
        }
        console.log("\n*** Demolition Summary ***");
        console.log("-".repeat(40));
        const demoCounts = events.reduce((counts: Record<string, number>, event: any) => {
            counts[event.attacker] = (counts[event.attacker] || 0) + 1;
            return counts;
        }, {});
        console.log("\nChronological Demolition Events:");
        events.forEach((event, i) => {
            console.log(`${i + 1}. ${event.attacker} -> ${event.victimName}`);
        });
        console.log("\nDemolition Leaderboard:");
        Object.entries(demoCounts)
            .sort(([, a], [, b]) => b - a)
            .forEach(([attacker, count]) => {
                console.log(`* ${attacker}: ${count} demolition${count !== 1 ? "s" : ""}`);
            });
    }

    analyzeReplayContent(content: string): void {
        try {
            const replayData = JSON.parse(content);
            this.exploreJsonStructure(replayData);
            this.buildActorMappings(replayData);
            const demolitionEvents = this.findDemolitions(replayData);
            this.printDemolitionSummary(demolitionEvents);
        } catch (error) {
            console.error("Error analyzing replay content:", error);
        }
    }

    getDemolitionEvents(content: string): any[] {
        try {
            const replayData = JSON.parse(content);
            this.exploreJsonStructure(replayData);
            this.buildActorMappings(replayData);
            const demolitionEvents = this.findDemolitions(replayData);
            return demolitionEvents;
        } catch (error) {
            console.error("Error analyzing replay content:", error);
            return [];
        }
    }
}

export class ReplayAnalyzer {
  actorToPlayer: Record<string, string>;
  seenDemolitions: Record<string, number>;

  constructor() {
    this.actorToPlayer = {};
    this.seenDemolitions = {};
  }

  buildActorMappings(replayData: any): void {
    console.log("\nBuilding actor mappings...");
    const frames = replayData?.network_frames?.frames || [];
    frames.forEach((frame: any) => {
      (frame.replications || []).forEach((replication: any) => {
        const actorId = replication.actor_id?.value;
        if (!actorId) return;

        (replication.value.updated || []).forEach((update: any) => {
          if (update.name === "Engine.PlayerReplicationInfo:PlayerName") {
            const playerName = update.value?.string;
            if (playerName) {
              this.actorToPlayer[actorId] = playerName;
              console.log(`Mapped actor ID ${actorId} to player ${playerName}`);
            }
          }
        });
      });
    });
    console.log(`Player mappings completed: ${Object.keys(this.actorToPlayer).length} players mapped`);
  }

  findDemolitions(replayData: any): { attackerName: string; victimName: string; frameNumber: number }[] {
    const demolitionEvents: { attackerName: string; victimName: string; frameNumber: number }[] = [];
    const frames = replayData?.network_frames?.frames || [];
    console.log(`\nProcessing ${frames.length} frames to find demolitions...`);

    frames.forEach((frame: any, frameIdx: number) => {
      (frame.replications || []).forEach((replication: any) => {
        (replication.value.updated || []).forEach((update: any) => {
          if (update.name?.includes("Demolish")) {
            const demoData =
              update.value?.demolish ||
              update.value?.custom_demolish?.demolish ||
              update.value?.custom_demolish_extended?.custom_demolish?.demolish;

            if (demoData) {
              const attackerId = demoData.attacker_actor_id;
              const victimId = demoData.victim_actor_id;
              if (attackerId && victimId) {
                const attackerName = this.actorToPlayer[attackerId] || `Unknown(${attackerId})`;
                const victimName = this.actorToPlayer[victimId] || `Unknown(${victimId})`;
                const demoKey = `${attackerName}-${victimName}`;
                const lastFrame = this.seenDemolitions[demoKey] || -999;

                if (frameIdx - lastFrame > 120) {
                  this.seenDemolitions[demoKey] = frameIdx;
                  demolitionEvents.push({
                    attackerName,
                    victimName,
                    frameNumber: frameIdx,
                  });
                  console.log(`Demolition: ${attackerName} -> ${victimName}`);
                }
              }
            }
          }
        });
      });
    });

    return demolitionEvents;
  }
}

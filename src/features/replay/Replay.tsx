import { ReplayInput } from "./ReplayInput";
import { Report } from "@/features/viz";
import { WarningBox } from "@/components/WarningBox";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useLatestParse, useParsedReplay } from "./replayStore";

export const Replay = () => {
  const latestParse = useLatestParse();
  const parsedReplay = useParsedReplay();

  const ParsedReplayComponent = () => {
  const { replay, body, processedBody } = useParsedReplay() || {};

  if (!replay) {
    return <div>No replay data available.</div>;
  }

  return (
  <div className="mt-4 flex flex-col gap-2">
    <ReplayInput />
    {latestParse.kind === "error" ? (
      <WarningBox
        message={`Unable to parse (${latestParse.input.path()}): ${getErrorMessage(
          latestParse.error,
        )}`}
      />
    ) : null}
    {parsedReplay?.networkErr ? (
      <WarningBox message={`network data: ${parsedReplay.networkErr}`} />
    ) : null}
    {parsedReplay !== null ? (
      <div>
        <Report />
        <h3>Replay Data</h3>
        <pre>{JSON.stringify(replay, null, 2)}</pre>
        <h3>Raw Body Data</h3>
        <pre>{JSON.stringify(body, null, 2)}</pre>
        <h3>Processed Body Data</h3>
        <pre>{JSON.stringify(processedBody, null, 2)}</pre>
      </div>
    ) : null}
  </div>
  );
};
/*return (
    <div className="mt-4 flex flex-col gap-2">
      <ReplayInput />
      {latestParse.kind === "error" ? (
        <WarningBox
          message={`Unable to parse (${latestParse.input.path()}): ${getErrorMessage(
            latestParse.error,
          )}`}
        />
      ) : null}
      {parsedReplay?.networkErr ? (
        <WarningBox message={`network data: ${parsedReplay.networkErr}`} />
      ) : null}
      {parsedReplay !== null ? <Report /> : null}
    </div>
  );*/
};

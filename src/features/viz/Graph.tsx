import { PlayerStat } from "@/features/worker";
import { Fragment } from "react";
import classes from "./Graph.module.css";

// d3-scales alone add 110kb to the minified, productionized output

interface GraphProps {
  scores: PlayerStat[];
  defaultMax: number;
  valFn: (x: PlayerStat) => number;
  title: string;
}

const scale = (
  num: number,
  in_min: number,
  in_max: number,
  out_min: number,
  out_max: number,
): number => {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

export const Graph = ({ scores, defaultMax, valFn, title }: GraphProps) => {
  const yPointHeight = 40;

  // width and height of svg
  const totalWidthPx = 600;
  const totalHeightPx = (scores.length + 1) * (yPointHeight - 15);

  // Width of the name legend
  const nameWidthPx = 200;

  // Gap between name legend and bars
  const nameGapPx = 25;

  // Points separating each tick mark
  const scoreSpacing = defaultMax / 4;

  // Default y scale goes out to 1000
  const defaultMaxScore = defaultMax;

  const scoreLabelWidthPx = 40;

  const pureScores = scores.map(valFn);
  const maxPlayerScore = Math.max(...pureScores);
  const maxScore = Math.max(defaultMaxScore, maxPlayerScore);

  // Number of tick marks
  const lineCount = Math.ceil(maxScore / scoreSpacing) + 1;

  const graphWidth = totalWidthPx - nameWidthPx - nameGapPx - scoreLabelWidthPx;
  const tickWidth = graphWidth / (lineCount - 1);

  const lines = Array.from({ length: lineCount }, (x, i) => (
    <Fragment key={`line ${i}`}>
      <line
        y1="0"
        y2={scores.length * yPointHeight}
        x1={i * tickWidth}
        x2={i * tickWidth}
        className="stroke-zinc-600/60 dark:stroke-zinc-200"
      />
    </Fragment>
  ));

  const xAxis = Array.from({ length: lineCount }, (x, i) => (
    <g
      key={`x-axis ${i}`}
      transform={`translate(${i * tickWidth}, 0)`}
      textAnchor="middle"
    >
      <text>{i * scoreSpacing}</text>
    </g>
  ));

  const scoreBars = scores.map((x, i) => (
    <rect
      key={`score ${i}`}
      height={`${yPointHeight - 19}`}
      x="0"
      y={i * yPointHeight}
      width={scale(valFn(x), 0, maxScore, 0, graphWidth)}
      className={x.Team === 0 ? "blue-team" : "orange-team"}
    />
  ));

  const scoreLabels = pureScores.map((x, i) => (
    <g
      key={`score label ${i}`}
      transform={`translate(${3 + scale(x, 0, maxScore, 0, graphWidth)}, ${
        24 + i * yPointHeight
      })`}
    >
      <text>{x}</text>
    </g>
  ));

  const names = scores.map((x, i) => (
    <g key={`name ${i}`} transform={`translate(0, ${4 + i * yPointHeight})`}>
      <text>{x.Name}</text>
    </g>
  ));

  return (
    <div className="max-w-full overflow-x-auto">
      <h2
        className="text-xl font-bold"
        style={{ marginLeft: nameWidthPx + 24 }}
      >
        {title}
      </h2>
      <svg
        height={totalHeightPx}
        width={totalWidthPx}
        className={classes["graph"]}
      >
        <g transform={`translate(${nameWidthPx}, 10)`}>
          <g transform="translate(0, 20)" textAnchor="end">
            {names}
          </g>
          <g transform={`translate(${nameGapPx}, 0)`}>
            {scoreBars}
            {lines}
            <g
              className="x-axis"
              transform={`translate(0, ${scores.length * yPointHeight + 16})`}
            >
              {xAxis}
            </g>
            {scoreLabels}
          </g>
        </g>
      </svg>
    </div>
  );
};

import obstacles from "../obstacles";
import config from "../config";
import { Hash } from "../types";

const { gridCount, squareSize } = config;

type RectProps = {
  x: number;
  y: number;
  color: string;
}

function Rect({ x, y, color }: RectProps) {
  return (
    <rect
      width={squareSize}
      height={squareSize}
      x={x * squareSize}
      y={y * squareSize}
      fill={color}
      stroke={color}
      onClick={() => console.log(x, y)}
    />
  );
}

const coordsToObstacles: Hash<string> = {};
const mapElems: React.JSX.Element[] = [];

obstacles.forEach(([xStart, xEnd, yStart, yEnd, color]) => {
  for (let x = xStart; x <= xEnd; x++) {
    for (let y = yStart; y <= yEnd; y++) {
      coordsToObstacles[`${x}:${y}`] = color || "#c1c3c7";
    }
  }
});

for (let x = 0; x < gridCount; x++) {
  for (let y = 0; y < gridCount; y++) {
    const key = `${x}:${y}`;
    const color = coordsToObstacles[`${x}:${y}`] || "white";
    mapElems.push(<Rect {...{ key, x, y, color }} />);
  }
}

export default function BaseLayer() {
  return (
    <div className="map_layer base_layer">
      <svg width={"100%"} height={"100%"}>
        {mapElems}
      </svg>
    </div>
  );
}

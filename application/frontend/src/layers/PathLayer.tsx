import config from "../config";
import { Driver, Point } from "../types.js";

const { squareSize } = config;

type Props = {
  driverData: Driver[]
} 

const offset = [squareSize / 2, squareSize / 2];

const Path = ({ path, status }: { path: Point[]; status: string }) => {
  const color = status === "enroute" ? "#454545" : "#adaaaa";

  const points = path.reduce(
    (res, p) => `${res} ${p[0] + offset[0]},${p[1] + offset[1]}`,
    ""
  );

  return (
    <svg width={"100%"} height={"100%"} style={{ position: "absolute" }}>
      <polyline points={points} stroke={color} strokeWidth={4} fill="none" />
    </svg>
  );
};

export default function PathLayer({ driverData }: Props) {
  const pathElems = driverData.map(({ id, path, status }) => {
    return path ? <Path key={id} path={path} status={status} /> : null;
  });

  return <div className="map_layer">{pathElems}</div>;
}

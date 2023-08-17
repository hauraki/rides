import Car from "../Car";
import { Driver } from "../types";

type Props = {
  driverData: Driver[]
} 

export default function CarLayer({ driverData }: Props) {
  const carElems = driverData.map(
    ({ id, location, name, path, pathIndex, pathDigest, pathLength }) => {
      return (
        <Car
          key={id}
          location={location}
          path={path}
          pathIndex={pathIndex}
          name={name}
          pathDigest={pathDigest}
          pathLength={pathLength}
        />
      );
    }
  );

  return <div className="map_layer">{carElems}</div>;
}

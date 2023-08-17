import { MapCustomerIcon, MapDestinationIcon } from "../icons";
import config from "../config";
import { Customer } from "../types";

const { gridCount } = config;

type Props = {
  customerData: Customer[];
}

export default function IconLayer({ customerData }: Props) {
  const iconElems = customerData.map(({ location, destination, enroute }) => {
    if (enroute) {
      const [x, y] = destination;
      return <MapDestinationIcon key={`${x}:${y}`} x={x} y={y} />;
    } else {
      const [x, y] = location;
      return <MapCustomerIcon key={`${x}:${y}`} x={x} y={y} />;
    }
  });

  return (
    <div className="map_layer">
      <svg
        viewBox={`0 0 ${gridCount} ${gridCount}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        {iconElems}
      </svg>
    </div>
  );
}

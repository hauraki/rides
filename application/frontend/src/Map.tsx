import React, { useState, useEffect } from "react";

import { BaseLayer, IconLayer, CarLayer, PathLayer } from "./layers";
import { Customer, Driver, Path, Point } from "./types";
import { apiGet, convertToPath, convertToPoint } from "./utils";
import config from "./config";

const { fetchInterval, gridSize, squareSize } = config;

function scalePoint([x, y]: Point) {
  return [x * squareSize, y * squareSize];
}

function scalePath(path: Path) {
  return path ? path.map(scalePoint) : null;
}

export default function Map() {
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [driverData, setDriverData] = useState<Driver[]>([]);

  useEffect(() => {
    async function loadData() {
      const drivers: Driver[] = ((await apiGet("/drivers")) || []).map((driver: any) => {
        return {
          id: driver.id,
          name: driver.name,
          status: driver.status,
          location: scalePoint(convertToPoint(driver.location)!),
          path: scalePath(convertToPath(driver.path)!),
          pathIndex: driver.path_index,
          pathLength: driver.path_length,
          pathDigest: driver.path_digest,
          customerId: driver.customer_id,
          customerName: driver.customer_name,
        };
      });

      const customerIsEnroute = (customer: any) => {
        return drivers.find(
          (driver) =>
            driver.status === "enroute" && driver.id === customer.driver_id
        );
      };

      const customers: Customer[] = ((await apiGet("/customers")) || []).map((customer:any) => {
        return {
          id: customer.id,
          name: customer.name,
          location: convertToPoint(customer.location),
          destination: convertToPoint(customer.destination),
          enroute: customerIsEnroute(customer),
        };
      });

      setDriverData(drivers);
      setCustomerData(customers);
    }

    const loadDataInterval = setInterval(loadData, fetchInterval);
    return function cleanup() {
      clearInterval(loadDataInterval);
    };
  }, []);

  return (
    <div className="map" style={{ width: gridSize, height: gridSize }}>
      <BaseLayer />
      <PathLayer driverData={driverData} />
      <CarLayer driverData={driverData} />
      <IconLayer customerData={customerData} />
    </div>
  );
}

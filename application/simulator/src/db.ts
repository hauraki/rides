import pg, { Client } from "pg";

import { Path, Point } from "./types.js";

let client: Client;

export async function connectClient() {
  if (client) return client;

  const connectionString = process.env.POSTGRES_URL;
  client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log("database connected successfully");
  } catch (err) {
    if (err instanceof Error) console.error("connection error", err.stack);
  }

  return client;
}

export function getClient() {
  return client;
}

// ---------- converters ----------

type PointObject = {
  x: number;
  y: number;
};

// "(13,37)"" --> [13,37]
export function convertToPoint(
  value: string | Point | PointObject | null
): Point | null {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const m = (value || "").match(/\((\d+)\,(\d+)\)/);
    return m ? [+m[1], +m[2]] : null;
  }

  if (value && typeof value.x === "number" && typeof value.y === "number")
    return [value.x, value.y];

  return null;
}

// "[(0,0),(1,1),(2,0)]" --> [[0,0], [1,1], [2,0]]
export function convertToPath(value: string | Path | null): Path | null {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return value
      .match(/\(\d+,\d+\)/g)!
      .map((pointString) => convertToPoint(pointString)!);
  }

  return null;
}

// [13,37] --> "(13,37)""
export function pointValue(point: Point | null) {
  return point ? `(${point[0]},${point[1]})` : null;
}

// [[0,0], [1,1], [2,0]] --> "[(0,0),(1,1),(2,0)]"
export function pathValue(path: Path | null) {
  if (!path) return null;

  return `[${path.map((point) => pointValue(point)).join(",")}]`;
}

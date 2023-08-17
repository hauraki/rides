export type Point = [number, number];
export type Path = Point[];
export type Graph = (0 | 1)[][];
export type Obstacle = [number, number, number, number, string?];

export type Hash<T extends any = any> = {
  [key: string]: T;
};

export type Customer = {
  location: Point;
  destination: Point;
  enroute: boolean;
};

export type Driver = {
  id: string;
  location: Point;
  path: Path | null;
  pathIndex: number | null;
  name: string;
  pathDigest: string | null;
  pathLength: number | null;
  status: string;
};

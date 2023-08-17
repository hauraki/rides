export type Point = [number, number];
export type Path = Point[];
export type Graph = (0 | 1)[][];
export type Obstacle = [number, number, number, number, string?];

export type Hash<T extends any = any> = {
  [key: string]: T;
};

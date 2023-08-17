import { Path, Point, Graph, Obstacle } from "./types.js";
import { getRandomInt } from "./utils.js";
import obstacles from "./data/obstacles.js";

export const gridCount = 100;

const buildObstaclesSet = (obstacles: Obstacle[]): Set<string> => {
  const set = new Set<string>();

  obstacles.forEach(([xStart, xEnd, yStart, yEnd]) => {
    for (let x = xStart; x <= xEnd; x++) {
      for (let y = yStart; y <= yEnd; y++) {
        set.add(`${x}:${y}`);
      }
    }
  });

  return set;
};

const buildGraph = (obstaclesSet: Set<string>): Graph => {
  const graph: Graph = [];
  for (let y = 0; y < gridCount; y++) {
    graph[y] = [];

    for (let x = 0; x < gridCount; x++) {
      if (obstaclesSet.has(`${x}:${y}`)) graph[y][x] = 0;
      else graph[y][x] = 1;
    }
  }

  return graph;
};

const buildRoadNodes = (obstaclesSet: Set<string>): Point[] => {
  const roadNodes: Point[] = [];
  for (let x = 0; x < gridCount; x++) {
    for (let y = 0; y < gridCount; y++) {
      if (!obstaclesSet.has(`${x}:${y}`)) {
        roadNodes.push([x, y]);
      }
    }
  }

  return roadNodes;
};

const obstaclesSet = buildObstaclesSet(obstacles);
export const roadNodes = buildRoadNodes(obstaclesSet);
export const graph = buildGraph(obstaclesSet);

export const getRandomRoadNode = () =>
  roadNodes[getRandomInt(0, roadNodes.length - 1)];

type GoalFunction = (p: Point) => boolean;
type SearchResultFunction<T> = (goal: Point, parents: Map<string, Point>) => T;
type NeighborFunction = (p: Point) => Point[];

// see https://en.wikipedia.org/wiki/Breadth-first_search
function BFS<T>(
  point: Point,
  isGoal: GoalFunction,
  getNeighbors: NeighborFunction,
  searchResult: SearchResultFunction<T>
): T | null {
  let queue = [point];
  const explored = new Set(`${point[0]}:${point[1]}`);
  const parents = new Map<string, Point>();

  while (queue.length) {
    const v = queue.pop()!;

    if (isGoal(v)) {
      return searchResult(v, parents);
    } else {
      getNeighbors(v).forEach((w) => {
        const key = `${w[0]}:${w[1]}`;
        if (!explored.has(key)) {
          explored.add(key);
          parents.set(key, v);
          queue.unshift(w);
        }
      });
    }
  }

  return null;
}

const getClosestRoadNode = (point: Point): Point | null => {
  const isRoadNode = ([x, y]: Point) => graph[y][x] === 1;

  // takes map limits into account
  const getNeighborNodes = ([x, y]: Point) => {
    const neighbors: Point[] = [];
    if (x > 0) neighbors.push([x - 1, y]);
    if (x < gridCount - 1) neighbors.push([x + 1, y]);
    if (y > 0) neighbors.push([x, y - 1]);
    if (y < gridCount - 1) neighbors.push([x, y + 1]);
    return neighbors;
  };

  const searchResult = (p: Point) => p;
  return BFS<Point>(point, isRoadNode, getNeighborNodes, searchResult);
};

export const getShortestPath = (
  startPoint: Point,
  endPoint: Point
): Path | null => {
  const equalPoints = (a: Point, b: Point): boolean => {
    return a[0] === b[0] && a[1] === b[1];
  };

  const isDestination = ([x, y]: Point) =>
    x === endPoint[0] && y === endPoint[1];

  // takes map limits into account
  const getNeighborRoadNodes = ([x, y]: Point) => {
    const neighbors: Point[] = [];
    if (x > 0 && graph[y][x - 1] === 1) neighbors.push([x - 1, y]);
    if (x < gridCount - 1 && graph[y][x + 1] === 1) neighbors.push([x + 1, y]);
    if (y > 0 && graph[y - 1][x] === 1) neighbors.push([x, y - 1]);
    if (y < gridCount - 1 && graph[y + 1][x] === 1) neighbors.push([x, y + 1]);
    return neighbors;
  };

  const searchResult = (v: Point, parents: Map<string, Point>): Path => {
    const path: Path = [];
    let i: Point | undefined = v;
    while (!equalPoints(startPoint, i)) {
      path.unshift(i!);
      i = parents.get(`${i![0]}:${i![1]}`)!;
    }

    path.unshift(startPoint);

    return path;
  };
  return BFS<Path>(
    startPoint,
    isDestination,
    getNeighborRoadNodes,
    searchResult
  );
};

export const generateDestination = (startPoint: Point): Point => {
  const getDestinationRange = (coord: number): [number, number] =>
    coord < gridCount / 2
      ? [gridCount / 2 + Math.floor(coord / 2), gridCount]
      : [0, gridCount / 2 - Math.floor((gridCount - coord) / 2)];

  const [endPointMinX, endPointMaxX] = getDestinationRange(startPoint[0]);
  const [endPointMinY, endPointMaxY] = getDestinationRange(startPoint[1]);

  const endPointX = getRandomInt(endPointMinX, endPointMaxX);
  const endPointY = getRandomInt(endPointMinY, endPointMaxY);

  return getClosestRoadNode([endPointX, endPointY])!;
};

export const getStraightLineDistance = (a: Point, b: Point) =>
  ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5;

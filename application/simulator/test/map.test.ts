import { getShortestPath } from "../src/map.js";

describe("#getShortestPath", () => {
  it("returns the shortest path between two points", () => {
    expect(getShortestPath([35, 11], [37, 11])).toEqual([
      [35, 11],
      [36, 11],
      [37, 11],
    ]);
  });

  it("returns a path with one point when start and end point are equal", () => {
    expect(getShortestPath([35, 11], [35, 11])).toEqual([[35, 11]]);
  });
});

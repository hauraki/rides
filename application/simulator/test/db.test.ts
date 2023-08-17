import { convertToPoint } from "../src/db.js";

describe("converters", () => {
  describe("#convertToPoint", () => {
    it("converts a point string to a Point", () => {
      expect(convertToPoint("(1,2)")).toEqual([1, 2]);
    });
    it("returns a Point unchanged", () => {
      expect(convertToPoint([3, 4])).toEqual([3, 4]);
    });
    it("converts a PointObject hash to a Point", () => {
      expect(convertToPoint({ x: 5, y: 6 })).toEqual([5, 6]);
    });
    it("returns null in other cases", () => {
      expect(convertToPoint(null)).toBeNull();
    });
  });
});

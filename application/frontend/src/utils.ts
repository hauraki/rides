import { Path, Point } from "./types";

// will only exist locally, not in the Docker image
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export const apiGet = async (path: string) => {
  const endpoint = apiBaseUrl ? `${apiBaseUrl}${path}` : `/api${path}`;

  const res = await fetch(endpoint);
  if (res.json) {
    return await res.json();
  }
  return res;
};

// "(13,37)"" --> [13,37]
export function convertToPoint(value: string | null): Point | null {
  const m = (value || "").match(/\((\d+),(\d+)\)/);
  return m ? [+m[1], +m[2]] : null;
}

// "[(0,0),(1,1),(2,0)]" --> [[0,0], [1,1], [2,0]]
export function convertToPath(value: string | null): Path | null {
  if (typeof value === "string") {
    return value
      .match(/\(\d+,\d+\)/g)!
      .map((pointString) => convertToPoint(pointString)!);
  }

  return null;
}

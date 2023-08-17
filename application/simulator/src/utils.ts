import { fileURLToPath } from "url";
import path from "path";

import { Hash, Point } from "./types.js";

export const gridCount = 100;

export const dirname = (moduleUrl: string) =>
  path.dirname(fileURLToPath(moduleUrl));

export const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min) + min);

export const decide = (probability: number) =>
  getRandomInt(1, 100) < probability;

export const wait = (ms: number) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });

/**
 * A pure function to pick specific keys from object, similar to https://lodash.com/docs/4.17.4#pick
 */
export const pick = (obj: Hash, keys: string[]) =>
  keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {} as Hash);

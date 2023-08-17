import React, { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import config from "./config";
import { Path, Point } from "./types.js";

const { squareSize } = config;

const carOffset = [-squareSize * 2, -squareSize * 2];

gsap.registerPlugin(MotionPathPlugin);

type Props = {
  location: Point;
  name: string;
  path: Path | null;
  pathIndex: number | null;
  pathDigest: string | null;
  pathLength: number | null;
};

type Tween = gsap.core.Tween;

export default function Car({
  location,
  name,
  path,
  pathIndex,
  pathDigest,
  pathLength,
}: Props) {
  const ref = useRef(null);
  const tween = useRef<Tween | null>(null);

  useEffect(() => {
    if (location && !pathDigest) {
      gsap.set(ref.current, {
        x: location[0] + carOffset[0],
        y: location[1] + carOffset[1],
      });
    }
  }, [location, pathDigest]);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      if (path) {
        gsap.set(ref.current, { x: path[0][0], y: path[0][1] });
        const motionPath = {
          path: path.map((p) => ({ x: p[0], y: p[1] })),
          autoRotate: 90,
          curviness: 0,
          offsetX: carOffset[0],
          offsetY: carOffset[1],
        };

        tween.current = gsap.to(ref.current, {
          motionPath,
          duration: path.length / 4,
          transformOrigin: "50% 50%",
          ease: "none",
        });
      }
    });

    return () => {
      ctx.revert();
      tween.current = null;
    };
    // using pathDigest as dep ensures that path does not go stale
    // eslint-disable-next-line
  }, [name, pathDigest]);

  useEffect(() => {
    if (tween.current && pathIndex !== null && pathLength !== null) {
      const oldProgress = tween.current.progress();
      const newProgress = (pathIndex + 1) / pathLength;
      if (Math.abs(oldProgress - newProgress) > 0.1) {
        tween.current.progress(newProgress);
        console.log(
          `[${name}]`,
          "sync progress",
          oldProgress.toFixed(2),
          "->",
          newProgress.toFixed(2)
        );
      }
    }
  }, [name, pathIndex, pathLength]);

  return (
    <div
      style={{
        display: "block",
        width: squareSize * 5,
        height: squareSize * 5,
        position: "absolute",
      }}
      ref={ref}
    >
      <img src="car.svg" alt="car" />
    </div>
  );
}

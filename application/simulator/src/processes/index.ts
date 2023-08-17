import { fork } from "child_process";
import { dirname } from "../utils.js";

const cwd = dirname(import.meta.url);

export const destinationGenerator = fork("./destinationGenerator", { cwd });
export const dispatcher = fork("./dispatcher", { cwd });

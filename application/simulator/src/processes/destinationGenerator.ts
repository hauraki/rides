import { wait } from "../utils.js";
import { generateDestination } from "../map.js";
import { Point } from "../types.js";

interface Message {
  id: string;
  location: Point;
}

const queue: Message[] = [];

process.on("message", (msg: Message) => {
  queue.push(msg);
});

const main = async () => {
  while (true) {
    if (queue.length) {
      const { id, location } = queue.shift()!;
      //await wait(800);
      const destination = generateDestination(location);
      process.send!({ id, destination });
    }

    if (queue.length) continue;
    else await wait(200);
  }
};

main();

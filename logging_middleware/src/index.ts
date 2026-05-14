import { Log } from "./logger";

const test = async () => {
  const response = await Log(
    "backend",
    "info",
    "middleware",
    "Middleware working successfully"
  );

  console.log(response);
};

test();
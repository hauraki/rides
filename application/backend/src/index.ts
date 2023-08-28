import express from "express";
import cors from "cors";

import { getCustomers, getDrivers } from "./database/index.js";

const PORT = 8080;
const app = express();

app.use(cors());

app.get("/customers", async (_, res) => {
  const customers = await getCustomers();
  res.json(customers);
});

app.get("/drivers", async (_, res) => {
  const drivers = await getDrivers();
  res.json(drivers);
});

app.listen(PORT, async () => {
  console.log(`Backend server is running on port ${PORT}`);
});

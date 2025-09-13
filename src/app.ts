import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import urlRoutes from "./routes/urlRoutes.js";
import keepAlive from "./routes/keepAliveRoutes.js";
import directUrlRoutes from "./routes/directUrlRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/v1/url", urlRoutes);
app.use("/api/v1/keep-alive", keepAlive);
app.use("/", directUrlRoutes);

export default app;

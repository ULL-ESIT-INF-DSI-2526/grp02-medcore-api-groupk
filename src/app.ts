import express from "express";
import "./db/mongoose.js";
import { defaultRouter } from "./routers/default.js";

export const app = express();
app.use(express.json());
app.use(defaultRouter);
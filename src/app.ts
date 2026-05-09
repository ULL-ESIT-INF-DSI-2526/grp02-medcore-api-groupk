import express from "express";
import "./db/mongoose.js";
import { defaultRouter } from "./routers/default.js";
import { patientRouter } from "./routers/patient.js";
import { staffRouter } from "./routers/staff.js";
import { medicationRouter } from "./routers/medications.js";
import { recordsRouter } from "./routers/records.js";

export const app = express();
app.use(express.json());
app.use(patientRouter);
app.use(staffRouter);
app.use(medicationRouter);
app.use(recordsRouter);
app.use(defaultRouter);
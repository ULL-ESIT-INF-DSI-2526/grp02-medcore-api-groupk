import express from "express";
import "./db/mongoose.js";
import { defaultRouter } from "./routers/default.js";
import { patientRouter } from "./routers/patient.js";
import { staffRouter } from "./routers/staff.js";
import { medicationRouter } from "./routers/medications.js";
import { recordsRouter } from "./routers/records.js";

/**
 * Configuración principal de la aplicación Express.
 * Registra la conexión a la base de datos y todos los routers de la API.
 */
export const app = express();
app.use(express.json());
app.use(patientRouter);
app.use(staffRouter);
app.use(medicationRouter);
app.use(recordsRouter);
app.use(defaultRouter);
import express from 'express';
import './db/mongoose.js';
import { defaultRouter } from './routers/default.js';
import { patientRouter } from './routers/patient.js';
import { staffRouter } from './routers/staff.js';
import { medicationRouter } from './routers/medications.js';
import { recordsRouter } from "./routers/records.js";

const app = express();
app.use(express.json());
app.use(patientRouter);
app.use(staffRouter);
app.use(medicationRouter);
app.use(recordsRouter);
app.use(defaultRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
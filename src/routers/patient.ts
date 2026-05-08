import express from 'express';
import { Patient } from '../models/patient.js';


export const patientRouter = express.Router();

patientRouter.post("/patients", async (req, res) => {

    try {
        // Buscar paciente existente por DNI
        const existingPatient = await Patient.findOne({
            idNumber: req.body.idNumber
        });

        // Si existe y está inactivo → reactivar
        if (existingPatient && existingPatient.status === "inactivo") {

            existingPatient.status = "activo";

            await existingPatient.save();

            return res.status(200).send(existingPatient);
        }

        // Si existe y NO está inactivo → error
        if (existingPatient) {
            return res.status(409).send({
                error: "El paciente ya existe"
            });
        }

        // Crea nuevo paciente
        const patient = new Patient(req.body);

        await patient.save();
        res.status(201).send(patient);
        
    } catch (error) {
        res.status(400).send(error);
    }
});

patientRouter.get("/patients", async (req, res) => {
    if (!req.query.fullName && !req.query.idNumber) {
        res.status(400).send({
            error: "Se tiene que dar el nombre del paciente o su número de identificación"
        });
    }
    
    const filter: any = {};

    if (req.query.fullName) filter.fullName = req.query.fullName.toString();
    if (req.query.idNumber) filter.idNumber = req.query.idNumber.toString();

    try {
        const patient = await Patient.find(filter);

        if (patient.length !== 0) {
            res.status(200).send(patient);
        } else {
            res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});

patientRouter.get("/patients/:id", async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
        res.status(200).send(patient);
    } catch (error) {
        res.status(500).send(error);
    }
});

patientRouter.patch("/patients", async (req, res) => {
    if (!req.query.fullName && !req.query.idNumber) {
        res.status(400).send({
            error: "Se tiene que dar el nombre del paciente o su número de identificación"
        });
    }

    const allowedUpdates = [
        "fullName",
        "birthDate",
        "gender",
        "contactData.address",
        "contactData.phoneNumber",
        "contactData.email",
        "allergies",
        "bloodType",
        "status"
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));

    if (!isValidUpdate) {
        res.status(400).send({
            error: "Actualización no permitida"
        });
    }

    const filter: any = {};

    if (req.query.fullName) filter.fullName = req.query.fullName.toString();
    if (req.query.idNumber) filter.idNumber = req.query.idNumber.toString();

    try {
        const patient = await Patient.findOneAndUpdate(
            filter,
            req.body,
            {
                returnDocument: "after",
                runValidators: true,
            },
        );

        if (patient) {
            res.status(200).send(patient);
        } else {
            res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }

});

patientRouter.patch("/patients/:id", async (req, res) => {
    
    const allowedUpdates = [
        "fullName",
        "birthDate",
        "gender",
        "contactData.address",
        "contactData.phoneNumber",
        "contactData.email",
        "allergies",
        "bloodType",
        "status"
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));

    if (!isValidUpdate) {
        res.status(400).send({
            error: "Actualización no permitida"
        });
    }

    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                returnDocument: "after",
                runValidators: true,
            },
        );

        if (patient) {
            res.status(200).send(patient);
        } else {
            res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * A la hora de borrar pacientes, no se va a borrar del sistema porque los registros se quedarían con _id que no existirían. 
 * De esta menera se preserva la integridad de los registros.
 */
patientRouter.delete("/patients", async (req, res) => {
    if (!req.query.fullName && !req.query.idNumber) {
        res.status(400).send({
            error: "Se tiene que dar el nombre del paciente o su número de identificación"
        });
    }
    
    const filter: any = {};

    if (req.query.fullName) filter.fullName = req.query.fullName.toString();
    if (req.query.idNumber) filter.idNumber = req.query.idNumber.toString();

    try {
        const patient = await Patient.findOneAndUpdate(
        filter,
        {
            status: "inactivo"
        },
        {
            returnDocument: "after",
            runValidators: true
        }
        );
        
        if (patient) {
            res.status(200).send(patient);
        } else {
            res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
        
    } catch (error) {
        res.status(500).send(error);
    } 
});

patientRouter.delete("/patients/:id", async (req, res) => {
    
    try{
        const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        {
            status: "inactivo"
        },
        {
            returnDocument: "after",
            runValidators: true
        }
        );

        if (patient) {
            res.status(200).send(patient);
        } else {
            res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});
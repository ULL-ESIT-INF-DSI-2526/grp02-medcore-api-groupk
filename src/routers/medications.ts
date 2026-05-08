/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { Medication } from '../models/medications.js';
import { Record } from '../models/records.js';


export const medicationRouter = express.Router();

medicationRouter.post("/medications", async (req, res) => {
    const medication = new Medication(req.body);

    try {
        await medication.save();
        res.status(201).send(medication);
    }catch (error) {
        return res.status(400).send(error);
    }
});

medicationRouter.get("/medications", async (req, res) => {
    if (!req.query.comercialName && !req.query.activePrinciple && !req.query.nationalCode) {
         return res.status(400).send({
            error: "Se tiene que dar el nombre comercial, principio activo o código nacional"
        });
    }
    
    const filter: any = {};

    if (req.query.comercialName) filter.comercialName = req.query.comercialName.toString();
    if (req.query.activePrinciple) filter.activePrinciple = req.query.activePrinciple.toString();
    if (req.query.nationalCode) filter.nationalCode = req.query.nationalCode.toString();

    try {
        const medication = await Medication.find(filter);

        if (medication.length !== 0) {
            res.status(200).send(medication);
        } else {
            return res.status(404).send({
                error: "No se encuentra el medicamento"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});

medicationRouter.get("/medications/:id", async (req, res) => {
    try {
        const medication = await Medication.findById(req.params.id);
        if (!medication) {
            return res.status(404).send({
                error: "No se encuentra el medicamento"
            });
        }
        res.status(200).send(medication);
    } catch (error) {
        res.status(500).send(error);
    }
});

medicationRouter.patch("/medications", async (req, res) => {
    if (!req.query.comercialName && !req.query.activePrinciple && !req.query.nationalCode) {
        return res.status(400).send({
            error: "Se tiene que dar el nombre comercial, principio activo o código nacional"
        });
    }

    const allowedUpdates = [
        "comercialName",
        "activePrinciple",
        "nationalCode",
        "pharmaceuticalForm",
        "dosage",
        "administrationRoute",
        "stock",
        "price",
        "medicalPrescription",
        "caducityDate",
        "negativeIndications" 
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));

    if (!isValidUpdate) {
        return res.status(400).send({
            error: "Actualización no permitida"
        });
    }

    const filter: any = {};

    if (req.query.comercialName) filter.comercialName = req.query.comercialName.toString();
    if (req.query.activePrinciple) filter.activePrinciple = req.query.activePrinciple.toString();
    if (req.query.nationalCode) filter.nationalCode = req.query.nationalCode.toString();

    try {
        const medication = await Medication.findOneAndUpdate(
            filter,
            req.body,
            {
                returnDocument: "after",
                runValidators: true,
            },
        );

        if (medication) {
            res.status(200).send(medication);
        } else {
            return res.status(404).send({
                error: "No se encuentra el medicamento"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }

});

medicationRouter.patch("/medications/:id", async (req, res) => {
    
    const allowedUpdates = [
        "comercialName",
        "activePrinciple",
        "nationalCode",
        "pharmaceuticalForm",
        "dosage",
        "administrationRoute",
        "stock",
        "price",
        "medicalPrescription",
        "caducityDate",
        "negativeIndications" 
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));

    if (!isValidUpdate) {
        return res.status(400).send({
            error: "Actualización no permitida"
        });
    }

    try {
        const medication = await Medication.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                returnDocument: "after",
                runValidators: true,
            },
        );

        if (medication) {
            res.status(200).send(medication);
        } else {
            return res.status(404).send({
                error: "No se encuentra el medicamento"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * Para controlar el borrado con los registros en este caso lo que se hace es comprobar que el medicamento a aborrar no esté en ningún registro.
 * Si pertenece a alguno se bloquea el borrado.
 */
medicationRouter.delete("/medications", async (req, res) => {
    if (!req.query.comercialName && !req.query.activePrinciple && !req.query.nationalCode) {
        return res.status(400).send({
            error: "Se tiene que dar el nombre comercial, principio activo o código nacional"
        });
    }
    
    const filter: any = {};

    if (req.query.comercialName) filter.comercialName = req.query.comercialName.toString();
    if (req.query.activePrinciple) filter.activePrinciple = req.query.activePrinciple.toString();
    if (req.query.nationalCode) filter.nationalCode = req.query.nationalCode.toString();

    try {
        const medication = await Medication.findOne(filter);
        
        if (!medication) {
            return res.status(404).send({
                error: "No se encuentra el medicamento"
            });
        } else {
        
            const recordExists = await Record.exists({
                "prescriptions.medication": medication._id
            } as any);

            if (recordExists) {
                return res.status(409).send({
                    error: "No se puede borrar el medicamento porque está asociado a registros médicos"
                });
            }

            await Medication.findByIdAndDelete(medication._id);
            res.status(200).send(medication);
        }
        
    } catch (error) {
        res.status(500).send(error);
    } 
});

medicationRouter.delete("/medications/:id", async (req, res) => {
    
    try{
        const recordExists = await Record.exists({
            "prescriptions.medication": req.params.id
        } as any);

        if (recordExists) {
            return res.status(409).send({
            error: "No se puede borrar el medicamento porque está asociado a registros médicos"
        });
        }

        const medication = await Medication.findByIdAndDelete(req.params.id);

        if (medication) {
            res.status(200).send(medication);
        } else {
            return res.status(404).send({
                error: "No se encuentra el medicamento"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});
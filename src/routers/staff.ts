/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { Staff } from '../models/staff.js';

export const staffRouter = express.Router();

staffRouter.post("/staff", async (req, res) => {

    try {
            // Buscar staff existente por DNI
            const existingStaff = await Staff.findOne({
                licenseNumber: req.body.licenseNumber
            });
    
            // Si existe y está inactivo → reactivar
            if (existingStaff && existingStaff.status === "inactivo") {
    
                existingStaff.status = "activo";
    
                await existingStaff.save();
    
                return res.status(200).send(existingStaff);
            }
    
            // Si existe y NO está inactivo → error
            if (existingStaff) {
                return res.status(409).send({
                    error: "El personal médico ya existe"
                });
            }

        const staff = new Staff(req.body);

        await staff.save();
        res.status(201).send(staff);
    }catch (error) {
        return res.status(400).send(error);
    }
});

staffRouter.get("/staff", async (req, res) => {
    if (!req.query.fullName && !req.query.specialty) {
        return res.status(400).send({
            error: "Se tiene que dar el nombre del personal médico o su especialidad"
        });
    }
    
    const filter: any = {};

    if (req.query.fullName) filter.fullName = req.query.fullName.toString();
    if (req.query.specialty) filter.specialty = req.query.specialty.toString();

    try {
        const staff = await Staff.find(filter);

        if (staff.length !== 0) {
            res.status(200).send(staff);
        } else {
            return res.status(404).send({
                error: "No se encuentra el personal médico"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});

staffRouter.get("/staff/:id", async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).send({
                error: "No se encuentra el personal médico"
            });
        }
        res.status(200).send(staff);
    } catch (error) {
        res.status(500).send(error);
    }
});

staffRouter.patch("/staff", async (req, res) => {
    if (!req.query.fullName && !req.query.specialty) {
        return res.status(400).send({
            error: "Se tiene que dar el nombre del personal médico o su especialidad"
        });
    }

    const allowedUpdates = [
        "fullName",
        "licenseNumber",
        "specialty",
        "role",
        "shift",
        "assignedArea",
        "yearsOfExperience",
        "contactData.address",
        "contactData.phoneNumber",
        "contactData.email",
        "status"
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));

    if (!isValidUpdate) {
        return res.status(400).send({
            error: "Actualización no permitida"
        });
    }

    const filter: any = {};

    if (req.query.fullName) filter.fullName = req.query.fullName.toString();
    if (req.query.licenseNumber) filter.licenseNumber = req.query.licenseNumber.toString();

    try {
        const staff = await Staff.findOneAndUpdate(
            filter,
            req.body,
            {
                returnDocument: "after",
                runValidators: true,
            },
        );

        if (staff) {
            res.status(200).send(staff);
        } else {
            return res.status(404).send({
                error: "No se encuentra el personal médico"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }

});

staffRouter.patch("/staff/:id", async (req, res) => {
    
    const allowedUpdates = [
        "fullName",
        "licenseNumber",
        "specialty",
        "role",
        "shift",
        "assignedArea",
        "yearsOfExperience",
        "contactData.address",
        "contactData.phoneNumber",
        "contactData.email",
        "status"
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) => allowedUpdates.includes(update));

    if (!isValidUpdate) {
        return res.status(400).send({
            error: "Actualización no permitida"
        });
    }

    try {
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                returnDocument: "after",
                runValidators: true,
            },
        );

        if (staff) {
            res.status(200).send(staff);
        } else {
            return res.status(404).send({
                error: "No se encuentra el personal médico"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * A la hora de borrar personal médico, no se va a borrar del sistema porque los registros se quedarían con _id que no existirían. 
 * De esta menera se preserva la integridad de los registros.
 */
staffRouter.delete("/staff", async (req, res) => {
    if (!req.query.fullName && !req.query.specialty) {
        return res.status(400).send({
            error: "Se tiene que dar el nombre del personal médico o su especialidad"
        });
    }
    
    const filter: any = {};

    if (req.query.fullName) filter.fullName = req.query.fullName.toString();
    if (req.query.licenseNumber) filter.licenseNumber = req.query.licenseNumber.toString();

    try {
        const staff = await Staff.findOneAndUpdate(
        filter,
        {
            status: "inactivo"
        },
        {
            returnDocument: "after",
            runValidators: true
        }
        );
        
        if (staff) {
            res.status(200).send(staff);
        } else {
            return res.status(404).send({
                error: "No se encuentra el personal médico"
            });
        }
        
    } catch (error) {
        res.status(500).send(error);
    } 
});

staffRouter.delete("/staff/:id", async (req, res) => {
    
    try{
        const staff = await Staff.findByIdAndUpdate(
        req.params.id,
        {
            status: "inactivo"
        },
        {
            returnDocument: "after",
            runValidators: true
        }
        );

        if (staff) {
            res.status(200).send(staff);
        } else {
            return res.status(404).send({
                error: "No se encuentra el personal médico"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { Staff } from '../models/staff.js';

export const staffRouter = express.Router();

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Crear o reactivar personal médico
 *     tags:
 *       - Staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffCreate'
 *     responses:
 *       201:
 *         description: Personal médico creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       200:
 *         description: Personal médico reactivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Faltan parámetros de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       409:
 *         description: Ya existe el personal médico
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

        // Crea nuevo staff
        const staff = new Staff(req.body);
        await staff.save();
        res.status(201).send(staff);
    }catch (error) {
        return res.status(400).send({ error: "Petición mal formada" });
    }
});

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Buscar personal médico por nombre o especialidad
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de personal médico
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Faltan parámetros de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       404:
 *         description: No se encuentra el medicamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
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

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Obtener personal médico por ID
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personal médico encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       404:
 *         description: No se encuentra el medicamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
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

/**
 * @swagger
 * /staff:
 *   patch:
 *     summary: Actualizar personal médico por filtros
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffUpdate'
 *     responses:
 *       200:
 *         description: Personal médico actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Faltan parámetros de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       404:
 *         description: No se encuentra el medicamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
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
    if (req.query.specialty) filter.specialty = req.query.specialty.toString();

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

/**
 * @swagger
 * /staff/{id}:
 *   patch:
 *     summary: Actualizar personal médico por ID
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffUpdate'
 *     responses:
 *       200:
 *         description: Personal médico actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Faltan parámetros de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       404:
 *         description: No se encuentra el medicamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
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

/**
 * @swagger
 * /staff:
 *   delete:
 *     summary: Desactivar personal médico
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personal médico actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Faltan parámetros de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400'
 *       404:
 *         description: No se encuentra el medicamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
staffRouter.delete("/staff", async (req, res) => {
    if (!req.query.fullName && !req.query.specialty) {
        return res.status(400).send({
            error: "Se tiene que dar el nombre del personal médico o su especialidad"
        });
    }
    
    const filter: any = {};

    if (req.query.fullName) filter.fullName = req.query.fullName.toString();
    if (req.query.specialty) filter.specialty = req.query.specialty.toString();

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

/**
 * A la hora de borrar personal médico, no se va a borrar del sistema porque los registros se quedarían con _id que no existirían. 
 * De esta menera se preserva la integridad de los registros.
 */

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Desactivar personal médico por ID
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personal médico actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       404:
 *         description: No se encuentra el medicamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500'
 */
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
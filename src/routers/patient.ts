/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { Patient } from '../models/patient.js';


export const patientRouter = express.Router();

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Crear o reactivar paciente
 *     tags:
 *       - Patients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientCreate'
 *     responses:
 *       201:
 *         description: Paciente creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       200:
 *         description: Paciente reactivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       409:
 *         description: Paciente ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error409'
 */
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
    }catch (error) {
        return res.status(400).send({ error: "Petición mal formada" });
    } 
});

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Buscar pacientes por nombre o DNI
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *       - in: query
 *         name: idNumber
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
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
patientRouter.get("/patients", async (req, res) => {
    if (!req.query.fullName && !req.query.idNumber) {
        return res.status(400).send({
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
            return res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Obtener paciente por ID
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paciente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
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
patientRouter.get("/patients/:id", async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
        res.status(200).send(patient);
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * @swagger
 * /patients:
 *   patch:
 *     summary: Actualizar paciente por filtros
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *       - in: query
 *         name: idNumber
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientUpdate'
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
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
patientRouter.patch("/patients", async (req, res) => {
    if (!req.query.fullName && !req.query.idNumber) {
        return res.status(400).send({
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
        return res.status(400).send({
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
            return res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }

});

/**
 * @swagger
 * /patients/{id}:
 *   patch:
 *     summary: Actualizar paciente por ID
 *     tags:
 *       - Patients
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
 *             $ref: '#/components/schemas/PatientUpdate'
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
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
        return res.status(400).send({
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
            return res.status(404).send({
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

/**
 * @swagger
 * /patients:
 *   delete:
 *     summary: Desactivar paciente (soft delete)
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: query
 *         name: fullName
 *         schema:
 *           type: string
 *       - in: query
 *         name: idNumber
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paciente desactivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
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
patientRouter.delete("/patients", async (req, res) => {
    if (!req.query.fullName && !req.query.idNumber) {
        return res.status(400).send({
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
            return res.status(404).send({
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

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Desactivar paciente por ID
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paciente desactivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
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
            return res.status(404).send({
                error: "No se encuentra el paciente"
            });
        }
    } catch (error) {
        res.status(500).send(error);
    } 
});
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { Record } from '../models/records.js';
import { Patient } from '../models/patient.js';
import { Staff } from '../models/staff.js';
import { Medication } from '../models/medications.js';
import { processPrescriptionsAndCalculateCost } from '../aux/processPrescriptionsAndCalculateCost.js';
import { restoreStock } from '../aux/restoreStock.js';
import { Types } from 'mongoose';

export const recordsRouter = express.Router();

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Crear registro médico
 *     tags:
 *       - Records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordCreate'
 *     responses:
 *       201:
 *         description: Registro creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       404:
 *         description: Paciente o staff no encontrado
 *       409:
 *         description: Error de validación (stock, staff inactivo, etc.)
 */
recordsRouter.post("/records", async (req, res) => {
    try {
        const {
            patientIdNumber,       // DNI del paciente (NO el _id)
            staffLicenseNumber,    // Número de colegiado (NO el _id)
            recordType,
            reason,
            diagnosis,
            prescriptionsInput     // Array: [{ nationalCode, quantity, instructions }]
        } = req.body;

        // Verificar Paciente
        const patient = await Patient.findOne({ idNumber: patientIdNumber });
        if (!patient) {
            return res.status(404).send({ error: "No se encuentra el paciente con ese número de identificación." });
        }

        // Verificar Médico
        const staff = await Staff.findOne({ licenseNumber: staffLicenseNumber });
        if (!staff) {
            return res.status(404).send({ error: "No se encuentra el personal médico con ese número de colegiado." });
        }
        if (staff.status === "inactivo") {
            return res.status(409).send({ error: "No se puede asignar un registro a un médico en estado inactivo." });
        }

        // Procesar Medicamentos (usando nuestra función auxiliar)
        let totalMedicationCost = 0;
        let finalPrescriptions: any[] = [];
        
        if (prescriptionsInput && prescriptionsInput.length > 0) {
            try {
                const result = await processPrescriptionsAndCalculateCost(prescriptionsInput);
                totalMedicationCost = result.totalCost;
                finalPrescriptions = result.processedPrescriptions;
            } catch (validationError: any) {
                // Capturamos los errores de stock, caducidad o no encontrado
                return res.status(409).send({ error: validationError.message });
            }
        }

        // Crear y guardar el registro final
        const record = new Record({
            patient: patient._id,
            staff: staff._id,
            recordType,
            reason,
            diagnosis,
            prescriptions: finalPrescriptions,
            totalMedicationCost,
            status: "abierto"
        });

        await record.save();
        return res.status(201).send(record);

    } catch (error) {
        return res.status(500).send({ error: "Error interno del servidor", details: error });
    }
});

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Obtener registros por DNI del paciente
 *     tags:
 *       - Records
 *     parameters:
 *       - in: query
 *         name: patientIdNumber
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de registros del paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Record'
 *       404:
 *         description: Paciente no encontrado
 */
recordsRouter.get("/records", async (req, res, next) => {
    
    // Si no viene patientIdNumber, pasar al siguiente GET
    if (!req.query.patientIdNumber) {
        return next();
    }

    try {

        const patient = await Patient.findOne({
            idNumber: req.query.patientIdNumber.toString()
        });

        if (!patient) {
            return res.status(404).send({
                error: "Paciente no encontrado."
            });
        }

        const records = await Record.find({
            patient: patient._id
        } as any).sort({ startDate: -1 });

        return res.status(200).send(records);

    } catch (error) {
        return res.status(500).send({ error: "Error interno del servidor", details: error });
    }
});

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Obtener registros por rango de fechas
 *     tags:
 *       - Records
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: recordType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registros filtrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Record'
 *       400:
 *         description: Faltan parámetros
 */
recordsRouter.get("/records", async (req, res) => {
    try {
        // Opción B: Búsqueda por rango de fechas
        if (req.query.startDate && req.query.endDate) {
            const filter: any = {
                startDate: {
                    $gte: new Date(req.query.startDate as string),
                    $lte: new Date(req.query.endDate as string)
                }
            };
            
            // Opcionalmente filtramos por tipo de registro si se incluye en la query
            if (req.query.recordType) {
                filter.recordType = req.query.recordType;
            }

            const records = await Record.find(filter).sort({ startDate: -1 });
            return res.status(200).send(records);
        }

        return res.status(400).json({
            error: "Debe proporcionar un rango de fechas (startDate y endDate)."
        });

    } catch (error) {
        return res.status(500).send({ error: "Error interno del servidor", details: error });
    }
});

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Obtener registro por ID
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       404:
 *         description: No encontrado
 */
recordsRouter.get("/records/:id", async (req, res) => {
    try {
        const record = await Record.findById(req.params.id)
            // populate() trae los datos reales del paciente y médico en vez de solo su ID
            .populate('patient', 'fullName idNumber') 
            .populate('staff', 'fullName licenseNumber')
            .populate('prescriptions.medication', 'comercialName nationalCode');

        if (!record) {
            return res.status(404).send({ error: "Registro no encontrado." });
        }
        return res.status(200).send(record);
    } catch (error) {
        return res.status(500).send({ error: "Error interno", details: error });
    }
});

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Actualizar registro médico
 *     tags:
 *       - Records
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
 *             $ref: '#/components/schemas/RecordUpdate'
 *     responses:
 *       200:
 *         description: Registro actualizado
 *       404:
 *         description: No encontrado
 *       409:
 *         description: Error de validación de medicamentos
 */
recordsRouter.patch("/records/:id", async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);
        if (!record) {
            return res.status(404).send({ error: "Registro no encontrado." });
        }

        // Extraemos los campos que se quieren actualizar
        const { prescriptionsInput, status, endDate, diagnosis, reason } = req.body;

        // Si se está modificando la receta médica, aplicamos la lógica compleja
        if (prescriptionsInput) {
            try {
                // Restaurar el stock de los medicamentos anteriores
                await restoreStock(record.prescriptions);

                // Procesar los nuevos medicamentos (reutilizando nuestra función del POST)
                const result = await processPrescriptionsAndCalculateCost(prescriptionsInput);
                
                // Actualizar el documento con la nueva receta y el nuevo coste
                record.prescriptions = result.processedPrescriptions;
                record.totalMedicationCost = result.totalCost;
            } catch (validationError: any) {
                // Si la nueva receta falla (falta de stock, etc.), hay que volver a descontar 
                // el stock de la receta antigua para dejar la base de datos como estaba.
                for (const item of record.prescriptions) {
                    await Medication.findByIdAndUpdate(item.medication, { $inc: { stock: -item.quantity } });
                }
                return res.status(409).send({ error: validationError.message });
            }
        }

        // Actualizar otros campos si han sido enviados
        if (status) record.status = status;
        if (endDate) record.endDate = endDate;
        if (diagnosis) record.diagnosis = diagnosis;
        if (reason) record.reason = reason;

        await record.save();
        return res.status(200).send(record);

    } catch (error) {
        return res.status(500).send({ error: "Error interno del servidor", details: error });
    }
});

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Eliminar registro médico y restaurar stock
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro eliminado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error interno
 */
recordsRouter.delete("/records/:id", async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);
        
        if (!record) {
            return res.status(404).send({ error: "Registro no encontrado." });
        }

        // Antes de borrar, restauramos el stock de todos los medicamentos que se habían prescrito
        if (record.prescriptions && record.prescriptions.length > 0) {
            await restoreStock(record.prescriptions);
        }

        // Borramos físicamente el registro (el guion dice "interpretado como una cancelación o corrección")
        await Record.findByIdAndDelete(req.params.id);

        return res.status(200).send({ message: "Registro eliminado correctamente y stock restaurado.", record });

    } catch (error) {
        return res.status(500).send({ error: "Error interno del servidor", details: error });
    }
});
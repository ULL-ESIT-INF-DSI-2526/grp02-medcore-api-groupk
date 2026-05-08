/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { Record } from '../models/records.js';
import { Patient } from '../models/patient.js';
import { Staff } from '../models/staff.js';
import { Medication } from '../models/medications.js';

export const recordsRouter = express.Router();

/**
 * Función auxiliar: Procesa la lista de recetas, verifica stocks y caducidades,
 * calcula el coste total y descuenta el stock de la base de datos.
 */
async function processPrescriptionsAndCalculateCost(prescriptionsInput: any[]): Promise<{ totalCost: number; processedPrescriptions: any[] }> {
    let totalCost = 0;
    const processedPrescriptions: any[] = [];

    // Verificar que todos los medicamentos existen, tienen stock y no están caducados
    for (const item of prescriptionsInput) {
        const medication = await Medication.findOne({ nationalCode: item.nationalCode });
        
        if (!medication) {
            throw new Error(`Medicamento con código nacional ${item.nationalCode} no encontrado.`);
        }

        if (medication.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${medication.comercialName}. Quedan ${medication.stock} unidades.`);
        }

        if (new Date(medication.caducityDate) < new Date()) {
            throw new Error(`El medicamento ${medication.comercialName} está caducado y no puede ser prescrito.`);
        }

        totalCost += medication.price * item.quantity;
        processedPrescriptions.push({
            medication: medication._id, // Transformamos el código nacional en el ObjectId real
            quantity: item.quantity,
            instructions: item.instructions
        });
    }

    // Solo si TODOS son válidos, descontamos el stock
    for (const item of prescriptionsInput) {
        await Medication.findOneAndUpdate(
            { nationalCode: item.nationalCode },
            { $inc: { stock: -item.quantity } } // Resta la cantidad al stock actual
        );
    }

    return { totalCost, processedPrescriptions };
}


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
 * Función auxiliar: Restaura el stock de los medicamentos de un registro.
 * Útil cuando se modifica la receta o se borra/cancela un registro.
 */
async function restoreStock(prescriptions: any[]) {
    for (const item of prescriptions) {
        await Medication.findByIdAndUpdate(
            item.medication, // Aquí es el ObjectId, no el código nacional
            { $inc: { stock: item.quantity } } // Sumamos la cantidad de vuelta
        );
    }
}


// Leer por Query String (DNI del paciente o Rango de Fechas)
recordsRouter.get("/records", async (req, res) => {
    try {
        // Opción A: Búsqueda por número de identificación del paciente
        if (req.query.patientIdNumber) {
            const patientIdNumber = String(req.query.patientIdNumber);
            const patient = await Patient.findOne({ idNumber: patientIdNumber });
            if (!patient) {
                return res.status(404).send({ error: "Paciente no encontrado." });
            }
            // Devolver ordenados cronológicamente (1 = más antiguo primero, -1 = más reciente primero)
            const records = await Record.find({ patient: patient._id }).sort({ startDate: -1 });
            return res.status(200).send(records);
        }

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
            error: "Debe proporcionar patientIdNumber o un rango de fechas (startDate y endDate)."
        });

    } catch (error) {
        return res.status(500).send({ error: "Error interno del servidor", details: error });
    }
});

// Leer por ID dinámico
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
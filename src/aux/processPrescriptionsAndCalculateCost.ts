import { Medication } from '../models/medications.js';

/**
 * Función auxiliar: Procesa la lista de recetas, verifica stocks y caducidades,
 * calcula el coste total y descuenta el stock de la base de datos.
 * @param prescriptionsInput - Array de prescripciones
 * @returns - Promesa con coste total y prescripciones procesadas
 */
export async function processPrescriptionsAndCalculateCost(prescriptionsInput: any[]): Promise<{ totalCost: number; processedPrescriptions: any[] }> {
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

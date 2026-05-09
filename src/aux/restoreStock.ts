import { Medication } from '../models/medications.js';

/**
 * Función auxiliar: Restaura el stock de los medicamentos de un registro.
 * Útil cuando se modifica la receta o se borra/cancela un registro.
 * @param prescriptions - Array de prescripciones
 */
export async function restoreStock(prescriptions: any[]) {
    for (const item of prescriptions) {
        await Medication.findByIdAndUpdate(
            item.medication, // Aquí es el ObjectId, no el código nacional
            { $inc: { stock: item.quantity } } // Sumamos la cantidad de vuelta
        );
    }
}
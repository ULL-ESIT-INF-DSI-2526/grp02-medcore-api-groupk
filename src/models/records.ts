import { Document, model, Schema } from "mongoose";
import validator from "validator";

/**
 * Interfaz auxiliar para los medicamentos prescritos dentro de un registro
 */
export interface PrescriptionInterface {
    medication: Schema.Types.ObjectId;
    quantity: number;
    instructions: string;
}

/**
 * Interfaz que define la forma del documento del registro médico (Consulta o Ingreso)
 */
export interface RecordDocumentInterface extends Document {
    patient: Schema.Types.ObjectId;
    staff: Schema.Types.ObjectId;
    recordType: "consulta ambulatoria" | "ingreso hospitalario";
    startDate: Date;
    endDate?: Date;
    reason: string;
    diagnosis: string;
    prescriptions: PrescriptionInterface[];
    totalMedicationCost: number;
    status: "abierto" | "cerrado";
}

/**
 * Esquema para los registros
 */
const RecordSchema = new Schema<RecordDocumentInterface>({
    // Referencia al modelo Patient
    patient: {
        type: Schema.Types.ObjectId,
        ref: "Patient",
        required: [true, "La referencia al paciente es obligatoria"]
    },
    // Referencia al modelo Staff
    staff: {
        type: Schema.Types.ObjectId,
        ref: "Staff",
        required: [true, "La referencia al médico responsable es obligatoria"]
    },
    recordType: {
        type: String,
        required: [true, "El tipo de registro es obligatorio"],
        enum: ["consulta ambulatoria", "ingreso hospitalario"]
    },
    startDate: {
        type: Date,
        default: Date.now 
    },
    endDate: {
        type: Date // Opcional, puede estar vacío si sigue activo
    },
    reason: {
        type: String,
        required: [true, "El motivo de la consulta o ingreso es obligatorio"],
        trim: true
    },
    diagnosis: {
        type: String,
        required: [true, "El diagnóstico es obligatorio"],
        trim: true
    },
    prescriptions: [
        {
            medication: {
                type: Schema.Types.ObjectId,
                ref: "Medication",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: [1, "La cantidad prescrita debe ser al menos 1"]
            },
            instructions: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],
    totalMedicationCost: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        required: [true, "El estado del registro es obligatorio"],
        enum: ["abierto", "cerrado"],
        default: "abierto"
    }
});

/**
 * Se invoca a model que tiene como argumentos el nombre del modelo y el esquema de los registros.
 */
export const Record = model<RecordDocumentInterface>("Record", RecordSchema);
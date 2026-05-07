import { Document, model, Schema } from "mongoose";
import validator from "validator";

/**
 * Interfaz que define la forma del documento del personal médico
 */
interface StaffDocumentationInterface extends Document {
    fullName: string;
    licenseNumber: string;
    specialty: "medicina general" | "cardiología" | "traumatología" | "pediatría" | "oncología" | "urgencias";
    role: "médico/a adjunto/a" | "médico/a residente" | "enfermero/a" | "auxiliar de enfermería" | "jefe/a de servicio";
    shift: "mañana" | "tarde" | "noche" | "rotatorio";
    assignedArea: string;
    yearsOfExperience: number;
    contactData: {
        address: string;
        phoneNumber: string;
        email: string;
    }
    status: "activo" | "inactivo";
}

/**
 * Esquema para el personal médico
 */
const StaffSchema = new Schema<StaffDocumentationInterface>({
    fullName: {
        type: String,
        required: [true, "El nombre completo es obligatorio"],
        trim: true
    },
    licenseNumber: {
        type: String,
        required: [true, "El número de colegiado es obligatorio"],
        unique: true,
        trim: true
    },
    specialty: {
        type: String,
        required: [true, "La especielidad médica es obligatoria"],
        enum: ["medicina general", "cardiología", "traumatología", "pediatría", "oncología", "urgencias"]
    },
    role: {
        type: String,
        required: [true, "La categoría profecional es obligatoria"],
        enum: ["médico/a adjunto/a", "médico/a residente", "enfermero/a", "auxiliar de enfermería", "jefe/a de servicio"]
    },
    shift: {
        type: String,
        required: [true, "El turno de trabajo es obligatorio"],
        enum: ["mañana", "tarde", "noche", "rotatorio"]
    },
    assignedArea: {
        type: String,
        required: [true, "El área asignada es obligatoria"],
        trim: true
    },
    yearsOfExperience: {
        type: Number,
        required: [true, "Los años de experiencia son obligatorios"],
        min: [0, "Los años de experiencia no pueden ser negativos"]
    },
    contactData: {
        address: { type: String, required: [true, "La dirección es obligatoria"], trim: true },
        phoneNumber: { type: String, required: [true, "El número de teléfono es obligatorio"], trim: true },
        email: {
            type: String,
            required: [true, "El email es obligatorio"],
            unique: true,
            trim: true, 
            lowercase: true,
            validate(value: string) {
                if (!validator.default.isEmail(value)) {
                    throw new Error("El email del personal médico no es válido");
                }
            }
        }
    },  
    status: {
        type: String,
        required: [true, "El estado del personal médico es obligatorio"],
        default: "activo",  
        enum: ["activo", "inactivo"]
    }
});

/**
 * Se invoca a model que tiene como argumentos el nombre del modelo y el esquema del personal médico.
 */
export const Staff = model<StaffDocumentationInterface>("Staff", StaffSchema);
import { Document, model, Schema } from "mongoose";
import validator from "validator";

/**
 * Interfaz que define la forma del documento del paciente
 */
interface PatientDocumentationInterface extends Document {
    fullName: string;
    birthDate: Date;
    idNumber: string;
    socialSecurityNumber: string;
    gender: string;
    contactData: {
        address: string;
        phoneNumber: string;
        email: string;
    };
    allergies: string[];
    bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "0+" | "0-";
    status: "activo" | "baja temporal" | "fallecido";
}

const PatientSchema = new Schema<PatientDocumentationInterface>({
    fullName: {
        type: String,
        required: [true, "El nombre completo es obligatorio"],
        trim: true
    },
    birthDate: {
        type: Date,
        required: [true, "La fecha de nacimiento es obligatoria"],
    },
    idNumber: {
        type: String,
        required: [true, "El número de identificación es obligatorio"],
        unique: true,
        trim: true
    },
    socialSecurityNumber: {
        type: String,
        required: [true, "El número de la seguridad social es obligatorio"],
        unique: true,
        trim: true
    },
    gender: {
        type: String,
        required: [true, "El género del paciente es obligatorio"],
        trim: true
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
                    throw new Error("El email del paciente no es válido");
                }
            }
        }
    },
    allergies: {
        type: [String],
        default: []
    },
    bloodType: {
        type: String,
        required: [true, "El tipo de sangre es obligatorio"],
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"]
    },
    status: {
        type: String,
        required: [true, "El estado del paciente es obligatorio"],
        default: "activo",
        enum: ["activo", "baja temporal", "fallecido"]
    },
});

/**
 * Se invoca a model que tiene como argumentos el nombre del modelo y el esquema del paciente.
 */
export const Patient = model<PatientDocumentationInterface>("Patient", PatientSchema);
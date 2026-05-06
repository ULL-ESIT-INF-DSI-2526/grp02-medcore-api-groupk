import { Document, model, Schema } from "mongoose";
import validator from "validator";

/**
 * Interfaz que define la forma del documento de los medicamentos
 */
interface MedicationDocumentationInterface extends Document {
  comercialName: string;
  activePrinciple: string;
  nationalCode: string;
  pharmaceuticalForm: "comprimido" | "cápsula" | "solución oral" | "inyección" | "pomada" | "parche" | "inhalador";
  dosage: string;
  administrationRoute: "oral" | "intravenosa" | "intramuscular" | "tópica" | "subctánea" | "inhalatoria";
  stock: number;
  price: number;
  medicalPrescription: boolean;
  caducityDate: Date;
  negativeIndications: string[]; 
}

const MedicationSchema = new Schema<MedicationDocumentationInterface>({ 
  comercialName: {
    type: String,
    required: [true, "El nombre comercial es obligatorio"],
    trim: true,
    min : [2, "El nombre comercial debe tener al menos 2 caracteres"],
  },
  activePrinciple: {
    type: String,
    required: [true, "El principio activo es obligatorio"],
    trim: true,
    min : [2, "El principio activo debe tener al menos 2 caracteres"],
  },
  nationalCode: {
    type: String,
    required: [true, "El código nacional es obligatorio"],
    unique: true,
    trim: true
  },
  pharmaceuticalForm: {
    type: String,
    required: [true, "La forma farmacéutica es obligatoria"],
    enum: ["comprimido", "cápsula", "solución oral", "inyección", "pomada", "parche", "inhalador"]
  },
  dosage: {
    type: String,
    required: [true, "La dosis es obligatoria"],
    trim: true
  },
  administrationRoute: {
    type: String,
    required: [true, "La vía de administración es obligatoria"],
    enum: ["oral", "intravenosa", "intramuscular", "tópica", "subctánea", "inhalatoria"]
  },
  stock: {
    type: Number,
    required: [true, "El stock es obligatorio"],
    min: [0, "El stock no puede ser negativo"]
  },
  price: {
    type: Number,
    required: [true, "El precio es obligatorio"],
    trim: true,
    min: [1, "El precio debe ser mayor a 0"]
  },
  medicalPrescription: {
    type: Boolean,
    required: [true, "La prescripción médica es obligatoria"],
    default: true
  },
  caducityDate: {
    type: Date,
    required: [true, "La fecha de caducidad es obligatoria"],
  },
  negativeIndications: {
    type: [String],
    trim: true,
    default: []
  }
});

export const MedicationModel = model<MedicationDocumentationInterface>("Medication", MedicationSchema);
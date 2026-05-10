import { describe, test, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { Record } from "../../src/models/records.js";
import { Patient } from "../../src/models/patient.js";
import { Staff } from "../../src/models/staff.js";
import { Medication } from "../../src/models/medications.js";

/**
 * Datos base para poblar la base de datos antes de cada prueba
 */
const patientExample = {
    fullName: "Juan Pérez",
    birthDate: "1990-01-01",
    idNumber: "12345678A",
    socialSecurityNumber: "SS123456",
    gender: "Masculino",
    contactData: {
        address: "Calle Falsa 123",
        phoneNumber: "600100200",
        email: "juan@example.com"
    },
    allergies: ["Polen"],
    bloodType: "A+",
    status: "activo"
};

const staffExample = {
    fullName: "Dra. Ana López",
    licenseNumber: "MED999",
    specialty: "medicina general",
    role: "médico/a adjunto/a",
    shift: "mañana",
    assignedArea: "Consulta 1",
    yearsOfExperience: 10,
    contactData: {
        address: "Avenida Central 45",
        phoneNumber: "600300400",
        email: "ana@hospital.com"
    },
    status: "activo"
};

const medicationExample = {
    comercialName: "Ibuprofeno",
    activePrinciple: "Ibuprofeno",
    nationalCode: "NC555",
    pharmaceuticalForm: "comprimido",
    dosage: "600mg",
    administrationRoute: "oral",
    stock: 50,
    price: 3,
    medicalPrescription: true,
    caducityDate: "2030-01-01", // Fecha futura válida
    negativeIndications: ["Úlcera gástrica"]
};

let defaultPatient: any;
let defaultStaff: any;
let defaultMedication: any;
let defaultRecord: any;

beforeEach(async () => {
    // Limpiar base de datos
    await Record.deleteMany();
    await Patient.deleteMany();
    await Staff.deleteMany();
    await Medication.deleteMany();

    // Crear documentos base
    defaultPatient = await new Patient(patientExample).save();
    defaultStaff = await new Staff(staffExample).save();
    defaultMedication = await new Medication(medicationExample).save();

    // Crear un registro médico por defecto para pruebas de GET, PATCH y DELETE
    defaultRecord = await new Record({
        patient: defaultPatient._id,
        staff: defaultStaff._id,
        recordType: "consulta ambulatoria",
        startDate: new Date("2024-05-01"),
        reason: "Dolor de cabeza",
        diagnosis: "Migraña",
        prescriptions: [{
            medication: defaultMedication._id,
            quantity: 2,
            instructions: "1 cada 8 horas"
        }],
        totalMedicationCost: 6,
        status: "abierto"
    }).save();

    // Simular descuento de stock que haría POST /records
    defaultMedication.stock -= 2;
    await defaultMedication.save();

    vi.restoreAllMocks();
});

describe("POST /records", () => {
    const validRecordPayload = {
        patientIdNumber: "12345678A",
        staffLicenseNumber: "MED999",
        recordType: "ingreso hospitalario",
        reason: "Fiebre alta",
        diagnosis: "Gripe",
        prescriptionsInput: [
            { nationalCode: "NC555", quantity: 5, instructions: "1 cada 8 horas" }
        ]
    };

    test("Crea correctamente un registro médico y descuenta el stock", async () => {
        const response = await request(app)
            .post("/records")
            .send(validRecordPayload)
            .expect(201);

        expect(response.body.diagnosis).toBe("Gripe");
        expect(response.body.totalMedicationCost).toBe(15); // 5 cantidad * 3 de precio

        // Verificamos que el stock del medicamento bajó (50 inicial - 5 recetados = 45)
        const medUpdated = await Medication.findOne({ nationalCode: "NC555" });
        expect(medUpdated?.stock).toBe(43);
    });

    test("Crea registro sin prescripciones (no entra en el if)", async () => {
        const response = await request(app)
            .post("/records")
            .send({
                patientIdNumber: "12345678A",
                staffLicenseNumber: "MED999",
                recordType: "consulta ambulatoria",
                reason: "Control",
                diagnosis: "OK",
                prescriptionsInput: []
            })
            .expect(201);

        expect(response.body.totalMedicationCost).toBe(0);
        expect(response.body.prescriptions.length).toBe(0);
    });

    test("Devuelve 404 si el paciente no existe", async () => {
        await request(app)
            .post("/records")
            .send({ ...validRecordPayload, patientIdNumber: "INVENTADO" })
            .expect(404);
    });

    test("Devuelve 404 si el paciente no existe", async () => {
        vi.spyOn(Patient, "findOne").mockResolvedValueOnce(null as any);

        await request(app)
            .post("/records")
            .send({
                patientIdNumber: "INVENTADO",
                staffLicenseNumber: "MED999",
                recordType: "consulta ambulatoria",
                reason: "Fiebre",
                diagnosis: "Gripe",
                prescriptionsInput: []
            })
            .expect(404);
    });

    test("Devuelve 404 si el personal médico no existe", async () => {
        vi.spyOn(Patient, "findOne").mockResolvedValueOnce(defaultPatient);
        vi.spyOn(Staff, "findOne").mockResolvedValueOnce(null as any);

        await request(app)
            .post("/records")
            .send({
                patientIdNumber: "12345678A",
                staffLicenseNumber: "INEXISTENTE",
                recordType: "consulta ambulatoria",
                reason: "Fiebre",
                diagnosis: "Gripe",
                prescriptionsInput: []
            })
            .expect(404);
    });

    test("Devuelve 409 si el médico está inactivo", async () => {
        // Ponemos al médico inactivo
        await Staff.findByIdAndUpdate(defaultStaff._id, { status: "inactivo" });

        await request(app)
            .post("/records")
            .send(validRecordPayload)
            .expect(409);
    });

    test("Devuelve 409 si no hay stock suficiente", async () => {
        await request(app)
            .post("/records")
            .send({
                ...validRecordPayload,
                prescriptionsInput: [{ nationalCode: "NC555", quantity: 100, instructions: "N/A" }] // Stock actual es 50
            })
            .expect(409);
    });

    test("Devuelve 409 si el medicamento está caducado", async () => {
        // Caducamos el medicamento
        await Medication.findByIdAndUpdate(defaultMedication._id, { caducityDate: "2020-01-01" });

        await request(app)
            .post("/records")
            .send(validRecordPayload)
            .expect(409);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {
        vi.spyOn(Patient, "findOne").mockImplementationOnce(() => {
            throw new Error("Error interno");
        });

        await request(app)
            .post("/records")
            .send({
                patientIdNumber: "12345678A",
                staffLicenseNumber: "MED999",
                recordType: "consulta ambulatoria",
                reason: "Fiebre",
                diagnosis: "Gripe",
                prescriptionsInput: []
            })
            .expect(500);
    });
});

describe("GET /records por IdNumber y rango de fechas", () => {
    test("Busca registros por patientIdNumber", async () => {
        const response = await request(app)
            .get("/records/patient/12345678A")
            .expect(200);

        expect(response.body.length).toBe(1);
        expect(response.body[0].reason).toBe("Dolor de cabeza");
    });

    test("Busca registros por rango de fechas", async () => {
        const response = await request(app)
            .get("/records?startDate=2024-04-01&endDate=2024-06-01")
            .expect(200);

        expect(response.body.length).toBe(1);
    });

    test("Devuelve 400 si faltan parámetros de búsqueda", async () => {
        await request(app)
            .get("/records")
            .expect(400);
    });

    test("Devuelve 404 si el paciente no existe en búsqueda por DNI", async () => {
        await request(app)
            .get("/records/patient/NO_EXISTE")
            .expect(404);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {
        vi.spyOn(Record, "find").mockImplementationOnce(() => {
            throw new Error("Error interno");
        });

        await request(app)
            .get("/records?startDate=2024-01-01&endDate=2024-12-31")
            .expect(500);
    });

    test("Devuelve 500 si ocurre un error interno (con recordType opcional)", async () => {
        vi.spyOn(Record, "find").mockImplementationOnce(() => {
            throw new Error("Error interno");
        });

        await request(app)
            .get("/records?startDate=2024-01-01&endDate=2024-12-31&recordType=consulta%20ambulatoria")
            .expect(500);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {
        vi.spyOn(Patient, "findOne").mockImplementationOnce(() => {
            throw new Error("Error interno");
        });

        await request(app)
            .get("/records/patient/12345678A")
            .expect(500);
    });
});

describe("GET /records/:id", () => {
    test("Obtiene registro por ID y lo devuelve con populate", async () => {
        const response = await request(app)
            .get(`/records/${defaultRecord._id}`)
            .expect(200);

        // Al usar populate, patient debe ser un objeto con el fullName
        expect(response.body.patient.fullName).toBe("Juan Pérez");
        expect(response.body.staff.licenseNumber).toBe("MED999");
    });

    test("Devuelve 404 si no existe el registro", async () => {
        await request(app)
            .get("/records/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {
        vi.spyOn(Record, "findById").mockImplementationOnce(() => {
            throw new Error("Error interno");
        });

        await request(app)
            .get(`/records/${defaultRecord._id}`)
            .expect(500);
    });
});

describe("PATCH /records/:id", () => {
    test("Actualiza campos simples (estado y motivo)", async () => {
        const response = await request(app)
            .patch(`/records/${defaultRecord._id}`)
            .send({ status: "cerrado", reason: "Revisión" })
            .expect(200);

        expect(response.body.status).toBe("cerrado");
        expect(response.body.reason).toBe("Revisión");
    });

    test("Actualiza receta, restaura stock antiguo y deduce el nuevo", async () => {
        // Modificamos la receta pidiendo 10 unidades del medicamento (antes eran 2)
        const response = await request(app)
            .patch(`/records/${defaultRecord._id}`)
            .send({
                prescriptionsInput: [
                    { nationalCode: "NC555", quantity: 10, instructions: "Nueva dosis" }
                ]
            })
            .expect(200);

        expect(response.body.totalMedicationCost).toBe(30); // 10 * 3€

        // Verificamos stock: Empezamos en 50. El registro por defecto usó 2 (quedan 48).
        // Al hacer PATCH, debería restaurar los 2 (vuelve a 50) y descontar 10 (queda en 40).
        const medUpdated = await Medication.findById(defaultMedication._id);
        expect(medUpdated?.stock).toBe(40);
    });

    test("Devuelve 404 si el registro no existe", async () => {
        await request(app)
            .patch("/records/000000000000000000000000")
            .send({
                status: "cerrado"
            })
            .expect(404);
    });

    test("Devuelve 409 si la nueva receta excede el stock", async () => {
        await request(app)
            .patch(`/records/${defaultRecord._id}`)
            .send({
                prescriptionsInput: [
                    { nationalCode: "NC555", quantity: 999, instructions: "Dosis excesiva" }
                ]
            })
            .expect(409);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {
        vi.spyOn(Record, "findById").mockImplementationOnce(() => {
            throw new Error("Error interno");
        });

        await request(app)
            .patch(`/records/${defaultRecord._id}`)
            .send({
                status: "cerrado"
            })
            .expect(500);
    });
});

describe("DELETE /records/:id", () => {
    test("Elimina el registro correctamente y restaura el stock", async () => {
        const response = await request(app)
            .delete(`/records/${defaultRecord._id}`)
            .expect(200);

        expect(response.body.message).toMatch(/Registro eliminado/);

        // Verificamos que el registro ya no existe
        const deletedRecord = await Record.findById(defaultRecord._id);
        expect(deletedRecord).toBeNull();

        // Verificamos que se restauraron los 2 elementos al stock (de 48 debería volver a 50)
        const medUpdated = await Medication.findById(defaultMedication._id);
        expect(medUpdated?.stock).toBe(50);
    });

    test("Devuelve 404 al intentar borrar algo que no existe", async () => {
        await request(app)
            .delete("/records/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 500 si hay error interno", async () => {
        vi.spyOn(Record, "findById").mockImplementationOnce(() => {
            throw new Error("Error interno");
        });

        await request(app)
            .delete(`/records/${defaultRecord._id}`)
            .expect(500);
    });
});
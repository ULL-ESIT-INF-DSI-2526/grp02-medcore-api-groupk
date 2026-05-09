import { describe, test, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { Patient } from "../../src/models/patient.js";

/**
 * Paciente base para pruebas
 */
const patientExample = {
    fullName: "María González Pérez",
    birthDate: "1995-04-12",
    idNumber: "12345678B",
    socialSecurityNumber: "SS987654321",
    gender: "femenino",
    contactData: {
        address: "Calle Mayor 15",
        phoneNumber: "612345678",
        email: "maria@test.com"
    },
    allergies: ["Penicilina"],
    bloodType: "A+",
    status: "activo"
};

beforeEach(async () => {
    await Patient.deleteMany();
    await new Patient(patientExample).save();
});

describe("POST /patients", () => {

    test("Crea correctamente un paciente nuevo", async () => {
        const response = await request(app)
            .post("/patients")
            .send({
                fullName: "Ana López",
                birthDate: "2000-01-01",
                idNumber: "87654321C",
                socialSecurityNumber: "SS111222333",
                gender: "femenino",
                contactData: {
                    address: "Calle Real 5",
                    phoneNumber: "600111222",
                    email: "ana@test.com"
                },
                allergies: [],
                bloodType: "0+"
            })
            .expect(201);

        expect(response.body.fullName).toBe("Ana López");
    });

    test("Devuelve 409 si el paciente ya existe", async () => {
        await request(app)
            .post("/patients")
            .send(patientExample)
            .expect(409);
    });

    test("Reactiva un paciente inactivo", async () => {
        await Patient.findOneAndUpdate(
            { idNumber: patientExample.idNumber },
            { status: "inactivo" }
        );

        const response = await request(app)
            .post("/patients")
            .send(patientExample)
            .expect(200);

        expect(response.body.status).toBe("activo");
    });

    test("Devuelve 400 con petición mal formada", async () => {
        await request(app)
            .post("/patients")
            .send({})
            .expect(400);
    });
});

describe("GET /patients", () => {

    test("Busca paciente por DNI", async () => {
        await request(app)
            .get("/patients?idNumber=12345678B")
            .expect(200);
    });

    test("Busca paciente por nombre", async () => {
        await request(app)
            .get("/patients?fullName=María González Pérez")
            .expect(200);
    });

    test("Devuelve 400 si no hay parámetros", async () => {
        await request(app)
            .get("/patients")
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .get("/patients?idNumber=NO_EXISTE")
            .expect(404);
    });

    test("Devuelve 500 si falla la base de datos", async () => {

        vi.spyOn(Patient, "find").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .get("/patients?idNumber=12345678B")
            .expect(500);
    });
});

describe("GET /patients/:id", () => {

    test("Obtiene paciente por ID", async () => {
        const patient = await Patient.findOne({ idNumber: "12345678B" });

        await request(app)
            .get(`/patients/${patient!._id}`)
            .expect(200);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .get("/patients/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 500 con ID inválido", async () => {
        await request(app)
            .get("/patients/ERROR_ID")
            .expect(500);
    });
});

describe("PATCH /patients", () => {

    test("Actualiza paciente correctamente por DNI", async () => {
        const response = await request(app)
            .patch("/patients?idNumber=12345678B")
            .send({ fullName: "María Actualizada" })
            .expect(200);

        expect(response.body.fullName).toBe("María Actualizada");
    });

    test("Actualiza paciente correctamente por nombre", async () => {
        const response = await request(app)
            .patch("/patients?fullName=María González Pérez")
            .send({ fullName: "Nombre cambiado" })
            .expect(200);

        expect(response.body.fullName).toBe("Nombre cambiado");
    });

    test("Devuelve 400 si no se envían filtros", async () => {
        await request(app)
            .patch("/patients")
            .send({ fullName: "X" })
            .expect(400);
    });

    test("Devuelve 400 si hay campos no permitidos", async () => {
        await request(app)
            .patch("/patients?idNumber=12345678B")
            .send({ campoInventado: "error" })
            .expect(400);
    });

    test("Devuelve 404 si no existe el paciente", async () => {
        await request(app)
            .patch("/patients?idNumber=NO_EXISTE")
            .send({ fullName: "No existe" })
            .expect(404);
    });

    test("Devuelve 500 si falla la base de datos", async () => {

        vi.spyOn(Patient, "findOneAndUpdate").mockImplementationOnce(() => {
            throw new Error("Fallo simulado en BD");
        });

        await request(app)
            .patch("/patients?idNumber=12345678B")
            .send({ fullName: "Crash" })
            .expect(500);
    });

});

describe("PATCH /patients/:id", () => {

    test("Actualiza paciente correctamente", async () => {
        const patient = await Patient.findOne({ idNumber: "12345678B" });

        const response = await request(app)
            .patch(`/patients/${patient!._id}`)
            .send({ fullName: "María Actualizada" })
            .expect(200);

        expect(response.body.fullName).toBe("María Actualizada");
    });

    test("Rechaza actualización no permitida", async () => {
        const patient = await Patient.findOne({ idNumber: "12345678B" });

        await request(app)
            .patch(`/patients/${patient!._id}`)
            .send({ invalidField: "xxx" })
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .patch("/patients/000000000000000000000000")
            .send({ fullName: "X" })
            .expect(404);
    });

    test("Devuelve 500 si da error del servidor", async () => {
        vi.spyOn(Patient, "findByIdAndUpdate").mockImplementationOnce(() => {
            throw new Error("Error simulado de base de datos");
        });

        await request(app)
            .patch("/patients/123456789012345678901234")
            .send({ fullName: "Error Test" })
            .expect(500);
    });
});

describe("DELETE /patients", () => {

    test("Desactiva paciente correctamente por su DNI(soft delete)", async () => {
        const response = await request(app)
            .delete("/patients?idNumber=12345678B")
            .expect(200);

        expect(response.body.status).toBe("inactivo");
    });

    test("Desactiva paciente correctamente por nombre(soft delete)", async () => {
        const response = await request(app)
            .delete("/patients?fullName=María González Pérez")
            .expect(200);

        expect(response.body.status).toBe("inactivo");
    });

    test("Devuelve 400 si faltan parámetros", async () => {
        await request(app)
            .delete("/patients")
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .delete("/patients?idNumber=NO_EXISTE")
            .expect(404);
    });

    test("Devuelve 500 si da error del servidor", async () => {
        vi.spyOn(Patient, "findOneAndUpdate").mockImplementationOnce(() => {
            throw new Error("Fallo simulado");
        });

        await request(app)
            .delete("/patients?idNumber=12345678B")
            .expect(500);
    });
});

describe("DELETE /patients/:id", () => {

    test("Desactiva correctamente un paciente por ID", async () => {
        const patient = await Patient.findOne({ idNumber: "12345678B" });

        const response = await request(app)
            .delete(`/patients/${patient!._id}`)
            .expect(200);

        expect(response.body.status).toBe("inactivo");
    });

    test("Devuelve 404 si el paciente no existe", async () => {
        await request(app)
            .delete("/patients/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 500 si falla la base de datos al eliminar", async () => {

        vi.spyOn(Patient, "findByIdAndUpdate").mockImplementationOnce(() => {
            throw new Error("Fallo simulado en BD");
        });

        const patient = await Patient.findOne({ idNumber: "12345678B" });

        await request(app)
            .delete(`/patients/${patient!._id}`)
            .expect(500);
    });

});
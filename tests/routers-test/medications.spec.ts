import { describe, test, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { Medication } from "../../src/models/medications.js";
import { Record } from "../../src/models/records.js";

/**
 * Medicamento base para pruebas
 */
const medicationExample = {
    comercialName: "Paracetamol",
    activePrinciple: "Paracetamol",
    nationalCode: "NC123",
    pharmaceuticalForm: "comprimido",
    dosage: "500mg",
    administrationRoute: "oral",
    stock: 100,
    price: 2.5,
    medicalPrescription: false,
    caducityDate: "2027-01-01",
    negativeIndications: []
};

beforeEach(async () => {
    await Medication.deleteMany();
    await Record.deleteMany();
    await new Medication(medicationExample).save();
});

describe("POST /medications", () => {

    test("Crea correctamente un medicamento", async () => {
        const response = await request(app)
            .post("/medications")
            .send({
                ...medicationExample,
                nationalCode: "NC999"
            })
            .expect(201);

        expect(response.body.comercialName).toBe("Paracetamol");
    });

    test("Devuelve 400 con datos inválidos", async () => {
        await request(app)
            .post("/medications")
            .send({})
            .expect(400);
    });
});

describe("GET /medications", () => {

    test("Busca medicamento por nombre comercial", async () => {
        await request(app)
            .get("/medications?comercialName=Paracetamol")
            .expect(200);
    });

    test("Devuelve 400 si no hay filtros", async () => {
        await request(app)
            .get("/medications")
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .get("/medications?comercialName=NO_EXISTE")
            .expect(404);
    });
});

describe("GET /medications/:id", () => {

    test("Obtiene medicamento por ID", async () => {
        const med = await Medication.findOne({ nationalCode: "NC123" });

        await request(app)
            .get(`/medications/${med!._id}`)
            .expect(200);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .get("/medications/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 500 con ID inválido", async () => {
        await request(app)
            .get("/medications/ERROR_ID")
            .expect(500);
    });
});

describe("PATCH /medications/:id", () => {

    test("Actualiza medicamento correctamente", async () => {
        const med = await Medication.findOne({ nationalCode: "NC123" });

        const response = await request(app)
            .patch(`/medications/${med!._id}`)
            .send({ stock: 200 })
            .expect(200);

        expect(response.body.stock).toBe(200);
    });

    test("Rechaza actualización no permitida", async () => {
        const med = await Medication.findOne({ nationalCode: "NC123" });

        await request(app)
            .patch(`/medications/${med!._id}`)
            .send({ invalidField: "xxx" })
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .patch("/medications/000000000000000000000000")
            .send({ stock: 10 })
            .expect(404);
    });
});

describe("DELETE /medications", () => {

    test("Elimina medicamento correctamente", async () => {
        const response = await request(app)
            .delete("/medications?nationalCode=NC123")
            .expect(200);

        expect(response.body.nationalCode).toBe("NC123");
    });

    test("Devuelve 400 si faltan filtros", async () => {
        await request(app)
            .delete("/medications")
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .delete("/medications?nationalCode=NO_EXISTE")
            .expect(404);
    });
});

describe("DELETE /medications/:id", () => {

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .delete("/medications/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 500 con ID inválido", async () => {
        await request(app)
            .delete("/medications/ERROR_ID")
            .expect(500);
    });
});
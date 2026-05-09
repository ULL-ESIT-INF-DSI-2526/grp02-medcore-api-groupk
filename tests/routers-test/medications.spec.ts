import { describe, test, expect, beforeEach, vi } from "vitest";
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

    vi.restoreAllMocks(); // importante para evitar mocks cruzados
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

    test("Busca medicamento por nombre activePrinciple", async () => {
        await request(app)
            .get("/medications?activePrinciple=Paracetamol")
            .expect(200);
    });

    test("Busca medicamento por nombre nationalCode", async () => {
        await request(app)
            .get("/medications?nationalCode=NC123")
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

    test("Devuelve 500 si falla la base de datos", async () => {

        vi.spyOn(Medication, "find").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .get("/medications?comercialName=Paracetamol")
            .expect(500);
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

describe("PATCH /medications", () => {

    test("Actualiza medicamento correctamente por nationalCode", async () => {
        const response = await request(app)
            .patch("/medications?nationalCode=NC123")
            .send({ stock: 200 })
            .expect(200);

        expect(response.body.stock).toBe(200);
    });

    test("Actualiza medicamento correctamente por comercialName", async () => {
        const response = await request(app)
            .patch("/medications?comercialName=Paracetamol")
            .send({ price: 10 })
            .expect(200);

        expect(response.body.price).toBe(10);
    });

    test("Actualiza medicamento correctamente por activePrinciple", async () => {
        const response = await request(app)
            .patch("/medications?activePrinciple=Paracetamol")
            .send({ price: 10 })
            .expect(200);

        expect(response.body.price).toBe(10);
    });

    test("Devuelve 400 si no hay filtros en query", async () => {
        await request(app)
            .patch("/medications")
            .send({ stock: 200 })
            .expect(400);
    });

    test("Devuelve 400 si la actualización no está permitida", async () => {
        await request(app)
            .patch("/medications?nationalCode=NC123")
            .send({ campoInvalido: "xxx" })
            .expect(400);
    });

    test("Devuelve 404 si no existe el medicamento", async () => {
        await request(app)
            .patch("/medications?nationalCode=NO_EXISTE")
            .send({ stock: 10 })
            .expect(404);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {

        vi.spyOn(Medication, "findOneAndUpdate").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .patch("/medications?nationalCode=NC123")
            .send({ stock: 999 })
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

    test("Devuelve 500 si falla la base de datos", async () => {

        vi.spyOn(Medication, "findByIdAndUpdate").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        const med = await Medication.findOne({ nationalCode: "NC123" });

        await request(app)
            .patch(`/medications/${med!._id}`)
            .send({ stock: 50 })
            .expect(500);
    });

});

describe("DELETE /medications", () => {

    test("Elimina medicamento correctamente por nationalCode", async () => {
        const response = await request(app)
            .delete("/medications?nationalCode=NC123")
            .expect(200);

        expect(response.body.nationalCode).toBe("NC123");
    });

    test("Elimina medicamento correctamente por comercialName", async () => {
        const response = await request(app)
            .delete("/medications?comercialName=Paracetamol")
            .expect(200);

        expect(response.body.nationalCode).toBe("NC123");
    });

    test("Elimina medicamento correctamente activePlrinciple", async () => {
        const response = await request(app)
            .delete("/medications?activePrinciple=Paracetamol")
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

    test("Devuelve 409 si el medicamento está en registros médicos", async () => {

        vi.spyOn(Record, "exists").mockResolvedValueOnce(true as any);

        await request(app)
            .delete("/medications?nationalCode=NC123")
            .expect(409);
    });

    test("Devuelve 500 si falla la base de datos", async () => {

        vi.spyOn(Medication, "findOne").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .delete("/medications?nationalCode=NC123")
            .expect(500);
    });

});

describe("DELETE /medications/:id", () => {

    test("Elimina correctamente un medicamento (200)", async () => {
        const med = await Medication.findOne({ nationalCode: "NC123" });

        const response = await request(app)
            .delete(`/medications/${med!._id}`)
            .expect(200);

        expect(response.body.nationalCode).toBe("NC123");

        const deleted = await Medication.findById(med!._id);
        expect(deleted).toBeNull();
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .delete("/medications/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 409 si el medicamento está en registros médicos", async () => {

        const med = await Medication.findOne({ nationalCode: "NC123" });

        // Simulamos que existe un record asociado
        vi.spyOn(Record, "exists").mockResolvedValueOnce(true as any);

        await request(app)
            .delete(`/medications/${med!._id}`)
            .expect(409);
    });

    test("Devuelve 500 con ID inválido", async () => {

        vi.spyOn(Medication, "findByIdAndDelete").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .delete("/medications/ERROR_ID")
            .expect(500);
    });
});
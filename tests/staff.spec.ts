import { describe, test, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Staff } from "../src/models/staff.js";

/**
 * Staff base para pruebas
 */
const staffExample = {
    fullName: "Dr. Juan Pérez",
    licenseNumber: "COL123456",
    specialty: "medicina general",
    role: "médico/a adjunto/a",
    shift: "mañana",
    assignedArea: "Urgencias",
    yearsOfExperience: 10,
    contactData: {
        address: "Calle Hospital 1",
        phoneNumber: "600123123",
        email: "juan@test.com"
    },
    status: "activo"
};

beforeEach(async () => {
    await Staff.deleteMany();
    await new Staff(staffExample).save();
});

describe("POST /staff", () => {

    test("Crea correctamente un staff nuevo", async () => {
        const response = await request(app)
            .post("/staff")
            .send({
                fullName: "Dra. Ana López",
                licenseNumber: "COL999999",
                specialty: "cardiología",
                role: "médico/a residente",
                shift: "tarde",
                assignedArea: "Cardiología",
                yearsOfExperience: 5,
                contactData: {
                    address: "Calle Doctor 2",
                    phoneNumber: "600999999",
                    email: "ana@test.com"
                }
            })
            .expect(201);

        expect(response.body.fullName).toBe("Dra. Ana López");
    });

    test("Devuelve 409 si el staff ya existe", async () => {
        await request(app)
            .post("/staff")
            .send(staffExample)
            .expect(409);
    });

    test("Devuelve 400 con petición mal formada", async () => {
        await request(app)
            .post("/staff")
            .send({})
            .expect(400);
    });
});

describe("GET /staff", () => {

    test("Busca staff por especialidad", async () => {
        await request(app)
            .get("/staff?specialty=medicina general")
            .expect(200);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .get("/staff?specialty=NO_EXISTE")
            .expect(404);
    });
});

describe("GET /staff/:id", () => {

    test("Obtiene staff por ID", async () => {
        const staff = await Staff.findOne({ licenseNumber: "COL123456" });

        await request(app)
            .get(`/staff/${staff!._id}`)
            .expect(200);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .get("/staff/000000000000000000000000")
            .expect(404);
    });

    test("Devuelve 500 con ID inválido", async () => {
        await request(app)
            .get("/staff/ERROR_ID")
            .expect(500);
    });
});

describe("PATCH /staff/:id", () => {

    test("Actualiza staff correctamente", async () => {
        const staff = await Staff.findOne({ licenseNumber: "COL123456" });

        const response = await request(app)
            .patch(`/staff/${staff!._id}`)
            .send({ fullName: "Dr. Juan Actualizado" })
            .expect(200);

        expect(response.body.fullName).toBe("Dr. Juan Actualizado");
    });

    test("Rechaza actualización no permitida", async () => {
        const staff = await Staff.findOne({ licenseNumber: "COL123456" });

        await request(app)
            .patch(`/staff/${staff!._id}`)
            .send({ invalidField: "xxx" })
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .patch("/staff/000000000000000000000000")
            .send({ fullName: "X" })
            .expect(404);
    });
});

describe("DELETE /staff/:id", () => {

    test("Desactiva staff correctamente", async () => {

        const staff = await Staff.findOne({ licenseNumber: "COL123456" });

        const response = await request(app)
            .delete(`/staff/${staff!._id}`)
            .expect(200);

        expect(response.body.status).toBe("inactivo");
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .delete("/staff/000000000000000000000000")
            .expect(404);
    });
});
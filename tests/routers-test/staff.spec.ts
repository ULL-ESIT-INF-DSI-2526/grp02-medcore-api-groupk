import { describe, test, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { Staff } from "../../src/models/staff.js";

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

    test("Reactiva un staff inactivo", async () => {
            await Staff.findOneAndUpdate(
                { licenseNumber: staffExample.licenseNumber },
                { status: "inactivo" }
            );
    
            const response = await request(app)
                .post("/staff")
                .send(staffExample)
                .expect(200);
    
            expect(response.body.status).toBe("activo");
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

    test("Busca staff por fullName", async () => {
        await request(app)
            .get("/staff?fullName=Dr. Juan Pérez")
            .expect(200);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .get("/staff?specialty=NO_EXISTE")
            .expect(404);
    });

    test("Devuelve 400 si no hay parámetros", async () => {
        await request(app)
            .get("/staff")
            .expect(400);
    });

    test("Devuelve 500 si falla la base de datos", async () => {

        vi.spyOn(Staff, "find").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .get("/staff?specialty=medicina general")
            .expect(500);
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

describe("PATCH /staff", () => {

    test("Actualiza staff correctamente por specialty", async () => {
        const response = await request(app)
            .patch("/staff?specialty=medicina general")
            .send({ assignedArea: "Planta 2" })
            .expect(200);

        expect(response.body.assignedArea).toBe("Planta 2");
    });

    test("Actualiza staff correctamente por fullName", async () => {
        const response = await request(app)
            .patch("/staff?fullName=Dr. Juan Pérez")
            .send({ shift: "noche" })
            .expect(200);

        expect(response.body.shift).toBe("noche");
    });

    test("Devuelve 400 si no hay filtros", async () => {
        await request(app)
            .patch("/staff")
            .send({ shift: "tarde" })
            .expect(400);
    });

    test("Devuelve 400 si la actualización no está permitida", async () => {
        await request(app)
            .patch("/staff?specialty=medicina general")
            .send({ invalidField: "xxx" })
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .patch("/staff?specialty=NO_EXISTE")
            .send({ shift: "tarde" })
            .expect(404);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {

        vi.spyOn(Staff, "findOneAndUpdate").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .patch("/staff?specialty=medicina general")
            .send({ shift: "tarde" })
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

    test("Devuelve 500 si ocurre un error interno", async () => {

        vi.spyOn(Staff, "findByIdAndUpdate").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .patch("/staff/ERROR_ID")
            .send({ fullName: "Error" })
            .expect(500);
    });
});

describe("DELETE /staff", () => {

    test("Desactiva staff correctamente por specialty", async () => {
        const response = await request(app)
            .delete("/staff?specialty=medicina general")
            .expect(200);

        expect(response.body.status).toBe("inactivo");
    });

    test("Desactiva staff correctamente por fullName", async () => {
        const response = await request(app)
            .delete("/staff?fullName=Dr. Juan Pérez")
            .expect(200);

        expect(response.body.status).toBe("inactivo");
    });

    test("Devuelve 400 si faltan filtros", async () => {
        await request(app)
            .delete("/staff")
            .expect(400);
    });

    test("Devuelve 404 si no existe", async () => {
        await request(app)
            .delete("/staff?specialty=NO_EXISTE")
            .expect(404);
    });

    test("Devuelve 500 si ocurre un error interno", async () => {

        vi.spyOn(Staff, "findOneAndUpdate").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .delete("/staff?specialty=medicina general")
            .expect(500);
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

    test("Devuelve 500 con ID inválido", async () => {

        vi.spyOn(Staff, "findByIdAndUpdate").mockImplementationOnce(() => {
            throw new Error("Error simulado en BD");
        });

        await request(app)
            .delete("/staff/ERROR_ID")
            .expect(500);
    });
});
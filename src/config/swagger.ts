import swaggerJSDoc, { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MedCore API",
      version: "1.0.0",
      description: "API hospitalaria con pacientes, staff, medicamentos y registros médicos",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER || "http://localhost:3000",
      },
    ],
    components: {
      schemas: {

        Patient: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69fdcf016bc58168f4ca6b25" },
            fullName: { type: "string", example: "María González Pérez" },
            birthDate: { type: "string", format: "date", example: "1999-04-06" },
            idNumber: { type: "string", example: "12345678F" },
            socialSecurityNumber: { type: "string", example: "123456789123" },
            gender: { type: "string", example: "femenino" },
            contactData: {
              type: "object",
              properties: {
                address: { type: "string", example: "Calle Prueba 1" },
                phoneNumber: { type: "string", example: "123456789" },
                email: { type: "string", example: "test@gmail.com" }
              }
            },
            allergies: {
              type: "array",
              items: { type: "string" },
              example: ["penicilina"]
            },
            bloodType: { type: "string", example: "A+" },
            status: { type: "string", example: "activo" }
          }
        },

        PatientCreate: {
          type: "object",
          required: [
            "fullName",
            "birthDate",
            "idNumber",
            "socialSecurityNumber",
            "gender",
            "contactData",
            "bloodType"
          ],
          properties: {
            fullName: { type: "string", example: "María González Pérez" },
            birthDate: { type: "string", format: "date", example: "1999-04-06" },
            idNumber: { type: "string", example: "12345678F" },
            socialSecurityNumber: { type: "string", example: "123456789123" },
            gender: { type: "string", example: "femenino" },

            contactData: {
              type: "object",
              required: ["address", "phoneNumber", "email"],
              properties: {
                address: { type: "string", example: "Calle Prueba 1" },
                phoneNumber: { type: "string", example: "123456789" },
                email: { type: "string", example: "test@gmail.com" }
              }
            },

            allergies: {
              type: "array",
              items: { type: "string" },
              example: ["penicilina"]
            },

            bloodType: {
              type: "string",
              enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"],
              example: "A+"
            }
          }
        },

        PatientUpdate: {
          type: "object",
          additionalProperties: false,
          properties: {
            fullName: { type: "string", example: "María González Pérez" },
            birthDate: { type: "string", format: "date", example: "1999-04-06" },
            gender: { type: "string", example: "femenino" },

            contactData: {
              type: "object",
              properties: {
                address: { type: "string", example: "Calle Nueva 2" },
                phoneNumber: { type: "string", example: "987654321" },
                email: { type: "string", example: "nuevo@gmail.com" }
              }
            },

            allergies: {
              type: "array",
              items: { type: "string" },
              example: ["penicilina"]
            },

            bloodType: {
              type: "string",
              enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"],
              example: "B+"
            },

            status: {
              type: "string",
              enum: ["activo", "baja temporal", "fallecido", "inactivo"],
              example: "activo"
            }
          }
        },

        Medication: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69ff1069e1ca9e7f680566f4" },

            comercialName: {
              type: "string",
              example: "Paracetamol Cinfa 500mg"
            },

            activePrinciple: {
              type: "string",
              example: "Paracetamol"
            },

            nationalCode: {
              type: "string",
              example: "PARA500"
            },

            pharmaceuticalForm: {
              type: "string",
              enum: ["comprimido", "cápsula", "solución oral", "inyección", "pomada", "parche", "inhalador"],
              example: "comprimido"
            },

            dosage: {
              type: "string",
              example: "500mg"
            },

            administrationRoute: {
              type: "string",
              enum: ["oral", "intravenosa", "intramuscular", "tópica", "subctánea", "inhalatoria"],
              example: "oral"
            },

            stock: {
              type: "number",
              example: 100
            },

            price: {
              type: "number",
              example: 4.5
            },

            medicalPrescription: {
              type: "boolean",
              example: true
            },

            caducityDate: {
              type: "string",
              format: "date",
              example: "2027-12-31"
            },

            negativeIndications: {
              type: "array",
              items: { type: "string" },
              example: ["Insuficiencia hepática", "Alergia al paracetamol"]
            }
          }
        },

        MedicationCreate: {
          type: "object",
          required: [
            "comercialName",
            "activePrinciple",
            "nationalCode",
            "pharmaceuticalForm",
            "dosage",
            "administrationRoute",
            "stock",
            "price",
            "medicalPrescription",
            "caducityDate"
          ],
          properties: {
            comercialName: { type: "string", example: "Paracetamol Cinfa 500mg" },
            activePrinciple: { type: "string", example: "Paracetamol" },
            nationalCode: { type: "string", example: "PARA500" },

            pharmaceuticalForm: {
              type: "string",
              enum: ["comprimido", "cápsula", "solución oral", "inyección", "pomada", "parche", "inhalador"],
              example: "comprimido"
            },

            dosage: { type: "string", example: "500mg" },

            administrationRoute: {
              type: "string",
              enum: ["oral", "intravenosa", "intramuscular", "tópica", "subctánea", "inhalatoria"],
              example: "oral"
            },

            stock: { type: "number", example: 100 },
            price: { type: "number", example: 4.5 },

            medicalPrescription: { type: "boolean", example: true },

            caducityDate: {
              type: "string",
              format: "date",
              example: "2027-12-31"
            },

            negativeIndications: {
              type: "array",
              items: { type: "string" },
              example: ["Alergia al principio activo"]
            }
          }
        },

        MedicationUpdate: {
          type: "object",
          additionalProperties: false,
          properties: {
            comercialName: { type: "string", example: "Paracetamol Cinfa 500mg" },
            activePrinciple: { type: "string", example: "Paracetamol" },
            pharmaceuticalForm: {
              type: "string",
              enum: ["comprimido", "cápsula", "solución oral", "inyección", "pomada", "parche", "inhalador"],
              example: "comprimido"
            },
            dosage: { type: "string", example: "500mg" },

            administrationRoute: {
              type: "string",
              enum: ["oral", "intravenosa", "intramuscular", "tópica", "subctánea", "inhalatoria"],
              example: "oral"
            },

            stock: { type: "number", example: 80 },
            price: { type: "number", example: 4.5 },

            medicalPrescription: { type: "boolean", example: true },

            caducityDate: {
              type: "string",
              format: "date",
              example: "2027-12-31"
            },

            negativeIndications: {
              type: "array",
              items: { type: "string" },
              example: ["Alergia leve"]
            }
          }
        },

        Staff: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69fdcf926bc58168f4ca6b28" },

            fullName: {
              type: "string",
              example: "Dr. Juan Pérez López"
            },

            licenseNumber: {
              type: "string",
              example: "MED12345"
            },

            specialty: {
              type: "string",
              enum: [
                "medicina general",
                "cardiología",
                "traumatología",
                "pediatría",
                "oncología",
                "urgencias"
              ],
              example: "medicina general"
            },

            role: {
              type: "string",
              enum: [
                "médico/a adjunto/a",
                "médico/a residente",
                "enfermero/a",
                "auxiliar de enfermería",
                "jefe/a de servicio"
              ],
              example: "médico/a adjunto/a"
            },

            shift: {
              type: "string",
              enum: ["mañana", "tarde", "noche", "rotatorio"],
              example: "mañana"
            },

            assignedArea: {
              type: "string",
              example: "Urgencias"
            },

            yearsOfExperience: {
              type: "number",
              example: 10
            },

            contactData: {
              type: "object",
              properties: {
                address: { type: "string", example: "Calle Hospital 1" },
                phoneNumber: { type: "string", example: "612345678" },
                email: { type: "string", example: "doctor@hospital.com" }
              }
            },

            status: {
              type: "string",
              enum: ["activo", "inactivo"],
              example: "activo"
            }
          }
        },

        StaffCreate: {
          type: "object",
          required: [
            "fullName",
            "licenseNumber",
            "specialty",
            "role",
            "shift",
            "assignedArea",
            "yearsOfExperience",
            "contactData"
          ],
          properties: {
            fullName: { type: "string", example: "Dr. Juan Pérez López" },
            licenseNumber: { type: "string", example: "MED12345" },

            specialty: {
              type: "string",
              enum: [
                "medicina general",
                "cardiología",
                "traumatología",
                "pediatría",
                "oncología",
                "urgencias"
              ],
              example: "urgencias"
            },

            role: {
              type: "string",
              enum: [
                "médico/a adjunto/a",
                "médico/a residente",
                "enfermero/a",
                "auxiliar de enfermería",
                "jefe/a de servicio"
              ],
              example: "médico/a residente"
            },

            shift: {
              type: "string",
              enum: ["mañana", "tarde", "noche", "rotatorio"],
              example: "rotatorio"
            },

            assignedArea: {
              type: "string",
              example: "UCI"
            },

            yearsOfExperience: {
              type: "number",
              example: 5
            },

            contactData: {
              type: "object",
              required: ["address", "phoneNumber", "email"],
              properties: {
                address: { type: "string", example: "Calle Hospital 1" },
                phoneNumber: { type: "string", example: "612345678" },
                email: { type: "string", example: "staff@hospital.com" }
              }
            }
          }
        },

        StaffUpdate: {
          type: "object",
          additionalProperties: false,
          properties: {
            fullName: { type: "string", example: "Dr. Juan Pérez López" },

            specialty: {
              type: "string",
              enum: [
                "medicina general",
                "cardiología",
                "traumatología",
                "pediatría",
                "oncología",
                "urgencias"
              ]
            },

            role: {
              type: "string",
              enum: [
                "médico/a adjunto/a",
                "médico/a residente",
                "enfermero/a",
                "auxiliar de enfermería",
                "jefe/a de servicio"
              ]
            },

            shift: {
              type: "string",
              enum: ["mañana", "tarde", "noche", "rotatorio"]
            },

            assignedArea: { type: "string", example: "Urgencias" },

            yearsOfExperience: { type: "number", example: 12 },

            contactData: {
              type: "object",
              properties: {
                address: { type: "string", example: "Nueva dirección" },
                phoneNumber: { type: "string", example: "600111222" },
                email: { type: "string", example: "nuevo@hospital.com" }
              }
            },

            status: {
              type: "string",
              enum: ["activo", "inactivo"]
            }
          }
        },

        Record: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "69ff1219e1ca9e7f680566f7"
            },

            patient: {
              type: "string",
              example: "69fdcf016bc58168f4ca6b25"
            },

            staff: {
              type: "string",
              example: "69fdcf926bc58168f4ca6b28"
            },

            recordType: {
              type: "string",
              enum: ["consulta ambulatoria", "ingreso hospitalario"],
              example: "consulta ambulatoria"
            },

            startDate: {
              type: "string",
              format: "date-time",
              example: "2026-05-09T10:53:13.191Z"
            },

            endDate: {
              type: "string",
              format: "date-time",
              example: "2026-05-10T10:53:13.191Z"
            },

            reason: {
              type: "string",
              example: "Dolor de garganta y fiebre"
            },

            diagnosis: {
              type: "string",
              example: "Faringitis leve"
            },

            prescriptions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication: {
                    type: "string",
                    example: "69ff1069e1ca9e7f680566f4"
                  },
                  quantity: {
                    type: "number",
                    example: 2
                  },
                  instructions: {
                    type: "string",
                    example: "Tomar 1 comprimido cada 8 horas durante 5 días"
                  }
                }
              }
            },

            totalMedicationCost: {
              type: "number",
              example: 9
            },

            status: {
              type: "string",
              enum: ["abierto", "cerrado"],
              example: "abierto"
            }
          }
        },

        RecordCreate: {
          type: "object",
          required: [
            "patientIdNumber",
            "staffLicenseNumber",
            "recordType",
            "reason",
            "diagnosis"
          ],
          properties: {
            patientIdNumber: {
              type: "string",
              example: "12345678B"
            },

            staffLicenseNumber: {
              type: "string",
              example: "MED12345"
            },

            recordType: {
              type: "string",
              enum: ["consulta ambulatoria", "ingreso hospitalario"],
              example: "consulta ambulatoria"
            },

            reason: {
              type: "string",
              example: "Dolor de garganta y fiebre"
            },

            diagnosis: {
              type: "string",
              example: "Faringitis leve"
            },

            prescriptionsInput: {
              type: "array",
              items: {
                type: "object",
                required: ["nationalCode", "quantity", "instructions"],
                properties: {
                  nationalCode: {
                    type: "string",
                    example: "PARA500"
                  },
                  quantity: {
                    type: "number",
                    example: 2
                  },
                  instructions: {
                    type: "string",
                    example: "Tomar 1 cada 8h durante 5 días"
                  }
                }
              }
            }
          }
        },

        RecordQuery: {
          type: "object",
          properties: {
            startDate: {
              type: "string",
              example: "2026-01-01"
            },
            endDate: {
              type: "string",
              example: "2026-12-31"
            },
            recordType: {
              type: "string",
              enum: ["consulta ambulatoria", "ingreso hospitalario"]
            },
            patientIdNumber: {
              type: "string",
              example: "12345678B"
            }
          }
        },

        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Error message" }
          }
        }
      }
    }
  },

  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);

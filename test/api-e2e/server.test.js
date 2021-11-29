// server.test.js

require("dotenv").config();

const uuid = require("uuid");
const supertest = require("supertest");

const { Server } = require("../../src/server.js");

const server = new Server({ port: process.env.PORT || 3000 });

describe("Scenario 1", () => {
    let serverAddress = "";

    beforeAll(async () => {
        let port = await server.start();
        serverAddress = `localhost:${port}`;
    });

    afterAll(() => server.stop());

    test("GET all", (done) => {
        supertest(serverAddress)
            .get("/person")
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual([]);
                done();
            });
    });

    let id;
    let person = {
        name: "John Silver",
        age: 42,
        hobbies: ["maps", "carrots", "rum"],
    };

    test("POST new", (done) => {
        supertest(serverAddress)
            .post("/person")
            .send(person)
            .expect("Content-Type", /json/)
            .expect(201)
            .then((response) => {
                expect(uuid.validate(response.body.id)).toBe(true);
                id = response.body.id;
                done();
            });
    });

    test("GET by id", (done) => {
        supertest(serverAddress)
            .get(`/person/${id}`)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body.name).toBe(person.name);
                expect(response.body.age).toBe(person.age);
                expect(response.body.hobbies).toEqual(person.hobbies);
                done();
            });
    });

    test("PUT by id", (done) => {
        person = {
            name: "Bilbo Baggins",
            age: "129",
            hobbies: ["smoking", "parties", "rings"],
        };

        supertest(serverAddress)
            .put(`/person/${id}`)
            .send(person)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body.name).toBe(person.name);
                expect(response.body.age).toBe(person.age);
                expect(response.body.hobbies).toEqual(person.hobbies);
                done();
            });
    });

    test("DELETE by id", (done) => {
        supertest(serverAddress)
            .delete(`/person/${id}`)
            .expect(204)
            .then((response) => {
                expect(response.headers).not.toHaveProperty("content-type");
                done();
            });
    });

    test("GET deleted", (done) => {
        supertest(serverAddress)
            .get(`/person/${id}`)
            .expect("Content-Type", /json/)
            .expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                done();
            });
    });
});

//__EOF__

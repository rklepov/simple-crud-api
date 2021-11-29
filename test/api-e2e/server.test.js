// server.test.js

require("dotenv").config();

const uuid = require("uuid");
const supertest = require("supertest");

const { Server } = require("../../src/server.js");

const server = new Server({ port: process.env.PORT || 3000 });

describe("Scenario 1", () => {
    beforeAll(() => server.start());

    afterAll(() => server.stop());

    test("GET all", (done) => {
        supertest(server.httpServer)
            .get("/person")
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toEqual([]);
                done();
            })
            .catch((e) => done(e));
    });

    let id;
    let person = {
        name: "John Silver",
        age: 42,
        hobbies: ["maps", "carrots", "rum"],
    };

    test("POST new", (done) => {
        supertest(server.httpServer)
            .post("/person")
            .send(person)
            .expect("Content-Type", /json/)
            .expect(201)
            .then((response) => {
                expect(uuid.validate(response.body.id)).toBe(true);
                id = response.body.id;
                done();
            })
            .catch((e) => done(e));
    });

    test("GET by id", (done) => {
        supertest(server.httpServer)
            .get(`/person/${id}`)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body.name).toBe(person.name);
                expect(response.body.age).toBe(person.age);
                expect(response.body.hobbies).toEqual(person.hobbies);
                done();
            })
            .catch((e) => done(e));
    });

    test("PUT by id", (done) => {
        person = {
            name: "Bilbo Baggins",
            age: "129",
            hobbies: ["smoking", "parties", "rings"],
        };

        supertest(server.httpServer)
            .put(`/person/${id}`)
            .send(person)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body.name).toBe(person.name);
                expect(response.body.age).toBe(person.age);
                expect(response.body.hobbies).toEqual(person.hobbies);
                done();
            })
            .catch((e) => done(e));
    });

    test("DELETE by id", (done) => {
        supertest(server.httpServer)
            .delete(`/person/${id}`)
            .expect(204)
            .then((response) => {
                // TODO: this is actually case-sensitive here
                expect(response.headers).not.toHaveProperty("content-type");
                done();
            })
            .catch((e) => done(e));
    });

    test("GET deleted", (done) => {
        supertest(server.httpServer)
            .get(`/person/${id}`)
            .expect("Content-Type", /json/)
            .expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                done();
            })
            .catch((e) => done(e));
    });
});

//__EOF__

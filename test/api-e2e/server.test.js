// server.test.js

require("dotenv").config();

const uuid = require("uuid");
const supertest = require("supertest");

const { Server } = require("../../src/server.js");

const server = new Server({ port: process.env.PORT || 3000 });

expect.extend({
    // checks if the passed HTTP header is present in the message. The check is case-insensitive.
    toHaveHttpHeader(message, expected) {
        let lowerExpected = expected.toLowerCase();
        const pass = Object.keys(message.headers)
            .map((x) => x.toLowerCase())
            .includes(lowerExpected);
        return {
            message: () =>
                `expected ${message.constructor.name}` + (pass ? " not " : " ") + `to have '${lowerExpected}' header`,
            pass,
        };
    },
});

describe("Scenario 1: normal flow", () => {
    beforeAll(() => {
        // suppressing server output to console
        jest.spyOn(console, "log").mockImplementation(() => {});
        return server.start();
    });

    afterAll(async () => {
        await server.stop();
        jest.restoreAllMocks();
    });

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
            age: 129,
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
                expect(response).not.toHaveHttpHeader("content-type");
                expect(response.body).toEqual({});
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

describe("Scenario 2: errors", () => {
    beforeAll(() => {
        // suppressing server output to console
        jest.spyOn(console, "log").mockImplementation(() => {});
        // as well as to stderr (because will be checking internal server error case)
        jest.spyOn(console, "error").mockImplementation(() => {});
        return server.start();
    });

    afterAll(async () => {
        await server.stop();
        jest.restoreAllMocks();
    });

    // GET
    test("Request to non-existent resource", (done) => {
        supertest(server.httpServer)
            .get("/some/non/existing/resource")
            .expect("Content-Type", /json/)
            .expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("The resource doesn't exist on the server");
                expect(response.body.details.path).toEqual(
                    expect.arrayContaining("some/non/existing/resource".split("/"))
                );
                done();
            })
            .catch((e) => done(e));
    });

    test("GET by bad id", (done) => {
        supertest(server.httpServer)
            .get("/person/abc-xyz")
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Invalid person Id");
                expect(response.body.details.id).toBe("abc-xyz");
                done();
            })
            .catch((e) => done(e));
    });

    test("GET by non-existent ID", (done) => {
        let fakeId = uuid.v4();
        supertest(server.httpServer)
            .get(`/person/${fakeId}`)
            .expect("Content-Type", /json/)
            .expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Person not found");
                expect(response.body.details.id).toBe(fakeId);
                done();
            })
            .catch((e) => done(e));
    });

    // POST
    test("POST no content-type", (done) => {
        supertest(server.httpServer)
            .post("/person")
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Unsupported request content type for POST");
                expect(response.body.details).toEqual({ expected: "application/json" });
                done();
            })
            .catch((e) => done(e));
    });

    test("POST not all mandatory fields present", (done) => {
        supertest(server.httpServer)
            .post("/person")
            .send({
                name: "Mr. Incoginto",
            })
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Not all mandatory fields provided for POST");
                expect(response.body.details.missing).toEqual(["age", "hobbies"]);
                done();
            })
            .catch((e) => done(e));
    });

    // PUT
    test("PUT by bad id", (done) => {
        supertest(server.httpServer)
            .put("/person/abc-xyz")
            .send({ name: "Doesn't Matter", age: 0, hobbies: [] })
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Invalid person Id");
                expect(response.body.details.id).toBe("abc-xyz");
                done();
            })
            .catch((e) => done(e));
    });

    test("PUT by non-existent ID", (done) => {
        let fakeId = uuid.v4();
        supertest(server.httpServer)
            .put(`/person/${fakeId}`)
            .send({ name: "Doesn't Matter", age: 0, hobbies: [] })
            .expect("Content-Type", /json/)
            .expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Person not found");
                expect(response.body.details.id).toBe(fakeId);

                done();
            })
            .catch((e) => done(e));
    });

    // DELETE
    test("DELETE by bad ID", (done) => {
        supertest(server.httpServer)
            .delete("/person/abc-xyz")
            .expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Invalid person Id");
                expect(response.body.details.id).toBe("abc-xyz");
                done();
            })
            .catch((e) => done(e));
    });

    test("DELETE by non-existent id", (done) => {
        let fakeId = uuid.v4();
        supertest(server.httpServer)
            .delete(`/person/${fakeId}`)
            .expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Person not found");
                expect(response.body.details.id).toBe(fakeId);
                done();
            })
            .catch((e) => done(e));
    });

    // ill-formed json posted
    test("POST ill-formed json", (done) => {
        supertest(server.httpServer)
            .post("/person")
            .set("content-type", "application/json")
            .send("{},")
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("JSON parse failed");
                done();
            })
            .catch((e) => done(e));
    });

    // Internal server error
    test("POST simulate 500 internal server error", (done) => {
        supertest(server.httpServer)
            .post("/person")
            .send({
                name: "Harry Potter",
                age: 11,
                hobbies: ["Quidditch"],
            })
            .expect("Content-Type", /json/)
            .expect(500)
            .then((response) => {
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toBe("Internal server error");
                expect(response.body.details.Error).toBe("Expelliarmus!");
                done();
            })
            .catch((e) => done(e));
    });
});

describe("Scenario 3: working with several objects", () => {
    beforeAll(() => {
        // suppressing server output to console
        jest.spyOn(console, "log").mockImplementation(() => {});
        return server.start();
    });

    afterAll(async () => {
        await server.stop();
        jest.restoreAllMocks();
    });

    let ids = [];
    const NUM_OBJECTS = 3;

    const testNumberObjects = (done) => {
        supertest(server.httpServer)
            .get("/person")
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toBeInstanceOf(Array);
                expect(response.body.length).toBe(ids.length);
                expect(ids.every((id, ix) => response.body[ix].id === id)).toBe(true);
                done();
            })
            .catch((e) => done(e));
    };

    test.each([...Array(NUM_OBJECTS).keys()])(`[POST] Create a new object(s)`, (n, done) => {
        supertest(server.httpServer)
            .post("/person")
            .send({
                name: `Person #${n}`,
                age: 20 + n,
                hobbies: [`hobby ${n}`],
            })
            .expect("Content-Type", /json/)
            .expect(201)
            .then((response) => {
                expect(response.body).toHaveProperty("id");
                ids[n] = response.body.id;
                done();
            })
            .catch((e) => done(e));
    });

    test(`[GET] ensure ${NUM_OBJECTS} object(s) created`, testNumberObjects);

    test("[GET] check the 2nd object", (done) => {
        supertest(server.httpServer)
            .get(`/person/${ids[1]}`)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty("name");
                expect(response.body.name).toBe("Person #1");
                expect(response.body).toHaveProperty("age");
                expect(response.body.age).toBe(21);
                expect(response.body).toHaveProperty("hobbies");
                expect(response.body.hobbies).toEqual(["hobby 1"]);
                done();
            })
            .catch((e) => done(e));
    });

    let newPerson1 = {
        name: "Bilbo Baggins",
        age: 129,
        hobbies: ["smoking", "parties", "rings"],
    };

    test("[PUT] change the 2nd object", (done) => {
        supertest(server.httpServer)
            .put(`/person/${ids[1]}`)
            .send(newPerson1)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body.name).toBe(newPerson1.name);
                expect(response.body.age).toBe(newPerson1.age);
                expect(response.body.hobbies).toEqual(newPerson1.hobbies);
                done();
            })
            .catch((e) => done(e));
    });

    test("[GET] check the updated 2nd object", (done) => {
        supertest(server.httpServer)
            .get(`/person/${ids[1]}`)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty("name");
                expect(response.body.name).toBe(newPerson1.name);
                expect(response.body).toHaveProperty("age");
                expect(response.body.age).toBe(newPerson1.age);
                expect(response.body).toHaveProperty("hobbies");
                expect(response.body.hobbies).toEqual(newPerson1.hobbies);
                done();
            })
            .catch((e) => done(e));
    });

    test("[DELETE] delete the first object", (done) => {
        supertest(server.httpServer)
            .delete(`/person/${ids[0]}`)
            .expect(204)
            .then((response) => {
                expect(response).not.toHaveHttpHeader("content-type");
                expect(response.body).toEqual({});
                ids.splice(0, 1);
                done();
            })
            .catch((e) => done(e));
    });

    test(`[GET] ensure ${NUM_OBJECTS - 1} object(s) remaining`, testNumberObjects);

    test("[DELETE] delete the last object", (done) => {
        supertest(server.httpServer)
            .delete(`/person/${ids.slice(-1)}`)
            .expect(204)
            .then((response) => {
                expect(response).not.toHaveHttpHeader("content-type");
                expect(response.body).toEqual({});
                ids.splice(-1, 1);
                done();
            })
            .catch((e) => done(e));
    });

    test(`[GET] ensure ${NUM_OBJECTS - 2} object(s) remaining`, testNumberObjects);

    test("[GET] check the last remaining object", (done) => {
        supertest(server.httpServer)
            .get(`/person/${ids[0]}`)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty("name");
                expect(response.body.name).toBe(newPerson1.name);
                expect(response.body).toHaveProperty("age");
                expect(response.body.age).toBe(newPerson1.age);
                expect(response.body).toHaveProperty("hobbies");
                expect(response.body.hobbies).toEqual(newPerson1.hobbies);
                done();
            })
            .catch((e) => done(e));
    });
});


//__EOF__

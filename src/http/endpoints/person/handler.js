// api-endpoints.js

const HTTPResponse = require("../../responses.js");
const RequestValidator = require("./validator.js");

class PeopleRegistryHandler {
    #selfEndpoint = [];
    #db = null;

    constructor(endpoint, db) {
        this.#selfEndpoint = endpoint;
        this.#db = db;
    }

    get(validator) {
        // list all records
        if (0 == validator.path.length) {
            return HTTPResponse.OK(this.#db.ls());
        }

        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        if (!(validator.checkPath(1, 1) && validator.checkId())) {
            return validator.response;
        }

        let id = validator.id;

        let { hasValue, value } = this.#db.read(id);
        if (hasValue) {
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id });
        }
    }

    post(validator, body) {
        // extra items in the path -> HTTPResponse.NotFound
        // content-type not application/json -> HTTPResponse.BadRequest
        // bad json passed -> HTTPResponse.BadRequest
        // not all object fields present -> HTTPResponse.BadRequest
        if (
            !(
                validator.checkPath(0, 0) &&
                validator.checkContentType("application/json") &&
                validator.checkJsonObject(body) &&
                validator.allObjectFieldsPresent(["name", "age", "hobbies"])
            )
        ) {
            return validator.response;
        }

        let obj = validator.object;

        // ! Special request to model 500 internal server error !
        if (obj["name"] === "Harry Potter") {
            throw new Error("Expelliarmus!");
        }

        let id = this.#db.create(obj);

        return HTTPResponse.Created({ id });
    }

    put(validator, body) {
        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        // content-type not application/json -> HTTPResponse.BadRequest
        // bad json passed -> HTTPResponse.BadRequest
        // not all object fields present -> HTTPResponse.BadRequest
        if (
            !(
                validator.checkPath(1, 1) &&
                validator.checkId() &&
                validator.checkContentType("application/json") &&
                validator.checkJsonObject(body) &&
                validator.allObjectFieldsPresent(["name", "age", "hobbies"])
            )
        ) {
            return validator.response;
        }

        let id = validator.id;
        let obj = validator.object;

        let { updated, value } = this.#db.update(id, obj);
        if (updated) {
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id });
        }
    }

    patch(validator, body) {
        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        // content-type not application/json -> HTTPResponse.BadRequest
        // bad json passed -> HTTPResponse.BadRequest
        if (
            !(
                validator.checkPath(1, 1) &&
                validator.checkId() &&
                validator.checkContentType("application/json") &&
                validator.checkJsonObject(body)
            )
        ) {
            return validator.response;
        }

        let id = validator.id;
        let obj = validator.object;

        let { hasValue, value } = this.#db.read(id);
        if (hasValue) {
            value = { ...value, ...obj };
            this.#db.update(id, value);
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id });
        }
    }

    delete(validator) {
        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        if (!(validator.checkPath(1, 1) && validator.checkId())) {
            return validator.response;
        }

        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        if (!(validator.checkPath(1, 1) && validator.checkId())) {
            return validator.response;
        }

        let id = validator.id;

        let { deleted } = this.#db.delete(id);
        if (deleted) {
            return HTTPResponse.NoContent();
        } else {
            return HTTPResponse.NotFound("Person not found", { id });
        }
    }

    dispatch(method, headers, path, body) {
        const supportedMethods = {
            GET: this.get,
            POST: this.post,
            PUT: this.put,
            PATCH: this.patch,
            DELETE: this.delete,
        };
        let handler = supportedMethods[method];
        if (handler) {
            let validator = new RequestValidator(method, headers, this.#selfEndpoint, path);
            return handler.call(this, validator, body);
        } else {
            return HTTPResponse.MethodNotAllowed("Method not supported", { method });
        }
    }
}

module.exports = PeopleRegistryHandler;

//__EOF__

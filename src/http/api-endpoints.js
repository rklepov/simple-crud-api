// api-endpoints.js

const HTTPResponse = require("./responses.js");
const { RequestValidator } = require("./validators.js");

class PeopleRegistryHandler {
    #db = null;

    constructor(db) {
        this.#db = db;
    }

    get(validator, path) {
        // list all records
        if (0 == path.length) {
            return HTTPResponse.OK(this.#db.ls());
        }

        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        if (!(validator.checkPath(1, 1) && validator.checkId())) {
            return validator.response;
        }

        let key = path[0];
        let { hasValue, value } = this.#db.read(key);
        if (hasValue) {
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id: key });
        }
    }

    post(validator, path, obj) {
        // extra items in the path -> HTTPResponse.NotFound
        // not all fields present -> HTTPResponse.BadRequest
        if (!(validator.checkPath(0, 0) && validator.allFieldsPresent(["name", "age", "hobbies"]))) {
            return validator.response;
        }

        // Special request to model 500 internal server error response
        if (obj["name"] === "Harry Potter") {
            throw new Error("Expelliarmus!");
        }

        let key = this.#db.create(obj);

        return HTTPResponse.Created({ id: key });
    }

    put(validator, path, obj) {
        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        // not all fields present -> HTTPResponse.BadRequest
        if (
            !(
                validator.checkPath(1, 1) &&
                validator.checkId() &&
                validator.allFieldsPresent(["name", "age", "hobbies"])
            )
        ) {
            return validator.response;
        }

        let key = path[0];
        let { updated, value } = this.#db.update(key, obj);
        if (updated) {
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id: key });
        }
    }

    patch(validator, path, obj) {
        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        if (!(validator.checkPath(1, 1) && validator.checkId())) {
            return validator.response;
        }

        let key = path[0];
        let { hasValue, value } = this.#db.read(key);
        if (hasValue) {
            value = { ...value, ...obj };
            this.#db.update(key, value);
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id: key });
        }
    }

    delete(validator, path) {
        // extra items in the path -> HTTPResponse.NotFound
        // invalid key -> HTTPResponse.BadRequest
        if (!(validator.checkPath(1, 1) && validator.checkId())) {
            return validator.response;
        }

        let key = path[0];
        let { deleted } = this.#db.delete(key);
        if (deleted) {
            return HTTPResponse.NoContent();
        } else {
            return HTTPResponse.NotFound("Person not found", { id: key });
        }
    }

    dispatch(method, path, obj) {
        const supportedMethods = {
            GET: this.get,
            POST: this.post,
            PUT: this.put,
            PATCH: this.patch,
            DELETE: this.delete,
        };
        let handler = supportedMethods[method];
        if (handler) {
            let validator = new RequestValidator(method, path, obj);
            return handler.call(this, validator, path, obj);
        } else {
            return HTTPResponse.MethodNotAllowed("Method not supported", { method });
        }
    }
}

module.exports = { PeopleRegistryHandler };

//__EOF__

// api-endpoints.js

const HTTPResponse = require("./responses.js");

class PeopleRegistryHandler {
    #db = null;

    constructor(db) {
        this.#db = db;
    }

    get(path) {
        if (0 == path.length) {
            return HTTPResponse.OK(this.#db.ls());
        }

        // TODO: extra items in the path -> HTTPResponse.NotFound
        // TODO: invalid key -> HTTPResponse.BadRequest
        let key = path[0];
        let { hasValue, value } = this.#db.read(key);
        if (hasValue) {
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id: key });
        }
    }

    post(path, obj) {
        // TODO: extra items in the path -> HTTPResponse.NotFound
        // TODO: invalid key -> HTTPResponse.BadRequest
        // TODO: json validation -> HTTPResponse.BadRequest

        let key = this.#db.create(obj);

        return HTTPResponse.Created({ id: key });
    }

    put(path, obj) {
        // TODO: extra items in the path -> HTTPResponse.NotFound
        // TODO: invalid key -> HTTPResponse.BadRequest
        // TODO: json validation -> HTTPResponse.BadRequest
        let key = path[0];
        let { updated, value } = this.#db.update(key, obj);
        if (updated) {
            return HTTPResponse.OK(value);
        } else {
            return HTTPResponse.NotFound("Person not found", { id: key });
        }
    }

    patch(path, obj) {
        // TODO: extra items in the path -> HTTPResponse.NotFound
        // TODO: invalid key -> HTTPResponse.BadRequest
        // TODO: json validation -> HTTPResponse.BadRequest
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

    delete(path) {
        // TODO: extra items in the path -> HTTPResponse.NotFound
        // TODO: invalid key -> HTTPResponse.BadRequest
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
            return handler.call(this, path, obj);
        } else {
            return HTTPResponse.MethodNotAllowed("Method not supported", { method });
        }
    }
}

module.exports = { PeopleRegistryHandler };

//__EOF__

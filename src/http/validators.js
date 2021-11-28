// validators.js

const uuid = require("uuid");

const HTTPResponse = require("./responses.js");

class RequestValidator {
    #method = null;
    #path = null;
    #object = null;
    #response = null;

    constructor(method, path, obj) {
        this.#method = method;
        this.#path = path;
        this.#object = obj;
    }

    checkId() {
        let id = this.#path[0];
        let valid = uuid.validate(id);
        if (!valid) {
            this.#response = HTTPResponse.BadRequest("Invalid person Id", { id });
        }
        return valid;
    }

    checkPath(minLen, maxLen) {
        let path = this.#path;
        let valid = minLen <= path.length && path.length <= maxLen;
        if (!valid) {
            this.#response = HTTPResponse.NotFound(`Invalid resource for ${this.#method}`, { path });
        }
        return valid;
    }

    allFieldsPresent(fields) {
        let missing = fields.filter((field) => !Object.keys(this.#object).includes(field));
        if (0 < missing.length) {
            this.#response = HTTPResponse.BadRequest(`Not all mandatory fields provided for ${this.#method}`, {
                missing,
            });
        }
        return 0 >= missing.length;
    }

    get response() {
        return this.#response;
    }
}

module.exports = { RequestValidator };

//__EOF__

// response.js
//
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
//

class Response {
    #status = null;

    constructor(status) {
        this.#status = status;
    }

    sendTo(serverResponse) {
        serverResponse.statusCode = this.#status;
        serverResponse.setHeader("content-type", "application/json");
        return serverResponse.end(JSON.stringify(this.getBody()));
    }

    getBody() {
        return this._body();
    }

    _body() {
        return {};
    }
}

// HTTP 200 ////////////////////////////////////////////////////////////////////

class SuccessfulResponse extends Response {
    #object = null;
    constructor(status, obj) {
        super(status);
        this.#object = obj;
    }

    _body() {
        // return { ...super._body(), ...this.#object };
        return this.#object;
    }
}

class OK extends SuccessfulResponse {
    constructor(obj) {
        super(200, obj);
    }
}

class Created extends SuccessfulResponse {
    constructor(obj) {
        super(201, obj);
    }
}

class NoContent extends SuccessfulResponse {
    constructor() {
        super(204);
    }

    _body() {
        return {};
    }
}

// HTTP 400, 500 ///////////////////////////////////////////////////////////////

class ErrorResponse extends Response {
    #message = null;
    #details = null;

    constructor(status, msg, details) {
        super(status);
        this.#message = msg;
        this.#details = details;
    }

    _body() {
        let body = { ...super._body(), message: this.#message };
        if (this.#details) {
            body = { ...body, details: this.#details };
        }
        return body;
    }
}

// HTTP 400 ////////////////////////////////////////////////////////////////////

class ClientError extends ErrorResponse {
    constructor(status, msg, details) {
        super(status, msg, details);
    }
}

class BadRequest extends ClientError {
    constructor(msg, details) {
        super(400, msg, details);
    }
}

class NotFound extends ClientError {
    constructor(msg, details) {
        super(404, msg, details);
    }
}

class MethodNotAllowed extends ClientError {
    constructor(msg, details) {
        super(405, msg, details);
    }
}

// HTTP 500 ////////////////////////////////////////////////////////////////////

class ServerError extends ErrorResponse {
    constructor(status, msg, details) {
        super(status, msg, details);
    }
}

class InternalError extends ServerError {
    constructor(msg, details) {
        super(500, msg, details);
    }
}

module.exports = {
    OK,
    Created,
    NoContent,

    BadRequest,
    NotFound,
    MethodNotAllowed,

    InternalError,
};

//__EOF__

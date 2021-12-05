// streams.js

const { Writable } = require("stream");

class RequestBodyStream extends Writable {
    constructor(opts) {
        super({ decodeStrings: false, defaultEncoding: "utf8", ...opts });
        this.buffer = "";
    }

    _construct(callback) {
        callback();
    }

    _write(chunk, _, callback) {
        this.buffer += chunk;
        callback();
    }
}

module.exports = { RequestBodyStream };

//__EOF__

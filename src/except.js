// except.js

class Exception extends Error {
    get name() {
        return this.constructor.name;
    }
}

module.exports = { Exception };

//__EOF__

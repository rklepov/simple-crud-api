// db.js
//
// Simple in-memory key-value storage. The implementation is based on Map which
// keys are string representations of UUID.
//
// TODO: apparently it's not very efficient to use string UUIDs as keys. However
//       for the sake of simplicity and the ability to use Map I've decided to
//       keep this solution for the time being.

const uuid = require("uuid");

let db = new Map();

function create(value) {
    let key = uuid.v4();
    db.set(key, value);
    return key;
}

function read(key) {
    let value = db.get(key);
    return { hasValue: !!value, value };
}

function update(key, value) {
    if (db.has(key)) {
        db.set(key, value);
        return { updated: true, value };
    } else {
        return { updated: false };
    }
}

function remove(key) {
    return { deleted: db.delete(key) };
}

function ls() {
    return [...db.values()];
}

module.exports = { create, read, update, remove, ls };

//__EOF__

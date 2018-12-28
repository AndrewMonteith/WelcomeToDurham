"use strict";
// Json Wrapper that can kinda act like a database
// pmbd = "Poor Man's Data Base"

const fs = require("fs");
const lockfile = require("lockfile");
let openDbs = {};

const nameToFileUrl = name => `./private/pmdb/${name}.json`;

function Open(name) {
    if (openDbs[name] !== undefined) {
        return;
    }

    openDbs[name] = JSON.parse(fs.readFileSync(nameToFileUrl(name)));
}
exports.Open = Open;

function Find(name, query) {
    return openDbs[name][query];
}
exports.Find = Find;

function Set(name, query, value) {
    openDbs[name][query] = value;
}
exports.Set = Set;

function Update(name, query, callback) {
    openDbs[name][query] = callback(Find(name, query));
}
exports.Update = Update;

function Exists(name, query) {
    return openDbs[name][query] !== undefined;
}
exports.Exists = Exists;

function Write(name) {
    const lockName = `./private/pmbd/${name}.lock`;
    const errorCallback = err => {
        if (err) {
            console.log(`Something went wrong when writing ${name}, ${err}`)
        }
    };

    lockfile.lock(lockName, {}, err => {
        if (err) {
            console.log("failed to lock, also oh dear. " + err);
            return;
        }
        
        fs.writeFile(nameToFileUrl(name), JSON.stringify(openDbs[name]), errorCallback);

        lockfile.unlock(lockName, errorCallback);
    });
}
exports.Write = Write;
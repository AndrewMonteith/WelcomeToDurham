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

function Find(name, key) {
    return openDbs[name][key];
}
exports.Find = Find;

function Set(name, key, value) {
    openDbs[name][key] = value;
}
exports.Set = Set;

function Update(name, key, callback) {
     openDbs[name][key] = callback(Find(name, key));
}
exports.Update = Update;

function Exists(name, key) {
    return openDbs[name][key] !== undefined;
}
exports.Exists = Exists;

function Iterate(name, callback) {
    let dict = openDbs[name];

    Object.keys(dict).forEach(key => callback(key, dict[key]));
}
exports.Iterate = Iterate;

function Query(name, callback) {
    let result = {};
    const db = openDbs[name];
    
    Object.keys(db).forEach(key => {
        const value = db[key];
        if (callback(value)) {
            result[key] = value;
        }
    });

    return result;
}
exports.Query = Query;

function Write(name) {
    const lockName = `./private/pmdb/${name}.lock`;
    
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
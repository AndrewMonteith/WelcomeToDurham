"use strict";

const crypto = require("crypto");

const sessionTokens = {};

function gesSessionTokenForUsername(username) {
    for (const token in sessionTokens) {
        if (sessionTokens[token] === username) {
            return token;
        }
    }
}

function GetUsernameFromToken(sessionToken) {
    return sessionTokens[sessionToken];
}
exports.GetUsernameFromToken = GetUsernameFromToken;

function RecordNewToken(username) {
    const currentSessionToken = gesSessionTokenForUsername(username);
    if (currentSessionToken !== undefined) {
        return currentSessionToken;
    }

    const newSessionToken = crypto.randomBytes(64).toString("hex");
    sessionTokens[newSessionToken] = username;
    return newSessionToken;
}
exports.RecordNewToken = RecordNewToken;

function IsTokenValid(sessionToken) {
    return sessionTokens[sessionToken] !== undefined;
}
exports.IsTokenValid = IsTokenValid;

function RemoveToken(sessionToken) {
    sessionTokens[sessionToken] = undefined;
}
exports.RemoveToken = RemoveToken;
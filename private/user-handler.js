"use strict";

const crypto = require("crypto");
const sha512 = require("js-sha512");
const utils = require("./utils");
const pmdb = require("./pmdb/pmdb");

pmdb.Open("users");

const sessionTokens = {};

function registerUser(username, password) {
    if (pmdb.Exists("users", username)) {
        console.log(`Cannot register ${username} as they already exist.`);
        return;
    }

    const salt = crypto.randomBytes(512);
    const hash = sha512.hmac(salt, password);
    
    pmdb.Set("users", username, {
        password: {
            hash: hash,
            salt: salt.toString("hex")
        }
    });

    pmdb.Write("users");
}

function passwordIsCorrect(username, password) {
    if (!pmdb.Exists("users", username)) {
        return;
    }

    const passwordDict = pmdb.Find("users", username).password;
    const inputPasswordHash = sha512.hmac(Buffer.from(passwordDict.salt, "hex"), password);

    return passwordDict.hash === inputPasswordHash;
}

function loginUser(username, response) {
    const sessionToken = crypto.randomBytes(256).toString("hex");
    sessionTokens[username] = sessionToken;

    response.status(200);
    response.type("json");
    response.send({Token: sessionToken});
}

function reportFailedAttempt(response) {
    response.status(400);
    utils.SendMessage(response, "Username or password was incorect");
}

function makeLoginRequest(request, response) {
    if (utils.InvalidStringParameter(request, "username")) {
        utils.SendInvalidParameterResponse(response, "username", "string"); 
        return;
    }

    if (utils.InvalidStringParameter(request, "password")) {
        utils.SendInvalidParameterResponse(response, "password", "string");
        return;
    }

    const queryUsername = request.query.username;

    if (passwordIsCorrect(queryUsername, request.query.password)) {
        loginUser(queryUsername, response);
    } else {
        reportFailedAttempt(response);
    }
}

function logoutUserRequest(request, response) {
    if (utils.InvalidStringParameter(request, "session")) {
        utils.SendInvalidParameterResponse(response, "session", "string");
        return;
    }

    sessionTokens[request.query.session] = undefined;
    utils.SendMessage(response, "success");
}

function checkUsernameExists(request, response) {
    if (utils.InvalidStringParameter(request, "username")) {
        utils.SendInvalidParameterResponse(response, "username", "string");
        return;
    }

    const exists = pmdb.Find("users", request.query.username) !== undefined;
    utils.SendMessage(response, exists);
}

exports.ListenOnRoutes = expressApp => {
    expressApp.get("/login", makeLoginRequest);
    expressApp.get("/logout", logoutUserRequest);
    expressApp.get("/usernameExists", checkUsernameExists);
};
"use strict";

const crypto = require("crypto");
const utils = require("./utils");
const pmdb = require("./pmdb/pmdb");

pmdb.Open("users");

const sessionTokens = {};

function isSessionTokenValid(token) {
    return sessionTokens[token] !== undefined;
}
exports.IsSessionTokenValid = isSessionTokenValid;

function getPasswordHash(password, salt) {
    return crypto.createHash("sha512").update(password+salt).digest('hex');
}

function registerUser(username, password) {
    if (pmdb.Exists("users", username)) {
        console.log(`Cannot register ${username} as they already exist.`);
        return;
    }

    const salt = crypto.randomBytes(64).toString("hex");
    const hash = getPasswordHash(password, salt);
    
    pmdb.Set("users", username, {
        password: { hash: hash, salt: salt }
    });

    pmdb.Write("users");
}

function passwordIsCorrect(username, password) {
    if (!pmdb.Exists("users", username)) {
        return;
    }

    const passwordDict = pmdb.Find("users", username).password;
    const inputPasswordHash = getPasswordHash(password, passwordDict.salt);

    return passwordDict.hash === inputPasswordHash;
}

function loginUser(response, username) {
    const sessionToken = crypto.randomBytes(64).toString("hex");
    sessionTokens[sessionToken] = username;
    console.log("Updated session tokens");
    response.status(200);
    response.type("json");
    response.json({ Token: sessionToken });
}

function reportFailedAttempt(response) {
    utils.SendMessage(response, 400, "Username or password was incorect");
}

function loginUserRequest(request, response) {
    if (utils.InvalidStringParameter(request, "username")) {
        utils.invalidQueryParamterType(response, "username", "string");
        return;
    }

    if (utils.InvalidStringParameter(request, "password")) {
        utils.invalidQueryParamterType(response, "password", "string");
        return;
    }

    const queryUsername = request.body.username;

    if (passwordIsCorrect(queryUsername, request.body.password)) {
        loginUser(response, queryUsername);
    } else {
        reportFailedAttempt(response);
    }
}

function logoutUserRequest(request, response) {
    if (utils.InvalidStringParameter(request, "session")) {
        utils.invalidQueryParamterType(response, "session", "string");
        return;
    }

    sessionTokens[request.body.session] = undefined;
    utils.SendMessage(response, 200, "success");
}

const isWhitespaceOrEmpty = s => s.trim() === "";

function isValidUsername(username) {
    if (username.match(/[^a-zA-Z_0-9]/) !== null) {
        return false;
    }

    if (username.length < 3) {
        return false;
    }

    if (doesUsernameExist(username)) {
        return false;
    }

    return true;
}

function isValidPassword(password) {
    /*
        - Must contain at least 1:
            - Capital Letter
            - Number
            - Punctuation
        - Be at least 8 letters long.
    */
    if (isWhitespaceOrEmpty(password)) {
        return false;
    }

    if (password.length < 8) {
        return false;
    }

    const uppercase = /[A-Z]/, lowercase = /[a-z]/, punctuation = /[^a-zA-Z0-9]/;
    return password.match(uppercase) && password.match(lowercase) && password.match(punctuation);
}

function registerUserRequest(request, response) {
    if (utils.InvalidStringParameter(request, "username")) {
        utils.invalidQueryParamterType(response, "username", "string");
        return;
    }

    const username = request.body.username;
    if (!isValidUsername(username)) {
        utils.SendMessage(response, 400, "Bad username");
        return;
    }

    if (utils.InvalidStringParameter(request, "password")) {
        utils.invalidQueryParamterType(response, "password", "string");
        return;
    }

    const password = request.body.password;
    if (!isValidPassword(password)) {
        utils.SendMessage(response, 400, "Bad Password");
        return;
    }

    registerUser(username, password);
    loginUser(response, username);
}

function doesUsernameExist(username) {
    return pmdb.Find("users", username) !== undefined;
}

function checkUsernameExists(request, response) {
    if (utils.InvalidStringParameter(request, "username")) {
        utils.InvalidQueryParamterType(response, "username", "string");
        return;
    }

    utils.SendMessage(response, 200, doesUsernameExist(request.query.username));
}

function checkSessionCookie(request, response) {
    if (utils.InvalidStringParameter(request, "session")) {
        utils.invalidQueryParamterType(response, "session", "string");
        return;
    }

    const sessionTokenValid = isSessionTokenValid(request.query.session);
    utils.SendMessage(response, 200, sessionTokenValid);
}

function GetUsernameFromSession(sessionToken) {
    return sessionTokens[sessionToken];
}
exports.GetUsernameFromSession = GetUsernameFromSession;

exports.ListenOnRoutes = expressApp => {
    expressApp.post("/login", loginUserRequest);
    expressApp.post("/logout", logoutUserRequest);
    expressApp.post("/register", registerUserRequest);
    expressApp.get("/amILoggedIn", checkSessionCookie);
    expressApp.get("/usernameExists", checkUsernameExists);
};
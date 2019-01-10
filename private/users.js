"use strict";

const crypto = require("crypto");

const utils = require("./utils");
const pmdb = require("./pmdb/pmdb");
const validators = require("./validators");
const session = require("./sessions");

pmdb.Open("users");

const endpoints = {
    POST: {},
    GET: {}
};

function hashPassword(password, salt) {
    return crypto.createHash("sha512").update(password + salt).digest("hex");
}

function passwordIsCorrect(username, password) {
    if (!pmdb.Exists("users", username)) { return; }

    const passwordDict = pmdb.Find("users", username).password;
    const inputPasswordHash = hashPassword(password, passwordDict.salt);

    return inputPasswordHash === passwordDict.hash;
}

function reportFailedLoginAttempt(response) {
    utils.SendMessage(response, 400, "Username or password incorrect");
}

function loginUser(response, username) {
    const token = session.RecordNewToken(username);

    response.status(200);
    response.type("json");
    response.json({ Token: token });
}

function loginUserEndpoint(request, response) {
    const requestParameters = validators.ValidateRequestParameters(
        request, response, { username: 'string', password: 'string' });
    if (requestParameters === undefined) { return; }

    if (passwordIsCorrect(requestParameters.username, requestParameters.password)) {
        loginUser(response, requestParameters.username);
    } else {
        reportFailedLoginAttempt(response);
    }
}
endpoints.POST['/login'] = loginUserEndpoint;


function logoutUserEndpoint(request, response) {
    const token = validators.ValidateSessionParameter(request, response);
    if (token === undefined) { return; }
    session.RemoveToken(token);

    utils.SendMessage(response, 200, "success");
}
endpoints.POST['/logout'] = logoutUserEndpoint;

function doesUserExist(username) {
    return pmdb.Find("users", username) !== undefined;
}

function isValidUsername(username) {
    return (username.match(/[^a-zA-Z_0-9]/) === null) &&
        (username.length >= 3) &&
        (!doesUserExist(username));
}

function isValidPassword(password) {
    const passwordLongEnough = !utils.IsWhitespaceOrEmpty(password) &&
        (password.length >= 8);

    if (!passwordLongEnough) {
        return false;
    }

    const uppercase = /[A-Z]/, lowercase = /[a-z]/, punctuation = /[^a-zA-Z0-9]/;
    return password.match(uppercase) && password.match(lowercase) && password.match(punctuation);
}

function registerUser(firstname, surname, username, password) {
    const salt = crypto.randomBytes(64).toString("hex");
    const hash = hashPassword(password, salt);

    pmdb.Set("users", username, {
        firstname: firstname,
        surname: surname,
        password: { hash: hash, salt: salt }
    });
}

function registerUserEndpoint(request, response) {
    const parameters = validators.ValidateRequestParameters(request, response,
        { username: 'string', password: 'string', firstname: 'string', surname: 'string' });
    if (parameters === undefined) { return; }

    if (!isValidUsername(parameters.username)) {
        utils.SendMessage(response, 400, "bad username");
        return;
    }

    if (!isValidPassword(parameters.password)) {
        utils.SendMessage(response, 400, "bad password");
        return;
    }

    registerUser(parameters.firstname, parameters.surname,
        parameters.username, parameters.password);
    loginUser(response, parameters.username);

}
endpoints.POST['/register'] = registerUserEndpoint;


function checkSingleParameterProperty(request, response, parameter, validation) {
    const value = validators.GetStringParameter(request, parameter);
    let result = value ? validation(value) : false;
    utils.SendMessage(response, 200, result);
}

function checkUsernameEndpoint(request, response) {
    return checkSingleParameterProperty(request, response, "username", doesUserExist);
}
endpoints.GET['/usernameExists'] = checkUsernameEndpoint;

function checkSessionCookieEndpoint(request, response) {
    return checkSingleParameterProperty(request, response, "Session", session.IsTokenValid);
}
endpoints.GET['/amILoggedIn'] = checkSessionCookieEndpoint;


// -------------- Endpoints required for automatic tests
function summariseUser(username, user) {
    return {
        username: username, forename: user.firstname, surname: user.surname
    };
}

function getResponseForEveryone() {
    const result = []

    pmdb.Iterate("users", (username, user) =>
        result.push(summariseUser(username, user)));

    return result;
}

function getSpecificPerson(username) {
    return summariseUser(username, pmdb.Find("users", username));
}

function getListOfPeopleEndpoint(request, response) {
    const person = validators.GetStringParameter(request, "person");

    const result = person === undefined ? 
        getResponseForEveryone() : getSpecificPerson(person);
    
    response.status(200);
    response.json(result);
}

function addBradleyUserEndpoint(request, response) {
    if (validators.GetStringParameter(request, "access_token") !== "concertina") {
        response.status(403);
        response.json({ Message: "unauthorised request" });
        return;
    }

    const parameters = validators.ValidateRequestParameters(request, response,
        { username: "string", forename: "string", surname: "string" });

    if (parameters === undefined) { return; }

    if (pmdb.Find("users", parameters.username)) {
        response.status(400);
        response.json({ Message: "cannot have duplicate user" });
        return;
    }

    registerUser(parameters.forename, parameters.surname,
        parameters.username, "Password123!");
}

function ListenOnRoutes(app) {
    Object.keys(endpoints.POST)
        .forEach(endpoint => app.post(endpoint, endpoints.POST[endpoint]));

    Object.keys(endpoints.GET)
        .forEach(endpoint => app.get(endpoint, endpoints.GET[endpoint]));

    // To pass the tests.
    app.route("/people")
        .get(getListOfPeopleEndpoint)
        .post(addBradleyUserEndpoint);

    app.route("/people/:person")
        .get(getListOfPeopleEndpoint)
        .post(addBradleyUserEndpoint);
}
exports.ListenOnRoutes = ListenOnRoutes;
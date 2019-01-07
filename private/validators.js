const utils = require("./utils");
const pmdb = require("./pmdb/pmdb");
const session = require("./sessions");

function getParameterFromRequest(request, parameter) {
    return (request.query[parameter] || request.body[parameter]);
}

function isStringParameterPresent(request, param) {
    const value = getParameterFromRequest(request, param);

    return (typeof (value) === "string") && !utils.IsWhitespaceOrEmpty(value);
}

function GetStringParameter(request, param) {
    if (isStringParameterPresent(request, param)) {
        return getParameterFromRequest(request, param);
    }
}
exports.GetStringParameter = GetStringParameter;

function reportMissingParameter(response, type, parameter) {
    response.status(400);
    response.json({
        Error: "Invalid query parameter",
        Description: `Expected ${type} for parameter ${parameter}`
    });
}

function ValidateStringParameter(request, response, parameter) {
    if (isStringParameterPresent(request, parameter)) {
        return getParameterFromRequest(request, parameter);
    } else {
        reportMissingParameter(response, "string", parameter);
    }
}
exports.ValidateStringParamter = ValidateStringParameter;

function ValidateBoolParameter(request, response, parameter) {
    const value = ValidateStringParameter(request, response, parameter);
    if (value === undefined) { return; }
    return value === "true";
}
exports.ValidateBoolParameter = ValidateBoolParameter;

function isValidEventId(eventId) {
    return pmdb.Find("events", eventId) !== undefined;
}

function ValidateEventParameter(request, response) {
    const eventId = getParameterFromRequest(request, "event");
    if (eventId === undefined) {
        reportMissingParameter(response, "string", "event");
    } else if (isValidEventId(eventId)) {
        return eventId;
    } else {
        utils.SendMessage(response, 200, false);
    }
}
exports.ValidateEventParameter = ValidateEventParameter;

function ValidateSesssionParameter(request, response) {
    const sessionToken = getParameterFromRequest(request, "Session");
    if (sessionToken === undefined) {
        reportMissingParameter(response, "string", "Session");
    } else if (session.IsTokenValid(sessionToken)) {
        return sessionToken;
    } else {
        utils.SendMessage(response, 200, "bad session token");
    }
}
exports.ValidateSessionParameter = ValidateSesssionParameter;

function isDateParameterPresent(request, parameter) {
    if (!isStringParameterPresent(request, parameter)) {
        return false;
    }

    const value = getParameterFromRequest(request, parameter);
    return value.match(/\d\d\d\d-\d\d-\d\d/);
}

function ValidateDateParameter(request, response, parameter) {
    if (isDateParameterPresent(request, parameter)) {
        return getParameterFromRequest(request, parameter);
    } else {
        reportMissingParameter(response, "date", parameter);
    }
}
exports.ValidateDateParameter = ValidateDateParameter;

function isImageParameterPresent(request, parameter) {
    if (request.files[parameter] === undefined) {
        return false;
    }

    const value = request.files[parameter];
    return value.mimetype.startsWith("image/");
}

function ValidateImageParameter(request, response, parameter) {
    if (isImageParameterPresent(request, parameter)) {
        return request.files[parameter];
    } else {
        reportMissingParameter(response, "image", parameter);
    }
}
exports.ValidateImageParameter = ValidateImageParameter;

function ValidateRequestParameters(request, response, parameters) {
    const result = {};

    const getValidatorFromType = type => {
        switch (type) {
            case "string":
                return ValidateStringParameter;
            case "date":
                return ValidateDateParameter;
            case "image":
                return ValidateImageParameter;
            case "session":
                return ValidateSesssionParameter;
            case "event":
                return ValidateEventParameter;
            case "bool":
                return ValidateBoolParameter;
        }
    };

    for (const parameterIdentifier in parameters) {
        const type = parameters[parameterIdentifier];
        const parameterValidator = getValidatorFromType(type);

        const value = parameterValidator(request, response, parameterIdentifier);

        if (value === undefined) { return; }
        result[parameterIdentifier] = value;
    }

    return result;
}
exports.ValidateRequestParameters = ValidateRequestParameters;
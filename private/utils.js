"use strict";

const isEmpty = str => str.trim().length === 0;

function invalidQueryParamterType(response, value, type) {
    response.status(400);
    response.type('json');

    response.json({
        Error: "Invalid query string parameter",
        Description: `Expected ${type} for parameter ${value}`
    });
}
exports.SendInvalidParamteterTypeResponse = invalidQueryParamterType;


function invalidStringParameter(request, param) {
    const value = (request.query[param] || request.body[param]);
    
    return (typeof (value) !== "string") || isEmpty(value);
}
exports.InvalidStringParameter = invalidStringParameter;

function sendMessage(response, code, message) {
    response.status(code);
    response.type("json");
    response.json({Message: message});
}
exports.SendMessage = sendMessage;

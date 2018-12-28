"use strict";

const isEmpty = str => str.trim().length === 0;

function invalidQueryParameter(response, query, type) {
    response.status(400);
    response.type('json');

    response.json({
        Error: "Invalid query string parameter",
        Description: `Expected ${type} for parameter ${query}`
    });
}
exports.SendInvalidParameterResponse = invalidQueryParameter;


function invalidStringParameter(request, param) {
    const query = request.query[param];

    return (typeof (query) !== "string") || isEmpty(query);
}
exports.InvalidStringParameter = invalidStringParameter;

function sendMessage(response, message) {
    response.type("json");
    response.send({Message: message});
}
exports.SendMessage = sendMessage;

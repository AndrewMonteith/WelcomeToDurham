"use strict";

const isEmpty = str => str.trim().length === 0;

function invalidQueryParamterType(response, parameter, type) {
    response.status(400);
    response.type('json');

    response.json({
        Error: "Invalid query string parameter",
        Description: `Expected ${type} for parameter ${parameter}`
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

function arrayContains(arr, val) {
    return arr.indexOf(val) > -1;
}
exports.Contains = arrayContains;

function deleteFromArray(arr,  val) {
    const index = arr.indexOf(val);
    if (index == -1) {
        return;
    }

    arr.splice(index, 1);
}
exports.Delete = deleteFromArray;

function isWhitespaceOrEmpty(str) {
    return str.trim() === "";
}
exports.IsWhitespaceOrEmpty = isWhitespaceOrEmpty;
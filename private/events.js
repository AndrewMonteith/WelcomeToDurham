const crypto = require("crypto");
const uniqid = require("uniqid");
const fs = require("fs");

const utils = require("./utils");
const users = require("./user-handler");
const pmdb = require("./pmdb/pmdb");

pmdb.Open("events");

function sha1Hash(input) {
    return crypto.createHash("sha1").update(input).digest("hex");
} 

function createNewEvent(name, description, date, logo) {
    const logoUrl = sha1Hash(logo.data);
    const eventId = uniqid("event-");

    const eventMetadata = {
        ID: eventId,
        Name: name,
        Description: description,
        Date: date,
        LogoURL: logoUrl,

        NumberGoing: 0
    };

    pmdb.Set("events", eventId, eventMetadata);
    logo.mv("./private/resources/" + logoUrl);

    pmdb.Write("events");

    return eventId;
}

function createNewEventRequest(request, response) {
    if (utils.InvalidStringParameter(request, "Session")) {
        utils.SendInvalidParamteterTypeResponse(response, "Session", "string");
        return;
    }
    
    if (!users.IsSessionTokenValid(request.body.Session)) {
        utils.SendMessage(response, 400, "bad session token");
        return;
    }

    if (utils.InvalidStringParameter(request, "Name")) {
        utils.SendInvalidParamteterTypeResponse(response, "Name", "string");
        return;
    }
    const name = request.body.Name;

    if (utils.InvalidStringParameter(request, "Description")) {
        utils.SendInvalidParamteterTypeResponse(response, "Description", "string");
        return;
    }
    const desc = request.body.Description;

    if (utils.InvalidStringParameter(request, "Date")) {
        utils.SendInvalidParamteterTypeResponse(response, "Date", "date");
        return;
    }
    const date = request.body.Date;
    
    if (!date.match(/\d\d\d\d-\d\d-\d\d/)) {
        utils.SendMessage(response, 400, "Bad date format");
        return;
    }

    if (request.files.Logo === undefined) {
        utils.SendMessage(response, 400, "need to send logo");
        return;
    }
    const logo = request.files.Logo;
    
    if (!logo.mimetype.startsWith("image/")) {
        utils.SendInvalidParamteterTypeResponse(response, "Logo", "image");
        return;
    }

    const eventId = createNewEvent(name, desc, date, logo);
    response.redirect(`/view-event?event=${eventId}`);
}

function isValidEventId(eventId) {
    return pmdb.Find("events", eventId) !== undefined;
}

function checkEventRequestIsValid(request, response) {
    if (utils.InvalidStringParameter(request, "event")) {
        utils.SendInvalidParamteterTypeResponse(response, "event", "string");
        return false;
    }

    const eventId = request.query.event;
    if (!isValidEventId(eventId)) {
        utils.SendMessage(response, 400, "bad event id");
        return false;
    }

    return eventId;
}

function numberRegisteredForEventRequest(request, response) {
    const eventId = checkEventRequestIsValid(request, response);
    if (!eventId) { 
        return;
     }

    const numberGoing = pmdb.Find("events", eventId).NumberGoing;

    utils.SendMessage(response, 200, numberGoing);
}

function replaceAll(str, replacements) {
    const re = new RegExp(Object.keys(replacements).join("|"), "g");

    return str.replace(re, match => replacements[match]);
}

function renderEventWebpage(stringWebapge, eventMetadata) {
    return replaceAll(stringWebapge, {
        "{Event Title}": eventMetadata.Name,
        "{Event Description}": eventMetadata.Description,
        "{Number Going}": eventMetadata.NumberGoing,   
        "{Event Image}": eventMetadata.LogoURL 
    });
}

function ServeEventDetails(request, response) {
    const eventId = checkEventRequestIsValid(request, response);
    if (!eventId) { return; }

    let rawTemplate = fs.readFileSync("./public/view-event.html").toString();
    const eventMetadata = pmdb.Find("events", eventId);
    
    response.send(
        renderEventWebpage(rawTemplate, eventMetadata));
}

exports.ListenOnRoutes = app => {
    app.post("/createevent", createNewEventRequest);
    app.get("/numberregistered", numberRegisteredForEventRequest);
};

exports.ServeEventDetails = ServeEventDetails;
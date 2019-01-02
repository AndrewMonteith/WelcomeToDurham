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

        NumberGoing: 0,
    };

    pmdb.Set("events", eventId, eventMetadata);
    logo.mv("./private/resources/" + logoUrl);

    pmdb.Write("events");

    return eventId;
}

function checkSessionIdIsValid(request, response) {
    if (utils.InvalidStringParameter(request, "Session")) {
        utils.SendInvalidParamteterTypeResponse(response, "Session", "string");
        return;
    }

    const session = request.query.Session || request.body.Session;

    if (!users.IsSessionTokenValid(session)) {
        utils.SendMessage(response, 400, "bad session id");
        return;
    }

    return session;
}

function createNewEventRequest(request, response) {
    const sessionId = checkSessionIdIsValid(request, response);
    if (!sessionId) {
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

    const eventId = (request.query.event || request.body.event);
    console.log("checking:" + eventId);
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

function getEventsOnRequest(request, response) {
    const responseDict = {};

    pmdb.Iterate("events", (eventId, eventData) => {
        responseDict[eventId] = {
            Name: eventData.Name,
            LogoURL: eventData.LogoURL
        };
    });

    response.status(200);
    response.json(responseDict);
}

function personGoingUpdate(request, response) {
    const eventId = checkEventRequestIsValid(request, response);
    if (!eventId) { return; }
    
    const sessionId = checkSessionIdIsValid(request, response);
    if (!sessionId) { return; }
    
    pmdb.Update("events", eventId, metadata => {
        if (request.body.going === "true") {
            metadata.NumberGoing += 1;
        } else {
            metadata.NumberGoing -= 1;
        }

        utils.SendMessage(response, 200, metadata.NumberGoing);

        return metadata;
    });
}

exports.ListenOnRoutes = app => {
    app.post("/createevent", createNewEventRequest);
    app.post("/eventregister", personGoingUpdate);
    app.get("/events", getEventsOnRequest);
    app.get("/numberregistered", numberRegisteredForEventRequest);
};

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
exports.ServeEventDetails = ServeEventDetails;
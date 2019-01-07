// Refractored Version.

const crypto = require("crypto");
const uniqid = require("uniqid");
const fs = require("fs");
const xss = require("xss");

const utils = require("./utils");
const session = require("./sessions");
const pmdb = require("./pmdb/pmdb");
const validators = require("./validators");

pmdb.Open("events");

const endpoints = {
    POST: {},
    GET: {}
};

function createNewEvent(owner, name, description, date, logo) {
    const sha1Hash = data => crypto.createHash("sha1").update(data).digest("hex");

    const logoUrl = sha1Hash(logo.data);
    const eventId = uniqid("event-");

    const eventMetadata = {
        ID: eventId,
        Name: name,
        Description: description,
        Date: date,
        LogoURL: logoUrl,
        StartedBy: owner,

        PeopleGoing: [],
        Comments: [],
    };

    pmdb.Set("events", eventId, eventMetadata);
    logo.mv("./private/resources/" + logoUrl);

    return eventId;
}

function createNewEventEndpoint(request, response) {
    const requestParameters = validators.ValidateRequestParameters(
        request, response,
        { Name: "string", Description: "string", Date: "date", Logo: "image", Session: "session" });
    if (requestParameters === undefined) { return; }

    const userStartingEvent = session.GetUsernameFromToken(requestParameters.Session);
    const eventId = createNewEvent(userStartingEvent, requestParameters.Name,
        requestParameters.Description, requestParameters.Date, requestParameters.Logo);

    response.redirect(`/view-event?event=${eventId}`)
}
endpoints.POST['/createevent'] = createNewEventEndpoint;


function personGoingUpdateEndpoint(request, response) {
    const requestParameters = validators.ValidateRequestParameters(
        request, response, { Session: "session", Event: "event", going: "bool" });
    if (requestParameters === undefined) { return; }

    const username = session.GetUsernameFromToken(requestParameters.Session);

    pmdb.Update("events", requestParameters.Event, metadata => {
        const isGoing = utils.Contains(metadata.PeopleGoing, username);

        if (requestParameters.going === isGoing) { return metadata; }

        if (requestParameters.going) {
            metadata.PeopleGoing.push(username);
        } else {
            utils.Delete(metadata.PeopleGoing, username);
        }

        utils.SendMessage(response, 200, metadata.PeopleGoing.length);

        return metadata;
    });
}
endpoints.POST['/eventregister'] = personGoingUpdateEndpoint;


function makeCommentEndpoint(request, response) {
    const requestParameters = validators.ValidateRequestParameters(
        request, response, { Session: 'session', event: 'event', comment: 'string' });
    if (requestParameters === undefined) { return; }

    const comment = {
        commenter: session.GetUsernameFromToken(requestParameters.Session),
        comment: xss(requestParameters.comment)
    };

    pmdb.Update("events", requestParameters.event, metadata => {
        metadata.Comments.push(comment);
        return metadata;
    });

    response.status(200);
    response.json(comment);
}
endpoints.POST['/makecomment'] = makeCommentEndpoint;


function replaceAll(str, replacements) {
    const re = new RegExp(Object.keys(replacements).join("|"), "g");

    return str.replace(re, match => replacements[match]);
}

function renderEventWebpage(stringWebapge, eventMetadata) {
    return replaceAll(stringWebapge, {
        "{Event Title}": eventMetadata.Name,
        "{Event Description}": eventMetadata.Description,
        "{Number Going}": eventMetadata.PeopleGoing.length,
        "{Event Image}": eventMetadata.LogoURL
    });
}

function viewEventEndpoint(request, response) {
    const eventId = validators.ValidateEventParameter(request, response);
    if (eventId === undefined) { return; }

    let rawTemplate = fs.readFileSync("./public/view-event.html").toString();
    const eventMetadata = pmdb.Find("events", eventId);

    response.send(
        renderEventWebpage(rawTemplate, eventMetadata));
}
endpoints.GET['/view-event'] = viewEventEndpoint;


function getListOfEventsEndpoint(request, response) {
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
endpoints.GET['/events'] = getListOfEventsEndpoint;


function getViewEventDetailsEndpoint(request, response) {
    const eventId = validators.ValidateEventParameter(request, response);
    if (eventId === undefined) { return; }

    const eventMetadata = pmdb.Find("events", eventId);

    const responseMessage = {
        PeopleGoing: eventMetadata.PeopleGoing,
        Comments: eventMetadata.Comments
    };

    const sessionId = validators.GetStringParameter(request, "Session");
    if (sessionId !== undefined) {
        responseMessage.IsGoing = utils.Contains(
            eventMetadata.PeopleGoing, session.GetUsernameFromToken(sessionId));
    }

    response.status(200);
    response.json(responseMessage);
}
endpoints.GET['/getvieweventstate'] = getViewEventDetailsEndpoint;


function getEventDescriptionEndpoint(request, response) {
    const eventId = validators.ValidateDateParameter(request, response);
    if (eventId === undefined) { return; }

    const eventDesc = pmdb.Find("events", eventId).Description;

    utils.SendMessage(response, 200, eventDesc);
}
endpoints.GET['/getdescription'] = getEventDescriptionEndpoint;


function summariseEventDetails(event) {
    return {
        Name: event.Name,
        Date: event.Date,
        LogoURL: event.LogoURL
    };
}

function findEventsRanBy(username) {
    const result = {};

    pmdb.Iterate("events", (eventId, eventData) => {
        if (eventData.StartedBy !== username) { return; }
        result[eventId] = summariseEventDetails(eventData);
    });

    return result;
}

function findEventsAttendedBy(username) {
    const result = {};

    pmdb.Iterate("events", (eventId, eventData) => {
        if (!utils.Contains(eventData.PeopleGoing, username)) { return; }
        result[eventId] = summariseEventDetails(eventData);
    });

    return result;
}

function getMyEventsEndpoint(request, response) {
    const sessionId = validators.ValidateSessionParameter(request, response);
    if (sessionId === undefined) { return; }

    const username = session.GetUsernameFromToken(sessionId);

    response.status(200);
    response.json({
        Running: findEventsRanBy(username),
        GoingTo: findEventsAttendedBy(username)
    });
}
endpoints.GET['/myevents'] = getMyEventsEndpoint;


function ListenOnRoutes(app) {
    Object.keys(endpoints.POST)
        .forEach(endpoint => app.post(endpoint, endpoints.POST[endpoint]));

    Object.keys(endpoints.GET)
        .forEach(endpoint => app.get(endpoint, endpoints.GET[endpoint]));
}
exports.ListenOnRoutes = ListenOnRoutes;
const crypto = require("crypto");
const utils = require("./utils");
const pmdb = require("./pmdb/pmdb");

pmdb.Open("events");

function sha1Hash(input) {
    return crypto.createHash("sha1").update(input).digest("hex");
} 

function createNewEvent(name, description, date, logo) {
    const logoUrl = sha1Hash(logo.data);

    const eventMetadata = {
        Name: name,
        Description: description,
        Date: date,
        LogoURL: logoUrl
    };

    pmdb.Set("events", name, eventMetadata);
    logo.mv("./private/resources/" + logoUrl);

    pmdb.Write("events");
}

function createNewEventRequest(request, response) {
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

    createNewEvent(name, desc, date, logo);
    utils.SendMessage(response, 200, "fine"); // TODO: Send Redirect Request.
}

exports.ListenOnRoutes = app => {
    app.post("/createevent", createNewEventRequest);
}
"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const userHandler = require("./private/user-handler");
const createEvent = require("./private/create-event");

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public/', {index: 'index.html'}));
app.use(fileUpload());

userHandler.ListenOnRoutes(app);
createEvent.ListenOnRoutes(app);

app.listen(8081);

"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const users = require("./private/users");
const events = require("./private/events");

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public/', {index: 'index.html'}));
app.use(express.static('./private/resources'));
app.use(fileUpload());
// app.get('/view-event', events.ServeEventDetails);

users.ListenOnRoutes(app);
events.ListenOnRoutes(app);

module.exports = app;
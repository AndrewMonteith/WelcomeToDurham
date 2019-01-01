"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const userHandler = require("./private/user-handler");
const events = require("./private/events");

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.get('/view-event', events.ServeEventDetails);

app.use(express.static('./public/', {index: 'index.html'}));
app.use(express.static('./private/resources'));
app.use(fileUpload());

userHandler.ListenOnRoutes(app);
events.ListenOnRoutes(app);

app.listen(8081);

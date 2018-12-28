"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const userHandler = require("./private/user-handler");

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public/', {index: 'index.html'}));

userHandler.ListenOnRoutes(app);

app.listen(8081);

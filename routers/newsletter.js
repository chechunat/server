const express = require("express");

const NewsletterControler = require("../controllers/newsletter");

const api = express.Router();

api.post("/suscribe-newsletter/:email", NewsletterControler.suscribeEmail);

module.exports = api;
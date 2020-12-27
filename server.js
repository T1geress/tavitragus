// server.js
// where your node app starts

// init project
const express = require('express')
const app = express()

const fs = require("fs");

// cleardb();

// Contact Form Configs

const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cors = require("cors");
app.use(cors());

const path = require("path");

app.set("views", path.join(__dirname, "blog"));
app.set("view engine", "ejs");

const matter = require("gray-matter");

function checkHttps(req, res, next) {
  // protocol check, if http, redirect to https

  if (req.get("X-Forwarded-Proto").indexOf("https") != -1) {
    return next();
  } else {
    res.redirect("https://" + req.hostname + req.url);
  }
}

app.all("*", checkHttps);

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
  // response.sendFile(__dirname + "/views/working.html");
});

app.get("/donate", function(request, response) {
  response.sendFile(__dirname + "/views/donate.html");
  // response.sendFile(__dirname + "/views/working.html");
});

app.get("/index", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
  // response.sendFile(__dirname + "/views/working.html");
});

app.get("/blog", (req, res) => {
  const posts = fs
    .readdirSync(__dirname + "/blog")
    .filter(file => file.endsWith(".md"));
  res.render("blog", {
    posts: posts
  });
});

app.get("/blog/:article", (req, res) => {
  const file = matter.read(__dirname + "/blog/" + req.params.article + ".md");
  console.log(file);

  console.log(req.params.article);
  var md = require("markdown-it")();
  let content = file.content;
  var result = md.render(content);

  res.render("index", {
    post: result,
    title: file.data.title,
    slug: req.params.article,
    description: file.data.description,
    image: file.data.image
  });
});

app.get("/contact", function(request, response) {
  response.sendFile(__dirname + "/views/contact.html");
});

app.get("/contact/success", function(request, response) {
  response.sendFile(__dirname + "/views/success.html");
});

app.get("/ping", function(request, response) {
  response.sendStatus(200);
});

// async..await is not allowed in global scope, must use a wrapper
app.post("/contact", function(req, res) {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID, // ClientID
    process.env.CLIENT_SECRET, // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });
  const accessToken = oauth2Client.getAccessToken();

  const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "tavitragus@gmail.com",
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken
    }
  });

  const mailContent = {
    from: "tavitragus@gmail.com",
    to: "tavitragus@gmail.com",
    subject: "Website Contact Me",
    generateTextFromHTML: true,
    html: `<b>Name</b>: ${req.body.name}<br>
<b>Email</b>: ${req.body.email}<br><br>
<b>Message</b>: ${req.body.message}`
  };

  smtpTransport.sendMail(mailContent, (err, response) => {
    //error ? console.log(error) : response.send("Your message has been sent!");
    if (err) {
      //response.send("Sorry, this form was not sent. Try again later?");
      console.error(err);
      var status = { status: "404" };
      response.send(status);
      console.log("Error!");
    } else {
      var status = { status: "200" };
      response.send(status);
      console.log("Sucess!");
    }
    smtpTransport.close();
  });

  res.redirect("/success");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

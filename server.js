const express=require("express");
const app=express();
const path=require("path");
const bodyParser = require("body-parser");
var nodemailer = require("nodemailer"); 

const PORT = process.env.PORT || 8080;

function onHttpStart(){
    console.log("Express HTTP server listening on: " + PORT);
}

app.use(express.static("./"));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/room-list", (req, res) => {
    res.sendFile(path.join(__dirname, "/room-list.html"));
});

app.get("/sign-up", (req, res) => {
    res.sendFile(path.join(__dirname, "/views/registration.html"));
});

let address = "johnlewis3310@gmail.com";
let name = "new";
app.post("/register-user", (req, res) => {
    address = req.body.email;
    name = req.body.firstName + ' ' + req.body.lastName;
    res.sendFile(path.join(__dirname, "/dashboard.html"));
    sendM();
});

function sendM(){
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pal121640@gmail.com',
      pass: 'cxroaedqimsfyagj'
    }
  });
  
  var mailOptions = {
    from: 'pal121640@gmail.com',
    to: address,
    subject: 'Welcome to AirBnb',
    text: 'Hello '+ name + ', Welcome to AirBnb.ca'
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent to: ' + address);
    }
  });
}

app.listen(PORT, onHttpStart);

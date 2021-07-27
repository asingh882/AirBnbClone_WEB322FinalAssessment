//Name:- Amritpal Singh
//Student ID:- 150143196
//email:- asingh882@myseneca.ca

const express=require("express");
const app=express();
const path=require("path");
const bodyParser = require("body-parser");
var nodemailer = require("nodemailer"); 
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const PORT = process.env.PORT || 8080;

//Database

mongoose.connect("mongodb+srv://webAssign:web311assignment@logininfo.bhe5t.mongodb.net/airbnb?retryWrites=true&w=majority");


var userInfo = new Schema({
  "email" : { "type" : String, "unique": true },
  "fname" : String,
  "lname" : String,
  "pass" : String,
  "dob" : Date
});

var user = mongoose.model("UserInfo", userInfo);

//Routes

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


app.post("/register-user", (req, res) => {
    let name = req.body.firstName + ' ' +  req.body.lastName;
    res.sendFile(path.join(__dirname, "/dashboard.html"));
    addData(req.body.firstName, req.body.lastName, req.body.email, req.body.password, req.body.dob);
    sendM(req.body.email, name);
});

//email function

function sendM(address, name){
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


//Database function

function addData(firstN, lastN, eAddress, password, dateOfBirth)
{
      var newUser = new user({
        email: eAddress,
        fname: firstN,
        lname: lastN,
        pass: password,
        dob: dateOfBirth
      });

    newUser.save((error) => {
      if(error) {
        console.log(`An unknown error occured! ${error}` );
      }
      else {
        console.log("A new user has been saved to the database!");
      }

    });
}

function checkEmail(address)
{

}






// start app here

app.listen(PORT, onHttpStart);

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
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const bcrypt = require("bcryptjs");

const SALT_WORK_FACTOR = 10;

const PORT = process.env.PORT || 8080;

app.engine(".hbs", exphbs({extname : ".hbs"}));
app.set("view engine", ".hbs");

app.use(express.static("static"));

app.use(clientSessions({
    cookieName: "session",
    secret: "usersessionairbnbasingh882",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use(express.urlencoded({ extended: false }));


//Database

mongoose.connect("mongodb+srv://webAssign:web311assignment@logininfo.bhe5t.mongodb.net/airbnb?retryWrites=true&w=majority");


var userInfo = new Schema({
  "email" : { "type" : String, "unique": true },
  "fname" : String,
  "lname" : String,
  "pass" : String,
  "dob" : Date
});

var adminInfo = new Schema({
    "username" : {"type": String, "unique": true},
    "email" : {"type": String, "unique": true},
    "fname" : String, 
    "lname": String,
    "phone": {"type": String, "unique": true},
    "pass": String,
    "dob": Date
});

var admin = mongoose.model("Admin", adminInfo);

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
  res.render("registration", {layout: false});
});

app.get("/sign-in", (req, res) => {
    res.render("login", {layout : false});
});

app.get("/admin-login", (req, res) => {
  res.render("adminLogin", { layout: false });
})


app.post("/login-admin", (req, res) => {
  const address = req.body.username;
  const password = req.body.password;
  admin.findOne({username: address}, (err, doc) => {
    if(err)
    {
      throw err;
    }
    if(!doc)
    {
      res.render("adminLogin", {errorMsg: "Invalid username!", layout: false});
    }
    else
    {
      admin.findOne( {username: address, pass: password}, (err, doc) => {
        if(err)
        {
          throw err;
        }
        if(!doc)
        {
          res.render("adminLogin", {errorMsg: "Invalid Password!", layout: false});
        }
        else
        {
            req.session.admin = {
              firstName: doc.fname,
              lastName: doc.lname
            }
            res.redirect("/admin-dashboard");
        }
      });
    }
  });
});


app.post("/login", (req, res) => {
    const address = req.body.email;
    const password = req.body.password;
    user.findOne({email: address}, (err, doc) => {
      if(err)
      {
        throw err;
      }
      if(!doc)
      {
        res.render("login", {errorMsg: "Email not registered!", layout: false});
      }
      else
      {
          if(doc.pass === password)
          {
              req.session.user = {
                email: address,
                firstName: doc.fname,
                lastName: doc.lname
              }
              res.redirect("/dashboard");
          }
      }
    });
});


function ensureLogin(req, res, next) {
  if(!req.session.user) {
      res.redirect("/sign-in");
  }
  else{
      next();
  }
}


app.get("/dashboard", ensureLogin, (req, res) => {
  res.render("dashboard", {user: req.session.user, layout: false});
});


function ensureAdmin(req, res, next) {
  if(!req.session.admin)
  {
    res.redirect("/admin-login");
  }
  else
  {
    next();
  }
}


app.get("/admin-dashboard", ensureAdmin, (req, res) => {
  res.render("adminDash", { user: req.session.admin, layout: false });
});

app.get("/logout", (req,res) => {
  req.session.reset();
  res.redirect("/");
});



app.get("/sign-up-admin", (req, res) => {
    res.render("adminSignup", { layout: false });
});


app.post("/register-user", (req, res) => {
    let name = req.body.firstName + ' ' +  req.body.lastName;
    user.findOne({email: req.body.email}, (err, doc) => {
      if(err)
      {
        throw err;
      }
      if(!doc)
      {
          addData(req.body.firstName, req.body.lastName, req.body.email, req.body.password, req.body.dob);
          sendM(req.body.email, name, false);
          res.redirect("/sign-in"); 
      }
      else
      {
          res.render("registration", { errorMsg: "Email already registered" , layout: false});
      }
    });
});
app.post("/register-admin", (req, res) => {
    let name = req.body.firstName + ' ' + req.body.lastName;
    admin.findOne({username: req.body.username}, (err, doc) => {
      if(err)
      {
        throw err;
      }
      if(!doc)
      {
        admin.findOne({email: req.body.email}, (err, doc) => {
          if(err)
          {
            throw err;
          }
          if(!doc)
          {
            admin.findOne({ phone: req.body.number }, (err, doc) => {
              if(err)
              {
                throw err;
              }
              if(!doc)
              {
                  res.redirect("/admin-login");
                  addAdmin(req.body.username, req.body.firstName, req.body.lastName, req.body.email, req.body.number, req.body.passord, req.body.dob);
                  sendM(req.body.email, name, true);
                
              }
              else
              {
                  res.render("adminSignup", {errorMsg: "Try another Phone number!", layout: false});
              }
            });
          }
          else{
            res.render("adminSignup", {errorMsg: "Try Another email!", layout: false});
          }
        });
      }
      else{
        res.render("adminSignup", {errorMsg: "Try Another username!", layout: false});
      }
    });
});

//email function

function sendM(address, name, isAdmin){
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pal121640@gmail.com',
      pass: 'cxroaedqimsfyagj'

    }
  });
  if(isAdmin)
  {
    var mailOptions = {
      from: 'pal121640@gmail.com',
      to: address,
      subject: 'Welcome to AirBnb',
      text: 'Hello '+ name + ', Thanks for registering as an admin.'
    };
  }
  else{
    var mailOptions = {
      from: 'pal121640@gmail.com',
      to: address,
      subject: 'Welcome to AirBnb',
      text: 'Hello '+ name + ', Welcome to AirBnb.ca'
    };
  }
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) 
    {
      console.log(error);
    } 
    else 
    {
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


function addAdmin( user, firstN, lastN, eAddress, mobile, password, dateOfBirth)
{
      var newAdmin = new admin({
        username: user,
        phone: mobile,
        email: eAddress,
        fname: firstN,
        lname: lastN,
        pass: password,
        dob: dateOfBirth
      });

    newAdmin.save((error) => {
      if(error) {
        console.log(`An unknown error occured! ${error}` );
      }
      else {
        console.log("A new user has been saved to the database!");
      }
    });
}

// crypt password

function hash(password) {
  return bcrypt.hash(password, 10);
 }


// start app here

app.listen(PORT, onHttpStart);

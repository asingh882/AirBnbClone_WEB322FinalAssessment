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
const fileUpload = require('express-fileupload');
const { resolveSoa } = require("dns");
const { domainToASCII } = require("url");
const { json } = require("body-parser");


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

app.use(express.static("./"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(fileUpload());



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

var roomInfo = new Schema({
    "username": String,
    "title": String,
    "description": String,
    "price": String,
    "location": String,
    "sImage": String, 
    "booked": Boolean
});


var admin = mongoose.model("Admin", adminInfo);

var user = mongoose.model("UserInfo", userInfo);

var room = mongoose.model("Room", roomInfo);

var editID;
//Routes

function onHttpStart(){
    console.log("Express HTTP server listening on: " + PORT);
}


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/room-list", (req, res) => {
    
  room.find({}, (err, docs) => {
    if(err)
    {
      console.log(`An unknown error occured!`);
    }
    else
    {
      docs = docs.map(value => value.toObject());
      res.render("room-list", { rooms: docs, user: req.session.user, layout: false });
    }
  });
});



app.get("/admin-room-list", (req, res) => {
    var userN = req.session.admin.username;
    room.find({ username: userN }, (err, docs) => {
        if(err)
        {
          console.log(`An error occured!`);
        }
        else{
              docs = docs.map(value => value.toObject()); 
              res.render("admin-rooms", {rooms: docs, user: req.session.admin, layout: false});
        }
    });
});

app.get("/sign-up", (req, res) => {
  res.render("registration", {layout: false});
});

app.get("/sign-in", (req, res) => {
    res.render("login", {layout : false});
});

app.get("/admin-login", (req, res) => {
  res.render("adminLogin", { layout: false });
});

app.get("/create-room", ensureAdmin, (req, res) => {
    res.render("createRoom", { layout: false });
});

app.get("/manage-room", ensureAdmin, (req, res) => {
  room.find({ username: req.session.admin.username }, (err, docs) => {
    if(err)
    {
      console.log(`An error occured!`);
    }
    else{
          docs = docs.map(value => value.toObject()); 
          res.render("manageRoom", {rooms: docs, user: req.session.admin, layout: false});
    }
  });
    
});

app.get("/edit-room/:id", ensureAdmin, (req, res) => {
  room.find({_id: req.params.id}, (err, doc) => {
    if(err)
      console.log(`An unknown error occured! ${err}`);
    else
    { 

        var rdocs = {
          id: doc[0]._id,
          title: doc[0].title,
          description: doc[0].description,
          price: doc[0].price,
          location: doc[0].location,
          sImage: doc[0].sImage
        };
        
        res.render("editRoom", {room: rdocs, user: req.session.admin, layout: false});
    }
  })
   
});

app.get("/delete-room/:id", ensureAdmin, (req, res) => {
    room.deleteOne( {_id: req.params.id}, (err, doc) => {
      if(err)
        console.log(`An unknown error occured!`);
      else
        res.redirect("/admin-dashboard");
    })
});

app.post("/edit/:id", ensureAdmin, (req, res) => {
  room.updateOne({_id: req.params.id}, {$set: {title: req.body.Title, description: req.body.Description, price: req.body.Price}}, (err, response) => {
        if(err)
          console.log(`An unknown error occurred! ${err}`);
        else
          res.redirect("/admin-dashboard");
    })
});

app.get("/book-room/:id", ensureLogin, (req, res) => {
  room.find({ _id: req.params.id }, (err, doc) => {
      if(err)
        console.log(`An error occurred! ${err}`);
      else
      {
        var rdocs = {
          id: doc[0]._id,
          title: doc[0].title,
          description: doc[0].description,
          price: doc[0].price,
          location: doc[0].location,
          sImage: doc[0].sImage,
          booked: doc[0].booked
        };
        
        res.render("bookRoom", {room: rdocs, user: req.session.user, layout: false});
      }
  })  
});

app.post("/booking/:id", ensureLogin, (req, res) => {
  room.find({ _id: req.params.id }, (err, doc) => {
    if(err)
      console.log(`An error occurred! ${err}`);
    else
    {
      var rdocs = {
        id: doc[0]._id,
        title: doc[0].title,
        description: doc[0].description,
        price: doc[0].price,
        location: doc[0].location,
        sImage: doc[0].sImage,
        booked: doc[0].booked
      };
      const date1 = new Date(req.body.start);
      const date2 = new Date(req.body.end);
      const diffTime = Math.abs(date2 - date1);
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      var totalPrice = parseInt(rdocs.price) * totalDays;
      
      res.render("bookRoom", { price: totalPrice, days: totalDays, room: rdocs, layout: false });
    } 
  })
});

app.get("/booked/:id", ensureLogin, (req, res) => {
  room.updateOne({ _id: req.params.id }, { $set: {booked: true}}, (err, response) => {
    if(err)
      console.log(`An error occurred! ${err}`);
    else
    {
        res.redirect("/dashboard");
    }
  });
});

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
              username: doc.username,
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
          else{
            res.render("login", {errorMsg: "Invalid Password!", layout: false});
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
                  addAdmin(req.body.username, req.body.firstName, req.body.lastName, req.body.email, req.body.number, req.body.password, req.body.dob);
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

app.post("/room-enter", (req, res, next) => {


  const desc = "New Room";
  var bufferImage = new Buffer.from(req.files.image.data).toString('base64'); 

  var obj = {
    userN: req.session.admin.username,
    rTitle: req.body.title,
    rDescription: desc,
    rLocation: req.body.location,
    rPrice: req.body.price,
    image: bufferImage
  };  

  addRoom(obj.userN, obj.rTitle, obj.rDescription, obj.rLocation, obj.rPrice, obj.image);
  res.render("adminDash", { msg: "Room has been added to the list! To add description Go to Manage Lists", user: req.session.admin , layout: false} );
});

app.post("/create-room", (req, res) => {

    


    var bufferImage = new Buffer.from(req.files.image.data).toString('base64'); 


    var obj = {
      userN: req.session.admin.username,
      rTitle: req.body.Title,
      rDescription: req.body.Description,
      rLocation: req.body.Location,
      rPrice: req.body.Price,
      image: bufferImage
    };
    
  
    addRoom(obj.userN, obj.rTitle, obj.rDescription, obj.rLocation, obj.rPrice, obj.image);
    res.render("adminDash", { msg: "Room has been added to the list! To add description Go to Manage Lists", user: req.session.admin , layout: false} );
 
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


function addAdmin( user, firstN, lastN, eAddress, mobile, password, dateOfBirth )
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
        console.log("New admin has been saved to the database!");
      }
    });
}

function addRoom(userN, rTitle, rDescription, rLocation, rPrice, imagestr)
{
    var newRoom = new room({
      username: userN,
      title: rTitle,
      description: rDescription,
      location: rLocation,
      price: rPrice,
      sImage: imagestr,
      booked: false
    });

    newRoom.save((error) => {
        if(error)
          console.log(`An unknown error occured! ${error}`);
        else{
            console.log(`New room has been added to the database!`);
        }
    });
}

function parseDate(str) {
  var mdy = str.split('/');
  return new Date(mdy[2], mdy[0]-1, mdy[1]);
}

function datediff(first, second) {
  return Math.round((second-first)/(1000*60*60*24));
}



// start app here

app.listen(PORT, onHttpStart);

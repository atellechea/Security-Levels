require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Remember us, remember that we once lived.",
    resave: false, 
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//We use this to avoid a deprecation warning 
mongoose.set("useCreateIndex", true);

//To use plugins into our models we need to have a mongoose schema not just a regular JS object
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res){
    if (req.isAuthenticated) {
        res.render("secrets");    
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.post("/register", function (req, res) {
    //We pass 3 arguments, username, password and a callback function
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            //If we get any errors we log them and redirect the user back the register page so he/she can try to register again  
            console.log(err);
            res.redirect("/register");
        } else {
            //This callback function is only triggered if the authentication process was successfull
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", function (req, res) {
    //The result of findOne query in this case is foundUser and it is a
    // JS object (User type in this case) so we can tap into it's properties.

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    
    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
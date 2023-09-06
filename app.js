//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { log } = require("console");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require("passport-facebook").Strategy;


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Rahasia",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://fajrdevil:test123@cluster0.8ckmckr.mongodb.net/userDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secret', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  });

app.route("/login")
    .get(function(req, res){
        res.render("login")
    })
    .post(function(req, res){
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, function(err){
            if (err){
                console.log(err);
            }else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secret");
                })
            }
        })
    })

app.route("/register")
    .get(function(req, res){
        res.render("register")
    })
    .post(function(req, res){
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err)
                res.redirect("/register");
            }else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secret");
                })
            }
        })
    })

app.get("/secret", function(req, res){
    User.find({secret: {$ne: null}}).then(function(foundUser){
        res.render("secrets", {userWithSecret: foundUser})
    })
    .catch(err=>{
        console.log(err);
    })
})

app.get("/submit", function(req, res){
    console.log(req.isAuthenticated())
    if (req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login")
    }
})

app.post("/submit", function(req, res){
    const Submittedsecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id)
        .then(function(foundUser){
            foundUser.secret = Submittedsecret;
            foundUser.save();
            res.redirect("/secret")
        })
        .catch(function(err){
            console.log(err)
        })
})

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

app.listen(3000, function(){
    console.log("Server is running on port 3000")
})
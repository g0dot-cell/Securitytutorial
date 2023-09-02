//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { log } = require("console");
const encrypt = require("mongoose-encryption");

const app = express();

mongoose.connect('mongodb+srv://fajrdevil:test123@cluster0.8ckmckr.mongodb.net/userDB');

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("U ser", userSchema);

app.get("/", function(req, res){
    res.render("home")
})

app.route("/login")
    .get(function(req, res){
        res.render("login")
    })
    .post(function(req, res){
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username})
        .then(foundUser => {
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }else{
                    console.log("wrong password")
                }
            }else{
                console.log("Email not found");
            }
        })
        .catch(err => {
            console.log(err);
        })
    })

app.route("/register")
    .get(function(req, res){
        res.render("register")
    })
    .post(function(req, res){
        const user = new User({
            email: req.body.username,
            password: req.body.password
        })
        user.save()
        .then(() => {
            res.render("secrets");
        })
        .catch(err => {
            console.log(err)
        })
    })

app.listen(3000, function(){
    console.log("Server is running on port 3000")
})
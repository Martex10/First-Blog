const mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");

//Bloger schema
const BloggerSchema = new mongoose.Schema({
    username: String,
    password: String
});

BloggerSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Blogger", BloggerSchema);
const passportLocalMongoose = require("passport-local-mongoose"),
expressSanitizer            = require("express-sanitizer"),
Blogger                     = require("./models/blogger"),
methodOverride              = require("method-override"),
LocalStrategy               = require("passport-local"),
bodyParser                  = require("body-parser"),
mongoose                    = require("mongoose"),
passport                    = require("passport"),
express                     = require("express"),
app                         = express();

//configuration
app.use(bodyParser.urlencoded({extended: true}));
// app.use(expressSanitizer());
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(methodOverride("_method"));
app.use(require("express-session")({
    secret: " secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Blogger.authenticate()));
passport.serializeUser(Blogger.serializeUser());
passport.deserializeUser(Blogger.deserializeUser());

//passing current user to every ejs template
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

//MONGOOSE/MODEL CONFIG
//connecting mongoose to mongoDB
mongoose.connect("mongodb://localhost/restfull_blog_app");
//how we want out data to look in mongoDB
//Blog schema 
const blogSchema = new mongoose.Schema({
   title: String,
   image: String,
   body: String,
   created: {
       type: Date,
       default: Date.now
   }
});

// setting the Schema to a model
const Blog = mongoose.model("Blog", blogSchema);


//RESTful routes
//root route 
app.get("/", function(req, res){
    res.redirect("/blogs");
});
//blogs page index route
app.get("/blogs", function(req, res){
    //get all blogs and then render the ejs file for the list of blogs
    
    Blog.find({}, null).sort('-created').exec(function(err, blogs){
        if(err){
            console.log(err);
        } else {
            res.render("index", {blogs: blogs});
        }
    });
});

//new route
app.get("/blogs/new", isLoggedIn, function(req, res){
    //shows form user can fill out
    res.render("new");
});

//create route
app.post("/blogs", isLoggedIn, function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);
    //create new blog post
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("new");
        } else {
            //redirect
            res.redirect("/blogs");
        }
    });
});

//show route
app.get("/blogs/:id", function(req,res){
    //find single blog post that was requested
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           console.log(err);
           res.redirect("/blogs");
       } else {
           //send to show page with selected data
           res.render("show", {blog: foundBlog});
       }
   });
});

//edit route
app.get("/blogs/:id/edit", isLoggedIn, function(req, res){
    //find blog with id given
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        } else {
            //send to edit page with blog info
            res.render("edit", {blog: foundBlog});
        }
    });
});

//update route
app.put("/blogs/:id", isLoggedIn, function(req,res){
    // //sanitize
    // req.body.blog.body = req.sanitize(req.body.blog.body);
    //find and update based on new id and user edit 
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updateBlog){
       if(err){
           res.redirect("/blogs");
       } else {
           //show update page
           res.redirect("/blogs/" + req.params.id);
       }
    });
});

//delete route
app.delete("/blogs/:id", isLoggedIn, function(req, res){
    //destroy blog
    Blog.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs");
        }
    });
});

//======================
//Authentication
//======================

// //register route
// app.get("/register", function(req, res){
//   res.render("register"); 
// });

//post route to sign up new blogger
app.post("/register", function(req, res){
   req.body.username;
   req.body.password;
   Blogger.register(new Blogger({username: req.body.username}),req.body.password, function(err, user){
       if(err){
           console.log(err);
           res.redirect("register");
           return;
       } else {
           passport.authenticate("local")(req, res, function(){
               res.redirect("/");
           });
       }
   });
});

//loggin route loggin page
app.get("/login", function(req, res){
    res.render("login");
});

//verify credentials and log user in 
app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}), function(req, res){
});

//log out route
app.get("/logout", isLoggedIn, function(req, res){
    req.logout();
    res.redirect("/");
});

//middle ware 
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } 
    res.redirect("/login");
}

//lets us know that the server has started
app.listen(process.env.PORT, process.env.IP, function(){
   console.log("BLOG SERVER STARTED");
});
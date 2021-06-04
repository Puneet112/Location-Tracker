// Require all of the modules u need
var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  flash = require("connect-flash"),
  logger = require("morgan"),
  cors = require("cors"),
  http = require("http");

// Importing Models and Routes
var User = require("./models/user");
var indexRoutes = require("./routes/index");

// Socket IO Configuration
var server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

// Socket IO
var users = {};
io.on("connection", (socket) => {
  console.log("New User Connected: " + socket.id);

  socket.on("disconnect", () => {
    console.log("User Disconnected: " + socket.id);
    for (var username in users) {
      // console.log("User: " + username);
      var arr = users[username];
      for (var i = 0; i < arr.length; i++) {
        // console.log(
        //   "user_disconnected:- user: " + socket.id + " check: " + arr[i]
        // );
        // console.log(arr[i]);
        if (socket.id == arr[i]) {
          arr.splice(i, 1);
          i--;
        } else {
          // console.log(
          //   "user_disconnected:- sender: " + socket.id + " receiver: " + arr[i]
          // );
          io.to(arr[i]).emit("user_disconnected", { id: socket.id });
        }
      }
    }
  });

  socket.on("user_connected", (username) => {
    console.log(username);
    if (username in users) {
      // console.log("User already exists");
      users[username].push(socket.id);
      // console.log(arr);
    } else {
      // console.log("New User");
      users[username] = [socket.id];
      // users = { [username]: [socket.id] };
    }
    io.to(socket.id).emit("get_id", { id: socket.id });
    console.log(users);
  });

  socket.on("location_data", (data) => {
    console.log(
      "Location Data Received for User: " +
        data.username +
        " which says " +
        data.info
    );
    data.id = socket.id;
    var username = data.username;
    var arr = users[username];
    var len = arr.length;
    for (var i = 0; i < len - 1; i++) {
      console.log("Sender: " + arr[len - 1] + " Receiver: " + arr[i]);
      io.to(arr[i]).emit("location_received", data);
    }
    for (var i = 0; i < len - 1; i++) {
      console.log("Sender: " + arr[i] + " Receiver: " + arr[len - 1]);
      io.to(arr[i]).emit("send_location", {
        id: arr[len - 1],
        username: data.username,
      });
    }
  });

  socket.on("send_location_newuser", (data) => {
    // console.log("Sender: " + data.username + " Receiver: " + data.receiver);
    data.id = socket.id;
    io.to(data.receiver).emit("location_received", data);
  });

  socket.on("emergency", (data) => {
    var id = socket.id;
    data.id = id;
    var username = data.username;
    var arr = users[username];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] != id) {
        io.to(arr[i]).emit("sos", data);
      }
    }
  });

  socket.on("sound", (id) => {
    // console.log(id);
    io.to(id).emit("play_sound", id);
  });

  // socket.on("stop", (id) => {
  //   console.log("Stop ID: ");
  //   io.to(id).emit("stop_sound", id);
  // });
});

var ejsLint = require("ejs-lint");
var _ = require("lodash");
var path = require("path");

mongoose.Promise = global.Promise;

var databaseUri = "mongodb://localhost/LocationTracker";

mongoose
  .connect(databaseUri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log(`Database connected`))
  .catch((err) => console.log(`Database connection error: ${err.message}`));

//Sets views folder for views
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));

// CORS
app.use(
  cors({
    origin: "http://localhost:5486",
    credentials: true,
  })
);
// app.use(logger("dev"));
app.use(flash());

// Express Session
app.use(
  require("express-session")({
    secret: "This is the Secret Key ahgdahd12121",
    resave: false,
    saveUninitialized: false,
  })
);

//Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//This middleware will make currentUser, flash success and error available to all templates
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

//Routes
app.use("/", indexRoutes);
app.use("*", indexRoutes);

//Server started here
server.listen(5486, function (request, response) {
  console.log("Server Running on PORT 5486");
});

//"C:\Program Files\MongoDB\Server\4.2\bin\mongo.exe"

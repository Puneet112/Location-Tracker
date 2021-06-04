var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var middleware = require("../middleware");
var { isLoggedIn } = middleware;

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

//Root Route - Landing Page
router.get("/", function (req, res) {
  res.render("landing");
});

// Register
router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", (req, res) => {
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
  });
  if (
    newUser.username === "" ||
    newUser.firstName === "" ||
    newUser.lastName === "" ||
    newUser.email === "" ||
    req.body.password === ""
  ) {
    return res.render("register", { error: "Please enter all the details" });
  }
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.render("register", { error: err.message });
    }
    passport.authenticate("local")(req, res, function () {
      console.log("authenticated");
      req.flash(
        "success",
        "Successfully Signed Up! Nice to meet you " +
          req.body.firstName +
          " " +
          req.body.lastName
      );
      res.redirect("/locate");
    });
  });
});

// Login
router.get("/login", (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/locate",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome to Location Tracking Service!",
  }),
  function (req, res) {}
);

// Logout
router.get("/logout", function (req, res) {
  req.logout();
  req.flash("success", "See you later!");
  res.redirect("/");
});

// Locate
router.get("/locate", isLoggedIn, function (req, res) {
  res.render("locate");
});

// Notifications
router.get("/view_location", isLoggedIn, function (req, res) {
  var lat = req.query.lat;
  var lng = req.query.lng;
  res.render("location", { lat: lat, lng: lng });
});

module.exports = router;

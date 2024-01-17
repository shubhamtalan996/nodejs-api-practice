const express = require("express");
const authController = require("../controller/auth");
const { body } = require("express-validator");
const User = require("../models/user");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email", "Please enter a valid email.")
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exists");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().notEmpty(),
  ],
  authController.signUp
);

router.post(
  "/login",
  body("email", "Please enter a valid email.")
    .trim()
    .isEmail()
    .normalizeEmail(),
  body("password").trim().isLength({ min: 5 }),
  authController.login
);

router.get("/status", isAuth, authController.getUserStatus);

router.put(
  "/status",
  isAuth,
  [body("status").trim().not().isEmpty()],
  authController.setUserStatus
);

module.exports = router;

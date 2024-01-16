const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    throw err;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        name,
        password: hashedPassword,
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Signup successfull",
        userId: result._id,
      });
    })
    .catch((err) => {
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      return next(err);
    });
};

exports.login = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    throw err;
  }
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const err = new Error("User not found!");
        err.statusCode = 404;
        throw err;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const err = new Error("Wrong password!");
        err.statusCode = 401;
        throw err;
      }
      const token = jwt.sign(
        {
          email: email,
          userId: loadedUser._id,
        },
        "secretstringsaknc",
        { expiresIn: "1h" }
      );

      res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      return next(err);
    });
};

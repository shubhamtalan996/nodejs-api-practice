const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controller/feed");

const router = express.Router();

router.get("/posts", feedController.getPosts);

router.post(
  "/post",
  [
    body("title", "Please enter a valid Title!").trim().isLength({ min: 7 }),
    body("content", "Please enter a valid description.")
      .trim()
      .isLength({ min: 8, max: 400 }),
  ],
  feedController.createPost
);

module.exports = router;

const express = require("express");
const { body } = require("express-validator");
const isAuth = require("../middleware/is-auth");

const feedController = require("../controller/feed");

const router = express.Router();

router.get("/posts", isAuth, feedController.getPosts);

router.get("/post/:postId", isAuth, feedController.getPost);

router.post(
  "/post",
  isAuth,
  [
    body("title", "Please enter a valid Title!").trim().isLength({ min: 5 }),
    body("content", "Please enter a valid description.")
      .trim()
      .isLength({ min: 8, max: 400 }),
  ],
  feedController.createPost
);

router.put(
  "/post/:postId",
  isAuth,
  [
    body("title", "Please enter a valid Title!").trim().isLength({ min: 5 }),
    body("content", "Please enter a valid description.")
      .trim()
      .isLength({ min: 8, max: 400 }),
  ],
  feedController.editPost
);

router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;

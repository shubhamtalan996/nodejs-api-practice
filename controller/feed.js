const { validationResult } = require("express-validator");
const Post = require("../models/post");
const fileHelper = require("../utils/file");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({
        posts: posts,
      });
    })
    .catch((err) => {
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      return next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((record) => {
      if (!record) {
        const err = new Error("Post not found!");
        err.statusCode = 404;
        throw err;
      }
      res.status(200).json({
        post: record,
      });
    })
    .catch((err) => {
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      return next(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    throw err;
  }

  if (!req.file) {
    const err = new Error("No image provided!");
    err.statusCode = 422;
    throw err;
  }
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: {
      name: "shubham",
    },
  });

  post
    .save()
    .then((result) => {
      console.log("Post Created!");
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((err) => {
      console.log("Error occurred while creating the post!", err);
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.editPost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    throw err;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const err = new Error("No image picked!");
    err.statusCode = 422;
    throw err;
  }
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const err = new Error("Post not found!");
        err.statusCode = 404;
        throw err;
      }
      if (imageUrl !== post.imageUrl) {
        fileHelper.deletefile(post.imageUrl);
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Post updated successfully!",
        post: result,
      });
    })
    .catch((err) => {
      console.log("Error occurred while updating post!", err);
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

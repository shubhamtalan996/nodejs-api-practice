const { validationResult } = require("express-validator");
const Post = require("../models/post");
const fileHelper = require("../utils/file");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;

  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((paginatedRecords) => {
      res.status(200).json({
        message: "Fetched posts successfully",
        posts: paginatedRecords,
        totalItems,
      });
    })
    .catch((err) => {
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      next(err);
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
      next(err);
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
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: req.userId,
  });

  post
    .save()
    .then((result) => {
      console.log("Post Created!");
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post created successfully!",
        post,
        creator: { _id: creator._id, name: creator.name },
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

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const err = new Error("Post not found!");
        err.statusCode = 404;
        throw err;
      }
      return Post.deleteOne({ _id: postId });
    })
    .then((result) => {
      console.log({ result });
      res.status(200).json({ message: "Success!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Deleting post failed!" });
    });
};

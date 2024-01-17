const { validationResult } = require("express-validator");
const Post = require("../models/post");
const fileHelper = require("../utils/file");
const User = require("../models/user");
const io = require("../socket");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const paginatedRecords = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully",
      posts: paginatedRecords,
      totalItems,
    });
  } catch (err) {
    if (!err?.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const posts = await Post.findById(postId);
    if (!posts) {
      const err = new Error("Post not found!");
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({
      post: posts,
    });
  } catch (err) {
    if (!err?.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
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

  try {
    const post = new Post({
      title,
      content,
      imageUrl,
      creator: req.userId,
    });

    const postSaveResponse = await post.save();
    if (postSaveResponse) {
      console.log("Post Created!");
    }
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit("posts", {
      action: "create",
      post: {
        ...post._doc,
        creator: {
          _id: req.userId,
          name: user.name,
        },
      },
    });
    res.status(201).json({
      message: "Post created successfully!",
      post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    console.log("Error occurred while creating the post!", err);
    if (!err?.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
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
    .populate("creator")
    .then((post) => {
      if (!post) {
        const err = new Error("Post not found!");
        err.statusCode = 404;
        throw err;
      }
      console.log({
        creatorid: post.creator._id.toString(),
        userId: req.userId.toString(),
      });
      if (post.creator._id.toString() !== req.userId.toString()) {
        const err = new Error("Not authorized!");
        err.statusCode = 403;
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
      io.getIO().emit("posts", {
        action: "update",
        post: result,
      });
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
      if (post.creator.toString() !== req.userId) {
        const err = new Error("Not authorized!");
        err.statusCode = 403;
        throw err;
      }
      return Post.deleteOne({ _id: postId });
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(() => {
      io.getIO().emit("posts", {
        action: "delete",
        post: postId,
      });
      res.status(200).json({ message: "Success!" });
    })
    .catch((err) => {
      if (!err?.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

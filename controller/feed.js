const { validationResult } = require("express-validator");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "First Post",
        description: "This is my first post",
        imageUrl: "images/duck.jpeg",
        creator: {
          name: "Shubham",
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    throw err;
  }
  const post = new Post({
    title,
    content,
    imageUrl: "image.path",
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

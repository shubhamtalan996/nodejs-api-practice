const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const utils = require("../utils/file");

module.exports = {
  createUser: async function ({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput?.email)) {
      errors.push({ message: "Email is invalid." });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password not strong enough!" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email: userInput?.email });
    if (existingUser) {
      const error = new Error("User exists already!");
      throw error;
    }
    const hashedPassword = await bcrypt.hash(userInput.password, 12);

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  loginUser: async function ({ email, password }, req) {
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: "Email is invalid." });
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: "Password not strong enough!" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      const err = new Error("User not found!");
      err.statusCode = 401;
      throw err;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const err = new Error("Wrong password!");
      err.statusCode = 401;
      throw err;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "secretstringsaknc",
      { expiresIn: "1h" }
    );

    return {
      token,
      userId: user._id.toString(),
    };
  },

  getPosts: async function ({ currentPage }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const pageNo = Number(currentPage) || 1;
    const perPage = 2;
    try {
      const totalItems = await Post.find().countDocuments();
      const paginatedRecords = await Post.find()
        .populate("creator")
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * perPage)
        .limit(perPage);

      console.log({ totalItems, paginatedRecords });

      return {
        posts: paginatedRecords.map((rec) => ({
          ...rec._doc,
          _id: rec._id.toString(),
          createdAt: rec.createdAt.toISOString(),
          updatedAt: rec.updatedAt.toISOString(),
        })),
        totalItems,
      };
    } catch (err) {
      err.statusCode = 500;
      throw err;
    }
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 4 })) {
      errors.push({ message: "Title validation failed!" });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: "content validation failed!" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error("User not found!");
        error.code = 404;
        throw error;
      }
      const post = new Post({
        title,
        content,
        imageUrl: imageUrl,
        creator: user,
      });
      const postSaveResponse = await post.save();
      if (postSaveResponse) {
        console.log("Post Created!");
      }

      user.posts.push(post);
      await user.save();

      return {
        ...postSaveResponse._doc,
        _id: postSaveResponse._id.toString(),
        createdAt: postSaveResponse.createdAt.toISOString(),
        updatedAt: postSaveResponse.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(id)) {
      errors.push({ message: "Id missing!" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    try {
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("Post not found!");
        error.code = 404;
        throw error;
      }
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;

    try {
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("Post not found!");
        error.code = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("User not authorized to edit post!");
        error.code = 403;
        throw error;
      }
      const errors = [];
      if (validator.isEmpty(title) || !validator.isLength(title, { min: 4 })) {
        errors.push({ message: "Title validation failed!" });
      }
      if (
        validator.isEmpty(content) ||
        !validator.isLength(content, { min: 5 })
      ) {
        errors.push({ message: "content validation failed!" });
      }
      if (errors.length > 0) {
        const error = new Error("Invalid input");
        error.data = errors;
        error.code = 422;
        throw error;
      }

      post.title = title;
      post.content = content;
      if (imageUrl !== "undefined" && imageUrl !== post.imageUrl) {
        utils.clearImage(post.imageUrl);
        post.imageUrl = imageUrl;
      }
      const updatedPost = await post.save();
      return {
        ...updatedPost._doc,
        _id: updatedPost._id.toString(),
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    try {
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("Post not found!");
        error.code = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("User not authorized to edit post!");
        error.code = 403;
        throw error;
      }
      utils.clearImage(post.imageUrl);
      await Post.deleteOne({ _id: id });

      const user = await User.findById(req.userId);
      user.posts.pull(id);
      await user.save();

      return true;
    } catch (error) {
      return false;
      throw error;
    }
  },
};

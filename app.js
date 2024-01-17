require("dotenv").config();
const path = require("path");
const express = require("express");
const feedRoutes = require("./routes/feed");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const authRoutes = require("./routes/auth");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((error, req, res, next) => {
  console.log(error);
  const status = error?.statusCode || 500;
  const message = error.message;
  res.status(status).json({
    message,
  });
});

mongoose
  .connect(process.env.MONGO_CONNECTION_URL)
  .then(() => {
    const server = app.listen(8080);
    console.log("appp>>>>>>>>>>>>>>>");
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connect");
    });
  })
  .catch((err) => {
    console.log("Error conencting with database>>", err);
  });

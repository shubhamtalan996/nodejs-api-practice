require("dotenv").config();
const path = require("path");
const express = require("express");
const feedRoutes = require("./routes/feed");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(bodyParser.json());

app.use("/feed", feedRoutes);

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
    app.listen(8080);
  })
  .catch((err) => {
    console.log("Error conencting with database>>", err);
  });

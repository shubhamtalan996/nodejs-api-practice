const fs = require("fs");
const path = require("path");

exports.deletefile = (fileName) => {
  const filePath = path.join(__dirname, "..", fileName);
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err) {
        throw err;
      }
    });
  }
};

exports.clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

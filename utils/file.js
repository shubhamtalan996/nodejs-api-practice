const fs = require("fs");
const path = require("path");

exports.deletefile = (fileName) => {
  console.log({ fileName });
  const filePath = path.join(__dirname, "..", fileName);
  console.log({ filePath });
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err) {
        throw err;
      }
    });
  }
};

exports.clearImage = (filePath) => {
  filePath = path.join(_dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

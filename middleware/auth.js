const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  console.log({ authHeader });
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(" ")[1];
  console.log({ token });
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secretstringsaknc");
    console.log({ decodedToken });
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.isAuth = true;
  req.userId = decodedToken.userId;
  next();
};

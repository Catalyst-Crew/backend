const { sign, verify } = require("jsonwebtoken");

const tokenKey = process.env.TOKEN_SECRET || "test"

const newToken = (userData = {}) => sign({
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8),
  data: userData
}, tokenKey);

const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"];
  verify(token, tokenKey, (err, verifiedToken) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized to perform that action" });
    }
    req.userData = verifiedToken
    next();
  });
};

//generate 6 digit random number
const getRandomCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

module.exports = { newToken, verifyToken, getRandomCode };
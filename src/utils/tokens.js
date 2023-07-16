const { sign, verify } = require("jsonwebtoken");

const tokenKey = process.env.TOKEN_SECRET || "test"

const newToken = (userID = "") => sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
    data: userID
}, tokenKey);

const verifyToken = (req, res, next) => {
    const token = req.headers["x-access-token"];
    verify(token, tokenKey, (err, verifiedToken) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized to perform that action" });
      }
      next();
    });
  };
  

module.exports = { newToken, verifyToken };
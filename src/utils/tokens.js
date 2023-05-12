const { sign, verify } = require("jsonwebtoken");

const tokenKey = process.env.TOKEN_SECRET || "test"

const newToken = (userID = "") => sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
    data: userID
}, tokenKey);

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    verify(token, tokenKey, (err) => {
        if (err) return res.status(401);
        next();
    })
}

module.exports = { newToken, verifyToken };
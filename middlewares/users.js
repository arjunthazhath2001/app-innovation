// middlewares/users.js
const jwt = require('jsonwebtoken')

function userMiddleware(req, res, next) {
    const token = req.headers.token
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_USER)
        if (decodedToken) {
            req.userId = decodedToken.id;
            next()
        } else {
            res.status(403).json({"message": "Please login"})
        }
    } catch (error) {
        res.status(401).json({"message": "Authentication failed"})
    }
}

module.exports = {
    userMiddleware
}


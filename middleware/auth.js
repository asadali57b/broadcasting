const jwt = require('jsonwebtoken');
const jwt_sect = 'secret';

async function auth(req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send("Access denied. No token provided.");
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    try {
        const decoded = jwt.verify(token, jwt_sect);
        req.user = decoded;
        next();
    } catch (ex) {
        if (ex.name === 'TokenExpiredError') {
            return res.status(400).send("Token expired");
        } else if (ex.name === 'JsonWebTokenError') {
            return res.status(400).send("Invalid token");
        } else {
            return res.status(400).send("Token verification failed");
        }
    }
}

module.exports = auth;

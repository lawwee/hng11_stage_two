const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    };

    const [, auth_key] = authorization.split(" ");

    if (!auth_key) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    };

    try {
        const user_details = jwt.verify(auth_key, process.env.JWT_SECRET);

        if (!user_details) {
            const error = new Error('Not Authenticated');
            error.statusCode = 401;
            throw error;
        };

        const { iss } = user_details;

        if (iss !== process.env.JWT_ISSUER) {
            return res.status(403).json("Token is invalid");
        };

        req.user = user_details.userId;
        return next();

    } catch (e) {
        console.error("Error authenticating user: ", e);
        throw e
    };
};
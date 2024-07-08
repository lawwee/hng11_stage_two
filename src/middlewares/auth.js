const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return next({
            status_code: 403,
            error: "Unauthorized",
        });
    }

    const [, auth_key] = authorization.split(" ");

    if (!auth_key) {
        return next({
            status_code: 403,
            error: "Unauthorized",
        });
    };

    try {
        const user_details = jwt.verify(auth_key, process.env.JWT_SECRET);

        if (!user_details) {
            return next({
                status_code: 403,
                error: "Not Authenticated",
            });
        };

        const { iss } = user_details;

        if (iss !== process.env.JWT_ISSUER) {
            return next({
                status_code: 403,
                error: "Token is invalid",
            });
        };

        req.user = user_details.userId;
        return next();

    } catch (e) {
        console.error("Error authenticating user: ", e);
        throw e
    };
};
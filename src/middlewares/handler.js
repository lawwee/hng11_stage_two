module.exports = {
    handle404(request, response, next) {
        const return_data = {
            status_code: 404,
            success: false,
            error: "Resource not found",
            payload: null,
        };
        next(return_data);
    },

    handleError(error, request, response, next) {
        console.log({ error });
        return response.status(error?.status_code || 500).json({
            errors: error?.errors || error?.error,
        });
    },

    processResponse(request, response, next) {
        if (!request.payload) return next();

        const { statusCode } = request.payload;
        return response.status(statusCode).json(request.payload);
    },

    setupRequest(request, response, next) {
        request.headers["access-control-allow-origin"] = "*";
        request.headers["access-control-allow-headers"] = "*";

        if (request.method === "OPTIONS") {
            request.headers["access-control-allow-methods"] = "GET, POST, PUT, PATCH, DELETE";
            response.status(200).json();
        }

        next();
    },
};

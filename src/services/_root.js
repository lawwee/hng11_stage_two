class RootService {
    constructor() {}

    handle_validation_errors(error, next) {
        if (error) {
            const errorMessages = error.details.map(({ message, path }) => ({
                field: path[0],
                message
            }));

            return next({
                status_code: 422,
                errors: errorMessages
            });
        };
    }

    process_failed_response(status, message, statusCode) {
        return {
            status,
            message,
            statusCode
        };
    }

    process_successful_response(payload, code) {
        console.log(payload, code);
        return {
            payload,
            statusCode: code
        };
    }

    // process_failed_response(message, code = 400) {
    //     return {
    //         error: message,
    //         payload: null,
    //         status_code: code,
    //         success: false,
    //     };
    // }

    // process_successful_response(payload, code = 200) {
    //     return {
    //         payload,
    //         error: null,
    //         status_code: code,
    //         success: true,
    //     };
    // }
}

module.exports = RootService;

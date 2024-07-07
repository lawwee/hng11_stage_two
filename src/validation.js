const Joi = require("joi");

const RequiredEmail = {
    email: Joi.string().email().required().messages({
        "string.email": "Invalid email format",
        "any.required": "Email is required",
    }),
};

const RequiredPassword = {
    password: Joi.string()
        .required()
        .pattern(
            /^(?=.*[!@#$%^&*()\-_=+{};:,<.>])(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and have a total length of 8 characters or more"
        ),
};

const RegisterSchema = Joi.object({
    ...RequiredEmail,
    ...RequiredPassword,
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string()
});

const LoginSchema = Joi.object({
    ...RequiredEmail,
    ...RequiredPassword
});

const OrganisationSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string()
});

module.exports = {
    RegisterSchema,
    LoginSchema,
    OrganisationSchema
}
const RootService = require("./_root");

const supabase = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { RegisterSchema, LoginSchema, OrganisationSchema } = require("../validation");

class UserService extends RootService {
    constructor () {
        super();
    };
    
    async register_user(request, next) {
        try {
            const { body } = request;
            
            const { error } = RegisterSchema.validate(body, {
                abortEarly: false
            });
    
            if (error) this.handle_validation_errors(error, next);
    
            const { email, password, firstName } = body;
    
            const email_case = email.toLowerCase().trim();
    
            const check_email = await supabase.from('users').select().eq('email', email_case);
    
            if (check_email.data.length) return this.process_failed_response("Bad Request", "Email already exists", 409);
    
            const salt = await bcrypt.genSalt(10);
            const new_password = await bcrypt.hash(password, salt);
    
            body.password = new_password;
            body.email = email_case;
    
            const cleaned_email = email_case.replace(/[^a-zA-Z0-9]/g, '');
            const userId = `UID_${cleaned_email}`;
    
            const new_user = await supabase.from('users').insert({
                userId,
                ...body
            });
    
            if (new_user.error) return this.process_failed_response("Server error", "Error creating user", 500);
    
            const auth_token = jwt.sign({ userId, email_case }, process.env.JWT_SECRET, {
                expiresIn: "30d",
                issuer: process.env.JWT_ISSUER
            });
    
            const timestamp = new Date().getTime();
            const orgId = `ORG_${timestamp}`;
    
            const new_org_details = {
                name: `${firstName}'s Organisation`,
                orgId,
                description: `A description of ${firstName}'s Organisation`
            };
    
            const new_organisation = await supabase.from('organisations').insert({
                ...new_org_details
            });
    
            if (new_organisation.error) return this.process_failed_response("Server error", "Error creating user's organisation", 500);
    
            const member_entry = await supabase.from('members').insert({
                user_id: userId,
                org_id: orgId
            });
    
            if (member_entry.error) return this.process_failed_response("Bad request", "Registration unsuccessful", 400);
    
            const data = {
                accessToken: auth_token,
                user: {
                    userId,
                    ...body
                }
            };
    
            return this.process_successful_response({
                status: "success",
                message: "Registration successful",
                data
            }, 201);
    
        } catch (e) {
            console.error("Error creating user: ", e);
            next(e);
        };
    };

    async login_user(request, next) {
        try {
            const { body } = request;
            const { error } = LoginSchema.validate(body, {
                abortEarly: false
            });
    
            if (error) this.handle_validation_errors(error, next);
    
            const { email, password } = body;
    
            const email_case = email.toLowerCase().trim();

            const check_email = await supabase.from('users').select().eq('email', email_case);
    
            if (!check_email.data.length) return this.process_failed_response("Bad Request", "Email does not exist", 409);
    
            const user = check_email.data[0];
            const { userId } = user;
    
            const if_password_is_correct = await bcrypt.compare(password, user.password);
    
            if (!if_password_is_correct) return this.process_failed_response("Unauthorized", "Incorrect password", 401);
    
            const auth_token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
                expiresIn: "30d",
                issuer: process.env.JWT_ISSUER
            });

            const data = {
                accessToken: auth_token,
                user
            };
    
            return this.process_successful_response({
                status: "success",
                message: "Login successful",
                data
            }, 200);
    
        } catch (e) {
            console.error("Error logging in user: ", e);
            next(e);
        };
    };

    async get_user_details(request, next) {
        try {
            const userId = request.user;
            const { id } = request.params;

            if (!id) return this.process_failed_response("Client error", "Id cannot be empty", 409);
    
            const check_user = await supabase.from('users').select().eq('userId', userId);
    
            const check_user_id = await supabase.from('users').select().eq('userId', id);
    
            if (!check_user.data.length || !check_user_id.data.length) return this.process_failed_response("Bad Request", "User(s) does not exist", 409);
    
            if (userId === id) 
                return this.process_successful_response({
                    status: "success",
                    message: "User Details fetched successfully",
                    data: check_user.data[0]
                }, 200);
    
            const user_orgs = await supabase.from('members').select().eq('user_id', userId);
    
            const user_id_orgs = await supabase.from('members').select().eq('user_id', id);
    
            if (!user_orgs.data.length || !user_id_orgs.data.length) return this.process_failed_response("Internal Server error", "Error reading members table", 500);
    
            const org1 = user_orgs.data.map(obj => obj.org_id);
            const org2 = user_id_orgs.data.map(obj => obj.org_id);
    
            const common_orgIds = org1.filter(orgId => org2.includes(orgId));
    
            if (!common_orgIds.length) return this.process_failed_response("Unauthorized", "You and user are not in same organisation", 401);
    
            return this.process_successful_response({
                status: "success",
                message: "User Details fetched successfully",
                data: check_user_id.data[0]
            }, 200);

        } catch (e) {
            console.error("Error fetching user details: ", e);
            next(e);
        };
    };

};

module.exports = new UserService();
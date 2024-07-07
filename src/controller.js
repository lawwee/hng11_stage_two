const supabase = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { RegisterSchema, LoginSchema, OrganisationSchema } = require("./validation");

exports.register_user = async (req, res) => {
    try {
        const { body } = req;
        
        const { error } = RegisterSchema.validate(body, {
            abortEarly: false
        });

        if (error) {
            const errorMessages = error.details.map(({ message, path }) => ({
                field: path[0],
                message
            }));

            return res.status(422).json({
                errors: errorMessages
            });
        };

        const { email, password, firstName } = body;

        const check_email = await supabase.from('users').select().eq('email', email);

        if (check_email.data.length) res.status(409).json("Email already exists");

        const salt = await bcrypt.genSalt(10);
        const new_password = await bcrypt.hash(password, salt);

        body.password = new_password;
        body.email = email.toLowerCase().trim();

        const cleaned_email = email.replace(/[^a-zA-Z0-9]/g, '');
        const userId = `UID_${cleaned_email}`;

        const new_user = await supabase.from('users').insert({
            userId,
            ...body
        });

        if (new_user.error) return res.status(500).json("Error creating user");

        const auth_token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
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

        if (new_organisation.error) return res.status(500).json("Error creating organisation");

        const member_entry = await supabase.from('members').insert({
            user_id: userId,
            org_id: orgId
        });

        if (member_entry.error) return res.status(500).json("Error adding user to organisation");

        return res.status(201).json({
            status: "success",
            message: "Registration successful",
            data: {
                accessToken: auth_token,
                user: {
                    userId,
                    ...body
                }
            }
        });  

    } catch (e) {
        console.error("Error registering new user: ", e);
        return res.status(400).json({ 
            status: "Bad request",
            message: "Registration unsuccessful",
            statusCode: 400
        });
    };
};

exports.login_user = async (req, res) => {
    try {
        const { body } = req;
        const { error } = LoginSchema.validate(body, {
            abortEarly: false
        });

        if (error) {
            const errorMessages = error.details.map(({ message, path }) => ({
                field: path[0],
                message
            }));

            return res.status(422).json({
                errors: errorMessages
            });
        };

        const { email, password } = body;

        const check_email = await supabase.from('users').select().eq('email', email);

        if (!check_email.data.length) return res.status(409).json("Email does not exist");

        const user = check_email.data[0];
        const { userId } = user;

        const if_password_is_correct = await bcrypt.compare(password, user.password);

        if (!if_password_is_correct) return res.status(401).json("Incorrect Password");

        const auth_token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
            expiresIn: "30d",
            issuer: process.env.JWT_ISSUER
        });

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                accessToken: auth_token,
                user
            }
        });

    } catch (e) {
        console.error("Error logging user in: ", e);
        return res.status(401).json({ 
            status: "Bad request",
            message: "Authentication failed",
            statusCode: 401
        });
    }
};

exports.get_user_details = async (req, res) => {
    try {
        const userId = req.user;
        const { id } = req.params;

        const check_user = await supabase.from('users').select().eq('userId', userId);

        const check_user_id = await supabase.from('users').select().eq('userId', id);

        if (!check_user.data.length || !check_user_id.data.length) return res.status(409).json("User(s) does not exist");

        if (userId === id) 
            return res.status(200).json({
                status: "success",
                message: "User Details fetched successfully",
                data: check_user.data[0]
            });

        const user_orgs = await supabase.from('members').select().eq('user_id', userId);

        const user_id_orgs = await supabase.from('members').select().eq('user_id', id);

        if (!user_orgs.data.length || !user_id_orgs.data.length) return res.status(403).json("Error reading members table");

        const org1 = user_orgs.data.map(obj => obj.org_id);
        const org2 = user_id_orgs.data.map(obj => obj.org_id);

        const common_orgIds = org1.filter(orgId => org2.includes(orgId));

        if (!common_orgIds.length) return res.status(401).json("You and user are not in any same organization");

        return res.status(200).json({
            status: "success",
            message: "User Details fetched successfully",
            data: check_user_id.data[0]
        });

    } catch (e) {
        console.error("Error fetching user details: ", e);
        return res.status(404).json({ 
            status: "Not Found",
            message: "User not found",
            statusCode: 404
        });
    };
};

exports.all_organisations = async (req, res) => {
    try {   
        const userId = req.user;

        const check_user = await supabase.from('users').select().eq('userId', userId);

        if (!check_user.data.length) return res.status(409).json("User does not exist");

        const user_orgs = await supabase.from('members').select().eq('user_id', userId);

        if (!user_orgs.data.length) return res.status(403).json("Error reading members table");

        const organisations = user_orgs.data.map(obj => obj.org_id);

        const all_organisations = [];

        for (let org of organisations) {
            const organisation = await supabase.from('organisations').select().eq('orgId', org);
            const org_details = organisation.data[0];

            all_organisations.push(org_details);
        };

        return res.status(200).json({
            status: "success",
            message: "All Organisations fetched successfully",
            data: {
                organisations: all_organisations
            }
        });

    } catch (e) {
        console.error("Error fetching all user's organisaions: ", e);
        return res.status(404).json({ 
            status: "Not Found",
            message: "Organisation(s) not found",
            statusCode: 404
        });
    };
};

exports.get_single_org = async (req, res) => {
    try {
        const userId = req.user;
        const { orgId } = req.params;

        const check_user = await supabase.from('users').select().eq('userId', userId);

        const check_org = await supabase.from('organisations').select().eq('orgId', orgId);

        if (!check_user.data.length) return res.status(409).json("User does not exist");

        if (!check_org.data.length) return res.status(409).json("Organisation does not exist");

        const org_details = check_org.data[0];

        const org_members = await supabase.from('members').select('user_id').eq('org_id', orgId);
        
        const members = org_members.data;

        const is_user_in_org = members.some(obj => obj.user_id === userId);

        if (!is_user_in_org) return res.status(401).json("You are not a part of this organisation");

        return res.status(200).json({
            status: "success",
            message: "Organisation details fetched successfully",
            data: org_details
        });

    } catch (e) {
        console.error("Error fetching organisation details: ", e);
        return res.status(404).json({ 
            status: "Not Found",
            message: "Organisation not found",
            statusCode: 404
        });
    }
};

exports.create_organisation = async (req, res) => {
    try {
        const userId = req.user;
        const { body } = req;
        
        const { error } = OrganisationSchema.validate(body, {
            abortEarly: false
        });

        if (error) {
            const errorMessages = error.details.map(({ message, path }) => ({
                field: path[0],
                message
            }));

            return res.status(422).json({
                errors: errorMessages
            });
        };

        const check_user_exits = await supabase.from('users').select().eq('userId', userId);

        if (!check_user_exits) return res.status(409).json("User does not exist");

        const timestamp = new Date().getTime();
        const orgId = `ORG_${timestamp}`;

        const new_organisation = await supabase.from('organisations').insert({
            orgId,
            ...body
        });

        if (new_organisation.error) return res.status(500).json("Error creating organisation");

        const member_entry = await supabase.from('members').insert({
            user_id: userId,
            org_id: orgId
        });

        if (member_entry.error) return res.status(500).json("Error adding user to organisation");

        return res.status(201).json({
            status: "success",
            message: "Organisation created successfully",
            data: {
                orgId,
                ...body
            }
        });

    } catch (e) {
        console.error("Error creating organisation: ", e);
        return res.status(400).json({ 
            status: "Bad request",
            message: "Client error",
            statusCode: 400
        });
    };
};

exports.add_user = async (req, res) => {
    try {
        const userId = req.user;
        const { orgId } = req.params;
        const user_to_add = req.body.userId;

        const check_user = await supabase.from('users').select().eq('userId', userId);

        const check_org = await supabase.from('organisations').select().eq('orgId', orgId);

        if (!check_user.data.length) return res.status(409).json("User does not exist");

        if (!check_org.data.length) return res.status(409).json("Organisation does not exist");

        const check_user_to_add = await supabase.from('users').select().eq('userId', user_to_add);

        if (!check_user_to_add.data.length) return res.status(409).json("User to add does not exist");

        const org_members = await supabase.from('members').select('user_id').eq('org_id', orgId);
        
        const members = org_members.data;

        const is_user_in_org = members.some(obj => obj.user_id === userId);

        if (!is_user_in_org) return res.status(401).json("You are not a part of this organisation");

        const member_entry = await supabase.from('members').insert({
            user_id: user_to_add,
            org_id: orgId
        });

        if (member_entry.error) return res.status(500).json("Error adding user to organisation");

        return res.status(200).json({
            status: "success",
            message: "User added to organisation successfully"
        });

    } catch (e) {
        console.error("Error adding user to organisation: ", e);
        return res.status(400).json({ 
            status: "Bad request",
            message: "Adding user was not successful",
            statusCode: 400
        });
    };
};
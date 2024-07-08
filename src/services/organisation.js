const RootService = require("./_root");

const supabase = require("../config/db");
require("dotenv").config();

const { OrganisationSchema } = require("../validation");

class OrganisationService extends RootService {
    constructor () {
        super();
    };

    async all_organisations(request, next) {
        try {   
            const userId = request.user;
    
            const check_user = await supabase.from('users').select().eq('userId', userId);
    
            if (!check_user.data.length) return this.process_failed_response("Bad Request", "User does not exist", 409);
    
            const user_orgs = await supabase.from('members').select().eq('user_id', userId);
    
            if (!user_orgs.data.length) return this.process_failed_response("Server error", "Error reading members table", 500);
    
            const organisations = user_orgs.data.map(obj => obj.org_id);
    
            const all_organisations = [];
    
            for (let org of organisations) {
                const organisation = await supabase.from('organisations').select().eq('orgId', org);
                const org_details = organisation.data[0];
    
                all_organisations.push(org_details);
            };
    
            return this.process_successful_response({
                status: "success",
                message: "All Organisations fetched successfully",
                data: {
                    organisations: all_organisations
                }
            }, 200);

        } catch (e) {
            console.error("Error fetching all user's organisations: ", e);
            next(e);
        };
    };

    async get_single_org(request, next) {
        try {
            const userId = request.user;
            const { orgId } = request.params;

            if (!orgId) return this.process_failed_response("Client error", "orgId cannot be empty", 409);
    
            const check_user = await supabase.from('users').select().eq('userId', userId);
    
            const check_org = await supabase.from('organisations').select().eq('orgId', orgId);
    
            if (!check_user.data.length) return this.process_failed_response("Bad Request", "User does not exist", 409);
    
            if (!check_org.data.length) return this.process_failed_response("Bad Request", "Organisation does not exist", 409);
    
            const org_details = check_org.data[0];
    
            const org_members = await supabase.from('members').select('user_id').eq('org_id', orgId);
            
            const members = org_members.data;
    
            const is_user_in_org = members.some(obj => obj.user_id === userId);
    
            if (!is_user_in_org) return this.process_failed_response("Unauthorized Request", "You are not a member of this organisation", 401);
    
            return this.process_successful_response({
                status: "success",
                message: "Organisation details fetched successfully",
                data: org_details
            }, 200);

        } catch (e) {
            console.error("Error fetching single organisation details: ", e);
            next(e);
        };
    };

    async create_organisation(request, next) {
        try {
            const userId = request.user;
            const { body } = request;
            
            const { error } = OrganisationSchema.validate(body, {
                abortEarly: false
            });
    
            if (error) return this.handle_validation_errors(error, next);
    
            const check_user_exists = await supabase.from('users').select().eq('userId', userId);
    
            if (!check_user_exists) return this.process_failed_response("Bad Request", "User does not exist", 409);
    
            const timestamp = new Date().getTime();
            const orgId = `ORG_${timestamp}`;
    
            const new_organisation = await supabase.from('organisations').insert({
                orgId,
                ...body
            });
            console.log(new_organisation)
    
            if (new_organisation.error) return this.process_failed_response("Server error", "Error creating organisation", 500);
    
            const member_entry = await supabase.from('members').insert({
                user_id: userId,
                org_id: orgId
            });
    
            if (member_entry.error) return this.process_failed_response("Server error", "Error adding user to organisation", 500);

            const data = {
                orgId,
                ...body
            }
    
            return this.process_successful_response({
                status: "success",
                message: "Registration successful",
                data
            }, 201);
    
        } catch (e) {
            console.error("Error creating organisation: ", e);
            next(e);
        };
    };
    
    async add_user(request, next) {
        try {
            const userId = request.user;
            const { orgId } = request.params;
            const user_to_add = request.body.userId;
    
            const check_user = await supabase.from('users').select().eq('userId', userId);

            if (!check_user.data.length) return this.process_failed_response("Bad Request", "User does not exist", 409);
    
            const check_org = await supabase.from('organisations').select().eq('orgId', orgId);
    
            if (!check_org.data.length) return this.process_failed_response("Bad Request", "Organisation does not exist", 409);
    
            const check_user_to_add = await supabase.from('users').select().eq('userId', user_to_add);
    
            if (!check_user_to_add.data.length) return this.process_failed_response("Bad Request", "User to add does not exist", 409);
    
            const org_members = await supabase.from('members').select('user_id').eq('org_id', orgId);
            
            const members = org_members.data;
    
            const is_user_in_org = members.some(obj => obj.user_id === userId);
    
            if (!is_user_in_org) return this.process_failed_response("Unauthorized Request", "You are not a member of this organisation", 401);
    
            const member_entry = await supabase.from('members').insert({
                user_id: user_to_add,
                org_id: orgId
            });
    
            if (member_entry.error) return this.process_failed_response("Server error", "Error adding into members table", 500);
    
            return this.process_successful_response({
                status: "success",
                message: "User added to organisation successfully"
            }, 200);
    
        } catch (e) {
            console.error("Error adding user to organisation: ", e);
            next(e);
        };
    };
};

module.exports = new OrganisationService();
const express = require("express");
const router = express.Router();

const user_service = require("../services/user");
const org_service = require("../services/organisation");

const authenticate = require("../middlewares/auth");

router
    .post("/auth/register", async (request, _, next) => {
        request.payload = await user_service.register_user(request, next);
        next();
    })

    .post("/auth/login", async (request, _, next) => {
        request.payload = await user_service.login_user(request, next);
        next();
    })

    .get("/api/users/:id", authenticate, async (request, _, next) => {
        request.payload = await user_service.get_user_details(request, next);
        next();
    })

    .get("/api/organisations", authenticate, async (request, _, next) => {
        request.payload = await org_service.all_organisations(request, next);
        next();
    })

    .get("/api/organisations/:orgId", authenticate, async (request, _, next) => {
        request.payload = await org_service.get_single_org(request, next);
        next();
    })

    .post("/api/organisations", authenticate, async (request, _, next) => {
        request.payload = await org_service.create_organisation(request, next);
        next();
    })

    .post("/organisations/:orgId/users", authenticate, async (request, _, next) => {
        request.payload = await org_service.add_user(request, next);
        next();
    })


module.exports = router
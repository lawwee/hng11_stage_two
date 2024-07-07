const express = require("express");
const controller = require("./controller");
const auth = require("./middleware");

const router = express.Router();

router
    .post("/auth/register", controller.register_user)

    .post("/auth/login", controller.login_user)
    
    .get("/api/users/:id", auth, controller.get_user_details)

    .get("/api/organisations", auth, controller.all_organisations)

    .get("/api/organisations/:orgId", auth, controller.get_single_org)

    .post("/api/organisations", auth, controller.create_organisation)

    .post("/organisations/:orgId/users", auth, controller.add_user)
    
module.exports = router;
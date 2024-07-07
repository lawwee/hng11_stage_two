const express = require("express");
const controller = require("./controller");
const auth = require("./middleware");

const router = express.Router();

router
    .post("/auth/register", controller.register_user)

    .post("/auth/login", controller.login_user)
    
    .get("/users/:id", auth, controller.get_user_details)

    .get("/organisations", auth, controller.all_organisations)

    .get("/organisations/:orgId", auth, controller.get_single_org)

    .post("/organisations", auth, controller.create_organisation)

    .post("/organisations/:orgId/users", auth, controller.add_user)
    
module.exports = router;
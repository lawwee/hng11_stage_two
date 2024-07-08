const express = require("express");
const app = express();
const cors = require("cors");

const routes = require("./src/routes/routes");
const HTTP = require("./src/middlewares/handler");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.send("Hello World!"));

app.use(HTTP.setupRequest);
app.use("/", routes);
app.use(HTTP.processResponse);
app.use(HTTP.handle404);
app.use(HTTP.handleError);

const PORT = 3000;

app.listen(PORT, () => {
    console.log("Server started on: ", PORT)
})
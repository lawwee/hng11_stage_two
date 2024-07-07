const express = require("express");

const routes = require("./src/route");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => res.send("Hello World!"));

app.use("/", routes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log("Server started on: ", PORT)
})
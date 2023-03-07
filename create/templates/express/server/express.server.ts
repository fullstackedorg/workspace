import express from "express"
import expressRegister from "./express.register";

const app = express();

app.get("/hello-express", (req, res) => {
    res.send("Hello from express");
});

expressRegister(app);

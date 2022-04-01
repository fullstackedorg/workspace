import Server, {publicDir} from "fullstacked/server";
import express from "express";
import axios from "axios";

const server = new Server();

server.express.use("/docs*", express.static(publicDir));

server.express.get("/subscribe", async (req, res) => {
    const response = await axios
        .post("https://" + process.env.MAILING_URL + "/api/subscribers",{
            email: req.query.email,
            name: req.query.name,
            lists: [parseInt(process.env.MAILING_LIST_ID)]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' +
                    Buffer.from(process.env.MAILING_USER + ":" + process.env.MAILING_PASS).toString('base64')
            }
        });

    res.json({success: response.data.data});
    
});

server.start();

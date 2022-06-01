import axios from "axios";
import {json, Router} from "express";

export class MailingRoutes {
    static mailingAppURL = "http://mailing_app:9989"
    static mailingUser = process.env.MAILING_USER ?? "listmonk";
    static mailingPass = process.env.MAILING_PASS ?? "listmonk";

    static register(){
        const router = Router();

        router.post("/subscribe", json(), async (req, res) => {
            const response = await axios.post(MailingRoutes.mailingAppURL + "/api/subscribers",{
                email: req.body.email,
                name:"-",
                lists: [2, 3]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' +
                        Buffer.from( MailingRoutes.mailingUser + ":" + MailingRoutes.mailingPass).toString('base64')
                }
            });

            res.json({success: response.data.data});
        });

        router.get("/subscribers/:listID", async (req, res) => {
            const response = await axios.get(MailingRoutes.mailingAppURL + "/api/lists/" + req.params.listID, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' +
                        Buffer.from(MailingRoutes.mailingUser + ":" + MailingRoutes.mailingPass).toString('base64')
                }
            });
            res.json(response.data.data.subscriber_count);
        });

        return router;
    }
}

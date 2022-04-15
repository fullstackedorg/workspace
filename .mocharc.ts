import path from "path";

module.exports = {
    require: [path.resolve(__dirname, "./scripts/register")],
    timeout: 5000,
    "enable-source-maps": true
}

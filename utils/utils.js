let crypto = require("crypto")
let {SALT} = require("../server/env.js")

module.exports = {
    hashString: (word) => {
        return crypto.createHash("sha256").update(word + SALT).digest("hex")
    },

    generateSSID: () => module.exports.hashString(crypto.randomBytes(16).toString("hex"))
}
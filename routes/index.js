let express = require("express")
let router = express.Router()
let {hashString, generateSSID} = require("../utils/utils.js")
let {SESSION_LIFETIME_SECONDS} = require("../utils/config.js")

function getRouter(pg_client, redis_client) {
    /* Fix me: enabling this causes the other routes to stop working lol

    router.use((req, res) => {
        console.log(`Received request ${req.originalUrl} at ${new Date()}`)
    })*/

    // ==== APIs ====

    function validateInput(data, elementString){ // Checks that every elem in elementString, separated by spaces, is truthy in data.
        if(!data)
            throw "bad input - data is undefined"
        for(elem of elementString.split(" "))
            if(data[elem] === undefined)
                throw "bad input"
    }

    async function validateAuth(auth){ // Validates that an auth is ok. That means that the given SSID exists and has been issued no longer than 5 minutes ago
        if((await redis_client.getAsync(auth.ssid)) == null)
            return false;
        return true;
    }

    async function generateSessionForUsername(username){
        try {
            let SSID = generateSSID()
            await redis_client.setAsync(SSID, username, "EX", SESSION_LIFETIME_SECONDS)
            return SSID
        } catch(e) { console.log(e); throw e }
    }

	// Validate LE certificate
	let KEY = "lGFYcAOdCda7Rl2o7_uETqOPWyIe0oiZNFPLBX-YV44.GnQZK-6wu1WDXgqY2-c72lcChHurkwAoL_OYhECRNF4";
	router.get("/.well-known/acme-challenge/lGFYcAOdCda7Rl2o7_uETqOPWyIe0oiZNFPLBX-YV44", async(req, res) => res.send(KEY))

    // <- {auth: {}, data: {username, password}}
    // -> {ssid}
    router.post("/register", async(req, res) => {
        try{
            validateInput(req.body.data, "username password")

            if((await pg_client.query("SELECT * FROM Users WHERE username = $1", [req.body.data.username])).rows.length > 0) return res.status(409).send("Username is taken")
            await pg_client.query("INSERT INTO Users(username, password_hash) VALUES($1, $2)", [req.body.data.username, hashString(req.body.data.password)])

            res.json({ssid: await generateSessionForUsername(req.body.data.username)})
        } catch(e) {console.log(e); res.status(400).send()}
    })

    // <- {auth: {}, data: {username, password}}
    // -> {ssid}
    router.post("/login", async(req, res) => {
        try{
            validateInput(req.body.data, "username password")

            if((await pg_client.query("SELECT * FROM Users WHERE username = $1 and password_hash = $2", [req.body.data.username, hashString(req.body.data.password)])).rows.length == 0)
                return res.status(401).send("Authentification failed")

            res.json({ssid: await generateSessionForUsername(req.body.data.username)})
        } catch(e) {console.log(e); res.status(400).send()}
    })

    // <- {auth: {ssid}, data: {name, description}}
    router.post("/createProject", async(req, res) => {
        try{
            console.log(req.body.data)
            validateInput(req.body.data, "name description")
            if(!await validateAuth(req.body.auth)) return res.status(401).send("SSID is invalid.")

            let username = await redis_client.getAsync(req.body.auth.ssid)
            await pg_client.query("INSERT INTO Projects(name, description, creator_username) VALUES($1, $2, $3)", [req.body.data.name, req.body.data.description, username])

            res.send()
        } catch(e) {console.log(e); res.status(400).send()}
    })

    // <- {auth: {ssid}, data: {}}
    // -> {projects: [{id, name, description, creator_username}, ...]}
    router.post("/readProjects", async(req, res) => {
        try{
            if(!await validateAuth(req.body.auth)) return res.status(401).send("SSID is invalid.")

            let username = await redis_client.getAsync(req.body.auth.ssid)
            let is_admin = (await pg_client.query("SELECT is_admin FROM Users WHERE username = $1", [username])).rows[0]["is_admin"]

            let r;
            if(is_admin == 'true')
                r = await pg_client.query("SELECT * FROM Projects")
            else
                r = await pg_client.query("SELECT * FROM Projects WHERE creator_username = $1", [username])

            res.json(r.rows)
        } catch(e) {console.log(e); res.status(400).send()}
    })

    // <- {auth: {ssid}, data: {projectId}}
    router.post("/deleteProject", async(req, res) => {
        try{
            validateInput(req.body.data, "projectId")
            if(!await validateAuth(req.body.auth)) return res.status(401).send("SSID is invalid.")

            let username = await redis_client.getAsync(req.body.auth.ssid)
            let is_admin = await pg_client.query("SELECT is_admin FROM Users WHERE username = $1", [username])
            let project_creator_username = (await pg_client.query("SELECT creator_username FROM Projects WHERE id = $1", [req.body.data.projectId])).rows[0]["creator_username"]

            if(!is_admin && username != project_creator_username) return res.status(403).send()
            pg_client.query("DELETE FROM Projects WHERE id = $1", [req.body.data.projectId])

            res.send()
        } catch(e) {console.log(e); res.status(400).send()}
    })

    return router
}

module.exports = getRouter

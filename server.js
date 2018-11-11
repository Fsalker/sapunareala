/*              Notes:

-------- How to run "sapunareala" --------
1. Fill in /server/env.js accordingly with information such as the connection data to your desired PG database
2. Initialise the Database if needed by modifying the INITIALISING_DB flag to true
3. npm start

Note: Redis runs locally by default

-------- Why? --------
    Why does the NodeJS Postgres driver require prepared parameters to have indexed variables?
        ie: 'INSERT INTO users(name, email) VALUES($1, $2) RETURNING *'
        We should simply be able to have $ or ? if we wanted so, instead of $1, $2, ..., $666013. It's silly like this.

    Why does app.use() cancel the following app.post(...) routes? Weird.

-------- Documentation reading --------
    ie: the little comments before every route

    How to read the arrows:
        <- means "gets", ie: the API requires these values
        -> means "gives", ie: the API returns these values

    Also, the auth & data objects are pretty self explanatory. Hopefully.

    [v] means done
    [ ] means not done

-------- Project architecture --------
    [v] For one, I could put all routes in a separated /Routes folder. I've seen that before and it's a nice practice.
    [v] Also, the project currently doesn't serve static/public files - that should be fixable easily with Express.

-------- To Do --------
    [ ] HTTPS
    [v] Create users & projects tables.
    [v] Bluebird Promises. I don't understand why Bluebird over vanilla, but its site and documentation are terribly lacking after a brief inspection.
    [v] Redis. Let's see what it's good for and how I'll glue it into the app.
    [ ] React. Vue > React (just a personal preference here atm), but the site could use better reactivity than my freestyle javascript maneuvering.
*/

// Requires
let pg = require("pg")
let express = require("express")
let redis = require("redis")
let bodyParser = require("body-parser")
let bluebird = require("bluebird")
let http = require("http")
let https = require("https")
//bluebird.promisifyAll(redis)

// Custom Requires
let getRouter = require("./routes/index.js")

// Config
let env = require("./server/env.js")
const INITIALISING_DB = false;

// Main
async function main(){
    let pg_client;
    let redis_client;
    try {
        // Connect to DB
        console.log("Connecting to PostGres...")
        pg_client = new pg.Client(env.PG_CONNECT)
        await pg_client.connect()
        console.log("Connected to PG!")
        console.log("Connecting to Redis...")
        redis_client = bluebird.Promise.promisifyAll(redis.createClient()) // Here's where Bluebird does some magic and promisifies Redis...
        console.log("Connected to Redis!")

        // Initialise DB, if needed
        if(INITIALISING_DB){
            await require("./server/initialiseDatabase.js").reset_and_init_db(pg_client, redis_client)
        }

        // Express App
        let app = express()

        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(express.static("public"))
        app.use(getRouter(pg_client, redis_client))

        //let privateKey = fs.readFileSync("./certificate/xxx.key", "utf8")
        //let certificate = fs.readFileSync("./certificate/xxx.crt", "utf8")

        //let httpsCredentials = {key: privateKey, cert: certificate}
        let httpServer = http.createServer(app);
        //let httpsServer = https.createServer(httpsCredentials, app);

        httpServer.listen(80);
        //httpsServer.listen(443);

        /*app.listen(env.WEB_PORT, () => {
            console.log(`Running Express Server on port ${env.WEB_PORT}`)
        })*/
    } catch(e) { console.log(e)}
}
main()
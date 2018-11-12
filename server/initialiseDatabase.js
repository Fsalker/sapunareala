let {hashString} = require("../utils/utils.js")
let {ADMIN_USERNAME, ADMIN_PASSWORD} = require("../server/env.js")

module.exports = {
    reset_and_init_db: async (pg_client, redis_client) => {
	console.log("Initialising DB...");
//	let r = await pg_client.query('SELECT VERSION()');
//	console.log(r);


        await pg_client.query(`
        DROP TABLE IF EXISTS Users; 
        DROP TABLE IF EXISTS Projects; 
        
        CREATE TABLE Users(
--            id int GENERATED ALWAYS AS IDENTITY
	    id SERIAL PRIMARY KEY,	
            username varchar(30) NOT NULL UNIQUE,
            password_hash varchar(64) NOT NULL,
            is_admin varchar(5) DEFAULT 'false'
	);
        
        CREATE TABLE Projects(
--            id int GENERATED ALWAYS AS IDENTITY,
	    id SERIAL PRIMARY KEY,
            name varchar(50) NOT NULL,
            description varchar(256) NOT NULL,
            creator_username varchar(64) NOT NULL
        );

	`)

        await redis_client.flushdb();

        await pg_client.query("INSERT INTO Users(username, password_hash, is_admin) VALUES($1, $2, 'true')", [ADMIN_USERNAME, hashString(ADMIN_PASSWORD)])
	console.log("Created Admin account")
        //await pg_client.query("INSERT INTO Users(username, password_hash) VALUES('t0ny0', 'xyz'), ('mirunz0r', 'xyz'), ('t0ny0_duplicate', 'zzz')")
        // await pg_client.query("INSERT INTO Projects(name, description, creator_username) VALUES('Sapunareala', 'A cool project that serves as a mean to flex with your ability to be flexible and learn new techs on the fly.', 't0ny0')")
//        let res = await pg_client.query("SELECT * FROM Users");  console.log(res.rows);
        //res = await pg_client.query("SELECT * FROM Projects"); console.log(res.rows)
    }
}

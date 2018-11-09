# Sapunareala
Here's how to run it, as stated in /server.js:
1. Fill in /server/env.js accordingly with information such as the connection data to your desired PG database. You will have to create the database beforehand (I did it via pgAdmin 4 myself).
2. Initialise the Database if needed by modifying the INITIALISING_DB flag to true. (Note: this drops every PG table and (re)creates them; it also deletes every Redis entry)
3. Open your Terminal in the project's root folder and run "npm start".

### About

The name was picked as a little banter towards SOAP. I actually like the name.

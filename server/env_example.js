module.exports = {
    WEB_PORT: 1234,
    PG_CONNECT: {
        user: "username",
        password: "password",
        host: "host",
        port: 6666,
        database: "yourdb"
    },
    ADMIN_USERNAME: "username",
    ADMIN_PASSWORD: "password",
    SALT: "your_super_secret_salt"

    /* // Not yet implemented. No need to bother with this :D
    REDIS_CONNECT: {
        host: "host",
        port: 666013
    }*/
}
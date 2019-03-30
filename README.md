# typing-evaluation


## Getting started

1. Install Node.js, NPM, PostgreSQL (listening at 127.0.0.1:5432, with a superuser named "postgres"),
2. Run `npm start`
3. The command line output will say something like `... listening on http://0.0.0.0:8080`.
4. Open `http://localhost:8080` in your browser.

The `npm start` command will handle creating the database and setting up the tables, then start the application server.


## Administration

Go to `http://localhost:8080/admin/`

Functionality available in the admin tool:

* Create / edit / delete stimulus sentences
* View participants and their responses


## Contributors

* Tom Stafford <t.stafford@sheffield.ac.uk>
* Colin Bannard <colinbannard@gmail.com>
* Christopher Brown <audiere@gmail.com>


## Deployment

See [`DEPLOY.md`](DEPLOY.md) for instructions on deploying the app to Digital Ocean using `docker-machine`.


## Development

You may want to copy the live database to your local machine, e.g., for debugging purposes.
Prepare the local database and dump the remote database into it:

    dropdb typing-evaluation; createdb typing-evaluation
    docker exec db pg_dump -U postgres typing-evaluation | psql typing-evaluation


## License

Copyright 2014-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).

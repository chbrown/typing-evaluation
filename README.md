# typing-evaluation


## Getting started

1. Install Node.js and NPM
2. Install PostgreSQL, change your local DNS to point the hostname `db` to your PostgreSQL server, add a superuser "postgres", and allow trusted local socket connections for that user.
2. Run `npm start`
3. The command line output will say something like `... listening on http://0.0.0.0:8080`.
4. Open `http://localhost:8080` in your browser.

The `npm start` command will handle creating the database and setting up the tables, then start the application server.


## Administration

Go to `http://localhost:8080/admin`

Functionality available in the admin tool:

* Create / edit / delete stimulus sentences
* View participants and their responses


## Contributors

* Tom Stafford <t.stafford@sheffield.ac.uk>
* Colin Bannard <colinbannard@gmail.com>
* Christopher Brown <audiere@gmail.com>


## License

Copyright 2014 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).

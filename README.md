# typing-evaluation


## Getting started

1. Install Node.js, NPM, and PostgreSQL:

       brew install node postgresql

2. Start PostgreSQL listening at `127.0.0.1:5432` (there might be additional setup if this your first time starting it):

       brew services start postgresql
       # you might need to  might be more

3. Clone this repository locally and `cd` into it:

       git clone https://github.com/chbrown/typing-evaluation.git
       cd typing-evaluation

4. Install all dependencies:

       npm install

5. Start the Node.js server:

       PORT=8080 npm start

   That command will handle creating the database and setting up the tables,
   then start the application server. It will not exit until you press `Ctrl-C`.


### Administration

Go to <http://localhost:8080/admin/>

Functionality available in the admin tool:

* Create / edit / delete stimulus sentences
* View participants and their responses
* Create / edit administrator accounts


### Participation

Go to <http://localhost:8080/>


## Contributors

* Tom Stafford <t.stafford@sheffield.ac.uk>
* Colin Bannard <colinbannard@gmail.com>
* Christopher Brown <audiere@gmail.com>


## Deployment

See [`DEPLOY.md`](DEPLOY.md) for instructions on deploying the app to Digital Ocean using `docker-machine`.


## Development

After making any changes to the UI source code (`.js` or `.css` files),
you must rebuild the compiled output:

    npm run prepack

You may want to copy the live database to your local machine, e.g., for debugging purposes.
Prepare the local database and dump the remote database into it:

    dropdb typing-evaluation; createdb typing-evaluation
    docker exec db pg_dump -U postgres typing-evaluation | psql typing-evaluation


## License

Copyright 2014-2019 Christopher Brown.
[MIT Licensed](https://chbrown.github.io/licenses/MIT/#2014-2019).

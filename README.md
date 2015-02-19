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


## Deployment via [machine](https://github.com/docker/machine)

`machine` isn't ready to go out of the box. You need to generate some [keys](https://github.com/docker/docker/issues/7667) first, which simply running an identity-based authentication-enabled docker client will do. First, get [a suitable docker](https://github.com/docker/machine#try-it-out):

    cd /usr/local/bin
    wget https://bfirsh.s3.amazonaws.com/docker/darwin/docker-1.3.1-dev-identity-auth
    chmod +x docker-1.3.1-dev-identity-auth

I'll assume that the alias and environment variable below apply throughout the rest of the deployment process.

    alias docker=docker-1.3.1-dev-identity-auth
    export DO_TOKEN=6c4a0280d36dc219n0t4ctua11ymydigital0ceant0k3n9186729fe910b157bb

Run that client to generate the required keys (it won't look like it did anything, but `~/.docker/public-key.json` should now exist):

    docker

Now you can spin up the Digital Ocean "droplet" (which is just what Digital Ocean calls their virtual machines). This will fail if a droplet with that name is already running.

    machine create -d digitalocean \
      --digitalocean-access-token=$DO_TOKEN \
      --digitalocean-image=docker \
      --digitalocean-region=nyc3 \
      --digitalocean-size=512mb \
      typing-evaluation

That machine will now be the "active" one (`cat ~/.docker/hosts/.active`), so you can run the following to point your docker controller at that host:

    export DOCKER_HOST=$(machine url) DOCKER_AUTH=identity

Docker commands will now affect the docker host on that machine. Start up the required containers:

    docker run -d --name db -p 127.0.0.1:5432:5432 postgres:9.3
    docker run -d --name app --link db:db -p 80:80 chbrown/typing-evaluation

After that initialization process, you can update to the latest version of the app with a few more commands:

    docker pull chbrown/typing-evaluation
    docker rm -f app
    docker run -d --name app --link db:db -p 80:80 chbrown/typing-evaluation

Supposing that the Docker Hub registry isn't responding to your `pull` commands, or is failing with "i/o timeout" errors, you can push over the new image manually with `docker save` and `docker load` and another machine instance that _can_ connect to the Docker registry:

    export DOCKER_HOST=$(machine url usa) DOCKER_AUTH=identity
    docker pull chbrown/typing-evaluation
    docker save chbrown/typing-evaluation | docker --host $(machine url typing-evaluation) load


## DO API

An `Authorization` header must be sent with all requests, so we might as well make it reusable:

    export DO_AUTH="Authorization: Bearer $DO_TOKEN"
    export DO_API=https://api.digitalocean.com/v2

List droplets:

    curl -H "$DO_AUTH" -X GET $DO_API/droplets | jq .

List domains:

    curl -H "$DO_AUTH" -X GET $DO_API/domains | jq .

Create domain:

    curl -H "$DO_AUTH" -X POST -d "name=typingexperiment.com&ip_address=178.62.68.168" $DO_API/domains | jq .

Check it out (DO automatically creates one SOA record, three NS records, and a single A record):

    curl -H "$DO_AUTH" -X GET $DO_API/domains/typingexperiment.com | jq .

Add a CNAME record for `www`:

    curl -H "$DO_AUTH" -X POST -d "type=CNAME&name=www&data=@" $DO_API/domains/typingexperiment.com/records | jq .


## Development

Copy the live database to your local machine:

First, set up an ssh tunnel, so that we don't have to rely on `pg_dump` being available on the remote machine.

    ssh-add ~/.docker/hosts/typing-evaluation/id_rsa
    machine active typing-evaluation
    ssh -N -L 15432:localhost:5432 root@$(machine ip) &

Then prepare the local database and dump the remote database into it:

    dropdb typing-evaluation; createdb typing-evaluation
    pg_dump -h localhost -p 15432 -U postgres typing-evaluation | psql typing-evaluation


## License

Copyright 2014-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).

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

Docker commands will now affect the docker host on that machine. Start up the required containers (this will pull the `chbrown/typing-evaluation` Docker container image from [Docker Hub](https://registry.hub.docker.com/u/chbrown/typing-evaluation/), so it might take a while):

    docker run -d --name db -p 127.0.0.1:5432:5432 postgres:9.3
    docker run -d --name app --link db:db chbrown/typing-evaluation

Now configure the nginx server to serve http/https. Create a basic nginx config layout:

    etc/nginx/conf.d/default.conf
    etc/nginx/certs/typingexperiment-com.crt
    etc/nginx/certs/typingexperiment-com.key

And sync your config to the remote machine:

    rsync -r -e "machine ssh" etc/nginx/ typing-evaluation:/etc/nginx/

And start nginx, mounting those directories as volumes in the nginx container:

    docker run -d --name nginx --link app:app -p 80:80 -p 443:443 \
      -v /etc/nginx/certs:/etc/nginx/certs -v /etc/nginx/conf.d:/etc/nginx/conf.d nginx

After that initialization process, you can update to the latest version of the app with a few more commands:

    docker pull chbrown/typing-evaluation
    docker rm -f app
    docker run -d --name app --link db:db chbrown/typing-evaluation
    # actually, you'll need to restart nginx now, too. sorry.
    docker rm -f nginx
    docker run -d --name nginx --link app:app -p 80:80 -p 443:443 \
      -v /etc/nginx/certs:/etc/nginx/certs -v /etc/nginx/conf.d:/etc/nginx/conf.d nginx

Supposing that the Docker Hub registry isn't responding to your `pull` commands, or is failing with "i/o timeout" errors, you can push over the new image manually with `docker save` and `docker load` and another machine instance that _can_ connect to the Docker registry:

    export DOCKER_HOST=$(machine url usa) DOCKER_AUTH=identity
    docker pull chbrown/typing-evaluation
    docker save chbrown/typing-evaluation | docker --host $(machine url typing-evaluation) load


## Migrating

Need to move to a new server but DNS is slow to update?

Suppose the new server is at `174.59.58.144`.

Create a new nginx config file, e.g., `proxy.conf`:

    server {
      listen 80;
      location / {
        proxy_pass http://174.59.58.144;
      }
    }

Write that file to the obsolete machine:

    cat proxy.conf | machine ssh typing-evaluation 'mkdir -p /etc/nginx/conf.d; cat - > /etc/nginx/conf.d/default.conf'

Now back on your machine (with the obsolete machine still active):

    docker rm -f app
    docker run -d --name proxy -p 80:80 -v /etc/nginx/conf.d:/etc/nginx/conf.d nginx


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

Check out the resulting zone file (DO automatically creates one SOA record, three NS records, and a single A record):

    curl -H "$DO_AUTH" -X GET $DO_API/domains/typingexperiment.com | jq .

View DO's internal records that produced the zone file:

    curl -H "$DO_AUTH" -X GET $DO_API/domains/typingexperiment.com/records | jq .

Add a CNAME record for `www`:

    curl -H "$DO_AUTH" -X POST -d "type=CNAME&name=www&data=@" $DO_API/domains/typingexperiment.com/records | jq .

Add MX records for FastMail:

    curl -H "$DO_AUTH" -X POST -d "type=MX&data=in1-smtp.messagingengine.com.&priority=10" $DO_API/domains/typingexperiment.com/records | jq .
    curl -H "$DO_AUTH" -X POST -d "type=MX&data=in2-smtp.messagingengine.com.&priority=20" $DO_API/domains/typingexperiment.com/records | jq .


## Development

Copy the live database to your local machine:

First, set up an ssh tunnel, so that we don't have to rely on `pg_dump` being available on the remote machine.

    machine ssh typing-evaluation -N -L 15432:localhost:5432 &

Then prepare the local database and dump the remote database into it:

    dropdb typing-evaluation; createdb typing-evaluation
    pg_dump -h localhost -p 15432 -U postgres typing-evaluation | psql typing-evaluation


## License

Copyright 2014-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).

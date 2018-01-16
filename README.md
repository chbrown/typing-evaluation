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

### Install [machine](https://github.com/docker/machine)

We're going to use Docker's `machine` to provision and configure our virtual machine. These instructions apply to version 0.2.0 of `machine`.

    curl -L https://github.com/docker/machine/releases/download/v0.2.0/docker-machine_darwin-amd64 > /usr/local/bin/docker-machine
    chmod +x /usr/local/bin/docker-machine

Now, running `docker-machine -v` should produce the output:

> machine version 0.2.0 (8b9eaf2)


### Start up a droplet on Digital Ocean

You'll need an account on [Digital Ocean](https://www.digitalocean.com/). Once your account is setup, generate a token on the [API](https://cloud.digitalocean.com/settings/applications) page. It should have both `Read` and `Write` scopes. The name you give it doesn't matter, but something like "docker-machine" would make sense. Store this token in your environment like so:

    export DO_TOKEN=6c4a0280d36dc219n0t4ctua11ymydigital0ceant0k3n9186729fe910b157bb

Now spin up a Digital Ocean "droplet" (that's what Digital Ocean calls their virtual machines) from the command line:

    docker-machine create -d digitalocean \
      --digitalocean-access-token $DO_TOKEN \
      --digitalocean-region nyc3 \
      --digitalocean-size 512mb \
      typing-evaluation

That will take a minute or two. When it's done, run the following to set the environment variables, `DOCKER_TLS_VERIFY`, `DOCKER_CERT_PATH`, and `DOCKER_HOST`:

    eval "$(docker-machine env typing-evaluation)"

Docker commands will now pick up those variables.
Running `docker ps` now should work, but will only print a list of headers since we haven't yet started any containers.


### Run the containers

We'll use a stock PostgreSQL 9.4, and name it `db`:

    docker run -d --name db postgres:9.4

Before starting nginx, if you have an SSL/TLS key and certificate, put them into `/etc/nginx/certs/` on the droplet:

    docker-machine ssh typing-evaluation 'mkdir -p /etc/nginx/certs/'
    cat typingexperiment.com.key | docker-machine ssh typing-evaluation 'cat - > /etc/nginx/certs/typingexperiment.com.key'
    cat typingexperiment.com.crt | docker-machine ssh typing-evaluation 'cat - > /etc/nginx/certs/typingexperiment.com.crt'

It's not too hard to configure the stock `nginx` Dockerfile, but there's a handy auto-configuring container called [`jwilder/nginx-proxy`](https://github.com/jwilder/nginx-proxy) that we'll use instead:

    docker run -d -p 80:80 -p 443:443 -v /etc/nginx/certs:/etc/nginx/certs \
        -v /var/run/docker.sock:/tmp/docker.sock --name nginx jwilder/nginx-proxy

Finally, start the actual web application container:

    # set VIRTUAL_HOST to the hostname you want the app to respond to
    # ADMIN_USER and ADMIN_PASS are optional, but they're an easy way to
    # initialize some valid credentials to allow logging into the admin pages.
    # Of course, you should change them to something else before running this command.
    docker run -d -e VIRTUAL_HOST=typingexperiment.com -e ADMIN_USER=open -e ADMIN_PASS=sesame \
        --name app --link db:db --restart always chbrown/typing-evaluation

That will pull the `chbrown/typing-evaluation` Docker container image from [Docker Hub](https://hub.docker.com/r/chbrown/typing-evaluation/), so it might take a while (around five minutes).

The nginx process will have detected the new app container and its `VIRTUAL_HOST` variable, rewriting its configuration to direct requests for `VIRTUAL_HOST` to the application itself.


### Updates

After the first deploy, you can update to the latest version of the app with a shorter sequence of commands:

    eval "$(docker-machine env typing-evaluation)"
    docker pull chbrown/typing-evaluation
    docker rm -f app
    docker run -d -e VIRTUAL_HOST=typingexperiment.com --link db:db --restart always \
        --name app chbrown/typing-evaluation


## DO API

An `Authorization` header must be sent with all requests, so we might as well make it reusable:

    export DO_AUTH="Authorization: Bearer $DO_TOKEN"
    export DO_API=https://api.digitalocean.com/v2

List droplets:

    curl -s -H "$DO_AUTH" -X GET $DO_API/droplets | jq

Delete a droplet:

    curl -s -H "$DO_AUTH" -X DELETE $DO_API/droplets/<droplet_id>

List domains:

    curl -s -H "$DO_AUTH" -X GET $DO_API/domains | jq

Create domain:

    curl -s -H "$DO_AUTH" -X POST -d "name=typingexperiment.com&ip_address=178.62.68.168" $DO_API/domains | jq

Check out the resulting zone file (DO automatically creates one SOA record, three NS records, and a single A record):

    curl -s -H "$DO_AUTH" -X GET $DO_API/domains/typingexperiment.com | jq -r .domain.zone_file

View DO's internal records that produced the zone file:

    curl -s -H "$DO_AUTH" -X GET $DO_API/domains/typingexperiment.com/records | jq

Fix the A record:

    curl -s -H "$DO_AUTH" -X PUT -d "data=178.62.68.168" $DO_API/domains/typingexperiment.com/records/6307079 | jq

Add a CNAME record for `www`:

    curl -s -H "$DO_AUTH" -X POST -d "type=CNAME&name=www&data=@" $DO_API/domains/typingexperiment.com/records | jq

Add MX records for FastMail:

    curl -s -H "$DO_AUTH" -X POST -d "type=MX&data=in1-smtp.messagingengine.com.&priority=10" $DO_API/domains/typingexperiment.com/records | jq
    curl -s -H "$DO_AUTH" -X POST -d "type=MX&data=in2-smtp.messagingengine.com.&priority=20" $DO_API/domains/typingexperiment.com/records | jq


## Development

You may want to copy the live database to your local machine, e.g., for debugging purposes.
Prepare the local database and dump the remote database into it:

    dropdb typing-evaluation; createdb typing-evaluation
    docker exec db pg_dump -U postgres typing-evaluation | psql typing-evaluation


## License

Copyright 2014-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).

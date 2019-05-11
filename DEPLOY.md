## Deployment

### Install [`docker-machine`](https://github.com/docker/machine)

We're going to use `docker-machine` to provision and configure our virtual machine.
These instructions were testing on `docker-machine` version 0.16.1.

    brew install docker-machine

Now, running `docker-machine --version` should produce the output:

> docker-machine version 0.16.1, build cce350d


### Start up a droplet on Digital Ocean

You'll need an account on [Digital Ocean](https://www.digitalocean.com/).
Once your account is setup, generate a token on the [API](https://cloud.digitalocean.com/settings/applications) page.
It should have both `Read` and `Write` scopes. The name you give it doesn't matter, but something like "docker-machine" would make sense.
Store this token in your environment like so:

    export DIGITALOCEAN_ACCESS_TOKEN=6c4a0280d36dc219n0t4ctua11ymydigital0ceant0k3n9186729fe910b157bb

Now spin up a Digital Ocean "droplet" (that's what Digital Ocean calls their virtual machines) from the command line:

    docker-machine create -d digitalocean --digitalocean-size 512mb typing-evaluation

That will take a minute or two. When it's done, run the following to set the environment variables, `DOCKER_TLS_VERIFY`, `DOCKER_CERT_PATH`, and `DOCKER_HOST`:

    eval "$(docker-machine env typing-evaluation)"

Docker commands will now pick up those variables.
Running `docker ps` now should work, but will only print a list of headers since we haven't yet started any containers.


### Startup

The entire stack is defined in [`docker-compose.yml`](docker-compose.yml) which can be deployed with `docker-compose`.

    brew install docker-compose

_(Work in progress: instructions on SSL certificate handling)_

<!-- Before starting nginx, if you have an SSL/TLS key and certificate, put them into `/etc/nginx/certs/` on the droplet:
    docker-machine ssh typing-evaluation 'mkdir -p /etc/nginx/certs/'
    cat typingexperiment.com.key | docker-machine ssh typing-evaluation 'cat - > /etc/nginx/certs/typingexperiment.com.key'
    cat typingexperiment.com.crt | docker-machine ssh typing-evaluation 'cat - > /etc/nginx/certs/typingexperiment.com.crt'
-->

Before proceeding, you should edit `docker-compose.yml` to change `ADMIN_USER` and `ADMIN_PASS`.
You may also want to change `VIRTUAL_HOST` to your domain (and `DEFAULT_HOST` to match).

Now, ensuring that you're in the same directory as the `docker-compose.yml` file, deploy:

    docker-compose up


### Updates

Whenever you change the `docker-compose.yml` config, re-deploy like so:

    eval "$(docker-machine env typing-evaluation)"
    docker-compose up


---

## Digital Ocean API Reference

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

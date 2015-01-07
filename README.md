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


## License

Copyright 2014-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).

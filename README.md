## Intro
Rides is a ride-sharing simulation, built as a distributed system with multiple services. [Here is a demo](https://rides.hauraki.de). It is based on [the original Rides app](https://github.com/jurajmajerik/rides/tree/master) by Juraj Majerik. I followed his [blog](https://jurajmajerik.com/) loosely to build my own version and extended the original app further for my learning and understanding in different areas.

Some of my major changes in the app's services include:
- **frontend:** animations with [GSAP](https://greensock.com/gsap/), refactor map into layers
- **simulator:** make models more state-machine-like, improve logs
- **backend:** complete rewrite in Node.js using Express and Knex

I deployed the app to different environments in the process, all the necessary config and documentation can be found in this repo as well:
- **Docker Compose:** my first and simple out-of-the box setup for local use that leverages health checks and auxiliary services for reverse proxying and TLS certificates
- **Minikube:** a local Kubernetes cluster with a single node, for easy development
- **Azure:** a cloud Kubernetes cluster, where I also built the *infrastructure as code* with Terraform
- **Dokku:** a simple self-hosted Docker-powered platform that I switched to after my free Azure trial ran out

The work on the different deployments is strongly inspired by Ashley Davis' book [Bootstrapping Microservices](https://www.manning.com/books/bootstrapping-microservices-with-docker-kubernetes-and-terraform). It is very hands-on and I highly recommend you check it out.
## Getting started
You can spin up the application locally using Docker Compose, in a few simple steps. Note that you will need [Docker Desktop](https://www.docker.com/products/docker-desktop) installed for this.

- Clone the repository and change to the project directory:

```bash
git clone https://github.com/hauraki/rides.git
cd rides
```

- Prepare the `.env` file from the provided example file, it works out of the box with the default values:

```bash
cp .env.example .env
```

- Run the migrations to create the necessary database tables:

```bash
docker compose run backend yarn migrate:latest:dev
```

- Add some seed data to the new tables:
```bash
docker compose run backend yarn seed:run:dev
```

- Launch the full application and observe in the logs how the different services are starting up:

```bash
docker compose up
```

- The application automatically generates a self-signed certificate for TLS. You'll need to trust the CA certificate saved in `deployment/compose/certs/ca.crt` by following [these instructions](https://github.com/sebastienheyd/docker-self-signed-proxy-companion#trust-self-signed-certificates). Otherwise you will run into a `NET::ERR_CERT_AUTHORITY_INVALID` error when accessing the app.
- Open the app [in your browser](https://rides.localtest.me) 🎉. (If you receive a a "502 Bad Gateway" error, it means that the frontend service is not ready yet - it may take a little while to build on first launch. Just reload the page after a while.)
## Learn more

Check out the [App improvements wiki page](https://github.com/hauraki/rides/wiki/App-improvements)  for more details on my changes to the frontend, simulator and backend services.

If you want to deploy the app with Docker Compose, Minikube or Azure, see the [Deployment wiki page](https://github.com/hauraki/rides/wiki/Deployment) for details.

## Outro
I hope you are enjoying the Rides ;) - and are feeling a bit more excited to build and deploy some distributed app of your own now.

Thanks again to Juraj Majerik for [the original Rides app](https://jurajmajerik.com/) and Ashley Davis for his [Bootstrapping Microservices book](https://www.manning.com/books/bootstrapping-microservices-with-docker-kubernetes-and-terraform), both have been very inspiring for this project!

If you'd like to work with me, find out more about me on [my website](http://hauraki.de/).

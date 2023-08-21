## Intro
Rides is a ride-sharing simulation (a "mini Uber clone"), built as a distributed system with multiple services. [Here is a demo](https://rides.hauraki.de). It is based on [the original Rides app by Juraj Majerik](https://github.com/jurajmajerik/rides/tree/master). He describes how he went about it in his [blog](https://jurajmajerik.com/), which I followed loosely to build my own version. I modified and extended the original app further for my own learning and understanding in different areas.

Some of my additions here are about improving the code of the app, particularly the Typescript bits, to refresh my skills of the language. For example, I changed the [frontend](https://github.com/hauraki/rides/tree/master/application/frontend) animations to work with [GSAP](https://greensock.com/gsap/),  refactored the [simulator](https://github.com/hauraki/rides/tree/master/application/simulator) to be more state-machine-like and moved SSL handling out of the Go-based [backend](https://github.com/hauraki/rides/tree/master/application/backend), among other things. I'll describe all of those in more detail below.

The larger part though is about providing different ways to deploy the application: I wanted to deepen and apply my dev ops knowledge of technologies such as Docker Compose, Kubernetes and Terraform in practice. The work for these parts is strongly inspired by Ashley Davis' book [Bootstrapping Microservices](https://www.manning.com/books/bootstrapping-microservices-with-docker-kubernetes-and-terraform). It is very hands-on and I highly recommend you check it out. I began with [a simple deployment](https://github.com/hauraki/rides/tree/master/deployment/compose) to Docker Compose, and [another one](https://github.com/hauraki/rides/tree/master/deployment/minikube) to a local [Minikube](https://minikube.sigs.k8s.io/docs/start/) cluster. After that I provisioned the [necessary infrastructure](https://github.com/hauraki/rides/tree/master/infrastructure) in an Azure cloud environment using [Terraform](https://www.terraform.io/) and [deployed](https://github.com/hauraki/rides/tree/master/deployment/cloud) the app onto a Kubernetes cluster. Finally, I added  [workflows](https://github.com/hauraki/rides/tree/master/.github/workflows) for continuous delivery with [Github Actions](https://github.com/features/actions). Again, I'll describe all in more detail below.
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

- Launch the application with Docker Compose and observe in the logs how the different services are starting up:

```bash
docker compose up
```

- The application automatically generates a self-signed certificate for TLS. You'll need to trust the CA certificate saved in `deployment/compose/certs/ca.crt` by following [these instructions](https://github.com/sebastienheyd/docker-self-signed-proxy-companion#trust-self-signed-certificates). Otherwise you will run into a `NET::ERR_CERT_AUTHORITY_INVALID` error when accessing the app.
- Open the app [in your browser](https://rides.localtest.me) 🎉. (If you receive a a "502 Bad Gateway" error, it means that the frontend service is not ready yet - it may take a little while to build on first launch. Just reload the page after a while.)
## App improvements
Go directly to: [General](#general) | [Frontend](#frontend) | [Simulator](#simulator) | [Backend](#backend)

In this section I want to describe some ways in which I changed the original app, based on my ideas for learning and experimentation. First, the general architecture of the app. After that, I'll go into each of the three services (frontend, simulator, backend) and highlight some of my changes.
### General
#### Removing backend file server for frontend
In the original app, the frontend was actually not an independent service. Rather, it was first built and then the files were served through the backend service. I found that not ideal - I wanted to move towards an independent deployment of both frontend and backend. Hence I removed this file server and instead decided to serve the frontend independently, through a nginx server.
#### Removing shared code
The frontend and the simulator, both written in Typescript, shared some code in a common folder. I was able to eliminate some of it with refactoring, but also took a trade-off and decided to duplicate some of it in both services. The benefit I aimed for again was easier independent deployment of these services later.
### Frontend
#### Animations with GSAP
As Juraj points out in [one of his later articles](https://jurajmajerik.com/blog/finalizing-simulation/), the animations on the map can become pretty laggy when more objects are added. I noticed that as well, and looked into ways to improve this. 

I found [GSAP](https://greensock.com/gsap/) to be a very fast and robust Javascript library for animations (or *tweens*, as its makers call them). Its [MotionPathPlugin](https://greensock.com/docs/v3/Plugins/MotionPathPlugin) is a perfect fit to move around cars on a map! It supports a declarative syntax where you basically pass it an object (the car image) and a path (the car's route on the map), and it will do most of the legwork of moving and rotating the car in a smooth animation.

Another neat thing about GSAP is that you can hook into ongoing animations. This is very helpful for *syncing*: the frontend animates a car at a certain speed on its route, and the backend occasionally sends updates with the current *actual* position of the car (which may be different from its current position on the frontend map). In such a case, the tween's API offers a `progress` method which can be used to update the position in the current animation.
#### Refactoring into map layers
The original app had much of the map presentation in one file, which I found a bit unwieldy after a while. I went ahead and separated these into layers, meaning there are separate React components in individual files for:
- **base layer:** roads and obstacles
- **path layer:** the current routes of cars
- **car layer:** the animated cars
- **icon layer:** icons for (waiting) customers and pins for their destinations

The actual map then becomes a simple composition of these components:

```jsx
<div className="map" style={{ width: gridSize, height: gridSize }}>
	<BaseLayer />
	<PathLayer driverData={driverData} />
	<CarLayer driverData={driverData} />
	<IconLayer customerData={customerData} />
</div>
```
### Simulator
#### Refactoring towards state machine
The core of the simulator are the models for its two central entities: [drivers](https://github.com/hauraki/rides/blob/master/application/simulator/src/models/Driver.ts) and [customers](https://github.com/hauraki/rides/blob/master/application/simulator/src/models/Customer.ts). I refactored these to act more like state machines, so it would be easier to reason about their behavior. I found this important, as things tend to get more complex when asynchronous flows are introduced, e.g. when waiting for a match from the dispatcher or a new customer destination.
##### Driver
|State |Description |Event |Target State |
| --- | --- | --- | --- |
|`off` |no customer assigned or requested |`requestCustomer` |`idle`|
|`idle` |waiting for next customer|`match` |`pickup`|
|`pickup` |on the way to customer |`move` |`pickup` |
|`pickup` |arriving at customer |`move` + `pickup` |`enroute` |
|`enroute` |delivering customer |`move` |`enroute` |
|`enroute` |arriving at destination |`move` + `dropoff` |`off` |
|any |customer cancels trip |`cancel` |`off` |
##### Customer
|State |Description |Event |Target State |
| --- | --- | --- | --- |
|`inactive` |not active on map |`spawn` |`planning` |
|`planning` |deciding where to go |`setDestination` |`unmatched`|
|`unmatched` |no driver requested yet |`requestDriver` |`matching` |
|`matching` |waiting to be matched with driver |`match` |`matched` |
|`matched` |waiting for driver to arrive |`pickup` |`matched` |
|`matched` |traveling to destination |`dropoff` |`inactive` |
|any |cancel trip |`cancel` |`inactive` |
#### Funkier logs
In order to better understand what is going on within the simulator at any given time, I extended the logs for both the driver and the customer model. These can easily be viewed in real time for a running Docker Compose container (`docker logs -f rides-simulator-1`) and also later in different Kubernetes setups. They look like this:

```
[D] 🙋 Clare requests customer from [ 84, 6 ]
[D] 🤝 Clare matches with Martin
[D] 🧭 Clare now has route to [ 10, 69 ]
[C] ✨ Elaine spawns at [ 29, 55 ]
[C] 🙋 Elaine requests driver
[D] ⬆️  Colin picks up Ryker at [ 55, 45 ]
```
#### Automatic database setup
One thing that is easy enough to do locally but becomes more tricky later in cloud contexts and possible collaboration with others is the preparation of the database: creating the necessary tables, and populating them with some useful data. While there are database migration tools for Node.js out there such as [node-pg-migrate](https://github.com/salsita/node-pg-migrate) that can help with this, I kept it very simple and pragmatic for my own purposes here and just added [an idempotent script](https://github.com/hauraki/rides/blob/master/application/simulator/src/data/prepareDatabase.ts) that runs every time the simulator starts. 
### Backend
#### Extracting TLS handling
The original app contained the TLS handling directly in the backend service, and only for a production environment. I moved this entirely out of the backend and into a reverse proxy (see below) in front of it. The necessary certificate files will be generated automatically, and there will be TLS support for all environments (i.e. including local development with Docker Compose, or a local Minikube cluster). 
#### Removing file server from backend
I removed the logic from the backend that served the frontend files. Instead, the frontend becomes its own service that can be deployed independently.
## Deployment
Go directly to: [Docker Compose](#docker-compose) | [Local Kubernetes](#local-kubernetes) | [Cloud Kubernetes](#cloud-kubernetes) | [Continuous Deployment](#continuous-deployment)

In this section, I'll describe the different deployment options in more detail. If you are just looking for a quick start to get the app running locally, see [Getting Started](#getting-started) above. It's a Docker Compose setup that works pretty much out of the box.

### Prepare environment variables for Kubernetes
For the different Kubernetes deployment options further below (not for Docker Compose though), you will need to adjust and export some environment variables to make them available in scripts:

```bash
# copy the provided default values
cp .env.example .env

# adjust values in .env file, see below sub sections for details

# export the variables
set -a; source .env; set +a
```

The last step needs to be repeated whenever you open a new shell. This is a bit error-prone and easy to forget. If you are on ZSH and Oh My Zsh I recommend the [dotenv plugin](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/dotenv) or something similar to load the `.env` file automatically.

### Docker Compose
With this first local deployment, I wanted to make it really easy for other developers to get started, on their own machines. It spins up all the necessary services automatically with a single command.

It supports **live-reloading**: the code of each service can be edited, and it will update automatically. This makes a lot of sense for development workflows, where quick feedback matters. This is also why there are two different Dockerfiles for each app service. There is a `Dockerfile-dev` with live-reloading support in Docker Compose, and there is a `Dockerfile-prod` optimized for performance and robustness in later production deployments.

Besides the app services for frontend, simulator and backend, there are a few additional services in the [Compose file](https://github.com/hauraki/rides/blob/master/deployment/compose/docker-compose.yml).

First there is a Postgres database server: it is prepared automatically by creating the necessary tables and populating them with some test data.

Then there is the nifty [nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy) service: it sets up a nginx reverse proxy for the frontend and backend service. The necessary proxy config is generated automatically, just based on some environment variables (mainly `VIRTUAL_HOST` and `VIRTUAL_PATH`) in the app services, pretty cool! In combination with the default use of [localtest.me](https://readme.localtest.me/) as virtual host name, this means that the frontend can be reached on [rides.localtest.me](https://rides.localtest.me) and the backend with the prefix [rides.localtest.me/api](https://rides.localtest.me/api/customers).

Finally, there is a companion service for nginx-proxy called [docker-self-signed-proxy-companion](https://github.com/sebastienheyd/docker-self-signed-proxy-companion): it hooks into nginx-proxy and automatically generates self-signed SSL certificates for all proxied services. This means easy and out of the box SSL support for local development! You need to [trust the CA of these self-signed certificates](https://github.com/sebastienheyd/docker-self-signed-proxy-companion#trust-self-signed-certificates) though, or your browser will give you a warning.
#### Setup
see [Getting Started](#getting-started) above
### Local Kubernetes
Before deploying the app to a Kubernetes cluster in the cloud, I wanted to experiment locally. This boils down to quick feedback loops again: when building the Kubernetes config, this way I can easily run them against a local cluster for testing.

Also, a local cluster means that images do not have to be pushed to a remote registry (such as [Docker Hub](https://hub.docker.com/)), but can be used directly from the local machine.

Docker Desktop actually already [includes a standalone Kubernetes server and client](https://docs.docker.com/desktop/kubernetes/). However, I found it to be pretty slow on my laptop. Additionally, I was stuck with the Kubernetes version that Docker Desktop ships with.

So I looked for alternatives and went for [Minikube](https://minikube.sigs.k8s.io/docs/start/) instead. It is a tool to quickly spin up a single-node Kubernetes cluster. The node can be provisioned using different [drivers](https://minikube.sigs.k8s.io/docs/drivers/), I just went for the default option and deployed the node as Docker container (other options include Hyperkit, VirtualBox etc).

In terms of Kubernetes manifest files, I needed to build the following:
- [*deployment* and *service* for frontend](deployment/kubernetes/shared/frontend.yml)
- [*deployment* for simulator](deployment/kubernetes/shared/simulator.yml) (no *service* needed, as it is not exposed via HTTP)
- [*deployment* and *service* for backend](deployment/kubernetes/shared/backend.yml)
- [*ingress* to configure a gateway for frontend and backend services](deployment/kubernetes/minikube/ingress.yml)
- [*deployment* and *service* for a Postgres database server](deployment/kubernetes/minikube/frontend.yml) with a very basic config, data will be lost when the cluster is shut down
#### Setup
If you want to run this app on your own Minikube cluster, follow these steps:
##### Prerequisites
- [install kubectl](https://kubernetes.io/docs/tasks/tools/) , a command-line tool to run commands against Kubernetes clusters
- [install Minikube](https://minikube.sigs.k8s.io/docs/start/), a nimble Kubernetes cluster for local development
- [install mkcert](https://github.com/FiloSottile/mkcert), a simple zero-config tool to generate locally-trusted TLS certificates
- if you are using Docker for Mac, [install docker-mac-net-connect](https://github.com/chipmk/docker-mac-net-connect) to access the Minikube node directly, without tunneling / port-binding 

##### Kubernetes Setup
- run [this setup script](deployment/kubernetes/minikube/setup.sh) to prepare the Minikube cluster:
```bash
./deployment/kubernetes/minikube/setup.sh
```

- add an entry for your app to your `/etc/hosts` file (`rides.app` by default)
```bash
sudo -- sh -c -e "echo '$(minikube ip) $MINIKUBE_HOST' >> /etc/hosts";
```

- open the app [in your browser](https://rides.app/) 🎉
##### Kubernetes Deployment
- to deploy a new version of a service, run [this deploy script](deployment/kubernetes/minikube/deploy.sh) with a `VERSION` of your choice (it is used to tag the image) and the service name (`simulator`, `frontend` or `backend`):
```bash
VERSION=2 ./deployment/kubernetes/minikube/deploy.sh simulator
```
- open the app [in your browser](https://rides.app/) 🎉
- you can check that all pods are running with:
```bash
kubectl get pods
```

- check the live logs from the simulator service:
```bash
kubectl logs -f -l app=simulator
```

### Cloud Kubernetes
By now the app is already running in a local Kubernetes cluster. Time to move things into the cloud! Much of the Kubernetes config from the previous section can be re-used here, with only slight modifications. However, a whole new area needs to be considered now: infrastructure. In other words, the cloud resources such as virtual machines, database server, Kubernetes cluster, virtual network, container registry and other moving parts that actually allow the application to run in the cloud.

In the local setup, Minikube took care of most of these moving parts (virtual machine, Kubernetes cluster, virtual network). A container registry was not necessary yet. I only needed to add a Postgres database server and a local "DNS entry" in my `hosts` file, and that was it.

The Rides app can be run with any of the big cloud service providers (AWS, Google Cloud, Azure, Digital Ocean etc.) - the infrastructure is pretty vanilla and contains no special components. I went with [Azure](https://azure.microsoft.com/) to gain some more experience with it (most of my past experience has been with AWS).

I could have just clicked together the necessary parts by hand in the Azure Portal, but I wanted to lay down the *infrastructure as code* with [Terraform](https://www.terraform.io/). It can be used to automate the provisioning and management of resources in any cloud.

I prepared Terraform config scripts for the automatic creation of the following cloud resources:
- **[resource group](infrastructure/resource-group.tf)**: a meta resource that logically groups all the other resources
- **[networking](infrastructure/networking.tf)**: a virtual network, subnets and private DNS to hook everything together
- **[container registry](infrastructure/container-registry.tf)**: a private registry where the Docker images can be stored
- **[kubernetes cluster](infrastructure/kubernetes-cluster.tf)**: a simple Kubernetes cluster with one node (for test purposes only and to keep costs low, would have to be more in production obviously) and the access config to the container registry
- **[database](infrastructure/database.tf)**: a Postgres server and a database in it, along with variables that allow you to choose your own username and password for it; just like in the Minikube setup above, the cluster will be *stateless* and the database server will run outside of it
- **[variables](infrastructure/variables.tf)**: dynamic parts of the infra config such as app name, Azure region and Kubernetes version can be set here

The Docker images that I built in the previous Minikube section can be re-used here (they may need new tags though). This allows for a nice workflow:

- build production-ready Docker images of one or more services
- test them in the local Minikube cluster and make adjustments if necessary
- when ready, push the Docker images to a container registry
- run a deployment to the cloud cluster, which will pull the images from the registry
#### Setup
If you want to run the app in a Kubernetes cluster in Azure, follow the steps below. I keep things a bit more high-level here than in the previous sections, and will link to some external resources for more detailed explanations. All the necessary Terraform and Kubernetes config to get up and running is in the repo though!
##### Prerequisites
- [set up your Azure account](https://azure.microsoft.com/de-de/free/) and get $200 of free credit (plenty for testing of this app, and to be used within the first 30 days)
- [install the Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) to manage Azure from your shell
- [sign in with Azure CLI](https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli)
- [install Terraform](https://developer.hashicorp.com/terraform/downloads)
##### Infrastructure
- change to the infrastructure directory in this repo:
```bash
cd infrastructure
```

- initialize Terraform to prepare the necessary provider plugins:
```bash
terraform init
```

- Apply the Terraform configuration to create all necessary resources in your Azure account. It will prompt for a few inputs:
	- **app_name**: This will be used to name most of the resources to be provisioned. So if you enter `rides` for example, your Kubernetes cluster will be called `rides` and your database server will be called `rides-dbserver`.
	- **registry_name**: The name of the container registry. It will be used as a subdomain for the registry URL (`<registry_name>.azurecr.io`), so it needs to be unique Azure-wide (the value `rides` is already taken here).
	- **db_username** and **db_password**: username and password for the database server - remember these values for later

```bash
terraform apply
```

- double-check in the [Azure Portal](https://portal.azure.com/) that all resources have been created successfully
- the infrastructure is ready now 🎉
##### Kubernetes setup
- [connect kubectl to your newly provisioned AKS cluster](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli#connect-to-the-cluster)
- Prepare your `.env` file ([see above](#deployment)) and update your `.env` file with personal settings for:
	- **CONTAINER_REGISTRY**: This is the domain of your registry as created above by Terraform. If you named it `my-rides`, then your value here would be `my-rides.azurecr.io`.
	- **LETSENCRYPT_EMAIL**: We will set up [LetsEncrypt](https://letsencrypt.org/) in a bit to automatically provide TLS certificates for our app. Enter your mail address here for notifications related to your certificates.
	- **CLOUD_DOMAIN**: The app an either be reached on a custom domain of your own (e.g. `rides.yourdomain.com`) or an Azure-managed FQDN (e.g. `rides.westeurope.cloudapp.azure.com`). Enter your intended domain here, it will be used both to set up the ingress and to generate suitable TLS config for it.
	- **KC_CONTEXT_CLOUD**: The `kubectl` tool defines a context for each Kubernetes cluster it connects to. If you followed along with the previous Minikube section and created the infrastructure for your app named `rides` in this section, then the output of `kubectl config get-contexts` should show you two contexts: `minikube` and `rides`. In this variable here, enter the name of your cloud Azure cluster.
- run the setup script to deploy an [nginx ingress controller](https://kubernetes.github.io/ingress-nginx/):
```bash
./deployment/cloud/setup.sh
```

- [Set up TLS with the ingress controller ](https://learn.microsoft.com/en-us/azure/aks/ingress-tls?tabs=azure-cli). This is probably the most complex step here (and I have not found a way yet to automate it). A few things to note here when you go through the linked article:
	- Take the "Use TLS with Let's Encrypt certificates" path, and ignore the instructions about "Secrets Store CSI Driver".
	- Whenever you see commands with the namespace `ingress-basic`, replace it with `ingress-nginx`, as that is the namespace where the script from the previous script deployed the controller.
	- The article gives you a choice between static or dynamic public IP address. I went with a dynamic IP, as it saves some configuration. Azure's naming is a bit confusing, as the dynamic IP will remain static for the lifespan of the ingress controller, which is good enough here, but it will not remain when you delete the controller.
	- I went for a custom domain name, but you can also use an Azure-based FQDN when you do not have a domain of your own at your disposal.
	- In the section "Update your ingress route", do not follow their "Hello World" example, but instead apply the changes to [this ingress manifest](https://github.com/hauraki/rides/blob/master/deployment/cloud/ingress.yml).
- follow the instructions in the [secrets manifest](https://github.com/hauraki/rides/blob/master/deployment/cloud/secrets.example.yml) to set up a secret for the Postgres database connection
##### Kubernetes deployment
- build images for all services and push them to the private container registry (the `VERSION` is used to tag the images):
```bash
VERSION=1 ./deployment/cloud/publish.sh
```
- finally, deploy the images to the Kubernetes cluster in the cloud:
```bash
VERSION=1 ./deployment/cloud/deploy.sh
```
- check the three pods for frontend, simulator and backend are running with:
```bash
kubectl get pods
```
- open the app in your browser, on your previously configured domain 🎉
- check the live logs from the simulator service:
```bash
kubectl logs -f -l app=simulator
```

- rinse and repeat for future deployments
##### Cleanup
- once you are done with all your testing, make sure to delete all your resources in order not to incur unnecessary costs in your Azure subscription:
```bash
terraform destroy
```

- double-check in the [Azure Portal](https://portal.azure.com/) that all resources have been removed successfully!

### Continuous delivery
At this point, the app is already running on a Kubernetes cluster in the Azure cloud. One more thing I wanted to add as icing on the cake is continuous delivery.

I decided to go with [Github Actions](https://github.com/features/actions), as this repo is already hosted in Github and their Actions services make it really easy to trigger workflows based on any changes.

Many CD services come with an assumption of (only) one deployment workflow per code repository. The Rides app here is hosted in a [monorepo](https://monorepo.tools/) though with multiple services, and I would like to have independent deployment workflows for each service. Turns out this is easy to do with Github Actions!

I defined [workflows](https://github.com/hauraki/rides/tree/master/.github/workflows) for each service (frontend, simulator, backend) that are triggered whenever a change to the according service directory (within the `application` parent directory) is pushed. Each of the services can also be easily deployed with a button click in the Github Actions UI.

In order to get these workflows working in your own repo, you would need to set up a few variables and secrets within the config of your repo:
- **CONTAINER_REGISTRY** variable: the domain of your private container registry, see the [Cloud Kubernetes](#cloud-kubernetes) section above for details
- **REGISTRY_UN** variable: the username for your registry (get it from Azure Portal)
- **REGISTRY_PW** secret: the password for your registry (get it from Azure Portal)
- **KUBE_CONFIG** secret: configuration of `kubectl` so it can access your cloud cluster, see [these instructions](https://github.com/marketplace/actions/kubernetes-cli-kubectl) for details

Whenever the workflows deploy a new version of a service, the commit hash of that deployed version will be automatically used as `VERSION` to tag the Docker images for deployment.
## Outro
Congrats on making it to the end of this article! I hope you enjoyed the Rides ;) - and are feeling a bit more excited now to build and deploy some distributed app of your own now.

Thanks again to Juraj Majerik for [the original Rides app](https://jurajmajerik.com/) and Ashley Davis for his [Bootstrapping Microservices book](https://www.manning.com/books/bootstrapping-microservices-with-docker-kubernetes-and-terraform), both have been very inspiring for this project!

If you'd like to work with me, find out more about me on [my website](http://hauraki.de/).

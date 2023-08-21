#
# Sets up a local Minikube cluster
#
# Usage:
#
#   ./deployment/kubernetes/minikube/setup.sh
#

set -u # or set -o nounset
: "$MINIKUBE_POSTGRES_PASSWORD"
: "$MINIKUBE_POSTGRES_URL"
: "$MINIKUBE_HOST"
: "$CONTAINER_REGISTRY"

# launch local cluster
minikube start

# enable the ingress addon
minikube addons enable ingress

# create a deployment and service for a simple Postgres server
envsubst < ./deployment/kubernetes/minikube/database.yml | kubectl apply -f -

# generate a certificate
mkcert $MINIKUBE_HOST

# create a Kubernetes secret with the certificate
kubectl create secret tls rides-ingress-cert --key"=$MINIKUBE_HOST-key.pem" --cert="$MINIKUBE_HOST.pem"

# remove the certificate files
rm $MINIKUBE_HOST.pem $MINIKUBE_HOST-key.pem

# create a Kubernetes secret with the database connection string
kubectl create secret generic rides-database --from-literal="connection-string=$MINIKUBE_POSTGRES_URL"

# build and deploy the first revision of each microservice
VERSION=1 FULL_DEPLOY=1 ./deployment/kubernetes/minikube/deploy.sh simulator
VERSION=1 FULL_DEPLOY=1 ./deployment/kubernetes/minikube/deploy.sh backend
VERSION=1 FULL_DEPLOY=1 ./deployment/kubernetes/minikube/deploy.sh frontend

# configure the ingress
envsubst < ./deployment/kubernetes/minikube/ingress.yml | kubectl apply -f -

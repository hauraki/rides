#
# Builds and deploys a microservice to a local Minikube cluster
#
# Usage:
#
#   VERSION=2 ./deployment/kubernetes/minikube/deploy.sh simulator
#

set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: "$VERSION"
: ${FULL_DEPLOY:=0}
: "$1"

# make VERSION available to child processes

export VERSION

# The image could be built directly in Minikube, but then it would need to be
# rebuilt locally later before pushing it to a cloud container registry, e.g.
# Azure Container Registry. So build locally directly and load it into Minikube.

echo "Building $1 image..."
docker build -t $CONTAINER_REGISTRY/$1:$VERSION -f ./application/$1/Dockerfile-prod ./application/$1

echo "Loading $1 image into Minikube..."
minikube image load $CONTAINER_REGISTRY/$1:$VERSION

echo "Deploying $1 to Minikube cluster..."
kubectl config use-context minikube

if [ "$FULL_DEPLOY" = "1" ]; then
  IMAGE_PULL_POLICY="Never"
  envsubst < ./deployment/kubernetes/shared/$1.yml | kubectl apply -f -
else
  kubectl set image deployment/$1 $1=$CONTAINER_REGISTRY/$1:$VERSION
fi

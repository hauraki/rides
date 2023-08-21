#
# Builds and deploys a microservice to a cloud cluster
#
# Usage:
#
#   VERSION=2 ./deployment/kubernetes/cloud/deploy.sh simulator
#

set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: "$KC_CONTEXT_CLOUD"
: "$CLOUD_DOMAIN"
: "$VERSION" 
: ${FULL_DEPLOY:=0}
: "$1"

# make VERSION available to child processes

export VERSION

# The image may have been built already for Minikube, in that case the builder 
# will hit the cache. Either way, it is built and then pushed to the registry.

echo "Building $1 image..."
docker build -t $CONTAINER_REGISTRY/$1:$VERSION -f ./application/$1/Dockerfile-prod ./application/$1

echo "Pushing $1 image to container registry..."
echo $REGISTRY_PW | docker login $CONTAINER_REGISTRY --username $REGISTRY_UN --password-stdin
docker push $CONTAINER_REGISTRY/$1:$VERSION

echo "Deploying $1 to cloud cluster..."
kubectl config use-context $KC_CONTEXT_CLOUD

if [ "$FULL_DEPLOY" = "1" ]; then
  IMAGE_PULL_POLICY="Never"
  envsubst < ./deployment/kubernetes/shared/$1.yml | kubectl apply -f -
else
  kubectl set image deployment/$1 $1=$CONTAINER_REGISTRY/$1:$VERSION
fi

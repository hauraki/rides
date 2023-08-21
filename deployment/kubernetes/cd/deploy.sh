#
# Builds and deploys a microservice to a cloud cluster from Github Actions
#
# Usage:
#
#   VERSION=2 ./deployment/kubernetes/cloud/deploy.sh simulator
#

set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: "$REGISTRY_UN"
: "$REGISTRY_PW"
: "$VERSION" 
: "$1"

echo "Building $1 image..."
docker build -t $CONTAINER_REGISTRY/$1:$VERSION -f ./application/$1/Dockerfile-prod ./application/$1

echo "Pushing $1 image to container registry..."
echo $REGISTRY_PW | docker login $CONTAINER_REGISTRY --username $REGISTRY_UN --password-stdin
docker push $CONTAINER_REGISTRY/$1:$VERSION

echo "Deploying $1 to cloud cluster..."
kubectl set image deployment/$1 $1=$CONTAINER_REGISTRY/$1:$VERSION

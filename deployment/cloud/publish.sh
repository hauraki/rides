#
# Builds and publishes all microservices
#
# Usage:
#
#   VERSION=7 ./deployment/cloud/publish.sh
#

set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: "$VERSION"

# Images may have been built already for a local Minikube deploy earlier
# in which case they will be re-used from the cache here. 

docker build -t $CONTAINER_REGISTRY/backend:$VERSION -f ./application/backend/Dockerfile-prod ./application/backend
docker build -t $CONTAINER_REGISTRY/simulator:$VERSION -f ./application/simulator/Dockerfile-prod ./application/simulator
docker build -t $CONTAINER_REGISTRY/frontend:$VERSION -f ./application/frontend/Dockerfile-prod ./application/frontend

# Push images to container registry

echo $REGISTRY_PW | docker login $CONTAINER_REGISTRY --username $REGISTRY_UN --password-stdin
docker push $CONTAINER_REGISTRY/backend:$VERSION
docker push $CONTAINER_REGISTRY/simulator:$VERSION
docker push $CONTAINER_REGISTRY/frontend:$VERSION

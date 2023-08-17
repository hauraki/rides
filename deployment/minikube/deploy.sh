#
# Builds and deploys all microservices to a local Minikube cluster
#
# Usage:
#
#   ./deployment/minikube/deploy.sh
#

set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: ${VERSION:=latest}

# make VERSION available to child processes

export VERSION

# Images could be built directly in Minikube, but then they would need to be
# rebuilt locally later before pushing them to a cloud container registry, e.g.
# Azure Container Registry. So build locally directly and load them into Minikube.

docker build -t $CONTAINER_REGISTRY/backend:$VERSION -f ./application/backend/Dockerfile-prod ./application/backend
docker build -t $CONTAINER_REGISTRY/simulator:$VERSION -f ./application/simulator/Dockerfile-prod ./application/simulator
docker build -t $CONTAINER_REGISTRY/frontend:$VERSION -f ./application/frontend/Dockerfile-prod ./application/frontend

# Load images into Minikube

echo "Loading images into Minikube..."
minikube image load $CONTAINER_REGISTRY/backend:$VERSION
minikube image load $CONTAINER_REGISTRY/simulator:$VERSION
minikube image load $CONTAINER_REGISTRY/frontend:$VERSION

# 
# Deploy containers to Kubernetes.
#

echo "Applying Kubernetes configuration..."
kubectl config use-context minikube
kubectl apply -f ./deployment/minikube/secrets.yml
envsubst < ./deployment/minikube/backend.yml | kubectl apply -f -
envsubst < ./deployment/minikube/simulator.yml | kubectl apply -f -
envsubst < ./deployment/minikube/frontend.yml | kubectl apply -f -
kubectl apply -f ./deployment/minikube/ingress.yml

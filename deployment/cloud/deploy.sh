#
# Deploys all microservices to a cloud cluster
#
# Usage:
#
#   VERSION=7 ./deployment/cloud/deploy.sh
#

set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: "$KC_CONTEXT_CLOUD"
: "$CLOUD_DOMAIN"
: "$VERSION" 

# make VERSION available to child processes

export VERSION

# 
# Deploy containers to Kubernetes.
#

echo "Applying Kubernetes configuration..."
kubectl config use-context $KC_CONTEXT_CLOUD
kubectl apply -f ./deployment/cloud/secrets.yml
envsubst < ./deployment/cloud/backend.yml | kubectl apply -f -
envsubst < ./deployment/cloud/simulator.yml | kubectl apply -f -
envsubst < ./deployment/cloud/frontend.yml | kubectl apply -f -
envsubst < ./deployment/cloud/ingress.yml | kubectl apply -f -

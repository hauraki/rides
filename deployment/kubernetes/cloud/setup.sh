#
# Sets up the cloud cluster in AKS (Azure), only needs to be done once.
#
# Usage:
#
#   ./deployment/cloud/setup.sh
#


kubectl config use-context $KC_CONTEXT_CLOUD

# Install nginx ingress controller in Azure, see https://kubernetes.github.io/ingress-nginx/deploy/#azure
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# build and deploy the first revision of each microservice
echo "Deploying the first revision of each microservice..."
VERSION=1 FULL_DEPLOY=1 ./deployment/kubernetes/cloud/deploy.sh simulator
VERSION=1 FULL_DEPLOY=1 ./deployment/kubernetes/cloud/deploy.sh backend
VERSION=1 FULL_DEPLOY=1 ./deployment/kubernetes/cloud/deploy.sh frontend

# Set up TLS, see https://learn.microsoft.com/en-us/azure/aks/ingress-tls?tabs=azure-cli
echo "Follow steps on https://learn.microsoft.com/en-us/azure/aks/ingress-tls?tabs=azure-cli to set up TLS.

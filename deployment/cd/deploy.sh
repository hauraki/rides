set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: "$NAME"
: "$VERSION"

envsubst < ./deployment/cd/${NAME}.yml | kubectl apply -f -

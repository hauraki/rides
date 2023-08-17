set -u # or set -o nounset
: "$CONTAINER_REGISTRY"
: "$VERSION"
: "$NAME"
: "$DIRECTORY"

docker build -t $CONTAINER_REGISTRY/$NAME:$VERSION -f ./application/$DIRECTORY/Dockerfile-prod ./application/$DIRECTORY

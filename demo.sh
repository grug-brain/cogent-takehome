#!/bin/bash

# 1. Build the Docker image
echo "Building Docker image..."
docker build --quiet -t express .
echo "Docker image built successfully"

# 2. Start the services
echo "Starting services with docker-compose..."
docker-compose up -d

# 3. Poll until the service is up
echo "Waiting for the service to be up..."
until $(curl --output /dev/null --silent --head --fail 127.0.0.1:3000/health); do
    printf '.'
    sleep 1
done
echo "Service is up!"

# 4. Create the job and immediately execute it
echo "Posting an image to the web server..."
JOB_ID=$(curl -s https://cataas.com/cat | curl -X POST -H "Content-Type: image/jpg" --data-binary @- http://localhost:3000/job | jq -r '.id')
echo "job id: $JOB_ID"

# 5. Poll the job status until done
echo "Waiting for image to process..."
while true; do
    response=$(curl -s 127.0.0.1:3000/job/$JOB_ID)
    url=$(echo "$response" | jq -r '.url // empty')
    
    if [[ ! -z "$url" ]]; then
        echo "Image processed! URL: $url"
        break
    else
        printf '.'
        sleep 1
    fi
done

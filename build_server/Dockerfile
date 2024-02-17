FROM ubuntu:focal

RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get upgrade -y && \
    apt-get install -y nodejs git && \
    apt-get clean

WORKDIR /home/app

# Copy main.sh, script.js, and package*.json files into the container
COPY main.sh main.sh
COPY script.js script.js
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Set permissions for main.sh and script.js
RUN chmod +x main.sh
RUN chmod +x script.js

# Set main.sh as the entrypoint
ENTRYPOINT [ "/home/app/main.sh" ]

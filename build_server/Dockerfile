FROM ubuntu:focal

RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get upgrade -y && \
    apt-get install -y nodejs git && \
    apt-get clean

WORKDIR /home/app

COPY main.sh main.sh

RUN chmod +x main.sh

ENTRYPOINT [ "/home/app/main.sh" ]


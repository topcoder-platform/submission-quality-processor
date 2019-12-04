# Use the base image with Open JDK 8
FROM openjdk:8-jdk-slim

# Install Node.js

RUN apt-get update -y \
    && apt-get install curl gnupg git python-dev build-essential -y --no-install-recommends \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt-get install nodejs -y --no-install-recommends \
    && apt-get install unzip -y

# Install Sonarqube CLI

WORKDIR /opt

RUN curl --insecure -o ./sonarscanner.zip -L https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-3.2.0.1227-linux.zip
RUN unzip sonarscanner.zip
RUN rm sonarscanner.zip
RUN mv sonar-scanner-3.2.0.1227-linux sonar-scanner

ENV SONAR_RUNNER_HOME=/opt/sonar-scanner
ENV PATH $PATH:/opt/sonar-scanner/bin

# Copy the current directory into the Docker image
COPY . /submission-quality-processor

# Set working directory for future use
WORKDIR /submission-quality-processor

# Install the dependencies from package.json
RUN npm install

ENTRYPOINT npm start

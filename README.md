# Topcoder SonarQube Scorer Processor

## Dependencies

- nodejs https://nodejs.org/en/ (v10)
- Kafka (v2)
- Sonarqube Server
- Sonarqube CLI Scanner
- Docker for local deployment of Sonarqube Server

## Setting up the pre-requisities

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the downloaded tgz file
- go to the extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create some topics:

```bash
  bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.create
  bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.update
```

- verify that the topics are created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topics
- run the producer and then write some message into the console to send to the topic `submission.notification.create`:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic submission.notification.create`
- In the console, write some message, one message per line. E.g:

```bash
{ "topic":"submission.notification.create", "originator":"submission-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "resource":"review", "id": "d34d4180-65aa-42ec-a945-5fd21dec0502", "score": 100, "typeId": "6da98d0f-e663-4539-8507-cd6c9e0e56d8", "reviewerId": "c23a4180-65aa-42ec-a945-5fd21dec0503", "scoreCardId": "b25a4180-65aa-42ec-a945-5fd21dec0503", "submissionId": "2561b61b-7f73-48a3-8a01-0891ad503c52", "created": "2018-05-20T07:00:30.123Z", "updated": "2018-06-01T07:36:28.178Z", "createdBy": "admin", "updatedBy": "admin" } }
```

- optionally, use another terminal, go to same directory, start a consumer to view the messages:

```bash
  bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic submission.notification.create --from-beginning
```

- writing/reading messages to/from other topics are similar

## Local Sonarqube Server setup

Assuming you have already installed docker in your system, execute the below command

```bash
docker pull sonarqube:6.7.5
```

Please note that sonarqube in docker uses H2 which uses the same port as Kafka (9092). Hence while bringing up Sonarqube server, we need to map the port 9092 (Container port) to 9093 (Host port)

```bash
docker run -d --name sonarqube -p 9000:9000 -p 9093:9092 sonarqube:6.7.5
```

Once you execute the above command, Sonarqube server will be up and running in few seconds at `http://localhost:9000`. If you are using locally deployed Sonarqube server, SONARQUBE_SERVER_URL will be `http://localhost:9000` which is already set in config/default.js

To run analysis in our application, We need to generate a token in Sonarqube server and use it while analyzing in Sonarqube Scanner CLI. Please follow the below steps to generate token

Assuming you are using Local Sonarqube server

1. Navigate to http://localhost:9000

2. Login with username and password as `admin`

3. Navigate to http://localhost:9000/admin/users

4. Under the column `Tokens`, click on the Notes icon. It will open a pop up

5. In the pop up, enter a name for token and click generate

6. You need to save the generated token which should be saved in environment variable as `SONARQUBE_TOKEN`

7. You need to setup webhooks next. Check out the deployment steps for the [Submission Quality Api](https://github.com/topcoder-platform/submission-quality-api)

## Sonarqube Scanner CLI Setup

- Follow the instructions at https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner to install Sonarqube scanner CLI in your local machine.

- sonar-scanner should be available in your PATH

## Configuration

Configuration for the application is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level
- PORT: the server port
- KAFKA_URL: comma separated Kafka hosts
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- CREATE_DATA_TOPIC: Kafka topic related to creation
- UPDATE_DATA_TOPIC: Kafka topic related to update
- SUBMISSION_API_URL: Submission API URL
- SONARQUBE_SERVER_URL: Sonarqube Server URL
- SONARQUBE_TOKEN: Token generated from Sonarqube Server
- DOWNLOAD_DIR: Download directory stores the files downloaded from S3. Path specified should be relative to the project directory
- All variables starting with prefix `AUTH0` corresponds to Auth0 related credentials

## Local deployment

1. From the project root directory, run the following command to install the dependencies

    ```bash
    npm i
    ```

2. To run linters if required

```bash
npm run lint

npm run lint:fix # To fix possible lint errors
```

3. Ensure that environment variables are set as required

4. Start the processor and express server

```bash
npm start
```

## Verification

1. Ensure that Kafka is up and running and the topics `submission.notification.create, submission.notification.update` are created in Kafka

2. Ensure that Sonarqube Scanner CLI is installed and available in your PATH

3. Ensure that Sonarqube Server is up and running. Generate token following the steps mentioned in `Setting up pre-requisities`

4. Ensure that environment variables are set as required.

5. Start the application

6. Attach to the topic `submission.notification.create` using Kafka console producer

```bash
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic submission.notification.create
```

7. Write a message with following structure to the console.

```bash
{ "topic":"submission.notification.create", "originator":"submission-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "resource":"review", "id": "d34d4180-65aa-42ec-a945-5fd21dec0502", "score": 100, "typeId": "6da98d0f-e663-4539-8507-cd6c9e0e56d8", "reviewerId": "c23a4180-65aa-42ec-a945-5fd21dec0503", "scoreCardId": "b25a4180-65aa-42ec-a945-5fd21dec0503", "submissionId": "2561b61b-7f73-48a3-8a01-0891ad503c52", "created": "2018-05-20T07:00:30.123Z", "updated": "2018-06-01T07:36:28.178Z", "createdBy": "admin", "updatedBy": "admin" } }
```

Also, if the SUBMISSION_API_URL is set to `https://api.topcoder-dev.com/v5`, Please use one of the submissionIds already existing in Dev Database. I have listed few IDs below. Please use it in `id` field of the Kafka message. While creating review, Submission API will verify the existence of submission in the database, hence using these id's is necessary.

```bash
2561b61b-7f73-48a3-8a01-0891ad503c52
```

8. You will be able to see in the console that message is processed

9. Analysis results could be viewed at Sonar Qube server as well. Submission ID will be the project name.

## Running unit tests

To run tests, following Environment variables need to be set up

- TEST_SONARQUBE_SERVER_URL SonarQube Server URL for Testing
- TEST_SONARQUBE_TOKEN Token to connect SonarQube test server

To run unit tests

```bash
npm run test
```

## Local Deployment with Docker

To run the Submission quality processor using docker, follow the below steps

1. Navigate to the directory `docker`

2. Rename the file `sample.api.env` to `api.env`

3. Set the required Auth0, Sonarqube credentials and Submission API URL in the file `api.env`

4. Once that is done, run the following command

    ```bash
    docker-compose up
    ```

5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

# Topcoder SonarQube Scorer Processor

## Dependencies

- nodejs https://nodejs.org/en/ (v10)
- Kafka (v2)
- Sonarqube Server
- Sonarqube CLI Scanner
- Active AWS Account
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
```  
  bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.create
  bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.update
```
- verify that the topics are created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topics
- run the producer and then write some message into the console to send to the topic `submission.notification.create`:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic submission.notification.create`
- In the console, write some message, one message per line:
E.g.
```
{ "topic":"submission.notification.create", "originator":"submission-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "resource":"submission", "id":"a12a4180-65aa-42ec-a945-5fd21dec0504", "url":"https://s3.amazonaws.com/tc-clean/toh-pt6.zip", "fileType": "zip", "isFileSubmission":false } }
```
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
```
  bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic submission.notification.create --from-beginning
```
- writing/reading messages to/from other topics are similar

## Local Sonarqube Server setup

Assuming you have already installed docker in your system, execute the below command

```
docker pull sonarqube:6.7.5
```

Please note that sonarqube in docker uses H2 which uses the same port as Kafka (9092). Hence while bringing up Sonarqube server, we need to map the port 9092 (Container port) to 9093 (Host port)

```
docker run -d --name sonarqube -p 9000:9000 -p 9093:9092 sonarqube:6.7.5
```

Once you execute the above command, Sonarqube server will be up and running in few seconds at http://localhost:9000. If you are using locally deployed Sonarqube server, SONARQUBE_SERVER_URL will be `http://localhost:9000` which is already set in config/default.js 

To run analysis in our application, We need to generate a token in Sonarqube server and use it while analyzing in Sonarqube Scanner CLI. Please follow the below steps to generate token

Assuming you are using Local Sonarqube server

1. Navigate to http://localhost:9000

2. Login with username and password as `admin`

3. Navigate to http://localhost:9000/admin/users

4. Under the column `Tokens`, click on the Notes icon. It will open a pop up

5. In the pop up, enter a name for token and click generate

6. You need to save the generated token which should be saved in environment variable as `SONARQUBE_TOKEN`

### Setting up Webhooks

1. Find out device level public IP address of your machine by executing `ifconfig` command (For Linux). `ipconfig` for windows

You will see some output like this
```
br-6280c84d0e2f Link encap:Ethernet  HWaddr 02:42:01:73:38:1b  
          inet addr:172.19.0.1  Bcast:172.19.255.255  Mask:255.255.0.0
```

Choose one of the IP Address in Ethernet name. In the above case it is 172.19.0.1

Webhook address to be used will be http://172.19,0.1:3000/scan/webhook

2. Navigate to http://localhost:9000/admin/settings?category=webhooks

3. Add name to your webhook and enter the URL found in the 1st step and save.

4. Alternatively, use [ngrok](https://ngrok.com/) and set it up to listen to port 3000 (the default one)

## Sonarqube Scanner CLI Setup

- Follow the instructions at https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner to install Sonarqube scanner CLI in your local machine.

- sonar-scanner should be available in your PATH

## AWS related set up

1. Download your AWS Credentials from AWS Console. Refer [AWS Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)

2. Depending on your Operating System, create AWS credentials file in the path listed below

```
Linux, Unix, and macOS users: ~/.aws/credentials

Windows users: C:\Users\USER_NAME\.aws\credentials
```

3. credentials file should look like below

```
[default]
aws_access_key_id = SOME_ACCESS_KEY_ID
aws_secret_access_key = SOME_SECRET_ACCESS_KEY
```

4. Credentials can be set in environment variables too. Refer - https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html

5. Create a S3 bucket from AWS Console

6. Upload few code related zip files to the bucket for testing the application

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
- AWS_REGION: AWS Region used for creating buckets. Default value is 'us-east-1'
- All variables starting with prefix `AUTH0` corresponds to Auth0 related credentials

## Local deployment

1. From the project root directory, run the following command to install the dependencies

```
npm i
```

2. To run linters if required

```
npm run lint

npm run lint:fix # To fix possible lint errors
```

3. Ensure that environment variables are set as required

4. Start the processor and express server

```
npm start
```

## Verification

1. Ensure that Kafka is up and running and the topics `submission.notification.create, submission.notification.update` are created in Kafka

2. Ensure that Sonarqube Scanner CLI is installed and available in your PATH

3. Ensure that Sonarqube Server is up and running. Generate token following the steps mentioned in `Setting up pre-requisities`

4. Ensure that environment variables are set as required.

5. Start the application

6. Attach to the topic `submission.notification.create` using Kafka console producer

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic submission.notification.create
``` 

7. Write a message with following structure to the cosole. **NOTE: You would need to use the URL of zip file from your S3 bucket**

```
{ "topic":"submission.notification.create", "originator":"submission-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "resource":"submission", "id":"d0a16037-54ae-46bc-ae43-298b74683644", "url":"https://s3.amazonaws.com/tc-clean/testFile.zip", "fileType": "zip", "isFileSubmission":false } }
```

Also, if the SUBMISSION_API_URL is set to `https://api.topcoder-dev.com/v5`, Please use one of the submissionIds already existing in Dev Database. I have listed few IDs below. Please use it in `id` field of the Kafka message. While creating review, Submission API will verify the existence of submission in the database, hence using these id's is necessary.

```
a34e1158-2c27-4d38-b079-5e5cca1bdcf7
7620a69c-0176-4715-815b-73b851c80edb
d0a16037-54ae-46bc-ae43-298b74683644
3f5db3d9-f847-4733-a7ec-136875f1b73e
```

8. You will be able to see in the console that message is processed

9. Analysis results could be viewed at Sonar Qube server as well. Submission ID will be the project name.

10. To verify that review has been created properly, Assuming you are using Topcoder Dev Submission API as `SUBMISSION_API_URL`, Login to https://lauscher.topcoder-dev.com/ with `TonyJ:appirio123`. Check the data posted in topic `submission.notification.create`

11. You will be able to see the review payload

## Running unit tests

To run tests, following Environment variables need to be set up

- TEST_SONARQUBE_SERVER_URL SonarQube Server URL for Testing
- TEST_SONARQUBE_TOKEN Token to connect SonarQube test server

To run unit tests

```
npm run test
```


**Note:**

3 security vulnerabilities reported during npm install is from the existing Topcoder package `tc-core-library-js` which is necessary to generate M2M tokens.

https://github.com/appirio-tech/tc-core-library-js/blob/master/package.json

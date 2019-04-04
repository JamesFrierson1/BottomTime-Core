# BottomTime Service
This repository is home to the Bottom Time application backend API service.

#### Build Status
Master [![CircleCI](https://circleci.com/gh/ChrisCarleton/BottomTime-Core/tree/master.svg?style=svg&circle-token=b4c86baca538392eeb5676fd14ef920f2cc44857)](https://circleci.com/gh/ChrisCarleton/BottomTime-Core/tree/master)

Production [![CircleCI](https://circleci.com/gh/ChrisCarleton/BottomTime-Core/tree/prod.svg?style=svg&circle-token=b4c86baca538392eeb5676fd14ef920f2cc44857)](https://circleci.com/gh/ChrisCarleton/BottomTime-Core/tree/prod)

Test Coverage [![Coverage Status](https://coveralls.io/repos/github/ChrisCarleton/BottomTime-Core/badge.svg?branch=master)](https://coveralls.io/github/ChrisCarleton/BottomTime-Core?branch=master)

Dependencies [![Dependencies](https://david-dm.org/ChrisCarleton/BottomTime-Core.svg)](https://david-dm.org/ChrisCarleton/BottomTime-Core)

## Environment Variables
The application is configured through the use of environment variables. Any of these can be set to change
the behaviour of the running application:

* **BT_FRIEND_LIMIT** Sets the maximum number of friends users are limitted to. The default is 1000.
* **BT_LOG_FILE** Setting this to a file name will force the application to write its logs to the file
rather than `stdout`.
* **BT_LOG_LEVEL** Sets the level of verbosity of the log output. Valid values are `trace`, `debug`, `info`,
`warn`, `error`, and `fatal`. The default is `debug`.
* **BT_MONGO_ENDPOINT** Sets the connection string for the MongoDB database. The default is
`mongodb://localhost/dev`.
* **BT_PORT** Can be set to override the default port the application listens for requests on. The default
is 29201.
* **BT_SESSION_SECRET** Sets the secret used to encrypt/decrypt session cookies. This doesn't really matter
for testing but should definitely be set to a secure value in production to prevent session hijacking.
* **BT_SITE_URL** Tells the application the base URL of the site. E.g. `https://www.bottomtime.ca/`. This
is important for some components of the application that need to return or provide URLs.
* **BT_SMTP_HOST** The hostname of the SMTP server used for sending out e-mails. Default is `localhost`.
* **BT_SMTP_PASSWORD** The password used to authenticate with the SMTP server.
* **BT_SMTP_PORT** The port number on which the SMTP server should be contacted. The default is `15025`.
* **BT_SMTP_USE_TLS** Whether or not to use TLS (secure connection) when connecting to the SMTP server.
Must be `true` or `false`. Default is `false`.
* **BT_SMTP_USERNAME** The username used to authenticate with the SMTP server.
* **BT_SUPPORT_EMAIL** An e-mail address that users of the site can send e-mails to for support. This will
typically be sent out in emails generated by the service.
* **BT_MONGO_ENDPOINT** Sets the connection string for the MongoDB database. The default is
`mongodb://localhost/dev`.

## API Documentation
See the full API documentation [here](docs/API.md)!

## Local Development
You'll need the following installed:

* **[Node.js](https://nodejs.org/en/download/)**
* **[Docker](https://www.docker.com/)**
* **Gulp CLI** which can be installed via npm: `npm install -g gulp-cli`.
* **Bunyan** (optional) is a nice tool for formatting the application's log output into a human-readable
form. `npm install -g bunyan`

The source code for the service itself lives in the `service/` directory and the unit/integration tests live
in the `tests/` directory.

A number of Gulp commands can be run to accomplish various tasks:
* `gulp lint` lints the code files for code smells.
* `gulp test` runs the test suite.
* `gulp serve` or simply `gulp` hosts the application at port 29201 so that you can test against the APIs.
The dev server will log to `stdout`.

*Hint:* Piping the dev server's log output through Bunyan makes it much easier to read:
`gulp serve | bunyan`

Before running any tests or the dev server you'll want to have a MongoDB database running to persist the
application data. Running the `admin/init-local.sh` script will run such a database in a Docker container,
which the application will try to use by default. However, you can set the `BT_MONGO_ENDPOINT` environment
variable to point to any MongoDB database you wish to use for testing.

## Deployment
Deployment and continuous integration builds are handled by
[CircleCI](https://circleci.com/gh/ChrisCarleton/BottomTime-Core). Merges to the `master` branch
are deployed to the development environment and merges to `prod` are deployed to the production environment.

The code is first linted/tested and then packaged in a Docker container which is pushed to AWS ECR. Finally,
Terraform is used to spin up an AWS ECS-powered environment to host the application.

* How the Docker image is built is controlled by the `Dockerfile` file in the project root directory.
* Terraform modules can be found at `terraform/modules/` and configuration for specific environments can be
found in `terraform/env/`.
* The CircleCI deployment pipeline is controlled by editing `.circleci/config.yml`.

## Administrative Tasks
A number of one-off administrative tasks have been created as runnable Gulp tasks. These are largely for
working with the database to set up initial data in a new environment.

By default, the scripts will run against `mongodb://localhost/dev`. To change this default, set the
`BT_MONGO_ENDPOINT` environment variable to the desired MongoDB connection string before running these
commands.

### Creating an Administrator User
A new environment will not have any data defined in the database - and that means no administrator accounts
for setting things up! To create an initial Admin account run the following command:

```
npm run create-admin-user
```

You'll be prompted for a strong password. Once completed, the command will have created (or updated) a
privileged user called `Admin` with the password you provided. The command can also be used to reset the
admin password if it is forgotten.

### Generating Test Data
This is meant for test and dev environments where it's useful to have a database populated with plenty of
realistic-ish data. Run

```
npm run generate-test-data
```

This will create several users with dozens of dives logged. The generated usernames will be output to
the terminal. Any of these user accounts can be logged into using the password `bottomtime`.

Obviously, **do not** run this against the prod database.

### Invalidating User Sessions
Occasionally, it may be necessary to forcefully terminate a user's sessions. Running this command will
invalidate all auth tokens associated with the indicated username. If `.` is supplied in place of a username
then **ALL** sessions will be terminated.

```
npm run kill-sessions (username|.)
```

### Purging the Database
This command will purge **all** data from the datase. All tables will be emptied.

```
npm run purge-database
```

Use with extreme caution. **Do not** run this in production!!!!

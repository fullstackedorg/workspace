# Testing

FullStacked provide an all setup test runner with all the tools for full web app testing. It uses three dependencies to achieve that :

- **mochajs** for the test runner

- **puppeteer** for the web app automation

- **nyc/c8** for the code coverage

Three types of tests will allow you to test different parts of your web app :

- **End-2-end** tests allows to make sure the UI is functional and it tests the web app as a whole.

- **Integration** tests will test your servers and data logic with all your `docker-compose` services.

- **Unit** tests is simply to test methods.

Always use mocha's `describe` and `it` functions to declare your test suites.

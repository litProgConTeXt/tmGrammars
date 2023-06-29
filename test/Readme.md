# lpic-module testing

We use:
  - [mocha](https://mochajs.org/) for the testing framework
    - see [getting started](https://mochajs.org/#getting-started) for a quick
      overview
    - we use the [async/await](https://mochajs.org/#using-async-await) style of
      tests
      - (and so need to ensure all of our existing code uses the async/await
        pattern as well)
  - [chai](https://www.chaijs.com/) for the tests
    - [assert](https://www.chaijs.com/guide/styles/#assert) style
      ([api](https://www.chaijs.com/api/assert) )
    - [expect](https://www.chaijs.com/guide/styles/#expect) and
      [should](https://www.chaijs.com/guide/styles/#should) (BDD) styles
      ([api](https://www.chaijs.com/api/bdd/))
  - [sinon](https://sinonjs.org/) for mocks and fake functions

# Plug-and-play API by HackPSU

This is the backend monolith api for hackathons.

### Development Setup

We are developing on Node v8.x.x

Firstly, you'll need Nodejs. We recommend v8+

[Install node](https://nodejs.org/en/)

Installing all dependencies:
- `npm install`
- `npm start` 
- To test:
    - `npm test`

[![Build Status](https://travis-ci.org/Hack-PSU/api.svg?branch=dev)](https://travis-ci.org/Hack-PSU/api)
[![Coverage Status](https://coveralls.io/repos/github/Hack-PSU/api/badge.svg?branch=sush%2Fts-migration)](https://coveralls.io/github/Hack-PSU/api?branch=sush%2Fts-migration)

## Documentation

All routes in the API must be documented properly. The documentation framework used for this project is [Apidocjs](https://apidocjs.com). See the website or current code for the syntax that needs to be followed. For each route, ensure
the following properties are included:

Name | Directive
------------ | -------------
Api path | @api
Api version | @apiVersion
Api name | @apiName
Api group | @apiGroup
Api permission | @apiPermission
Api parameters | @apiParam
On success response | @apiSuccess
On error response | @apiError

## Testing

Testing is handled by the CI platform Travis-CI. Tests are Javascript files under api/test. Tests should use the [MochaJS](http://Mochajs.org) testing framework. In addition, use
[ChaiJS](http://chaijs.com) for assertions. RESTful testing is handled by the [chai-http](http://chaijs.com/plugins/chai-http/) module.

### Appendix

#### Links
Resource | URL
------------ | -------------
 API | https://api.hackpsu.org/v2
 API Documentation | https://api.hackpsu.org/v2/doc
 API Documentation framework | https://apidocjs.com
 MochaJS | https://mochajs.org
 ChaiJS | https://chaijs.com
 CI | https://travis-ci.com

 #### ACL details
 All routes under ```/admin``` require some form of ACL permissions. These permissions are configured
 under the authentication from Firebase. To add permissions to your login, contact an administrator.
 
 ## Code structure
 The server is broken up into different interconnected pieces that enable good OOP practices and testability. The main structures are Models, DataMappers, Services, and RouteControllers. 
#### Models
 Models simply describe the data structures that get stored in the database, or alternately structures that the databases may return.
 There is minimal functionality in the models; perhaps the only function that is of importance there is the ability to validate that incoming data will be accepted by the database. This is done using `ajv` validators.
 

#### Services
Services are any helper mechanisms needed to connect to external systems. All services are standalone and provide simple interfaces that perform specific tasks. 
Services are useful since they can be tested individually without requiring a lot of integration and can be mocked easily for larger tests.

##### DataMappers
DataMappers are important services that provide Model <-> Database mapping in the form of Create, Read, Update, Delete (CRUD) and other methods. 
These classes are model and database specific and are kept that way to improve type safety and compatibility.
This structure lets us use multiple databases without ever having to change the overall structure of the server.

##### Processors
Processors are simple abstractions used by the Controllers that abstract away operations connected to the DataMappers. These classes
are mostly used to make testing easier.

#### RouteControllers
RouteControllers define the handling and structure of the REST API that the server exposes. These model most of the logic and tie all the remaining pieces together.
 For example, when a `GET` request is made to the server at a certain URL, a defined RouteController will handle that request, parse any data on the incoming request,
  use any services to store/process that data, and then respond to the request originator.

### Dependency Injection
An important concept that ties all the elements of the server together is its Dependency Injection (DI) framework. This is developed and documented 
at [[Injection-js](https://github.com/mgechev/injection-js)]. Any element that requires access to a certain service "asks" for it and the DI framework
provides it with an instance of what it requires. This design method makes testing very easy since mocking internal members is no longer needed.

[![npm](https://img.shields.io/npm/v/happn-service-mongo.svg)](https://www.npmjs.com/package/happn-service-mongo) [![Build Status](https://travis-ci.org/happner/happn-service-mongo.svg?branch=master)](https://travis-ci.org/happner/happn-service-mongo) [![Coverage Status](https://coveralls.io/repos/happner/happn-service-mongo/badge.svg?branch=master&service=github)](https://coveralls.io/github/happner/happn-service-mongo?branch=master) [![David](https://img.shields.io/david/happner/happn-service-mongo.svg)]()

<img src="https://raw.githubusercontent.com/happner/happner-website/master/images/HAPPN%20Logo%20B.png" width="300"></img>

Introduction
-------------------------

Happn is a mini database combined with pub/sub, the system stores json objects on paths. Paths can be queried using wildcard syntax. The happn client can run in the browser or in a node process. Happn clients can subscribe to events on paths, events happn when data is changed by a client on a path, either by a set or a remove operation.

Happn stores its data in a collection called 'happn' by default on your mongodb/nedb. The happn system is actually built to be a module, this is because the idea is that you will be able to initialize a server in your own code, and possibly attach your own plugins to various system events.

A paid for alternative to happn would be [firebase](https://www.firebase.com)

Technologies used:
Happn uses [Primus](https://github.com/primus/primus) to power websockets for its pub/sub framework and mongo or nedb depending on the mode it is running in as its data store, the API uses [connect](https://github.com/senchalabs/connect).

Getting started
---------------------------

You need NodeJS and NPM of course, you also need to know how node works (as my setup instructions are pretty minimal)

You need to install mocha to run the tests, ie: sudo npm install mocha -g --save

then run "npm install happn"

You could just clone this repository, then run "npm install" and then run "mocha test" to see how things work, there are over 180 tests there that execute against happn service running in embedded mode.

But if you want to run your own service do the following:

Create a directory you want to run your happn in, create a node application in it - with some kind of main.js and a package.json

*In node_modules/happn/test in your folder, the e2e_test.js script demonstrates the server and client interactions shown in the following code snippets*

starting service:
-------------------------------------------------------

The service runs on port 55000 by default - the following code snippet demonstrates how to instantiate a server.

```javascript
var happn = require('happn')
var happnInstance; //this will be your server instance

//we are using a compact default config here, port defaults to 55000

 happn.service.create({
  utils: {
    logLevel: 'error',
    // see happn-logger module for more config options
  }
},
function (e, happn) {
  if (e)
    return callback(e);

  happnInstance = happn; //here it is, your server instance
  happnInstance.log.info('server up');

});

```

In your console, go to your application folder and run*node main*your server should start up and be listening on your port of choice.

Connecting to Happn
-------------------------

Using node:

```javascript
var happn = require('happn');
var my_client_instance; //this will be your client instance

happn.client.create([options], function(e, instance) {

	//instance is now connected to the server listening on port 55000
	my_client_instance = instance;

});

```

To use the browser client, make sure the server is running, and reference the client javascript with the url pointing to the running server instances port and ip address like so:

```html
<script type="text/javascript" src="http://localhost:55000/browser_client"></script>
<script>

var my_client_instance;

HappnClient.create([options], function(e, instance) {

	//instance is now connected to the server listening on port 55000
	my_client_instance = instance;

});

</script>
```

SET
-------------------------

*Puts the json in the branch e2e_test1/testsubscribe/data, creates the branch if it does not exist*

```javascript

//the noPublish parameter means this data change wont be published to other subscribers, it is false by default
//there are a bunch other parameters - like noStore (the json isnt persisted, but the message is published)

my_client_instance.set('e2e_test1/testsubscribe/data/', {property1:'property1',property2:'property2',property3:'property3'}, {noPublish:true}, function(e, result){

	//your result object has a special _meta property (not enumerable) that contains its actual _id, path, created and modified dates
	//so you get back {property1:'property1',property2:'property2',property3:'property3', _meta:{path:'e2e_test1/testsubscribe/data/', created:20151011893020}}


});

```

*NB - by setting the option merge:true, the data at the end of the path is not overwritten by your json, it is rather merged with the data in your json, overwriting the fields you specify in your set data, but leaving the fields that are already at that branch.*

SET SIBLING
-------------------------

*sets your data to a unique path starting with the path you passed in as a parameter, suffixed with a random short id*

```javascript
	my_client_instance.setSibling('e2e_test1/siblings', {property1:'sib_post_property1',property2:'sib_post_property2'}, function(e, results){
		//you get back {property1:'sib_post_property1',property2:'sib_post_property2', _meta:{path:'e2e_test1/siblings/yCZ678__'}}
		//you would get all siblings by querying the path e2e_test1/siblings*
```

GET
---------------------------

*Gets the data living at the specified branch*

```javascript
my_client_instance.get('e2e_test1/testsubscribe/data',
	null, //options
	function(e, results){
	//results is your data, if you used a wildcard in your path, you get back an array
	//if you used an explicit path, you get back your data as the object on that path

```

*You can also use wildcards, gets all items with the path starting e2e_test1/testsubscribe/data*

```javascript
my_client_instance.get('e2e_test1/testsubscribe/data*',
	null,
	function(e, results){
	//results is your data
	results.map(function(item){

	});
```

*You can also just get paths, without data*

```javascript
my_client_instance.getPaths('e2e_test1/testwildcard/*', function(e, results){
```

SEARCH
---------------------------

*You can pass mongo style search parameters to look for data sets within specific key ranges*

```javascript

	var options = {
      fields: {"name": 1},
      sort: {"name": 1},
      limit: 1
    }

    var criteria = {
      $or: [{"region": {$in: ['North', 'South', 'East', 'West']}},
        	{"town": {$in: ['North.Cape Town', 'South.East London']}}],
      "surname": {$in: ["Bishop", "Emslie"]}
    }

    publisherclient.get('/users/*', {
	    criteria: criteria,
	    options: options
	  },
	  function (e, search_results) {
	  	//and your results are here
	  	search_results.map(function(user){
	  		if (user.name == 'simon')
	  			throw new Error('stay away from this chap, he is dodgy');
	  	});
	  }
	);

```

DELETE
---------------------------

*deletes the data living at the specified branch*

```javascript
	my_client_instance.remove('/e2e_test1/testsubscribe/data/delete_me', null, function(e, result){
	if (!e)
		//your item was deleted, result.payload is an object that lists the amount of objects deleted
```

EVENTS
----------------------------

*you can listen to any SET & REMOVE events happening in your data - you can specifiy a path you want to listen on or you can listen to all SET and DELETE events using a catch-all listener*

Specific listener:
```javascript
my_client_instance.on('/e2e_test1/testsubscribe/data/delete_me', //the path you are listening on
					{event_type:'remove', // either set, remove or all - defaults to all
					 count:0},// how many times you want your handler to handle for before it is removed - default is 0 (infinity)
					function(//your listener event handler
						message, //the actual object data being set or removed
						meta){ //the meta data - path, modified,created _id etc.


					},
					function(e){
						//passes in an error if you were unable to register your listener
					});
```

Catch all listener:
```javascript
my_client_instance.onAll(function(//your listener event handler
						message, //the actual object data being set or removed
						meta){ //the meta data - path, modified,created _id, also tells you what type of operation happened - ie. GET, SET etc.
					},
					function(e){
						//passes in an error if you were unable to register your listener
					});

```

TAGGING
----------------------------

*You can do a set command and specify that you want to tag the data at the end of the path (or the data that is created as a result of the command), tagging will take a snapshot of the data as it currently stands, and will save the snapshot to a path that starts with the path you specify, and a '/' with the tag you specify at the end*

```javascript

var randomTag = require('shortid').generate();

my_client_instance.set('e2e_test1/test/tag', {property1:'property1',property2:'property2',property3:'property3'}, {tag:randomTag}, function(e, result){

```

MERGING
----------------------------

*you can do a set command and specify that you want to merge the json you are pushing with the existing dataset, this means any existing values that are not in the set json but exist in the database are persisted*

```javascript

my_client_instance.set('e2e_test1/testsubscribe/data/', {property1:'property1',property2:'property2',property3:'property3'}, {merge:true}, function(e, result){

});

```

SECURITY SERVER
---------------

*happn server instances can be secured with user and group authentication, a default user and group called _ADMIN is created per happn instance, the admin password is 'happn' but is configurable (MAKE SURE PRODUCTION INSTANCES DO NOT RUN OFF THE DEFAULT PASSWORD)*

```javascript

var happn = require('happn')
var happnInstance; //this will be your server instance

happn.service.create({secure:true, adminUser:{password:'testPWD'}},
function (e, instance) {

  if (e)
    return callback(e);

  happnInstance = instance; //here it is, your server instance

});


```

*at the moment, adding users, groups and permissions can only be done by directly accessing the security service, to see how this is done - please look at the [functional test for security](https://github.com/happner/happn/blob/master/test/a7_eventemitter_security_access.js)*

SECURITY CLIENT
----------------

*the client needs to be instantiated with user credentials and with the secure option set to true to connect to a secure server*

```javascript

//logging in with the _ADMIN user

var happn = require('happn');
happn.client.create({config:{username:'_ADMIN', password:'testPWD'}, secure:true},function(e, instance) {


```

WEB PATH LEVEL SECURITY
-----------------------

*the http/s server that happn uses can also have custom routes associated with it, when the service is run in secure mode - only people who belong to groups that are granted @HTTP permissions that match wildcard patterns for the request path can access resources on the paths, here is how we grant permissions to paths:*


```javascript

var happn = require('happn')
var happnInstance; //this will be your server instance

happn.service.create({secure:true, adminUser:{password:'testPWD'}},
function (e, instance) {

  if (e)
    return callback(e);

  	happnInstance = instance; //here it is, your server instance

  	var testGroup = {
	  name:'TEST GROUP',
	  custom_data:{
	    customString:'custom1',
	    customNumber:0
	  }
	}

	testGroup.permissions = {
		'/@HTTP/secure/route/*':{actions:['get']},//NB - we can wildcard the path
		'/@HTTP/secure/another/route/test':{actions:['put','post']}//NB - actions confirm to http verbs
	};

	happnInstance.services.security.upsertGroup(testGroup, {}, function(e, group){

		//our group has been upserted with the right permissions

		//this is how we add custom routes to the service, these routes are both available to users who belong to the 'TEST GROUP' group or the _ADMIN user (who has permissions to all routes)

		happnInstance.connect.use('/secure/route/test', function(req, res, next){

		    res.setHeader('Content-Type', 'application/json');
		    res.end(JSON.stringify({"secure":"value"}));

		});

		happnInstance.connect.use('/secure/another/route/test', function(req, res, next){

		    res.setHeader('Content-Type', 'application/json');
		    res.end(JSON.stringify({"secure":"value"}));

		});




	});



});

```

*logging in with a secure client gives us access to a token that can be used, either by embedding the token in a cookie called happn_token or a query string parameter called happn_token, if the login has happened on the browser, the happn_token is autmatically set by default*


```javascript

//logging in with the _ADMIN user, who has permission to all web routes

var happn = require('happn');
happn.client.create({config:{username:'_ADMIN', password:'testPWD'}, secure:true},function(e, instance) {

	//the token can be derived from instance.session.token now

	//here is an example of an http request using the token:

	var http = require('http');

	var options = {
		host: '127.0.0.1',
      	port:55000,
      	path:'/secure/route/test'
	}

	if (use_query_string)
      	options.path += '?happn_token=' + instance.session.token;
    else
    	options.headers = {'Cookie': ['happn_token=' + instance.session.token]}

    http.request(options, function(response){

    	//response.statusCode should be 200;

    }).end();


});


```


HTTPS SERVER
-----------------------------

*happn can also run in https mode, the config has a section called transport*

```javascript

//cert and key defined in config

var config = {
  	transport:{
    	mode:'https',
    	cert: '-----BEGIN CERTIFICATE-----\n[CERT ETC...]\n-----END CERTIFICATE-----',
    	key: '-----BEGIN RSA PRIVATE KEY-----\n[KEY ETC...]\n-----END RSA PRIVATE KEY-----'
  	}
}

// or cert and key file paths defined in config
// IF BOTH OF THESE FILES DONT EXIST, THEY ARE AUTOMATICALLY CREATED AS SELF SIGNED

var config = {
	transport:{
    	mode:'https',
    	certPath:'home/my_cert.pem',
    	keyPath:'home/my_key.rsa'
	}
}

// or have the system create a cert and key for you, in the home directory of the user that started the happn process - called .happn-https-cert and .happn-https-key

var config = {
	transport:{
    	mode:'https'
	}
}

var happn = require('../lib/index')
var service = happn.service;
var happnInstance; //this will be your server instance

//create the service here - now in https mode - running over the default port 55000

service.create(config ...

```

HTTPS CLIENT
------------

*NB - the client must now be initialized with a protocol of https, and if it is the node based client and the cert and key file was self signed, the allowSelfSignedCerts option must be set to true*


```javascript

var happn = require('happn');

happn.client.create({config:{protocol:'https', allowSelfSignedCerts:true}},function(e, instance) {
...

```

PAYLOAD ENCRYPTION
------------------

*if the server is running in secure mode, it can also be configured to encrypt payloads between it and socket clients, this means that the client must include a keypair as part of its credentials on logging in, to see payload encryption in action plase go to the [following test](https://github.com/happner/happn/blob/master/test/c2_websockets_embedded_sanity_encryptedpayloads.js)*


TESTING WITH KARMA
------------------

testing payload encryption on the browser:
gulp --gulpfile test/test-browser/gulp-01.js


OTHER PLACES WHERE HAPPN IS USED:
----------------------------------
Watch this space :) - we are building an experimental application engine that uses happn for its nervous system, it is called happner, see: www.github.com/happner/happner


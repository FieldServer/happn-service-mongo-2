describe('happn-service-mongo functional tests', function() {

  this.timeout(20000);

  var expect = require('expect.js');

  var service = require('../service');
  var serviceInstance = new service();

  var testId = require('shortid').generate();

  var config = {
    url:'mongodb://127.0.0.1:27017/happn'
  }

  before('should initialize the service', function(callback) {

    serviceInstance.initialize(config, callback);

  });

  after(function(done) {

    serviceInstance.stop(done);

  });

  it('sets data', function(callback) {

    var beforeCreatedOrModified = Date.now();

    setTimeout(function(){

      serviceInstance.upsert('/set/' + testId, {"test":"data"}, {}, function(e, response){

        if (e) return callback(e);

        expect(response.data.test).to.equal("data");

        expect(response._meta.created > beforeCreatedOrModified).to.equal(true);
        expect(response._meta.modified > beforeCreatedOrModified).to.equal(true);

        callback();

      });


    }, 100);

  });

  it('gets data', function(callback) {

     serviceInstance.upsert('/get/' + testId, {"test":"data"}, {}, function(e, response){

      if (e) return callback(e);

      expect(response.data.test).to.equal("data");

      serviceInstance.get('/get/' + testId, {}, function(e, response){

        if (e) return callback(e);

        expect(response._meta.path).to.equal('/get/' + testId);
        expect(response.data.test).to.equal("data");

        callback();

      });

    });

  });

  it('merges data', function(callback) {

    var initialCreated;

    serviceInstance.upsert('/merge/' + testId, {"test":"data"}, {}, function(e, response){

      if (e) return callback(e);

      initialCreated = response._meta.created;

      serviceInstance.upsert('/merge/' + testId, {"test1":"data1"}, {merge:true}, function(e, response){

        if (e) return callback(e);

        expect(response._meta.created).to.equal(initialCreated);

        serviceInstance.get('/merge/' + testId, {}, function(e, response){

          if (e) return callback(e);

          expect(response.data.test).to.equal("data");
          expect(response.data.test1).to.equal("data1");
          expect(response._meta.created).to.equal(initialCreated);
          expect(response._meta.modified > initialCreated).to.equal(true);

          callback();

        });

      });


    });

  });

  it('tags data', function(callback) {

    var tag = require("shortid").generate();

    serviceInstance.upsert('/tag/' + testId, {"test":"data"}, {}, function(e, response){

      if (e) return callback(e);

      serviceInstance.upsert('/tag/' + testId, {"test":"data"}, {"tag":tag}, function(e, response){

        if (e) return callback(e);

        expect(response.data.path).to.equal('/tag/' + testId);
        expect(response.data.data.test).to.equal('data');
        expect(response._meta.tag).to.equal(tag);
        expect(response._meta.path.indexOf('/_TAGS' + '/tag/' + testId)).to.equal(0);

        callback();

      });

    });

  });

  it('removes data', function(callback) {

     serviceInstance.upsert('/remove/' + testId, {"test":"data"}, {}, function(e, response){

      if (e) return callback(e);

      serviceInstance.remove('/remove/' + testId, {}, function(e, response){

        if (e) return callback(e);

        expect(response._meta.path).to.equal('/remove/' + testId);
        expect(response.data.removed.result.n).to.equal(1);

        callback();

      });

    });

  });

   it('removes multiple data', function(callback) {

     serviceInstance.upsert('/remove/multiple/1/' + testId, {"test":"data"}, {}, function(e, response){

      if (e) return callback(e);

      serviceInstance.upsert('/remove/multiple/2/' + testId, {"test":"data"}, {}, function(e, response){

        if (e) return callback(e);

        serviceInstance.remove('/remove/multiple/*/' + testId, {}, function(e, response){

          if (e) return callback(e);

          expect(response._meta.path).to.equal('/remove/multiple/*/' + testId);
          expect(response.data.removed.result.n).to.equal(2);

          callback();

        });

      });

    });

  });

  it('gets data with wildcard', function(callback) {

    serviceInstance.upsert('/get/multiple/1/' + testId, {"test":"data"}, {}, function(e, response){

      if (e) return callback(e);

      serviceInstance.upsert('/get/multiple/2/' + testId, {"test":"data"}, {}, function(e, response){

        if (e) return callback(e);

         serviceInstance.get('/get/multiple/*/' + testId, {}, function(e, response){

            //console.log('get multiple response:::', response);

            expect(response.length).to.equal(2);
            expect(response[0].data.test).to.equal('data');
            expect(response[0]._meta.path).to.equal('/get/multiple/1/' + testId);
            expect(response[1].data.test).to.equal('data');
            expect(response[1]._meta.path).to.equal('/get/multiple/2/' + testId);

            callback();

         });

      });

    });


  });

  it('gets data with complex search', function(callback) {

    var test_path_end = require('shortid').generate();

    var complex_obj = {
      regions: ['North', 'South'],
      towns: ['North.Cape Town'],
      categories: ['Action', 'History'],
      subcategories: ['Action.angling', 'History.art'],
      keywords: ['bass', 'Penny Siopis'],
      field1: 'field1'
    };


    var criteria1 = {
      $or: [{"regions": {$in: ['North', 'South', 'East', 'West']}},
        {"towns": {$in: ['North.Cape Town', 'South.East London']}},
        {"categories": {$in: ["Action", "History"]}}],
      "keywords": {$in: ["bass", "Penny Siopis"]}
    }

    var options1 = {
      fields: {"data": 1},
      sort: {"field1": 1},
      limit: 1
    }

    var criteria2 = null;

    var options2 = {
      fields: null,
      sort: {"field1": 1},
      limit: 2
    }

    serviceInstance.upsert('/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/complex/' + test_path_end, complex_obj, null, function (e, put_result) {

      expect(e == null).to.be(true);
      serviceInstance.upsert('/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/complex/' + test_path_end + '/1', complex_obj, null, function (e, put_result) {
        expect(e == null).to.be(true);

        ////////////console.log('searching');
        serviceInstance.get('/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/complex*', {
          criteria: criteria1,
          options: options1
        }, function (e, search_result) {

          expect(e == null).to.be(true);
          expect(search_result.length == 1).to.be(true);

          serviceInstance.get('/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/complex*', {
            criteria: criteria2,
            options: options2
          }, function (e, search_result) {
            expect(e == null).to.be(true);
            expect(search_result.length == 2).to.be(true);
            callback(e);
          });

        });

      });

    });

  });

});
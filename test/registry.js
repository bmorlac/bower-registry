/*jshint undef:false, expr:true, strict:false */

var Registry = require('../index').Registry,
    RedisDb = require('../index').RedisDb,
    redis = require('redis-mock'),
    request = require('supertest');

require('chai').should();

describe('Registry server', function () {
  beforeEach(function (done) {
    this.db = new RedisDb({
      client: redis.createClient()
    });

    this.registry = new Registry({
      db: this.db
    });

    this.db.client.flushall(done);
  });

  describe('GET /packages', function () {
    beforeEach(function (done) {
      this.db.client.set('jquery', 'git://github.com/jquery/jquery.git', done);
    });

    it('should show all avalaible packages', function (done) {
      request(this.registry.server)
        .get('/packages')
        .expect('Content-type', /json/)
        .expect(200, [
          {
            name: 'jquery',
            url: 'git://github.com/jquery/jquery.git'
          }
        ], done);
    });
  });

  describe('POST /packages', function () {
    describe('if request is correct', function () {
      it('should add the package and return 200', function (done) {
        request(this.registry.server)
          .post('/packages')
          .send({name: 'jquery', url: 'git://github.com/jquery/jquery.git'})
          .expect(200, done);
      });
    });

    describe('if request is bad', function () {
      it('shouldn\'t add the package and return 400', function (done) {
        request(this.registry.server)
          .post('/packages')
          .send({name: 'jquery'})
          .expect(400, done);
      });
    });

    describe('if the package already exist', function () {
      beforeEach(function (done) {
        this.db.client.set('jquery', 'git://github.com/jquery/jquery.git', done);
      });

      describe('if the name exists', function () {
        it('should return 406', function (done) {
          request(this.registry.server)
            .post('/packages')
            .send({name: 'jquery', url: 'git://github.com/jquery2/jquery2.git'})
            .expect(406, done);
        });
      });

      /*
      // Need a reverse index on redis, so we accept that url is not unique
      describe('if the url exists', function () {
        it('should return 406', function (done) {
          request(this.registry.server)
            .post('/packages')
            .send({name: 'jquery2', url: 'git://github.com/jquery/jquery.git'})
            .expect(406, done);
        });
      });
      */
    });
  });

  describe('GET /packages/:name', function () {
    describe('if the package exists', function () {
      beforeEach(function (done) {
        this.db.client.set('jquery', 'git://github.com/jquery/jquery.git', done);
      });

      it('should return 200 and the package', function (done) {
        request(this.registry.server)
          .get('/packages/jquery')
          .expect(200, {
            name: 'jquery',
            url: 'git://github.com/jquery/jquery.git'
          }, done);
      });
    });

    describe('if the package doesn\'t exist', function () {
      it('should return 404', function (done) {
        request(this.registry.server)
          .get('/packages/jquery')
          .expect(404, done);
      });
    });
  });

  describe('GET /packages/search/:name', function () {
    beforeEach(function (done) {
      this.db.client.set('jquery', 'git://github.com/jquery/jquery.git', done);
    });

    it('should return matching packages', function (done) {
      request(this.registry.server)
        .get('/packages/search/jq')
        .expect(200, [
          {
            name: 'jquery',
            url: 'git://github.com/jquery/jquery.git'
          }
        ], done);
    });
  });
});
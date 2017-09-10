
'use strict'

const tap = require('tap')
const test = tap.test
const fastify = require('fastify')({logger: require('abstract-logging')})
const request = require('request')
const plugin = require('../')

fastify.register(plugin, (err) => {
  if (err) throw err
})

fastify.listen(0, (err) => {
  if (err) tap.error(err)
  fastify.server.unref()

  const reqOpts = {
    method: 'GET',
    baseUrl: 'http://localhost:' + fastify.server.address().port
  }
  const req = request.defaults(reqOpts)

  test('cookies get set correctly', (t) => {
    t.plan(7)

    fastify.get('/test1', (req, reply) => {
      reply
        .setCookie('foo', 'foo', {path: '/'})
        .send({hello: 'world'})
    })

    const jar = request.jar()
    req({uri: '/test1', jar}, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), {hello: 'world'})

      const cookies = jar.getCookies(reqOpts.baseUrl + '/test1')
      t.is(cookies.length, 1)
      t.is(cookies[0].key, 'foo')
      t.is(cookies[0].value, 'foo')
      t.is(cookies[0].path, '/')
    })
  })

  test('parses incoming cookies', (t) => {
    t.plan(6)
    fastify.get('/test2', (req, reply) => {
      t.ok(req.cookies)
      t.ok(req.cookies.bar)
      t.is(req.cookies.bar, 'bar')
      reply.send({hello: 'world'})
    })

    const headers = {
      cookie: 'bar=bar'
    }
    req({uri: '/test2', headers}, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), {hello: 'world'})
    })
  })
})
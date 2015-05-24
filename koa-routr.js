module.exports = koaRoutr

const route = require('koa-route')
const mount = require('koa-mount')
const compose = require('koa-compose')
const methods = require('methods')
const paramify = require('koa-params')

const proto = { constructor: null, middleware: null }
function createMethod(method) {
  proto[method] = function (url, fn, opts) {
    this.middleware.push(this._r[method](url, fn, opts))
    return this
  }
}

methods.forEach(createMethod)

proto.del = proto.delete
proto.all = createMethod('all')

proto.param = function (p, cb, opts) {
  this._r.param(p, cb, opts)
  return this
}

proto.use = function (path, cb) {
  this.middleware.push(mount(path, cb))
  return this
}

function koaRoutr() {
  var composed;
  const router = function * Router(upstream) {
    yield * composed.call(this, upstream)
  }

  const p = Object.create(router.__proto__)
  for (var k in proto) p[k] = proto[k]
  p.middleware = []
  p._r = paramify(route)

  composed = compose(p.middleware)
  router.__proto__ = p
  return router
}

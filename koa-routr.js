module.exports = koaRoutr

const route = require('koa-route')
const koaMount = require('koa-mount')
const compose = require('koa-compose')
const methods = require('methods')
const paramify = require('koa-params')
const co = require('co')

function call_(fn, ctx, args) {
  switch (args.length) {
    case 0: return fn.call(ctx)
    case 1: return fn.call(ctx, args[0])
    case 2: return fn.call(ctx, args[0], args[1])
    case 3: return fn.call(ctx, args[0], args[1], args[2])
    default: return fn.apply(ctx, args)
  }
}

function mount(a, b) {
  var mw = koaMount(a, b)
  return function * mount() {
    yield call_(mw, this, arguments)
  }
}

const leadingSlash = /^[\/]*/
function normalisePath(p) {
  return p.replace(leadingSlash, '/')
}

const proto = { constructor: null, middleware: null }
function createMethod(method) {
  proto[method] = function (url, fn, opts) {
    this.middleware.push(this._r[method](normalisePath(url), fn, opts))
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

function addMiddleware(r, path, cb) {
  if ('object' === typeof cb) {
    var newRouter = koaRoutr()
    Object.keys(cb).forEach(function (k) {
      newRouter[k]('/', cb[k])
    })
    r.middleware.push(mount(path, newRouter))
  } else {
    r.middleware.push(mount(path, cb))
  }
}

proto.use = function (path, cb) {
  addMiddleware(this, path, cb)
  return this
}

proto.router = function (path, opts) {
  var router = koaRoutr(opts)
  path = path.replace(/\/$/, '')
  this.middleware.push(mount(path, router))
  return router
}

function koaRoutr(options) {
  var composed;
  const router = function * Router(upstream) {
    yield co.call(this, composed, upstream)
  }

  const p = Object.create(router.__proto__)
  for (var k in proto) p[k] = proto[k]
  p.middleware = []

  if (options && options.params) p._r = paramify(route)
  else p._r = route

  composed = compose(p.middleware)
  router.__proto__ = p
  return router
}

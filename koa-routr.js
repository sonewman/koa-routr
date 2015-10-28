module.exports = koaRoutr

const koaMount = require('koa-mount')
const compose = require('koa-compose')
const methods = require('methods')
const co = require('co')
const pathToRegExp = require('path-to-regexp')

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

function match(ctx, method) {
  return ctx.method === method
    || (ctx.method === 'HEAD' && method === 'GET')
}

function createParams(m, keys) {
  const match = m.slice(1)
  return keys.reduce(function (params, key, i) {
    params[key] = decode(match[i])
    return params
  }, {})
}

function decode(v) {
  return v && decodeURIComponent(v)
}

function createVerbHandle(method) {
  return function (router, url, fn, opts) {
    const ps = []
    const re = pathToRegExp(url, ps, opts)
    const keys = ps.map(function (m) {
      return m.name
    })

    return function * (next) {
      if (!match(this, method)) return yield * next

      const m = re.exec(this.path)
      if (!m) return yield * next

      this.params
      = this.request.params
      = createParams(m, keys)

      if (keys.length === 0) {
        yield * fn.call(this, next)
      } else {
        yield * callParams.call(this, keys, router._params, fn, next)
      }

      return
    }
  }
}

function * callParams(keys, params, fn, next) {
  var called = false

  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i]

    if (typeof params[key] === 'function') {
      called = true

      yield co.call(this, params[key], function * () {
        yield * fn.call(this, next)
      })
    }
  }

  if (!called) yield * fn.call(this, next)
}

const route = {}

const proto = { constructor: null, middleware: null }
function createMethod(method) {
  route[method] = createVerbHandle(method.toUpperCase())

  proto[method] = function (url, fn, opts) {
    this.middleware.push(route[method](this, normalisePath(url), fn, opts))
    return this
  }
}

methods.forEach(createMethod)

proto.del = proto.delete
proto.all = createMethod('all')

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

function koaRoutr() {
  var composed
  const router = function * Router(upstream) {
    yield co.call(this, composed, upstream)
  }

  const p = Object.create(router.__proto__)
  for (var k in proto) p[k] = proto[k]
  p.middleware = []


  composed = compose(p.middleware)
  router.__proto__ = p

  const params = []
  router._params = []

  router.param = function (n, fn) {
    if (!params[n]) {
      params[n] = []
      router._params[n] = compose(params[n])
    }

    params[n].push(fn)
    return router
  }
  return router
}

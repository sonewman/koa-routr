# Koa-Routr

A simple easy to use router for Koa. If you are familiar to express' router then
this should be second nature to use.

## Install
```
npm i koa-routr
```

## Usage

It's as simple as bellow:

```javascript
const koa = require('koa')
const koaRoutr = require('koa-routr')

const app = koa()
const router = koaRoutr()

app.use(router)
app.listen(8000)

router.get('/abc', function * () {
  this.body = 'GOT!!!'
})

router.put('/abc', function * () {
  this.body = 'PUT'ED!!!'
})

router.post('/abc', function * () {
  this.body = 'POSTED!!!'
})

router.del('/abc', function * () {
  this.body = 'DELETED!!!'
})

```

And there is middleware (which you can use to structure further routers)
```javascript
const app = koa()
const router = koaRoutr()

app.use(router)
app.listen(8000)

router.use(function * (next) {
  // get users details...
  this.context = { user: 'sam' }
  yield next
})
  
const nestedRouter = koaRoutr()
nestedRouter.get('/123', function * () {
  this.body = '123!!!'
})

router.use('/abc', nestedRouter)
```

## Licence
MIT

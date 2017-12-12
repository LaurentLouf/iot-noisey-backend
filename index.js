const mongo   = require('mongodb');
const api     = require('./lib/api');
const config  = require('./lib/config');
const body    = require('body-parser');
const co      = require('co');
const express = require('express');
const next    = require('next');

const dev     = process.env.NODE_ENV !== 'production';
const app     = next({ dev });
const handle  = app.getRequestHandler();

// Users are managed at DB level
const MONGO_URL   = 'mongodb://root:toor@localhost:27017/noisey'
const PORT_HTTP   = 8080;
const PORT_HTTPS  = 8443;

co(function * () {
  // Initialize the Next.js app
  yield app.prepare();

  console.log(`Connecting to ${MONGO_URL}`);
  const db = yield mongo.connect(MONGO_URL)

  var fs      = require('fs')
  var options = {
    key: fs.readFileSync('privateKey.key'),
    cert: fs.readFileSync('certificate.crt')
  };

  // Configure express to expose a REST API
  const server = express();

  server.use(body.json());
  server.use((req, res, next) => {
    if (req.secure) 
    {
      // Also expose the MongoDB database handle so Next.js can access it.
      req.db = db
      next();
    } 
    else 
    {
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
  server.use('/api', api(db));
  server.use('/config', config(db));
  server.use(express.static(__dirname + '/public'));

  // Everything that isn't '/api' gets passed along to Next.js
  server.get('*', (req, res) => {
    return handle(req, res);
  });

  var https       = require('https');
  var http        = require('http');
  var httpServer  = http.createServer(server);
  var httpsServer = https.createServer(options, server);

  httpServer.listen(PORT_HTTP);
  httpsServer.listen(PORT_HTTPS);

  console.log(`Listening on ${PORT_HTTPS}`);
}).catch(error => console.error(error.stack))
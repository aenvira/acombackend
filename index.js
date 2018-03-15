const proxy = require('http-proxy-middleware')
const bodyParser = require('body-parser')
const flash = require('connect-flash')

const routes = require('./lib/routes')
const passport = require('./lib/auth')
const session = require('./lib/session')


const host = process.env.REACT_APP_HOST || 'localhost'
const serverPort = process.env.NODE_ENV === 'development'
  ? process.env.REACT_APP_SERVER_PORT
  : process.env.REACT_APP_PORT || 8080

const app = express()

// if (process.env.NODE_ENV === 'production') {
//   // In production we want to serve our JavaScripts from a file on the file
//   // system.
//   app.use('/static', express.static(path.join(process.cwd(), 'build/client/static')));
// } else {
//   // Otherwise we want to proxy the webpack development server.
//   app.use(['/static','/sockjs-node'], proxy({
//     target: `http://localhost:${process.env.REACT_APP_CLIENT_PORT}`,
//     ws: true,
//     logLevel: 'error'
//   }));
// }

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(cors({ credentials: false, origin: '*' }))
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/api', routes)
app.use('/', express.static('/lib/build'))

const ioServer = require('./lib/sockets')(app)

ioServer.listen(serverPort)
// server.listen(serverPort)
console.log(`Listening at http://${host}:${serverPort}`)

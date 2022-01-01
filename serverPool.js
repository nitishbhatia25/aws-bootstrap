const { hostname } = require('os');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432,
  database: "postgres",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0
});

executeDbQueries();

const STACK_NAME = process.env.STACK_NAME || "Unknown Stack";
const message = `Jai Jai Ram from ${hostname()} in ${STACK_NAME}\n`;
const port = 8080; 
const httpsPort = 8443;
// using self signed certificate in ec2 instance generated at the time of launching ec2 instance from deployment script
const httpsKey = '../keys/key.pem';
const httpsCert = '../keys/cert.pem';
if (fs.existsSync(httpsKey) && fs.existsSync(httpsCert)) { 
  console.log('Starting https server')
  const options = { key: fs.readFileSync(httpsKey), cert: fs.readFileSync(httpsCert) };
  const server = https.createServer(options, (req, res) => { 
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(message);
  });
  server.listen(httpsPort, hostname, () => {
    console.log(`Server running at https://${hostname()}:${httpsPort}/`);
  });
} else {
  console.log('Certificate keys not found');
  console.log('Starting http server')
  const server = http.createServer((req, res) => { 
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(message);
  });
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname()}:${port}/`);
  });
}
async function executeDbQueries() {
  try {
    console.log("Connection succesful");
    const { rows } = await pool.query("select * from greetings");
    console.table(rows);
  } catch (ex) {
    console.error(ex);
  } finally {
    console.log("Connection closed");
  }

}
const { hostname } = require('os');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Client } = require('pg');
const express = require('express');
const app = express();


// executeDbQueries();

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
  app.get('/db', async (req, res) => {
    const client = new Client({
      user: "postgres",
      password: "password",
      host: "localhost",
      port: 5432,
      database: "postgres"
    });
    try {
      await client.connect();
      console.log("Connection succesful");
      res.json(['Connection succesful']);
    } catch (e) {
      res.json(e);
    } finally {
      await client.end();
      console.log("Connection closed");
    }
  });
  app.get('/', async (req, res) => {
    // res.statusCode = 200;
    // res.setHeader('Content-Type', 'text/plain');
    // res.end(message);
    const data = await executeDbQueries();
    // res.end(['Hi']);
    // executeDbQueries().then((response) => res.json(response));
    res.json(data);
  })
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname()}:${port}/`);
  });
  app.listen(port, () => {
    console.log(`Server running at http://${hostname()}:${port}/`);
  })
}
async function executeDbQueries() {
  const client = new Client({
    user: "postgres",
    password: "password",
    host: "localhost",
    port: 5432,
    database: "postgres"
  });
  let response = [];
  try {
    await client.connect();
    console.log("Connection succesful");
    await client.query("BEGIN");
    // await client.query("insert into greetings values ($1, $2)", [7, "Bonjour"]);
    const { rows } = await client.query("select * from greetings");
    console.table(rows);
    await client.query("COMMIT");
    const result = await client.query("select * from greetings");
    response = result.rows;
    console.table(result.rows);
  } catch (ex) {
    console.error(ex);
    await client.query("ROLLBACK");
  } finally {
    await client.end();
    console.log("Connection closed");
    return response;
  }
}
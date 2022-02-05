const { hostname } = require('os');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Client } = require('pg');
const express = require('express');
const app = express();

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
  app.get('/', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(message);
  });
  app.get('/db', async (req, res) => {
    const client = new Client({
      user: "postgres",
      password: "2rf7qawjWDVpIin12u7G",
      host: "database-instance-1.c1cdckzqi1yl.us-east-2.rds.amazonaws.com",
      port: 5432,
      database: "awsbootstrapstagedb"
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
  const server = https.createServer(options, app);
  server.listen(httpsPort, hostname, () => {
    console.log(`Server running at https://${hostname()}:${httpsPort}/`);
  });
} else {
  console.log('Certificate keys not found');
}
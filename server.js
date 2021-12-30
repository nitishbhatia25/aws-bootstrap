const { hostname } = require('os');
const http = require('http');
const https = require('https');
const fs = require('fs');

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
}

console.log('Starting http server') 
const server = http.createServer((req, res) => { 
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(message);
});
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname()}:${port}/`);
});
(async () => {
  const { hostname } = require('os');
  const http = require('http');
  const https = require('https');
  const fs = require('fs');
  const { Client } = require('pg');
  const express = require('express');
  const AWS = require('aws-sdk');
  const { Liquibase, POSTGRESQL_DEFAULT_CONFIG } = require('liquibase');

  const app = express();
  // Create S3 service object
  let s3 = new AWS.S3({apiVersion: '2006-03-01'});

  const STACK_NAME = process.env.STACK_NAME || "Unknown Stack";
  const message = `Jai Jai Ram from ${hostname()} in ${STACK_NAME}\n`;
  const port = 8080; 
  const httpsPort = 8443;
  // using self signed certificate in ec2 instance generated at the time of launching ec2 instance from deployment script
  const httpsKey = '../keys/key.pem';
  const httpsCert = '../keys/cert.pem';
  if (fs.existsSync(httpsKey) && fs.existsSync(httpsCert)) { 
    console.log('Starting https server')
    console.log('Fetching db config from s3');
    const dbConfigString = await fetchS3Object('config-805402123321', 'db.json');
    const dbConfig = JSON.parse(dbConfigString);
    console.log('Applying liquibase changes to DB');
    await applyLiquibaseChanges(dbConfig);
    const options = { key: fs.readFileSync(httpsKey), cert: fs.readFileSync(httpsCert) };
    app.get('/', (req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(message);
    });
    app.get('/db', async (req, res) => {
      // const dbConfigString = await fetchS3Object('config-805402123321', 'db.json');
      // const dbConfig = JSON.parse(dbConfigString);
      const client = new Client(dbConfig);
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
    app.get('/buckets', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      s3.listBuckets(function(err, data) {
        if (err) {
          res.statusCode = 500;
          res.end(JSON.stringify(err));
        } else {
          res.statusCode = 200;
          res.end(JSON.stringify(data.Buckets));
        }
      });
    });
    const server = https.createServer(options, app);
    server.listen(httpsPort, hostname, () => {
      console.log(`Server running at https://${hostname()}:${httpsPort}/`);
    });
  } else {
    console.log('Certificate keys not found');
  }

  function fetchS3Object(bucketName, key) {
    const options = {
      Bucket: bucketName,
      Key: key,
    };
    return new Promise((resolve, reject) => {
      s3.getObject(options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const { Body } = data;
          resolve(Body.toString('utf-8'));
        }
      })
    });
  }

  async function applyLiquibaseChanges(dbConfig) {
    try {
      // Execute liquibase command after connecting
      const liquibaseConfigLocalDb = {
        changeLogFile: 'db/changelog/changelog.yaml',
        classpath: POSTGRESQL_DEFAULT_CONFIG.classpath,
        url: `jdbc:postgresql://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
        username: dbConfig.user,
        password: dbConfig.password,
      };
      const liquibaseInstance = new Liquibase(liquibaseConfigLocalDb);
      let status = await liquibaseInstance.status();
      await liquibaseInstance.updateSQL();
      await liquibaseInstance.update();
      console.log(`liquibase status: ${status}`);
    } catch (e) {
      console.error("Error in applying liquibase changes:", e);
    }
  }
})();
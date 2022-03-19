// Loading and initializing the library with default configs
const pgp = require('pg-promise')();

const s3 = require('./s3');

let db;
async function getDb() {
  if (db) return db;
  try {
    const dbConfigString = await s3.fetchS3Object('config-805402123321', 'db.json');
    const dbConfig = JSON.parse(dbConfigString);
    // Creating a new database instance from the connection details:
    db = pgp(dbConfig);
    return db;
  } catch(e) {
    console.error('unable to fetch from s3', e);
    throw e;
  }
}
// Call it immediately to start fetch config from s3
getDb();

// Exporting the database object for shared use:
module.exports = getDb;

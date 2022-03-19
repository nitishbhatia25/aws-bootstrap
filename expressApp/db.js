// Loading and initializing the library with default configs
const pgp = require('pg-promise')();
const s3 = require('./s3');
const { Liquibase, POSTGRESQL_DEFAULT_CONFIG, LiquibaseLogLevels } = require('liquibase');

let db, dbConfig;
async function getDb() {
  if (db) return db;
  try {
    const dbConfig = await getDbConfig();
    // Creating a new database instance from the connection details:
    db = pgp(dbConfig);
    return db;
  } catch(e) {
    console.error('unable to connect to db', e);
    throw e;
  }
}

async function applyLiquibaseChanges(dbConfig) {
  try {
    if (!dbConfig) {
      dbConfig = await getDbConfig();
    }
    // Execute liquibase command after connecting
    const liquibaseConfigLocalDb = {
      changeLogFile: 'db/changelog/changelog.yaml',
      classpath: POSTGRESQL_DEFAULT_CONFIG.classpath,
      url: `jdbc:postgresql://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
      username: dbConfig.user,
      password: dbConfig.password,
      logLevel: LiquibaseLogLevels.Off
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
applyLiquibaseChanges();

async function getDbConfig() {
  if (dbConfig) return dbConfig;
  try {
    // TODO local vs prod db config decider through some config decider
    console.log('fetching db config from s3');
    const dbConfigString = await s3.fetchS3Object('config-805402123321', 'db.json');
    dbConfig = JSON.parse(dbConfigString);
    return dbConfig;
  } catch(e) {
    console.error('unable to fetch config from s3', e);
    throw e;
  }
}

// Exporting the database object for shared use:
module.exports = getDb;

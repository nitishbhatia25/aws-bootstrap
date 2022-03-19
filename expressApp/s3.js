const AWS = require('aws-sdk');

// Create S3 service object
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

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
module.exports = { fetchS3Object };
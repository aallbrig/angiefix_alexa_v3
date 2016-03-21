import { defaultAppUserData } from './models';
const DOC = require('dynamodb-doc');
const docClient = new DOC.DynamoDB();
const extend = require('lodash/extend');

function getAppData(userId, callback) {
  docClient.getItem({
    TableName: 'angieFixV2',
    Key: {
      userId
    }
  }, (err, data) => {
    if (err) {
      console.log('error retrieving');
      console.log(err);
    } else if (data) {
      console.log('retrieving success');
      console.log(data);
    }
    callback(err, data);
  });
}

function saveAppData(userId, appData, callback) {
  const dataToBeSaved = extend({
    userId
  }, defaultAppUserData, appData);
  console.log('data to be saved');
  console.log(dataToBeSaved);
  docClient.putItem({
    TableName: 'angieFixV2',
    Item: {
      userId,
      draftLead: dataToBeSaved.draftLead,
      userInfo: dataToBeSaved.userInfo,
      projects: dataToBeSaved.projects
    }
  }, (err, data) => {
    if (err) {
      console.log('error saving');
      console.log(err);
    } else if (data) {
      console.log('data saving');
      console.log(data);
    }
    callback(err, data);
  });
}

module.exports = {
  getAppData,
  saveAppData
};

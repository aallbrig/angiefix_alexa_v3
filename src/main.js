// Single files are awful!
import {saveAppData, getAppData} from './db';
import {onLaunch, onIntent, buildResponse} from './responses';
const extend = require('lodash/extend');

function saveDataBeforeExiting(event, context) {
  var userId = event.session.user.userId;
  var appData = event.session.attributes || {};
  saveAppData(userId, appData, function () {
    console.log('session ended and data saved successfully.');
    console.log('data saved: ');
    console.log(appData);
    context.succeed();
  });
}

// MAIN
export function main(event, context) {
  try {
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);
    console.log('event');
    console.log(event);
    console.log('context');
    console.log(context);
    console.log('user');
    console.log(event.session.user);
    console.log('userId');
    console.log(event.session.user.userId);
    console.log('extend');
    console.log(extend);
    // amzn1.echo-sdk-account.AHRNUYGNDJBA4UNHHZBZYV4N35ITPIZJTSPT4OZ6U2D27GXSUZZWW

    if (event.session.new) {
      // Retrieve initial data
      console.log("onSessionStarted requestId=" + event.request.requestId + ", sessionId=" + event.session.sessionId);
      var userId = event.session.user.userId;
      getAppData(userId, function getAppDataCallback(err, data) {
        if (err) {
          console.log('cannot get data for user with id: ' + userId);
          console.log(err);
          event.session.attributes = {};
          console.log('new event.session');
          console.log(event.session.attributes);
        } else if (data) {
          console.log('got data for user with id: ' + userId);
          console.log(data);
          event.session.attributes = data.Item;
          console.log('new event.session');
          console.log(event.session.attributes);
        }
        filterEventByRequestType(event, context);
      });
    } else {
      filterEventByRequestType(event, context);
    }
  } catch (e) {
    context.fail("Exception: " + e);
  }
};

function filterEventByRequestType(event, context) {
  if (event.request.type === "LaunchRequest") {
    onLaunch(event.request,
      event.session,
      function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
  } else if (event.request.type === "IntentRequest") {
    onIntent(
      event,
      context,
      function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
  } else if (event.request.type === "SessionEndedRequest") {
    saveDataBeforeExiting(event, context);
  }
}

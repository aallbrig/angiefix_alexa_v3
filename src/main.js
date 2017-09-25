import { saveAppData, getAppData } from './db';
import { onLaunch, onIntent, buildResponse } from './responses';
import { defaultAppUserData } from './models';
const extend = require('lodash/extend');

function saveDataBeforeExiting(event, context) {
  const userId = event.session.user.userId;
  const appData = event.session.attributes || {};
  saveAppData(userId, appData, () => {
    console.log('session ended and data saved successfully.');
    console.log('data saved: ');
    console.log(appData);
    context.succeed();
  });
}

function routeEventByRequestType(event, context) {
  if (event.request.type === 'LaunchRequest') {
    onLaunch(event.request,
      event.session,
      (sessionAttributes, speechletResponse) => {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
  } else if (event.request.type === 'IntentRequest') {
    onIntent(
      event,
      context,
      (sessionAttributes, speechletResponse) => {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
  } else if (event.request.type === 'SessionEndedRequest') {
    saveDataBeforeExiting(event, context);
  }
}

// MAIN
export function main(event, context) {
  try {
    console.log(
      `event.session.application.applicationId=${event.session.application.applicationId}`
    );
    console.log('event');
    console.log(event);
    console.log('context');
    console.log(context);
    console.log('user');
    console.log(event.session.user);
    console.log('userId');
    console.log(event.session.user.userId);

    if (event.session.new) {
      // Retrieve initial data
      console.log(
        `onSessionStarted requestId=${event.request.requestId}, sessionId=${event.session.sessionId}`
      );
      const userId = event.session.user.userId;
      getAppData(userId, (err, data) => {
        let sessionAttributesFromStore = {
          session: {
            attributes: defaultAppUserData
          }
        };
        if (err) {
          console.log(`cannot get data for user with id: ${userId}`);
          console.log(err);
          event.session.attributes = {};
        } else if (data) {
          console.log(`got data for user with id: ${userId}`);
          console.log(data);
          sessionAttributesFromStore = {
            session: {
              attributes: data.Item
            }
          };
          event.session.attributes = data.Item;
        }
        console.log('new event.session');
        console.log(event.session.attributes);
        console.log('extend(sessionAttributesFromStore, event)');
        console.log(extend(sessionAttributesFromStore, event));
        console.log('extend(event, sessionAttributesFromStore)');
        console.log(extend(event, sessionAttributesFromStore));
        routeEventByRequestType(extend(sessionAttributesFromStore, event), context);
      });
    } else {
      routeEventByRequestType(event, context);
    }
  } catch (e) {
    context.fail(`Exception: ${e}`);
  }
}

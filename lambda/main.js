// Single files are awful!
var AWS = require("aws-sdk");
var DOC = require("dynamodb-doc");
var docClient = new DOC.DynamoDB();

function getAppData(userId, callback) {
  docClient.getItem({
    "TableName": "angieFixV2",
    "Key": {
      "userId": userId
    }
  }, function(err, data) {
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
  docClient.putItem({
    "TableName": "angieFixV2",
    "Item": {
      "userId": userId,
      "userInfo": appData.userInfo || {},
      "projects": appData.projects || [],
      "draftProject": appData.draftProject || {}
    }
  }, function(err, data) {
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

function saveDataBeforeExiting(event, context) {
  var userId = event.session.user.userId;
  var appData = event.session.attributes;
  saveAppData(userId, appData, function () {
    console.log('session ended and data saved successfully.');
    context.succeed();
  });
}

// MAIN
exports.main = function (event, context) {
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
    // amzn1.echo-sdk-account.AHRNUYGNDJBA4UNHHZBZYV4N35ITPIZJTSPT4OZ6U2D27GXSUZZWW

    // Retrieve initial data
    if (event.session.new) {
      console.log("onSessionStarted requestId=" + event.request.requestId + ", sessionId=" + event.session.sessionId);
      onSessionStarted(event, function callback(sessionAttributes) {
        event.session.attributes = sessionAttributes;
        filterIntent(event, context);
      });
    } else {
      filterIntent(event, context);
    }
  } catch (e) {
    context.fail("Exception: " + e);
  }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(event, callback) {
  var userId = event.session.user.userId;
  getAppData(userId, function (err, data) {
    if (err) {
      console.log('cannot get data for user with id: ' + userId);
      console.log(err);
      callback({});
    }
    if (data) {
      console.log('got data for user with id: ' + userId);
      console.log(data);
      callback(data);
    }
  });
}

function filterIntent(event, context) {
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

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
  console.log("onLaunch requestId=" + launchRequest.requestId +
      ", sessionId=" + session.sessionId);

  // Dispatch to your skill's launch.
  var sessionAttributes = {};
  var cardTitle = "Welcome";
  var speechOutput = "Hello user: " + session.user.userId.substring(0, 10);
  var repromptText = "Hello user: " + session.user.userId.substring(0, 10);
  var shouldEndSession = false;

  callback(sessionAttributes,
      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(event, context, callback) {
  var intentRequest = event.request;
  var session = event.session;
  console.log("onIntent requestId=" + intentRequest.requestId +
      ", sessionId=" + session.sessionId);
  var intent = intentRequest.intent;
  var intentName = intentRequest.intent.name;

  // Dispatch to your skill's intent handlers
  if ("AMAZON.HelpIntent" === intentName) {
    HelpIntent(callback);
  } else if ("AMAZON.StopIntent" === intentName) {
    saveDataBeforeExiting(event, context);
  } else if ("AMAZON.YesIntent" === intentName) {
    YesIntent(callback);
  } else if ("AMAZON.NoIntent" === intentName) {
    NoIntent(callback);
  } else {
    saveDataBeforeExiting(event, context);
  }
}

// --------------- Functions that control the skill's behavior -----------------------
function HelpIntent(callback) {
  var sessionAttributes = {};
  var speechOutput = "Help";
  var repromptText = "Help";
  var cardTitle = "Help";
  var shouldEndSession = false;

  callback(sessionAttributes,
      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
function YesIntent(callback) {
  var sessionAttributes = {};
  var speechOutput = "Yes";
  var repromptText = "Yes";
  var cardTitle = "Yes";
  var shouldEndSession = false;

  callback(sessionAttributes,
      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
function NoIntent(callback) {
  var sessionAttributes = {};
  var speechOutput = "No";
  var repromptText = "No";
  var cardTitle = "No";
  var shouldEndSession = false;

  callback(sessionAttributes,
      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    card: {
      type: "Simple",
      title: "Angie - " + title,
      content: "Angie - " + output
    },
    reprompt: {
      outputSpeech: {
          type: "PlainText",
          text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildSSMLSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    "outputSpeech": {
      "type": "SSML",
      "ssml": "<speak>This output speech uses SSML.</speak>"
    },
    card: {
      type: "Simple",
      title: "Angie - " + title,
      content: "Angie - " + output
    },
    reprompt: {
      outputSpeech: {
          type: "PlainText",
          text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
}

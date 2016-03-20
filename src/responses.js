import {saveAppData, getAppData} from './db';
import {regexToUrgency, supportedUrgencies} from './regexToUrgency';
import {regexToCategory, supportedCategories} from './regexToCategory';
import {defaultDraftLead} from './models';
import {joinArrayWithDifferentLastJoiner} from './utilities';
const extend = require('lodash/extend');

// console.log('regexToUrgency');
// console.log(regexToUrgency);
// console.log('regexToCategory');
// console.log(regexToCategory);
console.log('supportedUrgencies');
console.log(supportedUrgencies);
console.log('supportedCategories');
console.log(supportedCategories);

const yesNoQuestions = {
  getSubmit: "Your project is ready to send.  Would you like to send?",
  getDescription: "What kind of project would you like to start?",
  getUrgency: "When would you like this done?",
  getStartAnother: "Would you like to start another project?"
}

// TODO: Refactor this into something more sensible
function saveDataBeforeExiting(event, context) {
  var userId = event.session.user.userId;
  var appData = event.session.attributes || {};
  saveAppData(userId, appData, function () {
    console.log('session ended and data saved successfully.');
    context.succeed();
  });
}

function _getMissingInformation(draftLead = {}, userInfo = {}) {
  let response = {
    shouldEndSession: false
  };
  if (!draftLead || !draftLead.description) {
    console.log('no description');
    response.outputSpeech = yesNoQuestions['getDescription'];
    response.repromptText = "Say something like 'I need a plumber to fix my toilet'";
  } else if (!draftLead.urgency) {
    console.log('no urgency');
    response.outputSpeech = yesNoQuestions['getUrgency'];
    response.repromptText = `Say something like ${joinArrayWithDifferentLastJoiner(supportedUrgencies, ",", " or ")}`;
  } else {
    console.log('no sendToSystem');
    response.outputSpeech = yesNoQuestions['getSubmit'];
    response.repromptText = response.outputSpeech;
  }
  console.log('_getMissingInformation response: ');
  console.log(response);
  return response;
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
export function onLaunch(launchRequest, session, callback) {
  console.log("onLaunch requestId=" + launchRequest.requestId +
      ", sessionId=" + session.sessionId);

  let sessionAttributes = extend({
    previous: {}
  }, session.attributes);
  console.log('on launch session attributes');
  console.log(sessionAttributes);
  const cardTitle = "Welcome";
  const getDraftLeadState = _getMissingInformation(sessionAttributes.draftLead, sessionAttributes.userInfo);
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  sessionAttributes.previous.draftLead = sessionAttributes.draftLead;
  const speechOutput = `Hello user: <say-as interpret-as="spell-out">${session.user.userId.substring(10, 15)}</say-as>. ${getDraftLeadState.outputSpeech}`;
  const repromptText = `${getDraftLeadState.repromptText}`;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Called when the user specifies an intent for this skill.
 */
export function onIntent(event, context, callback) {
  const intentRequest = event.request;
  const session = event.session;
  const intent = intentRequest.intent;
  const intentName = intentRequest.intent.name;
  console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

  // Dispatch to your skill's intent handlers
  if ("ClearUserData" === intentName) {
    clearUserData(intent, session, callback);
  } else if ("ClearDraftData" === intentName) {
    clearDraftData(intent, session, callback);
  } else if ("CollectDescription" === intentName) {
    collectDescription(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    helpIntent(session, callback);
  } else if ("AMAZON.StopIntent" === intentName) {
    saveDataBeforeExiting(event, context);
  } else if ("AMAZON.YesIntent" === intentName) {
    yesIntent(session, callback);
  } else if ("AMAZON.NoIntent" === intentName) {
    noIntent(session, callback);
  } else {
    saveDataBeforeExiting(event, context);
  }
}

export function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
}
// --------------- Functions that control the skill's behavior -----------------------
function clearUserData(intent, session, callback) {
  let sessionAttributes = extend({
    previous: {}
  }, session.attributes);
  var speechOutput = "clear User Data";
  var repromptText = "clear User Data";
  var cardTitle = "clear User Data";
  var shouldEndSession = false;

  callback(sessionAttributes,
      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
function clearDraftData(intent, session, callback) {
  let sessionAttributes = extend({
    previous: {}
  }, session.attributes);
  var speechOutput = "clear draft Data";
  var repromptText = "clear draft Data";
  var cardTitle = "clear draft Data";
  var shouldEndSession = false;

  callback(sessionAttributes,
      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
function collectDescription(intent, session, callback) {
  let sessionAttributes = extend({
    previous: {}
  }, session.attributes);
  let draftLead = extend(defaultDraftLead, sessionAttributes.draftLead);
  sessionAttributes.previous.draftLead = draftLead;
  let speechOutput = '';
  let repromptText = '';
  const cardTitle = 'Collect description.';
  if (intent.slots.description) {
    draftLead.description = intent.slots.description.value;
    draftLead.title = `Alexa Lead - ${draftLead.description.substring(0, 40)}...`;
    speechOutput += ` You said you need: ${draftLead.description}`;
    regexToUrgency.forEach(urgency => {
      if (urgency.regex.test(draftLead.description)) {
        console.log('Urgency identified!');
        console.log(urgency.value);
        draftLead.urgency = urgency.value;
      }
    });
    regexToCategory.forEach(category => {
      if (category.regex.test(draftLead.description)) {
        console.log('category identified!');
        console.log(category.categoryId);
        draftLead.categoryIds.push(category.categoryId);
      }
    });
    sessionAttributes.previous.draftLead = sessionAttributes.draftLead;
  }
  sessionAttributes.draftLead = extend(sessionAttributes.draftLead, draftLead);
  const getDraftLeadState = _getMissingInformation(sessionAttributes.draftLead);
  speechOutput += getDraftLeadState.outputSpeech;
  repromptText += getDraftLeadState.repromptText;
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, function () {
      callback(sessionAttributes,
          buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
  }
}
function helpIntent(session, callback) {
  let sessionAttributes = extend({
    previous: {}
  }, session.attributes);
  var speechOutput = "Help";
  var repromptText = "Help";
  var cardTitle = "Help";
  var shouldEndSession = true;

  callback(sessionAttributes,
      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
function yesIntent(session, callback) {
  let sessionAttributes = extend({
    previous: {}
  }, session.attributes);
  const cardTitle = "Yes";
  const previousQuestion = sessionAttributes.previous.question;
  const previousDraftLead = sessionAttributes.previous.draftLead;
  if (!previousQuestion){
    var speechOutput = "Yes";
    var repromptText = "Yes";
    var shouldEndSession = true;
  } else if (previousQuestion === yesNoQuestions['getSubmit']) {
    const followUpQuestion = yesNoQuestions['getStartAnother'];
    var speechOutput = `Your project has been submitted! ${followUpQuestion}`;
    sessionAttributes.projects.push(sessionAttributes.draftLead);
    sessionAttributes.draftLead = defaultDraftLead;
    sessionAttributes.previous = {};
    sessionAttributes.previous.question = followUpQuestion;
    var shouldEndSession = false;
    var repromptText = followUpQuestion;
  } else if (previousQuestion === yesNoQuestions['getStartAnother']) {
    const getDraftLeadState = _getMissingInformation(sessionAttributes.draftLead, sessionAttributes.userInfo);
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    var speechOutput = getDraftLeadState.outputSpeech;
    var repromptText = getDraftLeadState.repromptText;
    var shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else {
    var speechOutput = "Yes";
    var repromptText = "Yes";
    var shouldEndSession = true;
  }

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, function () {
      callback(sessionAttributes,
          buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
  }
}
function noIntent(session, callback) {
  let sessionAttributes = extend({
    previous: {}
  }, session.attributes);
  var speechOutput = "No";
  var repromptText = "No";
  var cardTitle = "No";
  var shouldEndSession = true;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, function () {
      callback(sessionAttributes,
          buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
  }
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
      title: "Angie Fix - " + title,
      content: "Angie Fix - " + output
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

function buildSSMLSpeechletResponse(title, output, repromptText, shouldEndSession = false) {
  return {
    "outputSpeech": {
      "type": "SSML",
      "ssml": `<speak>${output}</speak>`
    },
    card: {
      type: "Simple",
      title: "Angie - " + title,
      content: "Angie - " + output
    },
    reprompt: {
      "outputSpeech": {
        "type": "SSML",
        "ssml": `<speak>${repromptText}</speak>`
      },
    },
    shouldEndSession: shouldEndSession
  };
}

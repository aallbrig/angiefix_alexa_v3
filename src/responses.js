import { saveAppData } from './db';
import { regexToUrgency, supportedUrgencies } from './regexToUrgency';
import { regexToCategory, supportedCategories } from './regexToCategory';
import {
  defaultDraftLead, defaultBuildResponse, defaultPreviousObject, defaultUserInfo
} from './models';
import { joinArrayWithDifferentLastJoiner } from './utilities';
const extend = require('lodash/extend');

const validation = {
  phoneNumber: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  postalCode: /^\d{5}(?:[-\s]\d{4})?$/
};

const QUESTIONS = {
  getSubmit: 'Your project is ready.  Would you like to submit?',
  getDescription: 'What kind of project would you like to start?',
  getUrgency: 'When would you like this done?',
  getPhoneNumber: 'What is your phone number?',
  getCategory: 'What category best describes your project?',
  confirmPhoneNumber: (currentPhoneNumber) =>
    `Can we still contact you through <say-as interpret-as="spell-out">${currentPhoneNumber}</say-as>?`,
  getStreetAddress: 'What street address will the work be done in?',
  confirmStreetAddress: (currentAddress) => `Will the work occur in ${currentAddress}?`,
  getPostalCode: 'What is your zip code?',
  confirmPostalCode: (currentPostalCode) =>
    `Is postal code <say-as interpret-as="spell-out">${currentPostalCode}</say-as> still correct?`,
  startAnotherProject: 'Would you like to start another project?'
};


// --------------- Helpers that build all of the responses -----------------------
function buildSSMLSpeechletResponse(title, output, repromptText, shouldEndSession = false) {
  const response = {
    outputSpeech: {
      type: 'SSML',
      ssml: `<speak>${output}</speak>`
    },
    card: {
      type: 'Simple',
      title: `Angie - ${title}`,
      content: `Angie -  ${output}`
    },
    reprompt: {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${repromptText}</speak>`
      }
    },
    shouldEndSession
  };
  console.log('buildSSMLSpeechletResponse response: ');
  console.log(response);
  return response;
}

// TODO: Refactor this into something more sensible in that it doesn't always exit
function saveDataBeforeExiting(event, context) {
  const userId = event.session.user.userId;
  const appData = event.session.attributes || {};
  saveAppData(userId, appData, () => {
    console.log('session ended and data saved successfully.');
    context.succeed();
  });
}

/*
(draftLead, userInfo) => {
  shouldEndSession:Boolean,
  outputSpeech:String,
  repromptText:string
}
*/
function _getMissingInformation(draftLead = defaultDraftLead, userInfo = defaultUserInfo) {
  const response = defaultBuildResponse;  // Overide this below!

  if (!draftLead || !draftLead.description) {
    console.log('no description');
    response.outputSpeech = QUESTIONS.getDescription;
    response.repromptText = 'Say something like "I need a plumber to fix my toilet"';
  } else if (!draftLead.urgency) {
    console.log('no urgency');
    response.outputSpeech = QUESTIONS.getUrgency;
    response.repromptText =
      `Say something like ${joinArrayWithDifferentLastJoiner(supportedUrgencies, ',', ' or ')}`;
  } else if (draftLead.categoryIds.length === 0) {
    console.log('no category');
    response.outputSpeech = QUESTIONS.getCategory;
    response.repromptText = `Say something like ${joinArrayWithDifferentLastJoiner(supportedCategories.slice(0, 2), ', ', ' or ')}.  Say "supported categories" to hear more.`;
  } else if (!draftLead.phone) {
    console.log('no phone #');
    if (!userInfo.phone) {
      console.log('no user phone number: ');
      response.outputSpeech = QUESTIONS.getPhoneNumber;
      response.repromptText = 'Say "317-987-6543"';
    } else {
      console.log(`Already have phone number: ${userInfo.phone}`);
      response.outputSpeech = QUESTIONS.confirmPhoneNumber(userInfo.phone);
      response.repromptText = 'Please say yes or no';
    }
  } else if (!draftLead.address.streetAddress) {
    console.log('no street address');
    if (!userInfo.address.streetAddress) {
      response.outputSpeech = QUESTIONS.getStreetAddress;
      response.repromptText = 'Say something like "123 main street"';
    } else {
      response.outputSpeech = QUESTIONS.confirmStreetAddress(userInfo.address.streetAddress);
      response.repromptText = 'Please say "yes" or "no"';
    }
  } else if (!draftLead.address.postalCode) {
    console.log('no postalCode');
    if (!userInfo.address.postalCode) {
      response.outputSpeech = QUESTIONS.getPostalCode;
    } else {
      response.outputSpeech = QUESTIONS.confirmPostalCode(userInfo.address.postalCode);
    }
  } else if (!draftLead.submitted) {
    console.log('no sendToSystem');
    response.outputSpeech = QUESTIONS.getSubmit;
    response.repromptText = response.outputSpeech;
  } else {
    console.log('unable to determine question state');
    console.log('draft lead info: ');
    console.log(draftLead);
    console.log('user info: ');
    console.log(userInfo);
    response.outputSpeech = 'unable to determine question state';
  }

  console.log('_getMissingInformation response: ');
  console.log(response);
  return response;
}

// --------------- Functions that control the skill's behavior -----------------------
function clearUserData(intent, session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  const outputSpeech = 'clearing user data';
  const repromptText = '';
  const cardTitle = 'Clearing User Data';
  sessionAttributes.userInfo = defaultUserInfo;
  const shouldEndSession = true;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}
function clearDraftData(intent, session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  sessionAttributes.draftLead = defaultDraftLead;
  const outputSpeech = 'clearing draft Data';
  const repromptText = '';
  const cardTitle = 'clear draft Data';
  const shouldEndSession = true;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}
function collectDescription(intent, session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  const draftLead = extend({}, defaultDraftLead, sessionAttributes.draftLead);
  const userInfo = extend({}, defaultUserInfo, sessionAttributes.userInfo);
  sessionAttributes.previous.draftLead = draftLead;
  let outputSpeech = '';
  let repromptText = '';
  const cardTitle = 'Collect description.';
  if (intent.slots.description) {
    draftLead.description = intent.slots.description.value;
    draftLead.title = `Alexa Lead - ${draftLead.description.substring(0, 40)}...`;
    // Extract ugency, if possible
    regexToUrgency.forEach(urgency => {
      if (urgency.regex.test(draftLead.description)) {
        console.log('Urgency identified!');
        console.log(urgency.value);
        draftLead.urgency = urgency.value;
      }
    });
    if (!draftLead.urgency) {
      draftLead.urgency = regexToUrgency[0].value;
    }
    // Extract category, if possible
    regexToCategory.forEach(category => {
      if (category.regex.test(draftLead.description)) {
        console.log('category identified!');
        console.log(category.categoryId);
        draftLead.categoryIds.push(category.categoryId);
      }
    });
    // Extract confirm phone #, if possible
    if (draftLead.description.indexOf('confirm phone') > 1) {
      draftLead.phone = userInfo.phone;
      draftLead.description = draftLead.description.replace('confirm phone', '');
    }
    // Extract confirm address, if possible
    if (draftLead.description.indexOf('confirm address') > 1) {
      draftLead.address.streetAddress = userInfo.address.streetAddress;
      draftLead.description = draftLead.description.replace('confirm address', '');
    }
    // Extract confirm postal code, if possible
    if (draftLead.description.indexOf('confirm postal') > 1) {
      draftLead.address.postalCode = userInfo.address.postalCode;
      draftLead.description = draftLead.description.replace('confirm postal', '');
    }
    outputSpeech += `Description: ${draftLead.description}`;
    sessionAttributes.previous.draftLead = sessionAttributes.draftLead;
  }
  sessionAttributes.draftLead = extend({}, sessionAttributes.draftLead, draftLead);
  const getDraftLeadState = _getMissingInformation(
    sessionAttributes.draftLead,
    sessionAttributes.userInfo
  );
  outputSpeech += getDraftLeadState.outputSpeech;
  repromptText += getDraftLeadState.repromptText;
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function collectCategory(intent, session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes, {
    pageNumber: 0,
    resultsPerPage: 4
  });
  const draftLead = extend({}, defaultDraftLead, sessionAttributes.draftLead);
  sessionAttributes.previous.draftLead = draftLead;
  let outputSpeech = '';
  let repromptText = '';
  const cardTitle = 'Collect Category.';
  if (intent.slots.category) {
    const maybeCategory = intent.slots.category.value;
    outputSpeech += `Category: ${maybeCategory}. `;
    // Extract category, if possible
    regexToCategory.forEach(category => {
      if (category.regex.test(draftLead.description)) {
        console.log('category identified!');
        console.log(category.name);
        draftLead.categoryIds.push(category.categoryId);
      } else if (category.name.toLowerCase() === maybeCategory.toLowerCase()) {
        console.log('category identified! ');
        console.log(category.name);
        draftLead.categoryIds.push(category.categoryId);
      } else if (maybeCategory.toLowerCase().indexOf(category.name.toLowerCase()) > -1) {
        console.log('category identified! ');
        console.log(category.name);
        draftLead.categoryIds.push(category.categoryId);
      }
    });
    sessionAttributes.previous.draftLead = sessionAttributes.draftLead;
  }
  sessionAttributes.draftLead = extend({}, sessionAttributes.draftLead, draftLead);
  const getDraftLeadState = _getMissingInformation(sessionAttributes.draftLead, sessionAttributes.userInfo);
  outputSpeech += getDraftLeadState.outputSpeech;
  repromptText += getDraftLeadState.repromptText;
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function collectPhoneNumberOrPostalCode(intent, session, callback) {
  console.log('collectPhoneNumberOrPostalCode!');
  let sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  const draftLead = extend({}, defaultDraftLead, sessionAttributes.draftLead);
  console.log('draft lead');
  console.log(draftLead);
  const userInfo = extend({}, defaultUserInfo, sessionAttributes.userInfo);
  console.log('user info');
  console.log(userInfo);
  sessionAttributes.previous.draftLead = draftLead;
  let outputSpeech = '';
  let repromptText = '';
  const cardTitle = 'Collect description.';
  if (
    intent.slots.phoneNumberOrPostalCode &&
    intent.slots.phoneNumberOrPostalCode.value.match(validation.phoneNumber)
  ) {
    draftLead.phone = intent.slots.phoneNumberOrPostalCode.value;
    userInfo.phone = intent.slots.phoneNumberOrPostalCode.value;
    console.log(`phone number collected! ${draftLead.phone}`);
    outputSpeech += ` Phone: <say-as interpret-as="spell-out">${draftLead.phone}</say-as>. `;
  } else if (
    intent.slots.phoneNumberOrPostalCode &&
    intent.slots.phoneNumberOrPostalCode.value.match(validation.postalCode)
  ) {
    draftLead.address.postalCode = intent.slots.phoneNumberOrPostalCode.value;
    userInfo.address.postalCode = intent.slots.phoneNumberOrPostalCode.value;
    console.log(`postal code collected! ${draftLead.address.postalCode}`);
    outputSpeech += ` Zip code: <say-as interpret-as="spell-out">${draftLead.address.postalCode}</say-as>. `;
  }
  sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
  const getDraftLeadState = _getMissingInformation(
    sessionAttributes.draftLead,
    sessionAttributes.userInfo
  );
  outputSpeech += getDraftLeadState.outputSpeech;
  repromptText += getDraftLeadState.repromptText;
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function collectStreetAddress(intent, session, callback) {
  console.log('collectStreetAddress!');
  let sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  const draftLead = extend({}, defaultDraftLead, sessionAttributes.draftLead);
  const userInfo = extend({}, defaultUserInfo, sessionAttributes.userInfo);
  sessionAttributes.previous.draftLead = draftLead;
  let outputSpeech = '';
  let repromptText = '';
  const cardTitle = 'Collect Street Address.';
  if (intent.slots.streetAddress) {
    draftLead.address.streetAddress = intent.slots.streetAddress.value;
    userInfo.address.streetAddress = intent.slots.streetAddress.value;
    console.log(`street address exists! ${draftLead.address.streetAddress}`);
    outputSpeech += ` You said: ${draftLead.address.streetAddress}. `;
  }
  sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
  const getDraftLeadState = _getMissingInformation(
    sessionAttributes.draftLead,
    sessionAttributes.userInfo
  );
  outputSpeech += getDraftLeadState.outputSpeech;
  repromptText += getDraftLeadState.repromptText;
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function helpIntent(session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  const outputSpeech = 'Help';
  const repromptText = 'Help';
  const cardTitle = 'Help';
  const shouldEndSession = true;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function listCategories(session, callback) {
  const sessionAttributes = extend({
    pageNumber: 0,
    resultsPerPage: 4
  }, session.attributes);

  console.log('page number');
  console.log(sessionAttributes.pageNumber);
  console.log('results per page');
  console.log(sessionAttributes.resultsPerPage);

  const offset = sessionAttributes.pageNumber * sessionAttributes.resultsPerPage;

  console.log('offset');
  console.log(offset);
  console.log('offset + results per page: ');
  console.log(offset + sessionAttributes.resultsPerPage);

  const categoriesToBeRead = supportedCategories.slice(offset, offset + sessionAttributes.resultsPerPage);

  console.log('categoriesToBeRead');
  console.log(categoriesToBeRead);

  sessionAttributes.pageNumber += 1;
  if ((sessionAttributes.pageNumber * sessionAttributes.resultsPerPage) + sessionAttributes.resultsPerPage > supportedCategories.length) {
    sessionAttributes.pageNumber = 0;
  }

  const outputSpeech = `${categoriesToBeRead.join(', ')}.  Say 'more' to hear more`;
  const repromptText = sessionAttributes.previous.question;
  const cardTitle = 'Categories List';
  const shouldEndSession = false;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
          buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function reviewDraft(session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  console.log('review draft');
  console.log('Review Draft');
  const draftLead = extend({}, defaultDraftLead, sessionAttributes.draftLead);
  const cardTitle = 'Review Draft';

  let outputSpeech = '';
  let repromptText;

  if (draftLead.description) {
    console.log(`have description: ${draftLead.description}`);
    outputSpeech += `description: ${draftLead.description}. `
  }
  if (draftLead.urgency) {
    console.log(`have urgency: ${draftLead.urgency}`);
    outputSpeech += `urgency: ${draftLead.urgency}. `
  }
  if (draftLead.categoryIds.length) {
    const draftCategories = regexToCategory.filter((category) => {
      console.log(`category ${category.categoryId}: ${category.name} - ${draftLead.categoryIds.indexOf(category.categoryId) > -1}`);
      console.log(category);
      return draftLead.categoryIds.indexOf(category.categoryId) > -1;
    }).map((category) => category.name);
    console.log(`have categoryIds: ${draftCategories.join(', ')}`);
    if (draftCategories.length) {
      outputSpeech += `categories: ${draftCategories.join(', ')}. `;
    }
  }
  if (draftLead.phone) {
    console.log(`have phone: ${draftLead.phone}`);
    outputSpeech += `phone: <say-as interpret-as="spell-out">${draftLead.phone}</say-as>. `;
  }
  if (draftLead.address.streetAddress) {
    console.log(`have street address: ${draftLead.address.streetAddress}`);
    outputSpeech += `street address: ${draftLead.address.streetAddress}. `;
  }
  if (draftLead.address.postalCode) {
    console.log(`have postal code: ${draftLead.address.postalCode}`);
    outputSpeech += `postal code: <say-as interpret-as="spell-out">${draftLead.address.postalCode}</say-as>. `;
  }

  if (!(sessionAttributes.previous || {}).question) {
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    repromptText = sessionAttributes.previous.question;
  } else {
    repromptText = sessionAttributes.previous.question;
  }
  const shouldEndSession = false;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
          buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function repeatIntent(session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  console.log('repeat intent');
  const cardTitle = 'Repeat';

  const getDraftLeadState = _getMissingInformation(
    sessionAttributes.draftLead,
    sessionAttributes.userInfo
  );
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  const outputSpeech = `I asked... ${getDraftLeadState.outputSpeech}`;
  const repromptText = getDraftLeadState.repromptText;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
          buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function startOverIntent(session, callback) {
  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  console.log('startOverIntent ');
  const cardTitle = 'Restart';

  sessionAttributes.draftLead = defaultDraftLead;
  sessionAttributes.previous = {};
  const getDraftLeadState = _getMissingInformation(
    sessionAttributes.draftLead,
    sessionAttributes.userInfo
  );
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  const outputSpeech = `Restart.  ${getDraftLeadState.outputSpeech}`;
  const repromptText = getDraftLeadState.repromptText;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;


  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
          buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function yesIntent(session, callback) {
  let sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  const userInfo = extend({}, defaultUserInfo, sessionAttributes.userInfo);
  console.log('yes intent user info: ');
  console.log(userInfo);
  const draftLead = extend({}, defaultDraftLead, sessionAttributes.draftLead);
  console.log('yes intent user info: ');
  const cardTitle = 'Yes';
  const previousQuestion = sessionAttributes.previous.question;
  let outputSpeech;
  let repromptText;
  let shouldEndSession;

  if (previousQuestion === QUESTIONS.confirmStreetAddress(userInfo.address.streetAddress)) {
    draftLead.address.streetAddress = userInfo.address.streetAddress;
    sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    outputSpeech = getDraftLeadState.outputSpeech;
    repromptText = getDraftLeadState.repromptText;
    shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else if (previousQuestion === QUESTIONS.confirmPhoneNumber(userInfo.phone)) {
    draftLead.phone = userInfo.phone;
    sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    outputSpeech = getDraftLeadState.outputSpeech;
    repromptText = getDraftLeadState.repromptText;
    shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else if (previousQuestion === QUESTIONS.confirmPostalCode(userInfo.address.postalCode)) {
    draftLead.address.postalCode = userInfo.address.postalCode;
    sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    outputSpeech = getDraftLeadState.outputSpeech;
    repromptText = getDraftLeadState.repromptText;
    shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else if (previousQuestion === QUESTIONS.getSubmit) {
    const followUpQuestion = QUESTIONS.startAnotherProject;
    outputSpeech = `Your project has been submitted! ${followUpQuestion}`;
    // outputSpeech = 'Your project has been submitted!';
    sessionAttributes.draftLead = extend({}, {
      submissionTime: new Date()
    }, sessionAttributes.draftLead);
    // Add to projects
    sessionAttributes.projects = [...[], ...sessionAttributes.projects];
    sessionAttributes.projects.push(sessionAttributes.draftLead);
    // reset draft and previous object
    console.log('draft lead before clear');
    console.log(sessionAttributes.draftLead);
    sessionAttributes.draftLead = defaultDraftLead;
    console.log('draft lead after clear');
    console.log(sessionAttributes.draftLead);
    console.log('defaultDraftLead');
    console.log(defaultDraftLead);
    sessionAttributes.previous = {};
    sessionAttributes.previous.question = followUpQuestion;
    shouldEndSession = false;
    repromptText = followUpQuestion;
  } else if (previousQuestion === QUESTIONS.startAnotherProject) {
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    outputSpeech = getDraftLeadState.outputSpeech;
    repromptText = getDraftLeadState.repromptText;
    shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else {
    outputSpeech = 'Yes';
    repromptText = 'Yes';
    shouldEndSession = true;
  }

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
          buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

function noIntent(session, callback) {
  let sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  const userInfo = extend({}, defaultUserInfo, sessionAttributes.userInfo);
  console.log('No intent user info: ');
  console.log(userInfo);
  const draftLead = extend({}, defaultDraftLead, sessionAttributes.draftLead);
  const cardTitle = 'No';
  const previousQuestion = sessionAttributes.previous.question;
  console.log('No intent previous question: ');
  console.log(previousQuestion);
  let outputSpeech;
  let repromptText;
  let shouldEndSession;

  if (previousQuestion === QUESTIONS.confirmStreetAddress(userInfo.address.streetAddress)) {
    userInfo.address.streetAddress = defaultUserInfo.address.streetAddress;
    sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    outputSpeech = getDraftLeadState.outputSpeech;
    repromptText = getDraftLeadState.repromptText;
    shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else if (previousQuestion === QUESTIONS.confirmPhoneNumber(userInfo.phone)) {
    userInfo.phone = defaultUserInfo.phone;
    sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    outputSpeech = getDraftLeadState.outputSpeech;
    repromptText = getDraftLeadState.repromptText;
    shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else if (previousQuestion === QUESTIONS.confirmPostalCode(userInfo.address.postalCode)) {
    userInfo.address.postalCode = defaultUserInfo.address.postalCode;
    sessionAttributes = extend({}, sessionAttributes, { draftLead, userInfo });
    const getDraftLeadState = _getMissingInformation(
      sessionAttributes.draftLead,
      sessionAttributes.userInfo
    );
    sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
    outputSpeech = getDraftLeadState.outputSpeech;
    repromptText = getDraftLeadState.repromptText;
    shouldEndSession = !!getDraftLeadState.shouldEndSession;
  } else {
    outputSpeech = 'No';
    shouldEndSession = true;
  }

  if (shouldEndSession) {
    const userId = session.user.userId;
    const appData = sessionAttributes;
    console.log('app data for ending session: ');
    console.log(appData);
    saveAppData(userId, appData, () => {
      callback(sessionAttributes,
          buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
    });
  } else {
    callback(sessionAttributes,
        buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
  }
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
export function onLaunch(launchRequest, session, callback) {
  console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

  const sessionAttributes = extend({}, defaultPreviousObject, session.attributes);
  console.log('on launch session object');
  console.log(session);
  console.log('on launch session attributes object');
  console.log(sessionAttributes);
  const cardTitle = 'Welcome';
  const getDraftLeadState = _getMissingInformation(
    sessionAttributes.draftLead,
    sessionAttributes.userInfo
  );
  sessionAttributes.previous.question = getDraftLeadState.outputSpeech;
  sessionAttributes.previous.draftLead = sessionAttributes.draftLead;
  let outputSpeech = `Hello there: <say-as interpret-as="spell-out">${String(session.user.userId).substring(10, 15)}</say-as>. `;
  if (!getDraftLeadState.outputSpeech === QUESTIONS.getDescription) {
    outputSpeech += ' I see you already have a draft project in progress.  Let\'s continue. ';
  }
  outputSpeech += ` ${getDraftLeadState.outputSpeech}`;
  const repromptText = `${getDraftLeadState.repromptText}`;
  const shouldEndSession = !!getDraftLeadState.shouldEndSession;

  callback(sessionAttributes,
      buildSSMLSpeechletResponse(cardTitle, outputSpeech, repromptText, shouldEndSession));
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
  if (intentName === 'ClearUserData') {
    clearUserData(intent, session, callback);
  } else if (intentName === 'CollectStreetAddress') {
    collectStreetAddress(intent, session, callback);
  } else if (intentName === 'CollectPhoneNumberOrPostalCode') {
    collectPhoneNumberOrPostalCode(intent, session, callback);
  } else if (intentName === 'ClearDraftData') {
    clearDraftData(intent, session, callback);
  } else if (intentName === 'CollectDescription') {
    collectDescription(intent, session, callback);
  } else if (intentName === 'CollectCategory') {
    collectCategory(intent, session, callback);
  } else if (intentName === 'ListCategories') {
    listCategories(session, callback);
  } else if (intentName === 'ReviewDraft') {
    reviewDraft(session, callback);
  } else if (intentName === 'AMAZON.RepeatIntent') {
    repeatIntent(session, callback);
  } else if (intentName === 'AMAZON.StartOverIntent') {
    startOverIntent(session, callback);
  } else if (intentName === 'AMAZON.HelpIntent') {
    helpIntent(session, callback);
  } else if (intentName === 'AMAZON.StopIntent') {
    saveDataBeforeExiting(event, context);
  } else if (intentName === 'AMAZON.YesIntent') {
    yesIntent(session, callback);
  } else if (intentName === 'AMAZON.NoIntent') {
    noIntent(session, callback);
  } else {
    saveDataBeforeExiting(event, context);
  }
}

export function buildResponse(sessionAttributes, speechletResponse) {
  const response = {
    version: '1.0',
    sessionAttributes,
    response: speechletResponse
  };
  console.log('buildResponse response: ');
  console.log(response);
  return response;
}

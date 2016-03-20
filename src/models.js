const extend = require('lodash/extend');

export const defaultAddress = {
  "streetAddress": null,
  "postalCode": null,
  "city": null,
  "state": null
}
export const defaultUserInfo = {
  "phone": null,
  "address": defaultAddress
}
export const defaultDraftLead = {
  "title": null,
  "description": null,
  "urgency": null,
  "categoryIds": [],
  "complete": false
}
export const defaultAppUserData = {
  "userInfo": defaultUserInfo,
  "projects": [],
  "draftLead": null
}


//
// // Speech output section
const defaultOutputSpeech = {
  outputSpeech: {
    type: "PlainText",
    ssml: "Default Plain Text Output Speech</speak>"
  }
};

const defaultSSMLOutputSpeech = {
  outputSpeech: {
    type: "SSML",
    ssml: "<speak>Default SSML Output Speech</speak>"
  }
};

const defaultSSMLRepromptOutputSpeech = {
  reprompt: defaultSSMLOutputSpeech
};

const defaultSimpleCard = {
  card: {
    type: "Simple",
    title: "Angie - Default Card",
    content: "Angie - Default Card Content"
  }
};
//
// const defaultResponse = extend();
//
// const defaultSSMLResponse = {
//   "outputSpeech": {
//     "type": "SSML",
//     "ssml": `<speak>${output}</speak>`
//   },
//   card: {
//     type: "Simple",
//     title: "Angie - " + title,
//     content: "Angie - " + output
//   },
//   reprompt: {
//     outputSpeech: {
//       "type": "SSML",
//       "ssml": `<speak>${repromptText}</speak>`
//     },
//   },
//   shouldEndSession: shouldEndSession
// };

// // Note: Authorization Url set up within amazon dev portal must return HTML
const defaultLinkAccountCard = {
  card: {
    type: "LinkAccount"
  }
};

const defaultShouldEndSession = {
  shouldEndSession: true
};

// You HAVE to call this function with {} if you are not passing in parameters!
export function generateResponse({
  outputSpeech = defaultOutputSpeech || defaultSSMLOutputSpeech,
  card = defaultSimpleCard,
  reprompt = defaultSSMLRepromptOutputSpeech,
  shouldEndSession = defaultShouldEndSession
}) {
  return extend(
    {},
    defaultSSMLResponse,
    outputSpeech,
    card,
    shouldEndSession
  );
};

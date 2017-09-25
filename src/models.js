const extend = require('lodash/extend');

export const defaultAddress = {
  streetAddress: null,
  postalCode: null,
  city: null,
  state: null
};

export const defaultUserInfo = {
  phone: null,
  address: defaultAddress
};

export const defaultDraftLead = {
  title: null,
  description: null,
  urgency: null,
  categoryIds: [],
  complete: false,
  phone: null,
  address: defaultAddress
};

export const defaultAppUserData = {
  userInfo: defaultUserInfo,
  projects: [],
  draftLead: defaultDraftLead
};

export const defaultBuildResponse = {
  outputSpeech: 'Default build response: please implement output speech',
  repromptText: 'Default build response: please implement reprompt text',
  shouldEndSession: false
};

export const defaultPreviousObject = {
  previous: {
    question: null,
    draftLead: defaultDraftLead
  }
};

//
// // Speech output section
const defaultOutputSpeech = {
  outputSpeech: {
    type: 'PlainText',
    ssml: 'Default Plain Text Output Speech</speak>'
  }
};

const defaultSSMLOutputSpeech = {
  outputSpeech: {
    type: 'SSML',
    ssml: '<speak>Default SSML Output Speech</speak>'
  }
};

const defaultSSMLRepromptOutputSpeech = {
  reprompt: defaultSSMLOutputSpeech
};

const defaultSimpleCard = {
  card: {
    type: 'Simple',
    title: 'Angie - Default Card',
    content: 'Angie - Default Card Content'
  }
};

const defaultShouldEndSession = {
  shouldEndSession: true
};

export function generateResponse({
  outputSpeech = defaultOutputSpeech || defaultSSMLOutputSpeech,
  card = defaultSimpleCard,
  reprompt = defaultSSMLRepromptOutputSpeech,
  shouldEndSession = defaultShouldEndSession
} = {}) {
  return extend(
    {},
    outputSpeech,
    card,
    reprompt,
    shouldEndSession
  );
}

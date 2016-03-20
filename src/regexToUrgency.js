export const regexToUrgency = [
  {
    regex: /(^(?=.*\bthis\b)(?=.*\bweek).*$)|(now|ASAP)/i,
    value: 'This week'
  },
  {
    regex: /^(?=.*\bnext\b)(?=.*\bweek).*$/i,
    value: 'Next week'
  },
  {
    regex: /(sometime|eventually|flexible)/i,
    value: 'I\'m flexible'
  }
];

export const supportedUrgencies = regexToUrgency.map(urgency => urgency.value);

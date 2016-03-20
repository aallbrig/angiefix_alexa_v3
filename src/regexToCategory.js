export const regexToCategory = [
  {
    regex: /(appliance|repair)/i,
    name: 'Appliance Repair',
    categoryId: '14'
  },
  {
    regex: /(carpet)/i,
    name: 'Carpet Cleaning',
    categoryId: '36'
  },
  {
    regex: /(ceramic|tile)/i,
    name: 'Ceramic Tile',
    categoryId: '40'
  },
  {
    regex: /(countertop)/i,
    name: 'Countertops',
    categoryId: '46'
  },
  {
    regex: /(deck|porch)/i,
    name: 'Decks & Porches',
    categoryId: '47'
  },
  {
    regex: /(door)/i,
    name: 'Doors',
    categoryId: '377'
  },
  {
    regex: /(drywall)/i,
    name: 'Drywall',
    categoryId: '53'
  },
  {
    regex: /(electric|electrical)/i,
    name: 'Electrical',
    categoryId: '54'
  },
  {
    regex: /(floor)/i,
    name: 'Flooring Sales/Installation/Repair',
    categoryId: '63'
  },
  {
    regex: /(garage)/i,
    name: 'Garage Doors',
    categoryId: '68'
  },
  {
    regex: /(gutter)/i,
    name: 'Gutter Repair & Replacement',
    categoryId: '74'
  },
  {
    regex: /(handymen)/i,
    name: 'Handymen',
    categoryId: '75'
  },
  {
    regex: /(AC|air\s*conditioning)/i,
    name: 'Heating & A/C',
    categoryId: '78'
  },
  {
    regex: /(housecleaning)/i,
    name: 'Housecleaning',
    categoryId: '80'
  },
  {
    regex: /(insulation)/i,
    name: 'Insulation',
    categoryId: '81'
  },
  {
    regex: /(landscaping|landscaper)/i,
    name: 'Landscaping',
    categoryId: '85'
  },
  {
    regex: /(landscaping|landscaper|lawn)/i,
    name: 'Lawn & Yard Work',
    categoryId: '86'
  },
  {
    regex: /(moving|move|movers)/i,
    name: 'Moving',
    categoryId: '98'
  },
  {
    regex: /^(?=.*\b(exterior|outside)\b)(?=.*\b(paint|painting)).*$/i,
    name: 'Painting - Exterior',
    categoryId: '293'
  },
  {
    regex: /^(?=.*\b(interior|inside)\b)(?=.*\b(paint|painting)).*$/i,
    name: 'Painting - Interior',
    categoryId: '294'
  },
  {
    regex: /(exterminator|pest|bugs)/i,
    name: 'Pest Control/Exterminating',
    categoryId: '58'
  },
  {
    regex: /(toilet|sink|bathroom|plumber)/i,
    name: 'Plumbing',
    categoryId: '107'
  },
  {
    regex: /(remodel|remodeling)/i,
    name: 'Remodeling - General',
    categoryId: '111'
  },
  {
    regex: /^(?=.*\b(remodel|remodeler)\b)(?=.*\b(kitch|bathroom)).*$/i,
    name: 'Remodeling - Kitchen & Bathroom',
    categoryId: '291'
  },
  {
    regex: /(roof|roofer|roofing)/i,
    name: 'Roofing',
    categoryId: '112'
  },
  {
    regex: /(tree)/i,
    name: 'Tree Service',
    categoryId: '126'
  },
  {
    regex: /(window)/i,
    name: 'Windows',
    categoryId: '143'
  }
];

export const supportedCategories = regexToCategory.map(category => category.name);

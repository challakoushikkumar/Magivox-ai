const COURSE_INTRODUCTIONS = Object.freeze({
  excel: 'Microsoft Excel is a spreadsheet application used to organise, calculate, clean, analyse and present data in rows and columns.',
  sql: 'SQL means Structured Query Language. It is used to create, read, update and analyse information stored in relational databases.',
  powerbi: 'Power BI is a business-intelligence platform used to connect data, transform it, build data models and create interactive reports.',
  tableau: 'Tableau is a visual analytics platform used to explore data and communicate findings through charts, dashboards and stories.',
  python: 'Python is a general-purpose programming language known for readable syntax and wide use in automation, data analysis, web development and AI.',
  r: 'R is a programming language designed for statistics, data analysis and visualisation.',
  java: 'Java is an object-oriented programming language used to build portable applications for web, desktop, mobile and enterprise systems.',
  dsa: 'Data structures organise information in memory, while algorithms are step-by-step methods for solving computational problems.',
  gis: 'GIS means Geographic Information System. It captures, manages, analyses and displays information connected to locations on Earth.',
  html: 'HTML means HyperText Markup Language. It gives a web page its structure and meaning.',
  css: 'CSS means Cascading Style Sheets. It controls the appearance, layout and responsive behaviour of web pages.',
  javascript: 'JavaScript is a programming language that adds logic, interaction and dynamic behaviour to web applications.',
  'data-entry': 'Data entry is the accurate process of capturing, checking, formatting and maintaining information in a digital system.',
  aptitude: 'Aptitude and reasoning measure how clearly and quickly a person can work with numbers, patterns, logic and written information.',
  interview: 'Interview preparation develops the ability to explain your background, skills and decisions clearly with relevant evidence.',
  'resume-prep': 'A resume is a concise professional document that presents relevant education, skills, projects and experience for a target role.'
});
const FOUNDATION_TITLES = Object.freeze({
  excel: 'What is Microsoft Excel?', sql: 'What is SQL?', powerbi: 'What is Power BI?', tableau: 'What is Tableau?', python: 'What is Python?', r: 'What is R?', java: 'What is Java?', dsa: 'What are Data Structures and Algorithms?', gis: 'What is GIS?', html: 'What is HTML?', css: 'What is CSS?', javascript: 'What is JavaScript?', 'data-entry': 'What is Data Entry?', aptitude: 'What are Aptitude and Reasoning?', interview: 'What is Interview Preparation?', 'resume-prep': 'What is an ATS-friendly Resume?'
});

const DEFINITIONS = Object.freeze({
  database: 'An organised collection of related data that can be stored, searched and updated.',
  table: 'A database or spreadsheet structure that stores related information in rows and columns.',
  select: 'The SQL command used to retrieve one or more columns from a table or query result.',
  column: 'A named field that stores one type of information for every record.',
  row: 'One complete record containing related values across columns.',
  cell: 'The intersection of a row and column in a spreadsheet.',
  range: 'A selected group of spreadsheet cells.',
  formula: 'An expression that calculates a result from values, cell references, operators or functions.',
  function: 'A reusable named operation that accepts input and returns a result.',
  variable: 'A named place used to store a value that a program can read or change.',
  array: 'An ordered collection of values accessed by position or index.',
  object: 'A value that groups related properties and behaviour.',
  class: 'A blueprint describing the data and behaviour that objects of a type should have.',
  method: 'A function associated with an object or class.',
  loop: 'A control structure that repeats instructions while a condition or sequence requires it.',
  condition: 'A true-or-false expression used to decide which instructions run.',
  join: 'An operation that combines related records by matching columns or keys.',
  key: 'A field used to identify a record or connect related records.',
  null: 'A marker showing that a value is missing or unknown.',
  filter: 'A condition that keeps only records matching a requirement.',
  dax: 'Data Analysis Expressions, the formula language used for calculations in Power BI data models.',
  measure: 'A calculation evaluated dynamically according to the current report filter context.',
  dashboard: 'A focused visual view of important measures, trends and filters used to support decisions.',
  kpi: 'Key Performance Indicator: a measurable value used to track progress toward an objective.',
  chart: 'A visual representation that makes comparisons, patterns or trends easier to understand.',
  crs: 'Coordinate Reference System: the rules used to locate spatial data correctly on Earth.',
  layer: 'A set of related geographic features displayed and analysed together in GIS.',
  semantic: 'Meaningful structure that describes the purpose of content to browsers and assistive technologies.',
  selector: 'A CSS pattern that chooses which HTML elements receive a style rule.',
  property: 'A named characteristic whose assigned value controls data or presentation.',
  event: 'An action or occurrence, such as a click or keypress, that a program can respond to.',
  dom: 'Document Object Model: the browser representation of an HTML document that JavaScript can read and change.',
  api: 'Application Programming Interface: a defined way for software components to exchange requests and data.',
  async: 'Asynchronous work that can finish later without blocking all other program activity.',
  validation: 'Checking whether data satisfies required rules before it is accepted or processed.',
  accuracy: 'The degree to which entered, calculated or reported information matches the correct value.',
  percentage: 'A ratio expressed out of 100.',
  ratio: 'A comparison showing the relative size of two quantities.',
  average: 'A representative value, commonly calculated by dividing a total by the number of values.',
  star: 'Situation, Task, Action and Result: a structure for explaining behavioural interview examples.',
  ats: 'Applicant Tracking System: software employers use to collect, organise and search job applications.',
  keyword: 'A significant word or phrase that connects evidence in a resume with a role or job description.'
});

const clean = value => String(value || '').trim();
const definitionFor = (term, topicTitle) => DEFINITIONS[clean(term).toLowerCase()] || `${clean(term)} is a core concept in ${topicTitle}. Learn what it controls, where it appears in the workflow, and how to verify its result.`;
const steps = workflow => clean(workflow).split(/\s*(?:->|→)\s*/).map(item => item.replace(/[.]$/, '').trim()).filter(Boolean);

export function getTopicCurriculum(course, topic, topicIndex = 0) {
  const concepts = (topic.keywords || []).map(term => ({ term: clean(term), definition: definitionFor(term, topic.title) }));
  const workflowSteps = steps(topic.workflow);
  const courseIntroduction = COURSE_INTRODUCTIONS[course.id] || `${course.title} teaches the concepts and practical workflow needed for ${course.description.toLowerCase()}`;
  return [
    {
      id: 'foundation', level: 'Foundation', title: topicIndex === 0 ? (FOUNDATION_TITLES[course.id] || `What is ${course.title}?`) : `What is ${topic.title}?`,
      paragraphs: [topicIndex === 0 ? courseIntroduction : topic.summary, topicIndex === 0 ? topic.summary : topic.useCase], concepts
    },
    {
      id: 'beginner', level: 'Beginner', title: 'Understand the process step by step',
      paragraphs: [`The goal is to use ${topic.title} correctly before adding more complex techniques.`, topic.useCase], steps: workflowSteps
    },
    {
      id: 'intermediate', level: 'Intermediate', title: 'Apply the concept to a practical task',
      paragraphs: [`Use this concept when: ${topic.useCase}`, `Worked example: ${topic.example}`, `Explain the result in your own words and connect it to the original requirement.`]
    },
    {
      id: 'advanced', level: 'Advanced', title: 'Quality, mistakes and professional practice',
      paragraphs: [`Common mistake: ${topic.mistake}`, `Professional check: ${topic.check}`, 'Work with a small verified example first, compare the result with the requirement, and document any assumption that affects the output.']
    },
    {
      id: 'project', level: 'Project & Revision', title: 'Build evidence and revise',
      paragraphs: [`Mini-project: create a small output that demonstrates ${topic.title}. Use this example as a starting point: ${topic.example}`],
      steps: [`State the requirement for ${topic.title}`, ...workflowSteps, `Verify the result: ${topic.check}`, 'Write two sentences explaining what you built and what you learned']
    }
  ];
}

export function curriculumSearchText(course, topic, topicIndex = 0) {
  return getTopicCurriculum(course, topic, topicIndex).flatMap(unit => [unit.level, unit.title, ...(unit.paragraphs || []), ...(unit.steps || []), ...(unit.concepts || []).flatMap(item => [item.term, item.definition])]).join(' ');
}

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizengine';

const questions = [
  { questionText: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 'Au', category: 'Science', difficulty: 'easy', points: 10, explanation: 'Au comes from the Latin word Aurum.' },
  { questionText: 'How many bones are in the adult human body?', options: ['196', '206', '216', '226'], correctAnswer: '206', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'Which planet is known as the Red Planet?', options: ['Jupiter', 'Saturn', 'Venus', 'Mars'], correctAnswer: 'Mars', category: 'Science', difficulty: 'easy', points: 10 },
  { questionText: 'What is the approximate speed of light in a vacuum?', options: ['150,000 km/s', '300,000 km/s', '450,000 km/s', '600,000 km/s'], correctAnswer: '300,000 km/s', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'What gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 'Carbon Dioxide', category: 'Science', difficulty: 'easy', points: 10 },
  { questionText: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Apparatus'], correctAnswer: 'Mitochondria', category: 'Science', difficulty: 'easy', points: 10, explanation: 'Mitochondria produce ATP through cellular respiration.' },
  { questionText: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correctAnswer: '6', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'Which planet has the most moons as of 2024?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctAnswer: 'Saturn', category: 'Science', difficulty: 'hard', points: 15 },
  { questionText: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Hydrogen', 'Nitrogen'], correctAnswer: 'Nitrogen', category: 'Science', difficulty: 'medium', points: 10, explanation: 'Nitrogen makes up about 78% of the atmosphere.' },
  { questionText: 'Who proposed the theory of general relativity?', options: ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Stephen Hawking'], correctAnswer: 'Albert Einstein', category: 'Science', difficulty: 'easy', points: 10 },
  { questionText: 'What is the hardest natural substance on Earth?', options: ['Quartz', 'Iron', 'Diamond', 'Titanium'], correctAnswer: 'Diamond', category: 'Science', difficulty: 'easy', points: 10 },
  { questionText: 'What organ produces insulin?', options: ['Liver', 'Kidney', 'Pancreas', 'Stomach'], correctAnswer: 'Pancreas', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'What is the chemical formula for water?', options: ['HO', 'H2O', 'H3O', 'OH2'], correctAnswer: 'H2O', category: 'Science', difficulty: 'easy', points: 10 },
  { questionText: 'Which type of radiation has the highest frequency?', options: ['Radio Waves', 'Microwaves', 'X-Rays', 'Gamma Rays'], correctAnswer: 'Gamma Rays', category: 'Science', difficulty: 'hard', points: 15 },
  { questionText: 'What is Newton\'s second law of motion?', options: ['F = mv', 'F = ma', 'F = m/a', 'F = a/m'], correctAnswer: 'F = ma', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'How many chromosomes does a typical human cell have?', options: ['23', '44', '46', '48'], correctAnswer: '46', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'What is the unit of electric current?', options: ['Volt', 'Watt', 'Ohm', 'Ampere'], correctAnswer: 'Ampere', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'What is the boiling point of water at sea level?', options: ['90°C', '95°C', '100°C', '105°C'], correctAnswer: '100°C', category: 'Science', difficulty: 'easy', points: 10 },
  { questionText: 'Which blood type is the universal donor?', options: ['A+', 'B-', 'O-', 'AB+'], correctAnswer: 'O-', category: 'Science', difficulty: 'medium', points: 10 },
  { questionText: 'What force keeps planets in orbit around the Sun?', options: ['Magnetism', 'Nuclear Force', 'Gravity', 'Friction'], correctAnswer: 'Gravity', category: 'Science', difficulty: 'easy', points: 10 },

  { questionText: 'What does CPU stand for?', options: ['Central Processing Unit', 'Central Peripheral Unit', 'Core Processor Unit', 'Central Program Unit'], correctAnswer: 'Central Processing Unit', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'Which language is primarily used for web styling?', options: ['JavaScript', 'Python', 'CSS', 'HTML'], correctAnswer: 'CSS', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'HyperText Transit Protocol', 'HighText Transfer Protocol', 'HyperText Transmission Protocol'], correctAnswer: 'HyperText Transfer Protocol', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'What does RAM stand for?', options: ['Random Access Memory', 'Read Access Memory', 'Rapid Access Memory', 'Readable Access Module'], correctAnswer: 'Random Access Memory', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'In what year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correctAnswer: '2007', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'What is Google\'s mobile operating system called?', options: ['iOS', 'Windows Mobile', 'Android', 'Symbian'], correctAnswer: 'Android', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'System Query Language', 'Sequential Query Language'], correctAnswer: 'Structured Query Language', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'Which company created JavaScript?', options: ['Microsoft', 'Apple', 'Netscape', 'Google'], correctAnswer: 'Netscape', category: 'Technology', difficulty: 'hard', points: 15 },
  { questionText: 'What is the maximum value of a single byte?', options: ['128', '255', '256', '512'], correctAnswer: '255', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'What does API stand for?', options: ['Application Programming Interface', 'Application Protocol Integration', 'Automated Program Interface', 'Application Process Integration'], correctAnswer: 'Application Programming Interface', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'What is the world\'s most widely used version control system?', options: ['SVN', 'Mercurial', 'Git', 'CVS'], correctAnswer: 'Git', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'What does IoT stand for?', options: ['Internet of Things', 'Integration of Technology', 'Interface of Tools', 'Internet of Transfer'], correctAnswer: 'Internet of Things', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'Which protocol is used to send emails?', options: ['FTP', 'HTTP', 'SMTP', 'TCP'], correctAnswer: 'SMTP', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'What is the binary representation of decimal 10?', options: ['1000', '1010', '1100', '0110'], correctAnswer: '1010', category: 'Technology', difficulty: 'hard', points: 15 },
  { questionText: 'What does VPN stand for?', options: ['Virtual Private Network', 'Very Personal Network', 'Virtual Public Network', 'Verified Private Network'], correctAnswer: 'Virtual Private Network', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'What is the default port for HTTPS?', options: ['80', '8080', '443', '8443'], correctAnswer: '443', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'What does DNS stand for?', options: ['Dynamic Name Server', 'Domain Name System', 'Distributed Network Service', 'Domain Node System'], correctAnswer: 'Domain Name System', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'What query style does MongoDB use?', options: ['SQL', 'GraphQL', 'BSON/JSON-like', 'XML'], correctAnswer: 'BSON/JSON-like', category: 'Technology', difficulty: 'medium', points: 10 },
  { questionText: 'What does AI stand for?', options: ['Automated Integration', 'Artificial Intelligence', 'Advanced Interface', 'Autonomous Input'], correctAnswer: 'Artificial Intelligence', category: 'Technology', difficulty: 'easy', points: 10 },
  { questionText: 'What does MVC stand for in software design?', options: ['Model View Controller', 'Module View Config', 'Main View Controller', 'Module Version Control'], correctAnswer: 'Model View Controller', category: 'Technology', difficulty: 'medium', points: 10 },

  { questionText: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: '1945', category: 'History', difficulty: 'easy', points: 10 },
  { questionText: 'Who was the first President of the United States?', options: ['John Adams', 'Thomas Jefferson', 'Benjamin Franklin', 'George Washington'], correctAnswer: 'George Washington', category: 'History', difficulty: 'easy', points: 10 },
  { questionText: 'In which year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1990'], correctAnswer: '1989', category: 'History', difficulty: 'medium', points: 10 },
  { questionText: 'Which ancient wonder was located in Alexandria?', options: ['Colossus of Rhodes', 'Hanging Gardens', 'Lighthouse of Alexandria', 'Temple of Artemis'], correctAnswer: 'Lighthouse of Alexandria', category: 'History', difficulty: 'hard', points: 15 },
  { questionText: 'What year did the Titanic sink?', options: ['1910', '1911', '1912', '1913'], correctAnswer: '1912', category: 'History', difficulty: 'easy', points: 10 },
  { questionText: 'Who primarily authored the Declaration of Independence?', options: ['George Washington', 'Benjamin Franklin', 'Thomas Jefferson', 'John Adams'], correctAnswer: 'Thomas Jefferson', category: 'History', difficulty: 'medium', points: 10 },
  { questionText: 'Julius Caesar ruled which empire?', options: ['Greek', 'Ottoman', 'Roman', 'Persian'], correctAnswer: 'Roman', category: 'History', difficulty: 'easy', points: 10 },
  { questionText: 'In which year did India gain independence?', options: ['1945', '1946', '1947', '1948'], correctAnswer: '1947', category: 'History', difficulty: 'easy', points: 10 },
  { questionText: 'Who was the first human to walk on the Moon?', options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'], correctAnswer: 'Neil Armstrong', category: 'History', difficulty: 'easy', points: 10 },
  { questionText: 'What was the first artificial satellite launched into space?', options: ['Explorer 1', 'Vostok 1', 'Sputnik 1', 'Luna 1'], correctAnswer: 'Sputnik 1', category: 'History', difficulty: 'medium', points: 10 },
  { questionText: 'In which century did the Renaissance begin?', options: ['12th', '13th', '14th', '15th'], correctAnswer: '14th', category: 'History', difficulty: 'hard', points: 15 },
  { questionText: 'What ship did Charles Darwin sail on?', options: ['HMS Victory', 'HMS Beagle', 'HMS Endeavour', 'HMS Discovery'], correctAnswer: 'HMS Beagle', category: 'History', difficulty: 'medium', points: 10 },
  { questionText: 'Which Egyptian queen allied with Julius Caesar?', options: ['Nefertiti', 'Hatshepsut', 'Cleopatra', 'Isis'], correctAnswer: 'Cleopatra', category: 'History', difficulty: 'easy', points: 10 },
  { questionText: 'Which country was the first to grant women the right to vote?', options: ['USA', 'UK', 'New Zealand', 'Australia'], correctAnswer: 'New Zealand', category: 'History', difficulty: 'hard', points: 15 },
  { questionText: 'What was the name of the first programmable electronic computer?', options: ['ENIAC', 'UNIVAC', 'Colossus', 'Mark I'], correctAnswer: 'ENIAC', category: 'History', difficulty: 'hard', points: 15 },

  { questionText: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Brisbane', 'Canberra'], correctAnswer: 'Canberra', category: 'Geography', difficulty: 'medium', points: 10 },
  { questionText: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctAnswer: 'Nile', category: 'Geography', difficulty: 'easy', points: 10 },
  { questionText: 'What is the largest continent by area?', options: ['Africa', 'North America', 'Europe', 'Asia'], correctAnswer: 'Asia', category: 'Geography', difficulty: 'easy', points: 10 },
  { questionText: 'Which country has the most natural lakes?', options: ['Russia', 'Canada', 'USA', 'China'], correctAnswer: 'Canada', category: 'Geography', difficulty: 'hard', points: 15 },
  { questionText: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctAnswer: 'Ottawa', category: 'Geography', difficulty: 'medium', points: 10 },
  { questionText: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 'Pacific', category: 'Geography', difficulty: 'easy', points: 10 },
  { questionText: 'What is the smallest country in the world?', options: ['Monaco', 'Liechtenstein', 'Vatican City', 'San Marino'], correctAnswer: 'Vatican City', category: 'Geography', difficulty: 'medium', points: 10 },
  { questionText: 'Mount Everest sits on the border of which two countries?', options: ['India & China', 'Nepal & China', 'Nepal & India', 'Tibet & Bhutan'], correctAnswer: 'Nepal & China', category: 'Geography', difficulty: 'medium', points: 10 },
  { questionText: 'Which desert is the largest in the world by area?', options: ['Gobi', 'Sahara', 'Arabian', 'Antarctic'], correctAnswer: 'Antarctic', category: 'Geography', difficulty: 'hard', points: 15 },
  { questionText: 'What is the capital of Japan?', options: ['Osaka', 'Kyoto', 'Tokyo', 'Hiroshima'], correctAnswer: 'Tokyo', category: 'Geography', difficulty: 'easy', points: 10 },
  { questionText: 'Which country has the most time zones?', options: ['Russia', 'USA', 'China', 'France'], correctAnswer: 'France', category: 'Geography', difficulty: 'hard', points: 15 },
  { questionText: 'What is the currency of Brazil?', options: ['Peso', 'Dollar', 'Real', 'Bolivar'], correctAnswer: 'Real', category: 'Geography', difficulty: 'medium', points: 10 },
  { questionText: 'Which country is called the Land of the Rising Sun?', options: ['China', 'South Korea', 'Japan', 'Vietnam'], correctAnswer: 'Japan', category: 'Geography', difficulty: 'easy', points: 10 },
  { questionText: 'The Amazon River flows primarily through which country?', options: ['Colombia', 'Peru', 'Venezuela', 'Brazil'], correctAnswer: 'Brazil', category: 'Geography', difficulty: 'easy', points: 10 },
  { questionText: 'What is the tallest mountain in Africa?', options: ['Mount Kenya', 'Mount Kilimanjaro', 'Mount Elgon', 'Ras Dashen'], correctAnswer: 'Mount Kilimanjaro', category: 'Geography', difficulty: 'medium', points: 10 },

  { questionText: 'What is the value of π to 2 decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], correctAnswer: '3.14', category: 'Math', difficulty: 'easy', points: 10 },
  { questionText: 'What is the square root of 144?', options: ['11', '12', '13', '14'], correctAnswer: '12', category: 'Math', difficulty: 'easy', points: 10 },
  { questionText: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correctAnswer: '30', category: 'Math', difficulty: 'easy', points: 10 },
  { questionText: 'What is the sum of interior angles of a triangle?', options: ['90°', '180°', '270°', '360°'], correctAnswer: '180°', category: 'Math', difficulty: 'easy', points: 10 },
  { questionText: 'What is 2 to the power of 10?', options: ['512', '1024', '2048', '256'], correctAnswer: '1024', category: 'Math', difficulty: 'medium', points: 10 },
  { questionText: 'What is the 10th Fibonacci number (starting 1,1,2,3...)?', options: ['34', '55', '89', '144'], correctAnswer: '55', category: 'Math', difficulty: 'hard', points: 15 },
  { questionText: 'What is the formula for area of a circle?', options: ['2πr', 'πr²', '2πr²', 'πd'], correctAnswer: 'πr²', category: 'Math', difficulty: 'easy', points: 10 },
  { questionText: 'Solve: 3x + 7 = 22. What is x?', options: ['3', '4', '5', '6'], correctAnswer: '5', category: 'Math', difficulty: 'medium', points: 10 },
  { questionText: 'What is the prime factorization of 60?', options: ['2² × 3 × 5', '2 × 3² × 5', '2³ × 5', '4 × 3 × 5'], correctAnswer: '2² × 3 × 5', category: 'Math', difficulty: 'hard', points: 15 },
  { questionText: 'What is 7! (7 factorial)?', options: ['2520', '5040', '720', '40320'], correctAnswer: '5040', category: 'Math', difficulty: 'medium', points: 10 },
  { questionText: 'What is the hypotenuse of a right triangle with legs 3 and 4?', options: ['5', '6', '7', '8'], correctAnswer: '5', category: 'Math', difficulty: 'easy', points: 10 },
  { questionText: 'What does a negative exponent indicate?', options: ['Subtraction', 'Reciprocal', 'Negative number', 'Division'], correctAnswer: 'Reciprocal', category: 'Math', difficulty: 'medium', points: 10 },
  { questionText: 'What is the derivative of x²?', options: ['x', '2x', 'x²/2', '2x²'], correctAnswer: '2x', category: 'Math', difficulty: 'hard', points: 15 },
  { questionText: 'How many sides does a dodecagon have?', options: ['10', '11', '12', '13'], correctAnswer: '12', category: 'Math', difficulty: 'medium', points: 10 },
  { questionText: 'What is the Roman numeral for 2024?', options: ['MMXXIII', 'MMXXIV', 'MMXXV', 'MMXXII'], correctAnswer: 'MMXXIV', category: 'Math', difficulty: 'hard', points: 15 },

  { questionText: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], correctAnswer: '366', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'Which is the most spoken native language in the world?', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], correctAnswer: 'Mandarin Chinese', category: 'General', difficulty: 'medium', points: 10 },
  { questionText: 'How many strings does a standard guitar have?', options: ['4', '5', '6', '7'], correctAnswer: '6', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'What is the largest organ in the human body?', options: ['Heart', 'Liver', 'Skin', 'Lungs'], correctAnswer: 'Skin', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'How many squares are on a standard chess board?', options: ['48', '56', '64', '72'], correctAnswer: '64', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'What is the official language of Brazil?', options: ['Spanish', 'Portuguese', 'English', 'French'], correctAnswer: 'Portuguese', category: 'General', difficulty: 'medium', points: 10 },
  { questionText: 'What is the name of the deepest ocean trench?', options: ['Java Trench', 'Puerto Rico Trench', 'Mariana Trench', 'Tonga Trench'], correctAnswer: 'Mariana Trench', category: 'General', difficulty: 'medium', points: 10 },
  { questionText: 'How many colors are in a standard rainbow?', options: ['5', '6', '7', '8'], correctAnswer: '7', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'What is the chemical symbol for sodium?', options: ['So', 'Sd', 'Na', 'Sm'], correctAnswer: 'Na', category: 'General', difficulty: 'medium', points: 10 },
  { questionText: 'Which planet is closest to the Sun?', options: ['Venus', 'Mars', 'Mercury', 'Earth'], correctAnswer: 'Mercury', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'What are the two official national sports of Canada?', options: ['Ice Hockey', 'Lacrosse', 'Both Ice Hockey and Lacrosse', 'Curling'], correctAnswer: 'Both Ice Hockey and Lacrosse', category: 'General', difficulty: 'hard', points: 15 },
  { questionText: 'In which country were the 2016 Summer Olympics held?', options: ['China', 'UK', 'Brazil', 'Japan'], correctAnswer: 'Brazil', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'What does UNESCO stand for?', options: ['United Nations Education, Science and Cultural Organization', 'Universal Nations Education, Social and Cultural Office', 'United Nations Economic, Social and Cultural Organization', 'Union of Nations for Education and Cultural Organization'], correctAnswer: 'United Nations Education, Science and Cultural Organization', category: 'General', difficulty: 'medium', points: 10 },
  { questionText: 'How many sides does a hexagon have?', options: ['4', '5', '6', '7'], correctAnswer: '6', category: 'General', difficulty: 'easy', points: 10 },
  { questionText: 'What is the highest-grossing film of all time (unadjusted)?', options: ['Avengers: Endgame', 'Titanic', 'Avatar', 'Star Wars: The Force Awakens'], correctAnswer: 'Avatar', category: 'General', difficulty: 'hard', points: 15 },
];

const seedDB = async () => {
  console.log('🌱 Starting database seed...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const deleted = await Question.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing questions`);

    const inserted = await Question.insertMany(questions);
    console.log(`✅ Seeded ${inserted.length} questions successfully!\n`);

    const categories = {};
    questions.forEach((q) => {
      categories[q.category] = (categories[q.category] || 0) + 1;
    });
    console.log('📊 Category Breakdown:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} questions`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database seeded and connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDB();
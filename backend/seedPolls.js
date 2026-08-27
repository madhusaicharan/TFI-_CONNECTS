const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Poll = require('./models/Poll');

dotenv.config();

const polls = [
  {
    question: "Who will win the Box Office clash this Sankranthi 2025?",
    options: [
      { text: "Ram Charan's Game Changer" },
      { text: "Venkatesh's Sankranthiki Vastunnam" },
      { text: "Balakrishna's Daaku Maharaaj" },
      { text: "It will be a tie!" }
    ]
  },
  {
    question: "Which music director is currently ruling Tollywood?",
    options: [
      { text: "Thaman S" },
      { text: "Devi Sri Prasad" },
      { text: "Anirudh Ravichander" },
      { text: "Mickey J. Meyer" }
    ]
  },
  {
    question: "What is your favorite genre of Telugu movies?",
    options: [
      { text: "Mass Commercial Action" },
      { text: "Rom-Com / Family Drama" },
      { text: "Mythological / Period Drama" },
      { text: "Sci-Fi / Thriller" }
    ]
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await Poll.deleteMany(); // Clear existing
    await Poll.insertMany(polls);
    console.log('Polls seeded successfully');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

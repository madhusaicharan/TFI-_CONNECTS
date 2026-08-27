const mongoose = require('mongoose');
require('dotenv').config();

const Movie = require('./models/Movie');
const Celebrity = require('./models/Celebrity');
const BoxOffice = require('./models/BoxOffice');
const Social = require('./models/Social');

const MOCK_DATA = {
  hero: [
    { id: 801688, title: "KALKI 2898 AD", poster: "https://image.tmdb.org/t/p/w500/k9Y96g_pD1U.jpg", rating: 9.8, genres: ["Sci-Fi", "Action"], description: "A modern myth that blends Indian epics with futuristic science fiction.", releaseYear: "2024", duration: "2h 50m", director: "Nag Ashwin", cast: [{ name: "Prabhas", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" }, { name: "Kamal Haasan", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" }] },
    { id: 1182390, title: "SARIPODHAA SANIVAARAM", poster: "https://image.tmdb.org/t/p/w500/v90nQhVvM5oOsh6B6i4y3mBq70J.jpg", rating: 8.5, genres: ["Action", "Drama"], description: "A gripping tale of justice and anger management.", releaseYear: "2024", duration: "2h 30m", director: "Vivek Athreya", cast: [{ name: "Nani", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }] }
  ],
  trending: [
    { id: 579974, title: "RRR", poster: "https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0ye9TFwo6.jpg", rating: 9.8, genres: ["Action", "Drama"] },
    { id: 792293, title: "SALAAR", poster: "https://image.tmdb.org/t/p/w500/bUR_UscXjFc.jpg", rating: 9.5, genres: ["Action", "Thriller"] }
  ],
  top10: [
    { id: 1182390, title: "SARIPODHAA SANIVAARAM", poster: "https://image.tmdb.org/t/p/w500/v90nQhVvM5oOsh6B6i4y3mBq70J.jpg", rating: 8.5, genres: ["Action", "Drama"] }
  ],
  newReleases: [
    { id: 800650, title: "GUNTUR KAARAM", poster: "https://image.tmdb.org/t/p/w500/DYq-X2zD6fM.jpg", rating: 7.5, genres: ["Action", "Family"] }
  ],
  action: [
    { id: 693134, title: "PUSHPA: THE RISE", poster: "https://image.tmdb.org/t/p/w500/pKctjRBW99U.jpg", rating: 9.2, genres: ["Action", "Crime"] }
  ],
  classics: [
    { id: 158023, title: "MAYABAZAR", poster: "https://image.tmdb.org/t/p/w500/hLtcUnDZZuBNSONZbRTiS67bnyz.jpg", rating: 9.8, genres: ["Classic", "Mythological"] },
    { id: 354630, title: "SHIVA", poster: "https://image.tmdb.org/t/p/w500/q6loMZxRfWdgmpK9OzHNtwSVHxs.jpg", rating: 9.4, genres: ["Classic", "Action"] },
    { id: 94965, title: "OKKADU", poster: "https://image.tmdb.org/t/p/w500/nVBa5QWSPrVzFyHK2XWrsruQzyl.jpg", rating: 9.6, genres: ["Classic", "Action"] },
    { id: 23381, title: "POKIRI", poster: "https://image.tmdb.org/t/p/w500/rQ8NH5f3CxRrmqZWMZNYPwLmjDS.jpg", rating: 9.7, genres: ["Classic", "Action"] },
    { id: 37172, title: "ATHADU", poster: "https://image.tmdb.org/t/p/w500/ojZAu2KOemaDEfLnJXZeuU9QQko.jpg", rating: 9.7, genres: ["Classic", "Action"] }
  ],
  romance: [
    { id: 857905, title: "SITA RAMAM", poster: "https://image.tmdb.org/t/p/w500/xZ1D9t7v8cO8h55a.jpg", rating: 9.6, genres: ["Romance", "Drama"] }
  ],
  scifi: [
    { id: 801688, title: "KALKI 2898 AD", poster: "https://image.tmdb.org/t/p/w500/k9Y96g_pD1U.jpg", rating: 9.8, genres: ["Sci-Fi", "Action"] }
  ],
  comedy: [
    { id: 778810, title: "JATHI RATNALU", poster: "https://image.tmdb.org/t/p/w500/778810.jpg", rating: 9.5, genres: ["Comedy"] }
  ],
  mythological: [
    { id: 736806, title: "ADIPURUSH", poster: "https://image.tmdb.org/t/p/w500/736806.jpg", rating: 7.5, genres: ["Mythology", "Action"] }
  ],
  boxoffice: [
    { id: 801688, title: "KALKI 2898 AD", collection: "₹1,100 Cr+", budget: "₹600 Cr", status: "All Time Blockbuster", percent: 183 },
    { id: 792293, title: "SALAAR", collection: "₹700 Cr+", budget: "₹250 Cr", status: "Blockbuster", percent: 280 }
  ],
  celebs: [
    {
      name: "Prabhas",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
      bio: "Uppalapati Venkata Suryanarayana Prabhas Raju is one of the highest-paid actors in Indian cinema.",
      age: 44,
      debut: "Eeswar (2002)",
      movies: [
        { id: 801688, title: "KALKI 2898 AD", poster: "https://image.tmdb.org/t/p/w500/k9Y96g_pD1U.jpg", rating: 9.8 },
      ]
    }
  ],
  social: [
    { type: 'tweet', author: "TFI Fanatic", handle: "@TFIFanatic", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80", content: "Kalki 2898 AD is a visual wonder! Mind blown! 🤯 #Kalki2898AD #Prabhas", likes: "12.4K", retweets: "4.2K", time: "2h" },
    { type: 'meme', image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80", caption: "Me waiting for Pushpa 2 updates like... 🕰️" }
  ]
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await Movie.deleteMany({});
    await Celebrity.deleteMany({});
    await BoxOffice.deleteMany({});
    await Social.deleteMany({});

    // Seed Movies with category tags (deduplicating by ID)
    const allSeedMovies = [
      ...MOCK_DATA.hero.map(m => ({ ...m, category: 'hero' })),
      ...MOCK_DATA.trending.map(m => ({ ...m, category: 'trending' })),
      ...MOCK_DATA.top10.map(m => ({ ...m, category: 'top10' })),
      ...MOCK_DATA.newReleases.map(m => ({ ...m, category: 'new' })),
      ...MOCK_DATA.action.map(m => ({ ...m, category: 'action' })),
      ...MOCK_DATA.classics.map(m => ({ ...m, category: 'classic' })),
      ...MOCK_DATA.romance.map(m => ({ ...m, category: 'romance' })),
      ...MOCK_DATA.scifi.map(m => ({ ...m, category: 'scifi' })),
      ...MOCK_DATA.comedy.map(m => ({ ...m, category: 'comedy' })),
      ...MOCK_DATA.mythological.map(m => ({ ...m, category: 'mythological' }))
    ];

    const uniqueMovies = Array.from(new Map(allSeedMovies.map(m => [m.id, m])).values());
    await Movie.insertMany(uniqueMovies);

    // Seed others
    await Celebrity.insertMany(MOCK_DATA.celebs);
    await BoxOffice.insertMany(MOCK_DATA.boxoffice);
    await Social.insertMany(MOCK_DATA.social);

    console.log('Seeding Complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();

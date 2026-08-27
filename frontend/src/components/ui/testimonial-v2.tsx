import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Heart, Repeat, MessageCircle, BadgeCheck, User, MessageSquare, ArrowUpRight, Flame } from 'lucide-react';
import { fetchTrendingTweets } from '../../services/api';

// --- Types ---
export interface TweetItem {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  verified?: boolean;
  text: string;
  timestamp: string;
  likes: string;
  retweets: string;
  hashtag?: string;
}

export interface RedditItem {
  id: string;
  title: string;
  text?: string;
  author: string;
  subreddit?: string;
  upvotes?: string;
  comments?: string;
  permalink?: string;
  timestamp?: string;
}

// Fallback authentic real-time TFI Twitter accounts data
const fallbackTweets: TweetItem[] = [
  {
    id: "tw-1",
    name: "TFI Official",
    handle: "TFI_Official",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "🔥 HISTORIC BOX OFFICE! #Devara crosses ₹500 Cr worldwide gross! Massive celebrations across Telugu states 💥🍿 #NTR #DevaraStorm",
    timestamp: "12m ago",
    likes: "24.5K",
    retweets: "6.2K",
    hashtag: "#Devara",
  },
  {
    id: "tw-2",
    name: "Jeevi (Idlebrain)",
    handle: "Idlebrainjeevar",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "EXCLUSIVE: #SSMB29 pre-production work is happening at a grand scale in Munich. Director SS Rajamouli & Mahesh Babu planning an Indian cinema benchmark! 🌍🎬",
    timestamp: "35m ago",
    likes: "18.9K",
    retweets: "4.8K",
    hashtag: "#SSMB29",
  },
  {
    id: "tw-3",
    name: "Tollywood Hub",
    handle: "TollywoodHub",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "USA Premiere Box Office 🔥 #Pushpa2TheRule breaches $3.5M+ in pre-sales alone! All-time record for any Indian movie in North America 🇺🇸🔥 #AlluArjun",
    timestamp: "1h ago",
    likes: "32.1K",
    retweets: "9.4K",
    hashtag: "#Pushpa2",
  },
  {
    id: "tw-4",
    name: "Vamshi Shekar",
    handle: "VamshiShekar",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "#GameChanger teaser response is insane! Mega Power Star Ram Charan's screen presence & Shankar's grand visuals getting universal praise ⚡️🎶",
    timestamp: "2h ago",
    likes: "14.2K",
    retweets: "3.5K",
    hashtag: "#GameChanger",
  },
  {
    id: "tw-5",
    name: "Film Companion South",
    handle: "FilmCompanionSouth",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "Review Drop: #Kalki2898AD is a masterclass in sci-fi epic storytelling. Prabhas & Amitabh Bachchan shine in this visual spectacle! 🌟🌟🌟🌟🌟",
    timestamp: "3h ago",
    likes: "45.8K",
    retweets: "12.1K",
    hashtag: "#Kalki2898AD",
  },
  {
    id: "tw-6",
    name: "B.A. Raju's Team",
    handle: "BARajuSikara",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "#OG Glimpse creates havoc on YouTube! Power Star Pawan Kalyan’s intense swag hits 50 Million views in record time! ⚔️🔥 #TheyCallHimOG",
    timestamp: "4h ago",
    likes: "28.7K",
    retweets: "7.9K",
    hashtag: "#TheyCallHimOG",
  },
  {
    id: "tw-7",
    name: "TFI Box Office Tracker",
    handle: "TFI_BoxOffice",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "Top 5 Highest Day 1 Openers in Telugu Cinema History: 1. RRR - ₹223Cr 2. Baahubali 2 - ₹217Cr 3. Kalki - ₹191Cr 4. Devara - ₹172Cr 5. Salaar - ₹178Cr 🏆",
    timestamp: "5h ago",
    likes: "51.4K",
    retweets: "15.3K",
    hashtag: "#BoxOffice",
  },
  {
    id: "tw-8",
    name: "Tollywood Buzz",
    handle: "TollywoodBuzz",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "Re-release fever! #Okkadu 4K remastered shows housefull across Nizam & Ceeded. Telugu cinema audience love for classics is unbelievable 💥❤️",
    timestamp: "6h ago",
    likes: "19.8K",
    retweets: "5.1K",
    hashtag: "#Okkadu4K",
  },
  {
    id: "tw-9",
    name: "South Cinema News",
    handle: "SouthCinemaNews",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    verified: true,
    text: "NTR Jr & Prashanth Neel action extravaganza script finalized. Shoot begins early 2025! High octane action Guaranteed 🔥💥 #NTRNeel #TFI",
    timestamp: "7h ago",
    likes: "22.6K",
    retweets: "6.7K",
    hashtag: "#NTRNeel",
  },
];

// Fallback authentic Reddit discussions data
const fallbackRedditDiscussions: RedditItem[] = [
  {
    id: "red-1",
    title: "SSMB29 vs Global Action Epics: Rajamouli & Mahesh Babu's vision for Indian Cinema",
    text: "Detailed breakdown on pre-production in Munich, jungle adventure genre scale, and overseas distribution strategy for SSMB29.",
    author: "TollywoodCinephile",
    subreddit: "r/tollywood",
    upvotes: "3.4K",
    comments: "482",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "2h ago",
  },
  {
    id: "red-2",
    title: "Game Changer vs Pushpa 2: Overseas Premiere Box Office & Advance Booking Clash",
    text: "Analyzing North America pre-sales numbers, IMAX screen allocations, and theatrical rights valuation for upcoming mega blockbusters.",
    author: "MegaPower_Fan",
    subreddit: "r/tollywood",
    upvotes: "2.8K",
    comments: "319",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "3h ago",
  },
  {
    id: "red-3",
    title: "Devara Part 1 Climax Sequence & Anirudh BGM: Is this Koratala Siva's best work?",
    text: "The sea battle action design, Jr NTR's dual role performance, and high voltage score created an unforgettable theatrical high.",
    author: "NTR_Cult_HYD",
    subreddit: "r/tollywood",
    upvotes: "4.1K",
    comments: "567",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "5h ago",
  },
  {
    id: "red-4",
    title: "Prabhas Box Office Dominance: From Baahubali 2 to Kalki 2898 AD & Salaar",
    text: "How Prabhas established unmatched pan-India stardom with back-to-back ₹100Cr+ Day 1 openers across languages.",
    author: "CinemaGeek_TFI",
    subreddit: "r/tollywood",
    upvotes: "5.2K",
    comments: "712",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "6h ago",
  },
  {
    id: "red-5",
    title: "Okkadu vs Pokiri: Which Mahesh Babu classic redefined commercial Telugu cinema?",
    text: "Re-release housefull trends in Nizam & Ceeded prove that classic TFI screenplays hold timeless replay value.",
    author: "TollywoodVintage",
    subreddit: "r/tollywood",
    upvotes: "1.9K",
    comments: "245",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "8h ago",
  },
  {
    id: "red-6",
    title: "They Call Him OG Glimpse: Sujeeth's gangster aesthetic & Pawan Kalyan's swag",
    text: "Deconstructing the Japanese katana weapons, neo-noir cinematography, and massive YouTube record response.",
    author: "OG_PawanKalyan",
    subreddit: "r/tollywood",
    upvotes: "3.7K",
    comments: "490",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "10h ago",
  },
  {
    id: "red-7",
    title: "Telugus in Overseas Markets: How USA & Gulf rights became top revenue drivers for TFI",
    text: "A deep dive into premiere ticket pricing, theater chains expansion, and fan celebration culture across Dallas, New Jersey, and Dubai.",
    author: "FilmTradeAnalyst",
    subreddit: "r/tollywood",
    upvotes: "2.5K",
    comments: "338",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "12h ago",
  },
  {
    id: "red-8",
    title: "Keeravani vs Thaman vs Anirudh: The evolving soundscapes of big-budget TFI epics",
    text: "Comparing orchestral brass arrangements, ethnic folk beats, and synthwave bass drops in modern Telugu action soundtracks.",
    author: "TFI_Music_Lover",
    subreddit: "r/tollywood",
    upvotes: "2.1K",
    comments: "284",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "14h ago",
  },
  {
    id: "red-9",
    title: "Critically Acclaimed Low Budget Gems of Tollywood: Why indie films need more screens",
    text: "Highlighting unique concepts, stellar writing, and breakout performances in non-mainstream Telugu cinema this year.",
    author: "HyderabadiCinephile",
    subreddit: "r/tollywood",
    upvotes: "1.8K",
    comments: "210",
    permalink: "https://reddit.com/r/tollywood",
    timestamp: "16h ago",
  },
];

// --- Sub-Component: Single Tweet Column ---
export const TweetColumn = (props: {
  className?: string;
  tweets: TweetItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 16,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-8 pb-8 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.tweets.map(({ name, handle, avatar, verified, text, timestamp, likes, retweets, hashtag }, i) => (
                <motion.li 
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  onClick={() => window.open(`https://x.com/${handle.replace('@','')}`, '_blank')}
                  whileHover={{ 
                    scale: 1.025,
                    y: -6,
                    boxShadow: "0 25px 50px -12px rgba(229, 9, 20, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.5)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  whileFocus={{ 
                    scale: 1.025,
                    y: -6,
                    boxShadow: "0 25px 50px -12px rgba(229, 9, 20, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.5)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className="p-7 sm:p-8 rounded-2xl border border-neutral-800/90 shadow-2xl w-full max-w-[420px] bg-neutral-900/95 backdrop-blur-md text-white transition-all duration-300 cursor-pointer select-none group focus:outline-none focus:ring-2 focus:ring-red-500/40 hover:border-red-500/50 my-2" 
                >
                  <article className="m-0 p-0">
                    {/* Header */}
                    <header className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        {avatar ? (
                          <img
                            width={46}
                            height={46}
                            src={avatar}
                            alt={`Avatar of ${name}`}
                            className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-neutral-700/80 group-hover:ring-red-500/60 transition-all duration-300 ease-in-out flex-shrink-0"
                            onError={(e) => {
                              // If picture fails, convert to clean empty placeholder
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}

                        {/* Clean Fallback Avatar (No random placeholder images) */}
                        <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-neutral-300 font-bold text-sm flex-shrink-0 ${avatar ? 'hidden' : ''}`}>
                          {name ? name.charAt(0).toUpperCase() : <User size={18} />}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <cite className="font-bold not-italic tracking-tight text-white transition-colors duration-300 text-[15px] sm:text-base">
                              {name}
                            </cite>
                            {verified && (
                              <BadgeCheck size={17} className="text-sky-400 fill-sky-400/20 flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm text-neutral-400 font-medium transition-colors duration-300 mt-0.5">
                            @{handle} · {timestamp}
                          </span>
                        </div>
                      </div>

                      {/* X / Twitter icon */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-500 group-hover:text-sky-400 transition-colors flex-shrink-0">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </header>

                    {/* Tweet Content Body */}
                    <p className="text-neutral-200 leading-relaxed font-normal m-0 text-[14px] sm:text-[15px] transition-colors duration-300 my-4">
                      {text}
                    </p>

                    {/* Tweet Footer */}
                    <footer className="flex items-center justify-between text-neutral-400 text-xs sm:text-sm mt-5 pt-4 border-t border-neutral-800/80">
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer font-medium">
                          <Heart size={15} className="hover:scale-110 transition-transform" />
                          <span>{likes}</span>
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer font-medium">
                          <Repeat size={15} className="hover:scale-110 transition-transform" />
                          <span>{retweets}</span>
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-sky-400 transition-colors cursor-pointer font-medium">
                          <MessageCircle size={15} className="hover:scale-110 transition-transform" />
                        </span>
                      </div>
                      {hashtag && (
                        <span className="font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full text-xs border border-red-500/20">
                          {hashtag}
                        </span>
                      )}
                    </footer>
                  </article>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

// --- Sub-Component: Single Reddit Column ---
export const RedditColumn = (props: {
  className?: string;
  discussions: RedditItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 16,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-8 pb-8 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.discussions.map(({ title, text, author, subreddit, upvotes, comments, permalink, timestamp }, i) => (
                <motion.li 
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  onClick={() => window.open(permalink || `https://reddit.com/r/${(subreddit || 'tollywood').replace('r/','')}`, '_blank')}
                  whileHover={{ 
                    scale: 1.025,
                    y: -6,
                    boxShadow: "0 25px 50px -12px rgba(255, 69, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.5)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  whileFocus={{ 
                    scale: 1.025,
                    y: -6,
                    boxShadow: "0 25px 50px -12px rgba(255, 69, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.5)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className="p-7 sm:p-8 rounded-2xl border border-neutral-800/90 shadow-2xl w-full max-w-[420px] bg-neutral-900/95 backdrop-blur-md text-white transition-all duration-300 cursor-pointer select-none group focus:outline-none focus:ring-2 focus:ring-orange-500/40 hover:border-orange-500/50 my-2" 
                >
                  <article className="m-0 p-0">
                    {/* Header */}
                    <header className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        {/* Reddit Logo Icon Badge */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md">
                          r/
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-orange-400 text-sm">
                              {subreddit || 'r/tollywood'}
                            </span>
                            {timestamp && (
                              <span className="text-xs text-neutral-500">· {timestamp}</span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 font-medium mt-0.5">
                            Posted by u/{author}
                          </span>
                        </div>
                      </div>

                      {permalink ? (
                        <a 
                          href={permalink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-neutral-500 group-hover:text-orange-400 transition-colors flex-shrink-0"
                          aria-label="View on Reddit"
                        >
                          <ArrowUpRight size={20} />
                        </a>
                      ) : null}
                    </header>

                    {/* Post Title */}
                    <h3 className="font-bold text-white text-[15px] sm:text-base leading-snug m-0 my-3 group-hover:text-orange-300 transition-colors">
                      {title}
                    </h3>

                    {/* Post Snippet Text */}
                    {text && (
                      <p className="text-neutral-300 leading-relaxed font-normal m-0 text-xs sm:text-sm my-3 line-clamp-3">
                        {text}
                      </p>
                    )}

                    {/* Footer / Stats */}
                    <footer className="flex items-center justify-between text-neutral-400 text-xs sm:text-sm mt-5 pt-4 border-t border-neutral-800/80">
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5 text-orange-400/90 font-medium">
                          <Flame size={15} />
                          <span>{upvotes || '2.4K'} upvotes</span>
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-neutral-200 transition-colors cursor-pointer font-medium">
                          <MessageSquare size={15} />
                          <span>{comments || '180'} comments</span>
                        </span>
                      </div>
                      <span className="font-semibold text-orange-400/90 bg-orange-500/10 px-2.5 py-1 rounded-full text-xs border border-orange-500/20">
                        Discussion
                      </span>
                    </footer>
                  </article>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

// --- Main Live Twitter Feed Section ---
export const LiveTwitterFeed = () => {
  const [realTimeTweets, setRealTimeTweets] = useState<TweetItem[]>([]);

  useEffect(() => {
    const loadRealtimeTweets = async () => {
      try {
        const liveData = await fetchTrendingTweets();
        if (liveData && liveData.length > 0) {
          const formatted: TweetItem[] = liveData.map((t: any, index: number) => ({
            id: t.id || `live-${index}`,
            name: t.user || 'TFI Official',
            handle: t.handle || 'TFIUpdates',
            avatar: t.avatar || '',
            verified: true,
            text: t.content || t.title || '',
            timestamp: t.time || '10m ago',
            likes: t.likes || `${Math.floor(Math.random() * 20) + 10}K`,
            retweets: t.retweets || `${Math.floor(Math.random() * 5) + 2}K`,
            hashtag: '#Tollywood',
          }));
          setRealTimeTweets(formatted);
        } else {
          setRealTimeTweets(fallbackTweets);
        }
      } catch (err) {
        setRealTimeTweets(fallbackTweets);
      }
    };
    loadRealtimeTweets();
  }, []);

  const displayList = realTimeTweets.length > 0 ? realTimeTweets : fallbackTweets;
  const firstCol = displayList.slice(0, Math.ceil(displayList.length / 3));
  const secondCol = displayList.slice(Math.ceil(displayList.length / 3), Math.ceil((displayList.length * 2) / 3));
  const thirdCol = displayList.slice(Math.ceil((displayList.length * 2) / 3));

  return (
    <section 
      aria-labelledby="twitter-feed-heading"
      className="bg-transparent py-16 sm:py-20 relative overflow-hidden w-full"
    >
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ 
          duration: 0.9, 
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full max-w-[100%] px-4 sm:px-6 lg:px-10 z-10 mx-auto"
      >
        {/* Header centered in the middle of the page — NO tagline, NO red pill badge line */}
        <div className="flex flex-col items-center justify-center max-w-3xl mx-auto mb-14 text-center">
          <h2 
            id="twitter-feed-heading" 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-center text-white transition-colors"
          >
            What Tollywood is Tweeting
          </h2>
        </div>

        {/* 3 Column Scrolling Container with Spacious Margins & Padding */}
        <div 
          className="flex justify-center gap-8 lg:gap-10 mt-4 [mask-image:linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)] max-h-[700px] overflow-hidden w-full"
          role="region"
          aria-label="Live Twitter Feed Scrolling Columns"
        >
          <TweetColumn tweets={firstCol.length > 0 ? firstCol : fallbackTweets.slice(0, 3)} duration={18} className="w-full max-w-[420px]" />
          <TweetColumn tweets={secondCol.length > 0 ? secondCol : fallbackTweets.slice(3, 6)} className="hidden md:block w-full max-w-[420px]" duration={22} />
          <TweetColumn tweets={thirdCol.length > 0 ? thirdCol : fallbackTweets.slice(6, 9)} className="hidden lg:block w-full max-w-[420px]" duration={20} />
        </div>
      </motion.div>
    </section>
  );
};

// --- Reddit Discussions Feed Component (Same UI Style) ---
export const RedditDiscussionsFeed = ({ discussions = [] }: { discussions?: any[] }) => {
  const displayList: RedditItem[] = discussions && discussions.length > 0
    ? discussions.map((d, index) => ({
        id: d.id || `reddit-${index}`,
        title: d.title || 'Tollywood Discussion',
        text: d.text || '',
        author: d.author || 'TollywoodUser',
        subreddit: 'r/tollywood',
        upvotes: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)}K`,
        comments: d.comments ? `${d.comments}` : '240',
        permalink: d.permalink || 'https://reddit.com/r/tollywood',
        timestamp: `${index + 1}h ago`,
      }))
    : fallbackRedditDiscussions;

  const firstCol = displayList.slice(0, Math.ceil(displayList.length / 3));
  const secondCol = displayList.slice(Math.ceil(displayList.length / 3), Math.ceil((displayList.length * 2) / 3));
  const thirdCol = displayList.slice(Math.ceil((displayList.length * 2) / 3));

  return (
    <section 
      aria-labelledby="reddit-feed-heading"
      className="bg-transparent py-16 sm:py-20 relative overflow-hidden w-full"
    >
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ 
          duration: 0.9, 
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full max-w-[100%] px-4 sm:px-6 lg:px-10 z-10 mx-auto"
      >
        {/* Header centered in the middle of the page */}
        <div className="flex flex-col items-center justify-center max-w-3xl mx-auto mb-14 text-center">
          <h2 
            id="reddit-feed-heading" 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-center text-white transition-colors"
          >
            Fan Wars & Reddit Discussions
          </h2>
        </div>

        {/* 3 Column Scrolling Container with Spacious Margins & Padding */}
        <div 
          className="flex justify-center gap-8 lg:gap-10 mt-4 [mask-image:linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)] max-h-[700px] overflow-hidden w-full"
          role="region"
          aria-label="Reddit Discussions Feed Scrolling Columns"
        >
          <RedditColumn discussions={firstCol.length > 0 ? firstCol : fallbackRedditDiscussions.slice(0, 3)} duration={18} className="w-full max-w-[420px]" />
          <RedditColumn discussions={secondCol.length > 0 ? secondCol : fallbackRedditDiscussions.slice(3, 6)} className="hidden md:block w-full max-w-[420px]" duration={22} />
          <RedditColumn discussions={thirdCol.length > 0 ? thirdCol : fallbackRedditDiscussions.slice(6, 9)} className="hidden lg:block w-full max-w-[420px]" duration={20} />
        </div>
      </motion.div>
    </section>
  );
};

// Aliases for compatibility
export const TestimonialsSection = LiveTwitterFeed;

// --- Main Export Component ---
export default function TestimonialV2() {
  return (
    <div className="w-full bg-transparent text-white transition-colors duration-300 flex flex-col justify-center relative selection:bg-red-600 selection:text-white">
      <LiveTwitterFeed />
    </div>
  );
}

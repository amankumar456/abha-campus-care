import { useState, useEffect } from "react";
import { Quote, Sparkles, GraduationCap, Rocket, Heart, Award } from "lucide-react";
import nitwBackground from "@/assets/nitw-background.png";

const INSPIRING_QUOTES = [
  "Where innovation meets tradition",
  "Engineering excellence since 1959",
  "Transforming minds, building futures",
  "The forge of India's finest engineers",
  "Where dreams take technical shape",
  "Beyond education: Creating leaders",
  "Where knowledge meets application",
];

const CATEGORIES = [
  {
    title: "Proud & Identity-Focused",
    icon: Award,
    color: "from-amber-500 to-orange-600",
    quotes: [
      "Pride of Telangana, pride of India",
      "More than an institute, a legacy",
      "The NIT with a warrior spirit",
      "Where talent meets opportunity",
      "Home to brilliant minds",
      "Nation building through engineering",
      "Excellence is our tradition",
    ]
  },
  {
    title: "Modern & Progressive",
    icon: Rocket,
    color: "from-blue-500 to-cyan-600",
    quotes: [
      "Tech pioneers of tomorrow",
      "Innovation with purpose",
      "Where code meets character",
      "Engineering solutions for India",
      "Future-ready minds at work",
      "The new age tech incubator",
      "Digital India's engineering backbone",
    ]
  },
  {
    title: "Student Spirit",
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    quotes: [
      "Once an NITWian, always an NITWian",
      "Redefining engineering excellence",
      "Where campus becomes home",
      "More than a degree, an identity",
      "Warriors of Warangal",
      "The NIT with heart",
    ]
  }
];

const MOTTOS = [
  "Engineering with Excellence",
  "Knowledge • Innovation • Integrity",
  "Builders of Tomorrow",
  "Think • Create • Transform",
  "The NITW Way",
  "Future in Making",
  "Tech with Purpose",
];

const InspirationalSection = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % INSPIRING_QUOTES.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${nitwBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/85 z-0" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Main Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white/90 text-sm font-medium">Inspiring & Motivational</span>
          </div>
          
          {/* Animated Quote */}
          <div className="min-h-[80px] flex items-center justify-center mb-6">
            <h2 
              className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white transition-all duration-500 ${
                isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
              }`}
            >
              "{INSPIRING_QUOTES[currentQuoteIndex]}"
            </h2>
          </div>
          
          {/* Quote Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {INSPIRING_QUOTES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuoteIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentQuoteIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Motto Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {MOTTOS.map((motto, index) => (
            <span
              key={motto}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium hover:bg-white/20 transition-colors cursor-default animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {motto}
            </span>
          ))}
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {CATEGORIES.map((category, catIndex) => (
            <div
              key={category.title}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${catIndex * 0.15}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{category.title}</h3>
              </div>
              
              <ul className="space-y-2">
                {category.quotes.slice(0, 4).map((quote, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-white/80 text-sm"
                  >
                    <Quote className="w-3 h-3 mt-1 text-white/50 flex-shrink-0" />
                    <span>{quote}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Official Motto */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl">
            <GraduationCap className="w-12 h-12 mx-auto text-yellow-300 mb-4" />
            <blockquote className="text-2xl font-bold text-white mb-2">
              "Excellence Through Innovation"
            </blockquote>
            <p className="text-white/70 text-sm mb-4">
              Pioneering Progress Since 1959
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white">
                Engineering Excellence
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white">
                Human Values
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white">
                Building India's Technological Foundation
              </span>
            </div>
          </div>
        </div>

        {/* Tagline Footer */}
        <div className="mt-12 text-center">
          <p className="text-xl text-white/90 font-medium">
            The Premier League of Technical Education
          </p>
          <p className="text-white/60 text-sm mt-2">
            Where Minds Engineer Futures
          </p>
        </div>
      </div>
    </section>
  );
};

export default InspirationalSection;

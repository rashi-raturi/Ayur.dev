import React from 'react';
import { Link } from 'react-router-dom';
import {Sparkles,ArrowRight} from 'lucide-react';
import { assets } from '../assets/assets'

const Hero = () => {
  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat rounded-xl px-6 md:px-10 lg:px-20 py-12 md:py-24 text-white overflow-hidden"
      style={{ backgroundImage: `url(${assets.ayurveda_hero_bg})` }}
    >
      {/* Optional dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">Ancient Wisdom, Modern Technology</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Your Personalized
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Ayurvedic Companion
            </span>
          </h1>

          <p className="text-lg md:text-xl font-light max-w-4xl leading-relaxed opacity-95">
            Discover your <strong>Prakruti</strong>, generate <strong>Ayurvedic diet plans</strong>, and get 
            instant support with our intelligent AI assistant. We bring ancient wisdom and modern technology together — for your holistic wellness.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link
                to="/PrakrutiSense"
                className="group bg-white text-green-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
                Try PrakrutiSense
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
                to="/AyuChart"
                className="group border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-700 transition-all duration-300 flex items-center gap-2"
            >
                Explore AyuChart
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
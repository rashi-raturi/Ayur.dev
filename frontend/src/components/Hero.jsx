import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, MessageCircle, Heart } from 'lucide-react';
import { assets } from '../assets/assets'

const Hero = () => {
  return (
    <section className="relative bg-gray-50 w-full">
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              <span>Your Wellness Journey</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Welcome to Your
              <br />
              <span className="block mt-2">Ayurvedic Wellness Portal</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Embark on a personalized journey of holistic health with ancient Ayurvedic wisdom
              combined with modern technology. Discover your constitution, get tailored
              nutrition plans, and access AI-powered guidance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/PrakrutiSense"
                className="group inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Activity className="w-5 h-5" />
                Start Your Assessment
              </Link>

              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-white text-gray-900 border-2 border-gray-200 px-8 py-3.5 rounded-xl text-base font-semibold hover:border-gray-300 hover:shadow-md transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
                Talk with VaaniAI
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={assets.ayurveda_hero_bg1} 
                alt="Ayurvedic wellness" 
                className="w-full h-[500px] object-cover"
              />
              {/* Floating heart icon */}
              <div className="absolute top-6 right-6 bg-white rounded-full p-3 shadow-lg">
                <Heart className="w-6 h-6 text-gray-900" />
              </div>
              {/* Floating activity icon */}
              <div className="absolute bottom-6 left-6 bg-white rounded-full p-3 shadow-lg">
                <Activity className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
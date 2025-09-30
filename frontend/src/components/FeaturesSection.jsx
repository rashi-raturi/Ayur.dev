import React from "react";
import { Link } from "react-router-dom";
import {Check} from 'lucide-react';

const features = [
  {
    id: "prakrutiSense",
    title: "PrakrutiSense",
    subtitle: "The Prakruti Analyzer",
    description:
      "Understand your unique Ayurvedic constitution (Vata, Pitta, Kapha) with AI-powered precision.",
    points: [
      "Instant Dosha profiling",
      "Lifestyle & diet recommendations",
      "Designed for patients & practitioners",
    ],
    buttonText: "Try PrakrutiSense →",
    buttonLink: "/PrakrutiSense",
  },
  {
    id: "ayuChart",
    title: "AyuChart",
    subtitle: "Ayurvedic Diet Chart Generator",
    description:
      "Create personalized, Ayurveda-compliant diet charts aligned with Prakruti and wellness goals.",
    points: [
      "8000+ food items with Ayurvedic data",
      "Six tastes & food properties built-in",
      "Dosha-balancing recommendations",
    ],
    buttonText: "Explore AyuChart →",
    buttonLink: "/AyuChart",
  },
  {
    id: "bookCall",
    title: "VaaniAI",
    subtitle: "Your AI Health Companion",
    description:
      "Talk to our intelligent AI agent to get personalized Ayurvedic guidance instantly.",
    points: [
      "24/7 intelligent Ayurvedic assistant",
      "Instant recommendations & support",
      "Secure & private conversations",
    ],
    buttonText: "Talk with VaaniAI →",
    buttonLink: "/contact",
  },
];

const FeaturesSection=()=>{
  return (
    <section className="w-full py-20 px-6 md:px-8 lg:px-16">
      <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Explore Our Core Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the power of personalized Ayurvedic wellness with our innovative tools
          </p>
        </div>

      <div className="grid gap-8 md:grid-cols-3">
        {features.map(
          ({ id, title, subtitle, description, points, buttonText, buttonLink }) => (
            <div
              key={id}
              className="group relative bg-white rounded-lg hover:shadow-lg p-8 flex flex-col justify-between transition-all duration-300"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 ">{title}</h3>
                <h4 className="text-green-600 mb-4 text-lg italic">{subtitle}</h4>
                <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
                <ul className="space-y-1 mb-4">
                  {points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-black mt-0.5 flex-shrink-0 w-4 h-7">➤</span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Link
                  to={buttonLink}
                  className="inline-block px-5 py-2 bg-primary text-white rounded-full text-sm hover:bg-green-700 transition-all hover:scale-105"
                >
                  {buttonText}
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default FeaturesSection;
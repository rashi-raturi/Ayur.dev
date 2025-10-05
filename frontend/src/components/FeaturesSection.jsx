import React from "react";
import { Link } from "react-router-dom";
import { Activity, Utensils, MessageCircle } from 'lucide-react';

const features = [
  {
    id: "prakrutiSense",
    icon: Activity,
    iconBg: "from-purple-100 to-purple-200",
    cardBg: "from-purple-50/30 to-purple-100/30",
    borderColor: "border-purple-100 hover:border-purple-200",
    iconColor: "text-purple-600",
    title: "Prakruti Sense",
    description:
      "Discover your unique Ayurvedic constitution through our comprehensive assessment. Get personalized insights about your body type and natural tendencies.",
    benefits: [
      "Personalized Constitution Analysis",
      "Dosha Balance Assessment",
      "Lifestyle Recommendations",
    ],
    buttonText: "Discover Your Prakruti",
    buttonColor: "bg-purple-500 hover:bg-purple-600 text-white",
    buttonLink: "/PrakrutiSense",
  },
  {
    id: "ayuChart",
    icon: Utensils,
    iconBg: "from-green-100 to-green-200",
    cardBg: "from-green-50/30 to-green-100/30",
    borderColor: "border-green-100 hover:border-green-200",
    iconColor: "text-green-600",
    title: "AyuChart",
    description:
      "Get personalized Ayurvedic diet plans tailored to your constitution. Explore recipes, meal plans, and nutritional guidance.",
    benefits: [
      "Customized Meal Plans",
      "Seasonal Diet Recommendations",
      "Nutritional Balance Tracking",
    ],
    buttonText: "Explore Diet Plans",
    buttonColor: "bg-green-500 hover:bg-green-600 text-white",
    buttonLink: "/AyuChart",
  },
  {
    id: "vaaniAI",
    icon: MessageCircle,
    iconBg: "from-blue-100 to-blue-200",
    cardBg: "from-blue-50/30 to-blue-100/30",
    borderColor: "border-blue-100 hover:border-blue-200",
    iconColor: "text-blue-600",
    title: "VaaniAI",
    description:
      "Chat with our AI-powered Ayurvedic assistant for instant guidance on health, wellness, and lifestyle questions.",
    benefits: [
      "24/7 AI Health Assistant",
      "Instant Ayurvedic Guidance",
      "Personalized Recommendations",
    ],
    buttonText: "Talk with VaaniAI",
    buttonColor: "bg-blue-500 hover:bg-blue-600 text-white",
    buttonLink: "/contact",
  },
];

const FeaturesSection = () => {
  return (
    <section className="w-full py-20 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explore Our Features
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive tools designed to support your Ayurvedic wellness journey with personalized
            insights and guidance.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map(
            ({ id, icon: Icon, iconBg, cardBg, borderColor, iconColor, title, description, benefits, buttonText, buttonColor, buttonLink }) => (
              <div
                key={id}
                className={`group relative bg-white rounded-3xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2 ${borderColor}`}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cardBg} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                
                {/* Content wrapper */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${iconBg}`}>
                      <Icon className={`w-8 h-8 ${iconColor}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
                    <p className="text-gray-700 mb-6 leading-relaxed">{description}</p>
                    
                    {/* Benefits */}
                    <div className="mb-8">
                      <p className="text-sm font-semibold text-gray-600 mb-3">Key Benefits:</p>
                      <ul className="space-y-2">
                        {benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gray-900 mt-0.5">•</span>
                            <span className="text-gray-700 text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Button - pushed to bottom */}
                  <div className="mt-auto">
                    <Link
                      to={buttonLink}
                      className={`inline-flex items-center justify-center w-full px-6 py-3 ${buttonColor} rounded-xl text-base font-semibold transition-all shadow-md hover:shadow-lg`}
                    >
                      {buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
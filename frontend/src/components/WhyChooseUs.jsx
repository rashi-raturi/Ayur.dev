import React from "react";
import { Shield, Users, Sparkles, Lock } from "lucide-react";

const reasons = [
  {
    icon: Sparkles,
    title: "Authentic Ayurvedic Expertise",
    description:
      "Our platform is deeply rooted in classical Ayurvedic principles, ensuring all recommendations respect traditional wisdom.",
  },
  {
    icon: Users,
    title: "Personalized to Your Prakruti",
    description:
      "We tailor diet charts and health advice based on your unique body constitution (Vata, Pitta, Kapha) for effective, holistic wellness.",
  },
  {
    icon: Shield,
    title: "Seamless Technology Integration",
    description:
      "With AI-driven analysis and easy-to-use tools, you get modern convenience without compromising the essence of Ayurveda.",
  },
  {
    icon: Lock,
    title: "Secure & Privacy-Focused",
    description:
      "Your health data is safeguarded with best-in-class security measures complying with industry regulations.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="w-full py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the perfect blend of ancient Ayurvedic wisdom with cutting-edge technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reasons.map(({ icon: Icon, title, description }, idx) => (
            <div
              key={idx}
              className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 hover:shadow-2xl hover:border-gray-300 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="mb-4">
                <div className="inline-flex p-3 rounded-xl bg-gray-900 text-white group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-gray-900 font-bold text-2xl mb-3">
                {title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

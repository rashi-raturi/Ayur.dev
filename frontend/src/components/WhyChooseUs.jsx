import React from "react";

const reasons = [
  {
    title: "Authentic Ayurvedic Expertise",
    description:
      "Our platform is deeply rooted in classical Ayurvedic principles, ensuring all recommendations respect traditional wisdom.",
  },
  {
    title: "Personalized to Your Prakruti",
    description:
      "We tailor diet charts and health advice based on your unique body constitution (Vata, Pitta, Kapha) for effective, holistic wellness.",
  },
  {
    title: "Seamless Technology Integration",
    description:
      "With AI-driven analysis and easy-to-use tools, you get modern convenience without compromising the essence of Ayurveda.",
  },
  {
    title: "Secure & Privacy-Focused",
    description:
      "Your health data is safeguarded with best-in-class security measures complying with industry regulations.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="px-6 md:px-10 lg:px-20 py-16 mb-16">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-semibold text-green-800">
          Why Choose Us?
        </h2>
        <p className="mt-4 text-gray-700 max-w-2xl mx-auto text-lg">
          Experience the perfect blend of ancient Ayurvedic wisdom with cutting-edge technology designed to support your health journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {reasons.map(({ title, description }, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-green-700 font-semibold text-2xl mb-3">
              {title}
            </h3>
            <p className="text-gray-700 text-md">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;

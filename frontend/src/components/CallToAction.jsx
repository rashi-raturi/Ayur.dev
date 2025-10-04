import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallToAction = () => {
  return (
    <section className="w-full py-20 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-[1400px] mx-auto px-6">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl text-gray-700 mb-10 leading-relaxed max-w-3xl mx-auto">
            Join thousands of users who have discovered personalized Ayurvedic wellness. 
            Start your journey today and experience the power of ancient wisdom combined with modern technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link
              to="/PrakrutiSense"
              className="group bg-gray-900 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Free Assessment
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/contact"
              className="group bg-white border-2 border-gray-200 text-gray-900 px-10 py-4 rounded-xl text-lg font-semibold hover:border-gray-300 hover:shadow-lg transition-all duration-300 inline-flex items-center gap-3"
            >
              Talk with VaaniAI
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          
          
        </div>
      </div>
    </section>
  );
};

export default CallToAction;

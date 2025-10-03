import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallToAction = () => {
  return (
    <section className="w-full py-20 px-6 md:px-10 lg:px-20 bg-primary text-white relative overflow-hidden rounded-xl">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Transform Your Health?
        </h2>
        <p className="text-xl md:text-2xl opacity-95 mb-8 leading-relaxed">
          Join thousands of users who have discovered the power of personalized Ayurvedic wellness. 
          Start your journey to optimal health today.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link
            to="/PrakrutiSense"
            className="group bg-white text-green-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            Start Free Assessment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/contact"
            className="group border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-700 transition-all duration-300 flex items-center gap-2"
          >
            Talk with VaaniAI
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 opacity-90">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-current text-yellow-300" />
            <span className="font-semibold">4.9/5</span>
            <span>Rating</span>
          </div>
          <div className="w-px h-6 bg-white/30 hidden sm:block"></div>
          <div>
            <span className="font-semibold">10,000+</span> Happy Users
          </div>
          <div className="w-px h-6 bg-white/30 hidden sm:block"></div>
          <div>
            <span className="font-semibold">100%</span> Secure & Private
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;

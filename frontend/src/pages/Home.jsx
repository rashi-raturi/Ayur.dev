import React from 'react'
import SpecialityMenu from '../components/SpecialityMenu'
import Banner from '../components/Banner'
import FeaturesSection from '../components/FeaturesSection'
import Hero from '../components/Hero'
import CallToAction from '../components/CallToAction'
import WhyChooseUs from '../components/WhyChooseUs'

const Home = () => {
  return (
    <div>
      <Hero/>
      <FeaturesSection/>
      <Banner />
      <SpecialityMenu />
      <WhyChooseUs/>
      <CallToAction/>
    </div>
  )
}

export default Home
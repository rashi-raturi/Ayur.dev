import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import FeaturesSection from '../components/FeaturesSection'
import Hero from '../components/Hero'
import CallToAction from '../components/CallToAction'
import WhyChooseUs from '../components/WhyChooseUs'

const Home = () => {
  return (
    <div>
      <Hero/>
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <FeaturesSection/>
      <Banner />
      <WhyChooseUs/>
      <CallToAction/>
    </div>
  )
}

export default Home
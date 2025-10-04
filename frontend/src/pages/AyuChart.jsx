import React from 'react'
import DietChartGenerator from '../components/DietChartGenerator';
import PageTransition from '../components/PageTransition';

const AyuChart = () => {
  return (
    <PageTransition>
      <DietChartGenerator/>
    </PageTransition>
  )
}

export default AyuChart;
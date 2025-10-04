import React from 'react';
import PrakrutiAnalysisForm from '../components/PrakrutiAnalysisForm';
import PageTransition from '../components/PageTransition';

const PrakrutiSense = () => {
  return (
    <PageTransition>
      <div className="prakruti-sense-page">
        <PrakrutiAnalysisForm />
      </div>
    </PageTransition>
  );
};

export default PrakrutiSense;

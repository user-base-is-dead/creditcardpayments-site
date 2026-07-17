import React from 'react';
import Hero from '../../components/Hero/Hero';
import HowItWorks from '../../components/HowItWorks/HowItWorks';
import Services from '../../components/Services/Services';
import Stats from '../../components/Stats/Stats';
import Testimonials from '../../components/Testimonials/Testimonials';
import FAQ from '../../components/FAQ/FAQ';
import CTA from '../../components/CTA/CTA';
import './Home.css';

export default function Home() {
  return (
    <div className="home-page">
      <Hero />
      <HowItWorks />
      <Services />
      <Stats />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  );
}

"use client";
import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import TrustedBy from '../components/TrustedBy';
import Stats from '../components/Stats';
import FeaturesSection from '../components/FeaturesSection';
import Testimonial from '../components/Testimonial';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';

const Home = () => {
    return (
        <>
            <main>
                <Hero />
                <TrustedBy />
                <Stats />
                <FeaturesSection />
                <Testimonial />
                <FAQ />
                {/* <Pricing /> */}
                <CTA />
            </main>
            
        </>
    )
}

export default Home;

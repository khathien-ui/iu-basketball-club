import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import ExecutiveBoard from "@/components/ExecutiveBoard";
import EventsList from "@/components/EventsList";
import Gallery from "@/components/Gallery";
import News from "@/components/News";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import ScrollEffects from "@/components/ScrollEffects";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="home">
        <Hero />
        <Features />
        <About />
        <ExecutiveBoard />
        <EventsList />
        <Gallery />
        <News />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
      <ScrollEffects />
    </>
  );
}

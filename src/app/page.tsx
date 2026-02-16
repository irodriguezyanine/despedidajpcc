import Hero from "@/components/Hero";
import Squad from "@/components/Squad";
import VideoSection from "@/components/VideoSection";
import Itinerary from "@/components/Itinerary";
import MapSection from "@/components/MapSection";
import BeerPong from "@/components/BeerPong";
import VotingSection from "@/components/VotingSection";
import SpotifySection from "@/components/SpotifySection";
import Footer from "@/components/Footer";
import InstagramSection from "@/components/InstagramSection";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen" tabIndex={-1}>
      <Hero />
      <Squad />
      <VideoSection />
      <Itinerary />
      <MapSection />
      <BeerPong />
      <VotingSection />
      <SpotifySection />
      <InstagramSection />
      <Footer />
    </main>
  );
}

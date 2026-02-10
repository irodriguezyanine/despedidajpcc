import Hero from "@/components/Hero";
import Squad from "@/components/Squad";
import VideoSection from "@/components/VideoSection";
import Itinerary from "@/components/Itinerary";
import MapSection from "@/components/MapSection";
import BeerPong from "@/components/BeerPong";
import SpotifySection from "@/components/SpotifySection";
import Footer from "@/components/Footer";
import InstagramSection from "@/components/InstagramSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Squad />
      <VideoSection />
      <Itinerary />
      <MapSection />
      <BeerPong />
      <SpotifySection />
      <Footer />
      <InstagramSection />
    </main>
  );
}

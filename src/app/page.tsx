import Hero from "@/components/Hero";
import Squad from "@/components/Squad";
import VideoSection from "@/components/VideoSection";
import Itinerary from "@/components/Itinerary";
import MapSection from "@/components/MapSection";
import SpotifySection from "@/components/SpotifySection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Squad />
      <VideoSection />
      <Itinerary />
      <MapSection />
      <SpotifySection />
      <Footer />
    </main>
  );
}

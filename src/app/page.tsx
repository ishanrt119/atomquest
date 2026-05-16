import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WorkflowTimeline } from "@/components/landing/WorkflowTimeline";
import { RoleCards } from "@/components/landing/RoleCards";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WorkflowTimeline />
      <RoleCards />
      <Footer />
    </main>
  );
}

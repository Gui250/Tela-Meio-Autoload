import { StageView } from "@/components/StageView";
import { AutoIntelligenceFab } from "@/components/AutoIntelligenceFab";
import { BrandMark } from "@/components/BrandMark";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-brand"><BrandMark /><span className="topbar-wordmark">AutoMind</span></div>
      </header>
      <div className="brand-rule" />
      <main className="page">
        <StageView />
        <AutoIntelligenceFab />
      </main>
    </>
  );
}

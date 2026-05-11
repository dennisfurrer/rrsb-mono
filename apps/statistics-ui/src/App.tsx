import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BreaksPage } from "./pages/BreaksPage";
import { LiveScoresPage } from "./pages/LiveScoresPage";
import { PlayerProfilePage } from "./pages/PlayerProfilePage";
import { MatchHistoryPage } from "./pages/MatchHistoryPage";
import { HighlightsPage } from "./pages/HighlightsPage";
import { TrainingPage } from "./pages/TrainingPage";
import { TrainingSessionPage } from "./pages/TrainingSessionPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/breaks" replace />} />
        <Route path="/breaks" element={<BreaksPage />} />
        <Route path="/live" element={<LiveScoresPage />} />
        <Route path="/profile/:name" element={<PlayerProfilePage />} />
        <Route path="/matches/:name" element={<MatchHistoryPage />} />
        <Route path="/highlights" element={<HighlightsPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/training/:sessionId" element={<TrainingSessionPage />} />
      </Route>
    </Routes>
  );
}

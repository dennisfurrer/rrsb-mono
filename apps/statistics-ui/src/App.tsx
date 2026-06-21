import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BreaksPage } from "./pages/BreaksPage";
import { LiveScoresPage } from "./pages/LiveScoresPage";
import { MatchDetailPage } from "./pages/MatchDetailPage";
import { MatchesPage } from "./pages/MatchesPage";
import { PlayersPage } from "./pages/PlayersPage";
import { PlayerProfilePage } from "./pages/PlayerProfilePage";
import { MatchHistoryPage } from "./pages/MatchHistoryPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/live" replace />} />
        <Route path="/live" element={<LiveScoresPage />} />
        <Route path="/match/:id" element={<MatchDetailPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/players/:name" element={<PlayerProfilePage />} />
        {/* Legacy aliases */}
        <Route path="/profile/:name" element={<PlayerProfilePage />} />
        <Route path="/breaks" element={<BreaksPage />} />
        <Route path="/matches/:name" element={<MatchHistoryPage />} />
        <Route path="*" element={<Navigate to="/live" replace />} />
      </Route>
    </Routes>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NewSimulation from "./pages/NewSimulation";
import SimulationView from "./pages/SimulationView";
import Report from "./pages/Report";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="/new" element={<ErrorBoundary><NewSimulation /></ErrorBoundary>} />
          <Route path="/simulation/:id" element={<ErrorBoundary><SimulationView /></ErrorBoundary>} />
          <Route path="/simulation/:id/report" element={<ErrorBoundary><Report /></ErrorBoundary>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

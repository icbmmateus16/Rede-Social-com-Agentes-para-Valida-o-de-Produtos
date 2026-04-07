import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NewSimulation from "./pages/NewSimulation";
import SimulationView from "./pages/SimulationView";
import Report from "./pages/Report";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewSimulation />} />
        <Route path="/simulation/:id" element={<SimulationView />} />
        <Route path="/simulation/:id/report" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}

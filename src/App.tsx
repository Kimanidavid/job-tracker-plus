import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import JobTracker from "./pages/JobTracker";
import ResumeBuilder from "./pages/ResumeBuilder";
import AutopilotSearch from "./pages/AutopilotSearch";
import JobDetail from "./pages/JobDetail";
import FollowUpManager from "./pages/FollowUpManager";
import CareerAgent from "./pages/CareerAgent";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/tracker" element={<AppLayout><JobTracker /></AppLayout>} />
          <Route path="/resume" element={<AppLayout><ResumeBuilder /></AppLayout>} />
          <Route path="/autopilot" element={<AppLayout><AutopilotSearch /></AppLayout>} />
          <Route path="/jobs/:id" element={<AppLayout><JobDetail /></AppLayout>} />
          <Route path="/jobs/external/:extId" element={<AppLayout><JobDetail /></AppLayout>} />
          <Route path="/followups" element={<AppLayout><FollowUpManager /></AppLayout>} />
          <Route path="/agent" element={<AppLayout><CareerAgent /></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import IssueCertificate from "./pages/IssueCertificate";
import BulkIssue from "./pages/BulkIssue";
import StudentPortal from "./pages/StudentPortal";
import Profile from "./pages/Profile";
import MyCertificates from "./pages/MyCertificates";
import Analytics from "./pages/Analytics";
import Verify from "./pages/Verify";
import UniversitySettings from "./pages/UniversitySettings";
import NotFound from "./pages/NotFound";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/issue-certificate" element={<IssueCertificate />} />
            <Route path="/bulk-issue" element={<BulkIssue />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<UniversitySettings />} />
            <Route path="/certificates" element={<MyCertificates />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:certificateId" element={<Verify />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/student/:studentId" element={<StudentPortal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;

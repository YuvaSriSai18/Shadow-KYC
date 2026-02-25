import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Navigation } from "@/components/Navigation";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { restoreWalletConnection } from "@/services/clientService";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import KYCDashboard from "./pages/KYCDashboard";
import ZKProof from "./pages/ZKProof";
import ServiceTest from "./pages/ServiceTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Auto-restore wallet connection on app load
  useEffect(() => {
    restoreWalletConnection().catch((err) => {
      console.log('[App] No existing wallet session to restore:', err.message);
    });
  }, []);

  return (
    <ThirdwebProvider activeChain="mumbai" clientId="demo">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <Navigation />
              <div className="absolute top-4 right-4 z-50">
                <DarkModeToggle />
              </div>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/kyc" element={<KYCDashboard />} />
                <Route path="/zkproof" element={<ZKProof />} />
                <Route path="/test-services" element={<ServiceTest />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThirdwebProvider>
  );
};

export default App;

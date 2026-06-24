import React, { useState, useEffect } from "react";
import { loadDB, writeAuditLog, resetSystemData } from "./state/db";
import Login from "./components/Login";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SimulationPanel from "./components/SimulationPanel";
import { Shield, LogOut, Cpu, Sun, Moon, RotateCcw, Megaphone, QrCode, ExternalLink, Settings } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("sat_theme") || "light"); // Default light to match screenshot

  // Sync session check and state initialization
  useEffect(() => {
    loadDB();
    
    // Apply theme class
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("sat_theme", nextTheme);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    writeAuditLog("INFO", "User Session Started", `Logged in as ${user.name} (${user.role}).`);
  };

  const handleLogout = () => {
    if (currentUser) {
      writeAuditLog("INFO", "User Session Ended", `${currentUser.name} signed out.`);
    }
    setCurrentUser(null);
  };

  const handleSimulationUpdate = () => {
    setTriggerRefresh(prev => prev + 1);
  };

  const handleResetDB = () => {
    if (window.confirm("Are you sure you want to clear all mock database records? This will delete all attendance logs, registered device fingerprints, and active sessions, returning the system to a completely fresh state.")) {
      resetSystemData();
      setCurrentUser(null);
      setTriggerRefresh(prev => prev + 1);
      alert("Database reset successfully! All logs and fingerprints are cleared.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-zinc-950 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-200 antialiased">
      {/* 1. Juno Brand Header Bar */}
      <header className="juno-header z-30 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left Side: Logos & Icons */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 cursor-pointer">
              {/* Juno Campus circular logo */}
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                <span className="text-[#0e5b9e] font-extrabold text-[9px] tracking-tight leading-none text-center">
                  JUNO
                </span>
              </div>
              
              {/* Secondary Red Crest Logo */}
              <div className="h-8 w-8 rounded-full bg-rose-600 flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
            </div>

            {/* Quick Action Icons */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10 text-white/80">
              <button className="hover:text-white transition cursor-pointer" title="Announcements">
                <Megaphone className="h-4 w-4" />
              </button>
              <button className="hover:text-white transition cursor-pointer" title="Roster QR System">
                <QrCode className="h-4 w-4" />
              </button>
              <button className="hover:text-white transition cursor-pointer" title="External Links">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Side: Profile Info, Theme, Settings */}
          <div className="flex items-center gap-3">
            {/* Local DB status (debug tool) */}
            <div className="hidden md:flex items-center gap-1 text-[10px] text-white/60 bg-black/10 px-2 py-0.5 rounded border border-white/5 font-mono">
              <Cpu className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span>Local DB</span>
            </div>

            {/* Global Reset Database */}
            <button
              onClick={handleResetDB}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title="Reset System Data"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                {/* User avatar and info */}
                <div className="text-right">
                  <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[9px] text-white/70 capitalize font-medium">{currentUser.role}</div>
                </div>
                
                {/* Profile Circle Avatar */}
                <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center overflow-hidden">
                  <div className="text-xs font-bold text-white capitalize select-none">
                    {currentUser.name.charAt(0)}
                  </div>
                </div>

                {/* Settings Cog */}
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-white/80 hover:text-rose-350 hover:bg-white/10 rounded cursor-pointer transition"
                  title="Log Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition cursor-pointer">
                <Settings className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Sub-Header Navigation bar */}
      <nav className="juno-sub-header z-25 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center text-xs font-bold gap-6 overflow-x-auto whitespace-nowrap">
          {currentUser ? (
            currentUser.role === "student" ? (
              <>
                <span className="text-[#0e5b9e] border-b-2 border-[#0e5b9e] py-2 cursor-pointer">Personal ▾</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Academic Functions ▾</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Student Academic Fees Payment</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Student Hostel Fees Details</span>
              </>
            ) : currentUser.role === "teacher" ? (
              <>
                <span className="text-[#0e5b9e] border-b-2 border-[#0e5b9e] py-2 cursor-pointer">Classroom Controls ▾</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Roster Analytics ▾</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Course Management</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Dynamic QR Schedules</span>
              </>
            ) : (
              <>
                <span className="text-[#0e5b9e] border-b-2 border-[#0e5b9e] py-2 cursor-pointer">System Management ▾</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Directory Configuration ▾</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Audit Logs Console</span>
                <span className="hover:text-[#0e5b9e] py-2 cursor-pointer transition">Subnet Verification Ranges</span>
              </>
            )
          ) : (
            <span className="text-zinc-500 py-2">Select Mock Account to unlock JUNO System Roster Functions</span>
          )}
        </div>
      </nav>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser ? (
          <>
            {currentUser.role === "student" && (
              <StudentDashboard 
                user={currentUser} 
                triggerRefresh={triggerRefresh} 
                onTriggerRefresh={handleSimulationUpdate} 
              />
            )}
            {currentUser.role === "teacher" && (
              <TeacherDashboard 
                user={currentUser} 
                triggerRefresh={triggerRefresh} 
                onTriggerRefresh={handleSimulationUpdate} 
              />
            )}
            {currentUser.role === "admin" && (
              <AdminDashboard 
                triggerRefresh={triggerRefresh} 
                onTriggerRefresh={handleSimulationUpdate} 
              />
            )}
          </>
        ) : (
          <Login onLogin={handleLogin} triggerRefresh={triggerRefresh} />
        )}
      </main>

      {/* Floating Simulation Sandbox Panel */}
      <SimulationPanel onUpdate={handleSimulationUpdate} />

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 font-sans mt-auto transition-colors duration-200">
        <p>© 2026 JUNO CAMPUS • Digital Attendance & Secure Fingerprint Verification Module. Technical Integrity Division.</p>
      </footer>
    </div>
  );
}

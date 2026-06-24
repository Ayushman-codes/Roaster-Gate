import React, { useState, useEffect } from "react";
import { loadDB, generateBrowserFingerprint } from "../state/db";
import { UserCheck, ShieldAlert, BookOpen, Key, Users, User, ArrowRight } from "lucide-react";

export default function Login({ onLogin, triggerRefresh }) {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null); // 'student', 'teacher', 'admin'
  const [selectedUserId, setSelectedUserId] = useState("");
  const [clientFingerprint, setClientFingerprint] = useState("");
  const [clientIp, setClientIp] = useState("");

  useEffect(() => {
    const db = loadDB();
    setUsers(db.users);
    setClientFingerprint(db.simulation.fingerprintOverride || generateBrowserFingerprint());
    setClientIp(db.simulation.clientIp);
  }, [triggerRefresh]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    const db = loadDB();
    const roleUsers = db.users.filter(u => u.role === role);
    if (roleUsers.length > 0) {
      setSelectedUserId(roleUsers[0].id);
    } else {
      setSelectedUserId("");
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const db = loadDB();
    const user = db.users.find(u => u.id === selectedUserId);
    if (!user) return;

    // Check device binding on login if they are a student and have a registered fingerprint
    if (user.role === "student" && user.registeredFingerprint) {
      if (user.registeredFingerprint !== clientFingerprint) {
        alert(`Access Denied! Device Fingerprint Mismatch. \n\nExpected: ${user.registeredFingerprint}\nDetected: ${clientFingerprint}\n\n(Use the Simulation Panel to match the bound fingerprint or log in as Admin to clear this student's device binding).`);
        return;
      }
    }

    onLogin(user);
  };

  const filteredUsers = users.filter(u => u.role === selectedRole);

  return (
    <div className="min-h-[90svh] flex flex-col justify-center items-center py-10 px-4">
      {/* Brand Logo & Header */}
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <Key className="h-3.5 w-3.5" /> SECURE ATTENDANCE TRACKING
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-450 dark:from-emerald-200 dark:via-emerald-100 dark:to-emerald-50 select-none tracking-tight leading-none mb-3">
          Digital Attendance
        </h1>
        <p className="text-sm text-slate-650 dark:text-slate-400">
          A security-hardened web attendance system implementing dynamic QR code authentication, device binding, and IP range constraints.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md glass rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {!selectedRole ? (
          /* Step 1: Select Role */
          <div className="space-y-4">
            <h3 className="text-center font-bold text-lg text-slate-800 dark:text-slate-200 mb-5">
              Select Your Role
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {/* Student Role */}
              <button
                onClick={() => handleRoleSelect("student")}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 rounded-xl group cursor-pointer transition-all duration-305"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-900/40 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-white">Student Portal</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mark attendance, check history, bind device</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Teacher Role */}
              <button
                onClick={() => handleRoleSelect("teacher")}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 rounded-xl group cursor-pointer transition-all duration-305"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-900/40 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-white">Teacher Dashboard</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Generate QR sessions, oversee live attendance</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Admin Role */}
              <button
                onClick={() => handleRoleSelect("admin")}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 dark:hover:border-amber-500/40 rounded-xl group cursor-pointer transition-all duration-305"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-900/40 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-white">Administrator</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">System configuration, device clearing, logs</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Select Mock Account */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-sm text-emerald-650 dark:text-emerald-400 capitalize flex items-center gap-1.5">
                {selectedRole === "student" && <User className="h-4 w-4" />}
                {selectedRole === "teacher" && <BookOpen className="h-4 w-4" />}
                {selectedRole === "admin" && <Users className="h-4 w-4" />}
                {selectedRole} Portal
              </span>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                Back to roles
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="userSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Mock Account
              </label>
              <select
                id="userSelect"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950/80 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {filteredUsers.map(u => (
                  <option key={u.id} value={u.id} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* If Student: Show current device binding status preview */}
            {selectedRole === "student" && selectedUserId && (() => {
              const currentStu = users.find(u => u.id === selectedUserId);
              if (!currentStu) return null;

              const isBound = !!currentStu.registeredFingerprint;
              const fingerprintMatches = currentStu.registeredFingerprint === clientFingerprint;

              return (
                <div className={`p-4 rounded-xl text-xs space-y-2 ${
                  isBound 
                    ? fingerprintMatches 
                      ? "glass-emerald text-emerald-800 dark:text-emerald-200" 
                      : "glass-rose text-rose-800 dark:text-rose-200" 
                    : "bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300"
                }`}>
                  <div className="font-semibold flex items-center gap-1.5">
                    {isBound ? (
                      fingerprintMatches ? (
                        <>
                          <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Authorized Device Connected</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-bounce" />
                          <span>Warning: Fingerprint Mismatch!</span>
                        </>
                      )
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>No Device Registered Yet</span>
                      </>
                    )}
                  </div>
                  <div className="opacity-90 leading-relaxed font-sans text-slate-650 dark:text-slate-350">
                    {isBound ? (
                      fingerprintMatches ? (
                        "This device fingerprint matches the registered device. You are authorized to log in."
                      ) : (
                        `This account is locked to fingerprint [${currentStu.registeredFingerprint}]. Detected browser fingerprint is [${clientFingerprint}]. Log in blocked.`
                      )
                    ) : (
                      "Your account has no registered device. You will need to bind this browser fingerprint on your first dashboard visit."
                    )}
                  </div>
                </div>
              );
            })()}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg shadow-lg font-semibold text-sm cursor-pointer transition-all duration-300 transform active:scale-98"
            >
              Sign In
            </button>
          </form>
        )}
      </div>

      {/* Simulation Info Banner */}
      <div className="mt-8 text-center text-xs text-slate-500 max-w-sm font-sans space-y-1 bg-slate-200/50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-900/50">
        <div className="font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
          <span>Simulation Active</span>
        </div>
        <div>Detected IP: <span className="text-emerald-650 dark:text-emerald-400 font-mono font-semibold">{clientIp}</span></div>
        <div>Fingerprint: <span className="text-slate-700 dark:text-slate-400 font-mono font-semibold">{clientFingerprint}</span></div>
      </div>
    </div>
  );
}

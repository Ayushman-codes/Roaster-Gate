import React, { useState, useEffect } from "react";
import { 
  loadDB, 
  saveDB, 
  unbindStudentDevice, 
  writeAuditLog 
} from "../state/db";
import { Users, Server, ShieldAlert, Trash2, Search, PlusCircle, Unlock, Info, ShieldX } from "lucide-react";

export default function AdminDashboard({ triggerRefresh, onTriggerRefresh }) {
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // JUNO Interactive Load States
  const [isLogsLoaded, setIsLogsLoaded] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [isSubjectsLoaded, setIsSubjectsLoaded] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  // New User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("student");
  const [newUserEmail, setNewUserEmail] = useState("");

  // New Subject Form State
  const [newSubId, setNewSubId] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubTeacher, setNewSubTeacher] = useState("");
  const [newSubRoom, setNewSubRoom] = useState("");
  const [newSubSubnet, setNewSubSubnet] = useState("192.168.1.*");

  useEffect(() => {
    const db = loadDB();
    setUsers(db.users);
    setSubjects(db.subjects);
    setAuditLogs(db.auditLogs);
  }, [triggerRefresh]);

  const handleClearDevice = (studentId) => {
    const res = unbindStudentDevice(studentId);
    if (res.success) {
      onTriggerRefresh();
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const db = loadDB();
    const newId = (newUserRole === "student" ? "stu_" : "teach_") + Math.random().toString(36).substr(2, 6);
    
    const newUser = {
      id: newId,
      name: newUserName,
      role: newUserRole,
      email: newUserEmail,
      ...(newUserRole === "student" && { registeredFingerprint: null })
    };

    db.users.push(newUser);
    saveDB(db);

    writeAuditLog("INFO", "User Created by Admin", `Added ${newUserRole} '${newUserName}' with ID ${newId}`);
    
    // Clear forms
    setNewUserName("");
    setNewUserEmail("");
    onTriggerRefresh();
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubId || !newSubName || !newSubTeacher) return;

    const db = loadDB();
    const newSub = {
      id: newSubId,
      name: newSubName,
      teacherId: newSubTeacher,
      schedule: "Mon/Wed 2:00 PM",
      room: newSubRoom || "LH-101",
      subnet: newSubSubnet || "192.168.1.*"
    };

    db.subjects.push(newSub);
    saveDB(db);

    writeAuditLog("INFO", "Subject Created by Admin", `Added subject '${newSubName}' under teacher ${newSubTeacher}`);

    // Clear forms
    setNewSubId("");
    setNewSubName("");
    setNewSubRoom("");
    onTriggerRefresh();
  };

  const handleClearLogs = () => {
    const db = loadDB();
    db.auditLogs = [];
    saveDB(db);
    writeAuditLog("INFO", "Audit Logs Cleared", "System Administrator flushed the security audit log database table.");
    onTriggerRefresh();
  };

  // Filter logs based on search and level dropdown
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const studentsList = users.filter(u => u.role === "student");
  const teachersList = users.filter(u => u.role === "teacher");
  const adminsList = users.filter(u => u.role === "admin");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left max-w-7xl mx-auto py-2">
      {/* ================= LEFT SIDEBAR COLUMN ================= */}
      <div className="lg:col-span-1 space-y-4">
        {/* Admin credentials info card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            System Admin Credentials
          </h3>
          
          <div className="space-y-3.5 text-xs">
            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Operator Role</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Root Security Admin</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Security Division</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Technical Integrity Team</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Active Database Users</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{users.length} Registered Accounts</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Monitored Courses</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{subjects.length} Subjects Registry</div>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            System Subsections
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mb-4">Jump directly to administration sections.</p>

          <div className="space-y-2 text-xs">
            <button 
              onClick={() => {
                setIsLogsLoaded(true);
                document.getElementById("logs-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" />
              <span>Security Audit Logs</span>
            </button>

            <button 
              onClick={() => {
                setIsUsersLoaded(true);
                document.getElementById("users-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Users className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" />
              <span>User Directory</span>
            </button>

            <button 
              onClick={() => {
                setIsSubjectsLoaded(true);
                document.getElementById("subjects-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Server className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" />
              <span>Course Catalog Registry</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIGHT MAIN SECTION ================= */}
      <div className="lg:col-span-2 space-y-4">
        {/* Card 1: Security Audit Logs */}
        <div id="logs-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Security Audit Logs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time security events, intrusion flags, and device mismatch alerts.
              </p>
            </div>
            <button
              onClick={() => setIsLogsLoaded(!isLogsLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isLogsLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isLogsLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute inset-y-0 left-0 pl-3 h-full w-4 text-slate-400 flex items-center pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e]"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e] cursor-pointer flex-1 sm:flex-initial"
                  >
                    <option value="ALL">All Severity</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>

                  <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 rounded-lg text-xs font-semibold transition cursor-pointer dark:bg-rose-950/20 dark:hover:bg-rose-950/25 dark:text-rose-400 dark:border-rose-900/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Flush Table</span>
                  </button>
                </div>
              </div>

              {/* Logs console window */}
              <div className="border border-zinc-200 dark:border-zinc-855 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 dark:bg-zinc-950 px-4 py-2 border-b border-zinc-200 dark:border-zinc-855 flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase">Security Audit Stream Console</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{filteredLogs.length} Entries found</span>
                </div>
                
                <div className="p-2 bg-white dark:bg-zinc-950/40 font-mono text-xs max-h-[350px] overflow-y-auto space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-zinc-450 font-sans">
                      No matching audit records in the database.
                    </div>
                  ) : (
                    filteredLogs.map(log => {
                      let levelClass = "text-zinc-500";
                      let levelBg = "bg-slate-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-900";
                      
                      if (log.level === "WARN") {
                        levelClass = "text-amber-700 dark:text-amber-400";
                        levelBg = "bg-amber-50/50 border border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/20";
                      } else if (log.level === "CRITICAL") {
                        levelClass = "text-rose-700 dark:text-rose-450 font-bold animate-pulse";
                        levelBg = "bg-rose-50/50 border border-rose-250 dark:bg-rose-950/15 dark:border-rose-900/25";
                      }

                      return (
                        <div key={log.id} className={`p-3 rounded-lg ${levelBg} flex items-start gap-3 transition hover:bg-slate-50 dark:hover:bg-zinc-900/5`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                              <span className={`font-bold uppercase tracking-wider text-[10px] ${levelClass}`}>
                                [{log.level}] {log.message}
                              </span>
                              <span className="text-[9px] text-zinc-450 font-semibold font-mono">
                                {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            {log.details && (
                              <p className="text-[10px] text-slate-650 dark:text-zinc-400 break-words font-sans mt-0.5 leading-relaxed">{log.details}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: User Directory */}
        <div id="users-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Roster User Directory</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View enrolled accounts, assign system privileges, and clear bound fingerprint links.
              </p>
            </div>
            <button
              onClick={() => setIsUsersLoaded(!isUsersLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isUsersLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isUsersLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Table directory column */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Student Directory */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Student Directory</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-855 text-zinc-455 font-bold">
                            <th className="py-2 font-semibold">Student Name</th>
                            <th className="py-2 font-semibold">Email</th>
                            <th className="py-2 font-semibold">Fingerprint Lock</th>
                            <th className="py-2 font-semibold text-right">Reset Lock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsList.map(u => (
                            <tr key={u.id} className="border-b border-zinc-150 dark:border-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                              <td className="py-2.5">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                                <div className="text-[9px] text-zinc-450 font-mono">{u.id}</div>
                              </td>
                              <td className="py-2.5 font-mono text-[9px] text-slate-550 dark:text-slate-455">{u.email}</td>
                              <td className="py-2.5 font-mono text-[9px]">
                                {u.registeredFingerprint ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-28 block">{u.registeredFingerprint}</span>
                                ) : (
                                  <span className="text-slate-400 font-sans">Unbound</span>
                                )}
                              </td>
                              <td className="py-2.5 text-right">
                                {u.registeredFingerprint ? (
                                  <button
                                    onClick={() => handleClearDevice(u.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-[#0e5b9e] border border-zinc-200 rounded text-[9px] font-bold cursor-pointer transition dark:bg-zinc-950 dark:border-zinc-800 dark:text-emerald-450"
                                  >
                                    <Unlock className="h-3 w-3" />
                                    <span>Clear Bind</span>
                                  </button>
                                ) : (
                                  <span className="text-zinc-350">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Teacher Directory */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Teacher Directory</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-855 text-zinc-455 font-bold">
                            <th className="py-2 font-semibold">Teacher Name</th>
                            <th className="py-2 font-semibold">Email Address</th>
                            <th className="py-2 font-semibold">Role</th>
                            <th className="py-2 font-semibold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachersList.map(u => (
                            <tr key={u.id} className="border-b border-zinc-150 dark:border-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                              <td className="py-2.5">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                                <div className="text-[9px] text-zinc-450 font-mono">{u.id}</div>
                              </td>
                              <td className="py-2.5 font-mono text-[9px] text-slate-550 dark:text-slate-455">{u.email}</td>
                              <td className="py-2.5 text-slate-550 dark:text-slate-455 font-semibold capitalize">{u.role}</td>
                              <td className="py-2.5 text-right">
                                <span className="text-zinc-455 text-[10px] font-semibold italic">Active</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Admin Directory */}
                  {adminsList.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Admin Directory</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-855 text-zinc-455 font-bold">
                              <th className="py-2 font-semibold">Operator Name</th>
                              <th className="py-2 font-semibold">Email Address</th>
                              <th className="py-2 font-semibold">Role</th>
                              <th className="py-2 font-semibold text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminsList.map(u => (
                              <tr key={u.id} className="border-b border-zinc-150 dark:border-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                                <td className="py-2.5">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                                  <div className="text-[9px] text-zinc-450 font-mono">{u.id}</div>
                                </td>
                                <td className="py-2.5 font-mono text-[9px] text-slate-555 dark:text-slate-455">{u.email}</td>
                                <td className="py-2.5 text-slate-555 dark:text-slate-455 font-semibold capitalize">{u.role}</td>
                                <td className="py-2.5 text-right">
                                  <span className="text-[#0e5b9e] dark:text-emerald-400 text-[10px] font-semibold uppercase">Root System</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form column */}
                <div className="xl:col-span-1 bg-slate-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl h-fit space-y-4">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <PlusCircle className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" /> Add Roster Account
                  </h4>
                  
                  <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. David Miller"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">System Privilege</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e] cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. miller@university.edu"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e] font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#0e5b9e] hover:bg-[#004b87] text-white rounded-lg shadow-xs font-semibold cursor-pointer transition"
                    >
                      Create Account
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Subjects & Schedules */}
        <div id="subjects-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Course Schedules Registry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure classroom schedules, allocate room terminals, and whitelist IP subnet ranges.
              </p>
            </div>
            <button
              onClick={() => setIsSubjectsLoaded(!isSubjectsLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isSubjectsLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isSubjectsLoaded && (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Table directory column */}
                <div className="xl:col-span-2 space-y-3">
                  <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Course Catalog</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-450 font-bold">
                          <th className="py-2 font-semibold">Course Code / Name</th>
                          <th className="py-2 font-semibold">Assigned Instructor</th>
                          <th className="py-2 font-semibold">Classroom Terminal</th>
                          <th className="py-2 font-semibold">WiFi Subnet Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map(s => (
                          <tr key={s.id} className="border-b border-zinc-150 dark:border-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                            <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="font-mono text-[#0e5b9e] dark:text-emerald-450">{s.id}</div>
                              <div>{s.name}</div>
                            </td>
                            <td className="py-2.5 font-mono text-[9px] text-slate-500">{s.teacherId}</td>
                            <td className="py-2.5 text-slate-500">
                              <div className="font-semibold text-slate-855 dark:text-slate-350">{s.room}</div>
                              <div className="text-[9px] opacity-75">{s.schedule}</div>
                            </td>
                            <td className="py-2.5 font-mono text-[9px] text-slate-650 dark:text-zinc-400 font-bold">{s.subnet}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form column */}
                <div className="xl:col-span-1 bg-slate-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl h-fit space-y-4">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <PlusCircle className="h-4 w-4 text-[#0e5b9e] dark:text-[#10b981]" /> Register Course
                  </h4>

                  <form onSubmit={handleAddSubject} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Course Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS-404"
                        value={newSubId}
                        onChange={(e) => setNewSubId(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-2 text-slate-805 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e] font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Course Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Distributed Systems"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-2 text-slate-850 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-500 font-bold">Assign Instructor</label>
                      <select
                        value={newSubTeacher}
                        onChange={(e) => setNewSubTeacher(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-2 text-slate-850 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e] cursor-pointer"
                      >
                        <option value="">Select Instructor</option>
                        {users.filter(u => u.role === "teacher").map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-zinc-500 font-bold">Room</label>
                        <input
                          type="text"
                          placeholder="e.g. LH-3"
                          value={newSubRoom}
                          onChange={(e) => setNewSubRoom(e.target.value)}
                          className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-zinc-500 font-bold">WiFi Subnet</label>
                        <input
                          type="text"
                          placeholder="192.168.1.*"
                          value={newSubSubnet}
                          onChange={(e) => setNewSubSubnet(e.target.value)}
                          className="w-full bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0e5b9e] font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#0e5b9e] hover:bg-[#004b87] text-white rounded-lg shadow-xs font-semibold cursor-pointer transition"
                    >
                      Register Course
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

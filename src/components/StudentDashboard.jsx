import React, { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { 
  loadDB, 
  generateBrowserFingerprint, 
  registerStudentDevice, 
  verifyAndSubmitAttendance 
} from "../state/db";
import { Laptop, ScanLine, Clock, MapPin, History, CheckCircle2, AlertTriangle, User, Calendar, Megaphone, ShieldAlert, UserCheck } from "lucide-react";

export default function StudentDashboard({ user, triggerRefresh, onTriggerRefresh }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannerControlsRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [clientFingerprint, setClientFingerprint] = useState("");
  const [clientIp, setClientIp] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // JUNO Interactive Load States
  const [isScannerLoaded, setIsScannerLoaded] = useState(false);
  const [isDeviceLoaded, setIsDeviceLoaded] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  useEffect(() => {
    const db = loadDB();
    const freshUser = db.users.find(u => u.id === user.id);
    if (freshUser) {
      setCurrentUser(freshUser);
    }
    
    setClientFingerprint(db.simulation.fingerprintOverride || generateBrowserFingerprint());
    setClientIp(db.simulation.clientIp);

    if (db.sessions.length > 0) {
      const activeSess = db.sessions[0];
      const subject = db.subjects.find(s => s.id === activeSess.subjectId);
      setActiveSession({
        ...activeSess,
        subjectName: subject ? subject.name : "Unknown",
        subjectCode: subject ? subject.id : "",
        subnet: subject ? subject.subnet : ""
      });
    } else {
      setActiveSession(null);
    }

    const history = db.attendance.filter(a => a.studentId === user.id);
    history.sort((a, b) => b.timestamp - a.timestamp);
    setAttendanceHistory(history);

  }, [user.id, triggerRefresh]);

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const handleRegisterDevice = () => {
    const res = registerStudentDevice(currentUser.id, clientFingerprint);
    if (res.success) {
      onTriggerRefresh();
    } else {
      alert(res.message);
    }
  };

  const handleScanSubmit = (tokenToScan) => {
    if (!tokenToScan) {
      alert("No token payload found to scan.");
      return;
    }
    
    const result = verifyAndSubmitAttendance(currentUser.id, tokenToScan);
    setScanResult({
      success: result.success,
      message: result.message
    });
    
    setManualToken("");
    onTriggerRefresh();

    setTimeout(() => {
      setScanResult(null);
    }, 6000);
  };

  const stopCameraScanner = () => {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop();
      scannerControlsRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraScanning(false);
  };

  const startCameraScanner = async () => {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Live camera access is not available in this browser. Use the phone camera fallback below.");
      return;
    }

    try {
      setIsCameraScanning(true);
      await new Promise(resolve => requestAnimationFrame(resolve));

      if (!videoRef.current) {
        throw new Error("Scanner video element is not ready");
      }

      const codeReader = new BrowserQRCodeReader();

      scannerControlsRef.current = await codeReader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        videoRef.current,
        (result, error, controls) => {
          if (!result) return;

          const scannedToken = result.getText().trim();
          controls.stop();
          scannerControlsRef.current = null;
          setIsCameraScanning(false);
          handleScanSubmit(scannedToken);
        }
      );
    } catch (err) {
      stopCameraScanner();
      setCameraError("Live camera could not open. Use HTTPS, allow camera permission, or tap the phone camera fallback below.");
    }
  };

  const handleImageQrUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setCameraError("");
    let imageUrl = "";

    try {
      const codeReader = new BrowserQRCodeReader();
      imageUrl = URL.createObjectURL(file);
      const result = await codeReader.decodeFromImageUrl(imageUrl);
      handleScanSubmit(result.getText().trim());
    } catch (err) {
      setCameraError("Could not read a QR code from that camera image. Retake it with the QR centered and in focus.");
    } finally {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  };

  const handleQuickScan = () => {
    if (!activeSession) return;
    const db = loadDB();
    const timeOffsetMs = db.simulation.timeOffsetSeconds * 1000;
    const currentTimestamp = Date.now() + timeOffsetMs;
    const windowTimestamp = Math.floor(currentTimestamp / 5000) * 5000;
    
    const payload = {
      sessionId: activeSession.id,
      timestamp: windowTimestamp,
      salt: Math.random().toString(36).substring(2, 6)
    };

    const token = btoa(JSON.stringify(payload));
    handleScanSubmit(token);
  };

  const isDeviceBound = !!currentUser.registeredFingerprint;
  const isFingerprintMatch = currentUser.registeredFingerprint === clientFingerprint;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left max-w-7xl mx-auto py-2">
      {/* ================= LEFT SIDEBAR COLUMN ================= */}
      <div className="lg:col-span-1 space-y-4">
        {/* Student Academic Info Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Student Credentials
          </h3>
          
          <div className="space-y-3.5 text-xs">
            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Enrollment No</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{currentUser.id}</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Programme</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">(L) BCA0100 - Computer Applications</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Semester</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">2024-2028-SP26 SEM IV</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Division</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Sec-B</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Batch</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">2024 - 2028</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Unique ID</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">BCA/40051/24</div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-semibold">Student Unique ID (Fingerprint)</div>
              <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {currentUser.registeredFingerprint || "Unregistered (-)"}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                onClick={() => {
                  setIsDeviceLoaded(true);
                  // Scroll to device card
                  document.getElementById("device-card")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="juno-btn-secondary w-full text-center"
              >
                Link Device Fingerprint
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="juno-card">
          <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Quick Links
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mb-4">Open common student actions directly.</p>

          <div className="space-y-2 text-xs">
            <button 
              onClick={() => {
                setIsDeviceLoaded(true);
                document.getElementById("device-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <User className="h-4 w-4 text-emerald-500" />
              <span>Verify Profile Fingerprint</span>
            </button>

            <button 
              onClick={() => {
                setIsScannerLoaded(true);
                document.getElementById("scanner-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <ScanLine className="h-4 w-4 text-emerald-500" />
              <span>Attendance QR Scan Portal</span>
            </button>

            <button 
              onClick={() => {
                setIsHistoryLoaded(true);
                document.getElementById("history-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 text-left transition cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span>View Roster Log History</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIGHT MAIN SECTION ================= */}
      <div className="lg:col-span-2 space-y-4">
        {/* Card 1: Dynamic QR Code Scanner */}
        <div id="scanner-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ScanLine className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Class Attendance Scanner</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mark attendance for the current classroom session. Decodes dynamic QR coordinates.
              </p>
            </div>
            <button
              onClick={() => setIsScannerLoaded(!isScannerLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isScannerLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isScannerLoaded ? (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in">
              {scanResult && (
                <div className={`p-4 rounded-xl text-xs flex gap-3 ${
                  scanResult.success 
                    ? "bg-emerald-50 dark:glass-emerald text-emerald-800 dark:text-emerald-200 border border-emerald-250" 
                    : "bg-rose-50 dark:glass-rose text-rose-800 dark:text-rose-200 border border-rose-250"
                }`}>
                  {scanResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold mb-0.5">{scanResult.success ? "Verification Success" : "Security Blocked"}</h4>
                    <p>{scanResult.message}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Viewfinder simulation */}
                <div className="relative h-60 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-4">
                  <div className="absolute inset-4 border border-dashed border-slate-800 rounded-lg pointer-events-none"></div>
                  <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-emerald-500"></div>
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-emerald-500"></div>
                  <div className="absolute left-6 right-6 h-0.5 bg-rose-500 opacity-60 animate-scan-line pointer-events-none"></div>

                  {activeSession ? (
                    <div className="space-y-4 z-10">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full inline-flex items-center justify-center animate-pulse">
                        <ScanLine className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-200">Active Classroom QR Found</h4>
                        <p className="text-[10px] text-emerald-400 font-medium font-mono">{activeSession.subjectCode} - {activeSession.subjectName}</p>
                      </div>
                      <button
                        onClick={isCameraScanning ? stopCameraScanner : startCameraScanner}
                        className="px-4 py-2 text-xs font-semibold rounded-lg shadow transition cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                      >
                        {isCameraScanning ? "Stop Camera" : "Open Camera Scanner"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 z-10 text-slate-500">
                      <ScanLine className="h-8 w-8 mx-auto stroke-1" />
                      <p className="text-xs">No active attendance session broadcast in range.</p>
                      <p className="text-[10px] opacity-75">Start a session in the Teacher portal to begin.</p>
                    </div>
                  )}
                </div>

                {/* Subnet details & manual payload */}
                <div className="space-y-4 text-xs font-sans text-slate-600 dark:text-zinc-400">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Phone camera scanner:</h4>
                    <div className="relative h-44 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                      <video
                        ref={videoRef}
                        className={`h-full w-full object-cover ${isCameraScanning ? "block" : "hidden"}`}
                        playsInline
                        muted
                      />
                      {!isCameraScanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-slate-500">
                          <ScanLine className="h-8 w-8 stroke-1" />
                          <p>Tap Open Camera Scanner, then point at the teacher QR.</p>
                        </div>
                      )}
                      {isCameraScanning && (
                        <>
                          <div className="absolute inset-6 rounded-lg border border-dashed border-emerald-400/70 pointer-events-none"></div>
                          <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-rose-500/80 animate-scan-line pointer-events-none"></div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={isCameraScanning ? stopCameraScanner : startCameraScanner}
                      className="juno-btn-primary w-full"
                    >
                      {isCameraScanning ? "Stop Camera" : "Open Camera Scanner"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageQrUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="juno-btn-secondary w-full"
                    >
                      Open Phone Camera Fallback
                    </button>
                    {!activeSession && (
                      <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
                        No active teacher broadcast is running yet. The camera can open, but attendance will only submit after a teacher starts a QR session.
                      </p>
                    )}
                    {cameraError && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                        {cameraError}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Location constraints:</h4>
                    <div className="space-y-1.5 font-sans">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <span>Room Location: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{activeSession ? activeSession.room : "N/A"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <span>Subnet Subnet Limit: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{activeSession ? activeSession.subnet : "N/A"}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-150 dark:border-zinc-800 pt-3 space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Simulate Token Capture Injection</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste base64 token..."
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-2.5 py-1.5 font-mono text-[10px] text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleScanSubmit(manualToken)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded font-semibold transition cursor-pointer"
                      >
                        Inject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              Click Load to fetch today's active camera scanning viewport.
            </p>
          )}
        </div>

        {/* Card 2: Device Fingerprint Registration */}
        <div id="device-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Laptop className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Device Fingerprint Registration</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Link your active device characteristics to lock your profile and prevent proxy attendance.
              </p>
            </div>
            <button
              onClick={() => setIsDeviceLoaded(!isDeviceLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isDeviceLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isDeviceLoaded ? (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in">
              {isDeviceBound ? (
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 rounded-lg">
                    <UserCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Fingerprint Bound and Authenticated</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-zinc-500">Bound Fingerprint Hash:</div>
                      <div className="font-mono bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2 rounded text-slate-800 dark:text-emerald-400 select-all mt-1">
                        {currentUser.registeredFingerprint}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-zinc-500">Detected Fingerprint Hash:</div>
                      <div className={`font-mono p-2 rounded border select-all mt-1 ${
                        isFingerprintMatch 
                          ? "bg-slate-50 dark:bg-zinc-950 border-emerald-300 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                          : "bg-rose-50 dark:bg-zinc-950 border-rose-350 dark:border-rose-900/30 text-rose-700 dark:text-rose-450"
                      }`}>
                        {clientFingerprint}
                      </div>
                    </div>
                  </div>

                  {!isFingerprintMatch && (
                    <div className="p-3.5 bg-rose-50 border border-rose-250 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 rounded-lg flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                      <p className="leading-relaxed">
                        Access Blocked: Browser fingerprint mismatch. You must log in as Administrator to clear this student's device binding.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-250 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 rounded-lg flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="leading-relaxed">
                      Device binding is required. Linked profiles ensure other users cannot check-in for you.
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] text-zinc-500">Detected Fingerprint:</div>
                    <div className="font-mono bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded text-amber-600 dark:text-amber-400 select-all mt-1">
                      {clientFingerprint}
                    </div>
                  </div>

                  <button
                    onClick={handleRegisterDevice}
                    className="juno-btn-primary w-full"
                  >
                    Bind Current Device Fingerprint
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              Click Load to fetch system device fingerprint mappings.
            </p>
          )}
        </div>

        {/* Card 3: Academic Attendance History */}
        <div id="history-card" className="juno-card">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-[#0e5b9e] dark:text-[#10b981]" />
                <span>Attendance Log Registry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View completed attendance records from active courses.
              </p>
            </div>
            <button
              onClick={() => setIsHistoryLoaded(!isHistoryLoaded)}
              className="juno-btn-primary shrink-0"
            >
              {isHistoryLoaded ? "Close" : "Load"}
            </button>
          </div>

          {isHistoryLoaded ? (
            <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-fade-in">
              {attendanceHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-sans">
                  No verified attendance scans found in the database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                        <th className="py-2.5 font-semibold">Subject</th>
                        <th className="py-2.5 font-semibold">Status</th>
                        <th className="py-2.5 font-semibold">Scan IP</th>
                        <th className="py-2.5 font-semibold">Verification Method</th>
                        <th className="py-2.5 font-semibold text-right">Time Logged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map(item => (
                        <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/20">
                          <td className="py-3 font-semibold">
                            <div>{item.subjectName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono font-medium">{item.subjectId}</div>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30 rounded-full font-medium">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-[10px]">{item.ipAddress}</td>
                          <td className="py-3 text-zinc-500 dark:text-zinc-400">{item.method}</td>
                          <td className="py-3 text-right font-mono text-[10px]">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              Click Load to fetch historical logs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

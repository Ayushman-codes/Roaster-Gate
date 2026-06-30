// Local database & security logic simulation for Secure Attendance Tracking

const DEFAULT_USERS = [
  { id: "stu_alice", name: "Alice Smith", role: "student", email: "alice@university.edu", registeredFingerprint: null },
  { id: "stu_bob", name: "Bob Jones", role: "student", email: "bob@university.edu", registeredFingerprint: null },
  { id: "stu_charlie", name: "Charlie Brown", role: "student", email: "charlie@university.edu", registeredFingerprint: null },
  { id: "teach_turing", name: "Dr. Alan Turing", role: "teacher", email: "turing@university.edu" },
  { id: "teach_hopper", name: "Prof. Grace Hopper", role: "teacher", email: "hopper@university.edu" },
  { id: "admin_chief", name: "System Admin", role: "admin", email: "admin@university.edu" }
];

const DEFAULT_SUBJECTS = [
  { id: "CS-101", name: "Introduction to Cryptography", teacherId: "teach_turing", schedule: "Mon/Wed 10:00 AM", room: "Room LH-101", subnet: "192.168.1.*" },
  { id: "CS-102", name: "Advanced Compiler Design", teacherId: "teach_hopper", schedule: "Tue/Thu 2:00 PM", room: "Lab A", subnet: "10.0.0.*" },
  { id: "CS-103", name: "Neural Networks & Deep Learning", teacherId: "teach_turing", schedule: "Fri 1:00 PM", room: "Room LH-202", subnet: "192.168.1.*" }
];

const DEFAULT_SIMULATION = {
  clientIp: "192.168.1.45",
  timeOffsetSeconds: 0,
  fingerprintOverride: ""
};

// Initial logs - start completely empty for a clean slate
const DEFAULT_AUDIT_LOGS = [];

// Helper to load database from localStorage or set defaults
export function loadDB() {
  if (!localStorage.getItem("sat_db_initialized")) {
    localStorage.setItem("sat_users", JSON.stringify(DEFAULT_USERS));
    localStorage.setItem("sat_subjects", JSON.stringify(DEFAULT_SUBJECTS));
    localStorage.setItem("sat_sessions", JSON.stringify([]));
    localStorage.setItem("sat_attendance", JSON.stringify([]));
    localStorage.setItem("sat_audit_logs", JSON.stringify(DEFAULT_AUDIT_LOGS));
    localStorage.setItem("sat_simulation", JSON.stringify(DEFAULT_SIMULATION));
    localStorage.setItem("sat_db_initialized", "true");
  }

  return {
    users: JSON.parse(localStorage.getItem("sat_users")),
    subjects: JSON.parse(localStorage.getItem("sat_subjects")),
    sessions: JSON.parse(localStorage.getItem("sat_sessions")),
    attendance: JSON.parse(localStorage.getItem("sat_attendance")),
    auditLogs: JSON.parse(localStorage.getItem("sat_audit_logs")),
    simulation: JSON.parse(localStorage.getItem("sat_simulation"))
  };
}

export function saveDB(data) {
  localStorage.setItem("sat_users", JSON.stringify(data.users));
  localStorage.setItem("sat_subjects", JSON.stringify(data.subjects));
  localStorage.setItem("sat_sessions", JSON.stringify(data.sessions));
  localStorage.setItem("sat_attendance", JSON.stringify(data.attendance));
  localStorage.setItem("sat_audit_logs", JSON.stringify(data.auditLogs));
  localStorage.setItem("sat_simulation", JSON.stringify(data.simulation));
}

// Reset system tables completely
export function resetSystemData() {
  localStorage.removeItem("sat_db_initialized");
  localStorage.removeItem("sat_users");
  localStorage.removeItem("sat_subjects");
  localStorage.removeItem("sat_sessions");
  localStorage.removeItem("sat_attendance");
  localStorage.removeItem("sat_audit_logs");
  localStorage.removeItem("sat_simulation");
  loadDB();
  writeAuditLog("INFO", "Database Reset", "System database restored to clean defaults. All attendance logs and device registrations have been purged.");
}

// Generate device fingerprint based on browser metadata
export function generateBrowserFingerprint() {
  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create a clean hash-like representation from screen + browser settings
  const rawFingerprint = `${userAgent}-${screenWidth}x${screenHeight}-${language}-${timezone}`;
  
  // Simple hash function to create a readable hex string
  let hash = 0;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "DEV_FP_" + Math.abs(hash).toString(16).toUpperCase();
}

// Write to Audit Log
export function writeAuditLog(level, message, details) {
  const db = loadDB();
  const newLog = {
    id: "log_" + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now() + (db.simulation.timeOffsetSeconds * 1000),
    level,
    message,
    details
  };
  db.auditLogs.unshift(newLog); // Put new logs at top
  // Keep logs at a reasonable limit
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDB(db);
  return newLog;
}

// Generate Dynamic QR Payload
// payload refreshed every 5 seconds
export function generateQrPayload(sessionId) {
  const db = loadDB();
  const timeOffset = db.simulation.timeOffsetSeconds * 1000;
  const currentTimestamp = Date.now() + timeOffset;
  const session = db.sessions.find(s => s.id === sessionId);
  const subject = session ? db.subjects.find(s => s.id === session.subjectId) : null;

  // Round timestamp down to the nearest 5-second interval to stabilize current window
  const windowTimestamp = Math.floor(currentTimestamp / 5000) * 5000;

  const payload = {
    sessionId,
    subjectId: session?.subjectId || "",
    teacherId: session?.teacherId || "",
    subjectName: subject?.name || "",
    subnet: subject?.subnet || "",
    timestamp: windowTimestamp,
    salt: Math.random().toString(36).substring(2, 6)
  };

  const jsonStr = JSON.stringify(payload);
  // Encode base64 to simulate encrypted text payload
  const encryptedPayload = btoa(jsonStr);

  return {
    token: encryptedPayload,
    expiresAt: windowTimestamp + 5000,
    timestamp: windowTimestamp
  };
}

// Student Registers Device Fingerprint
export function registerStudentDevice(studentId, fingerprint) {
  const db = loadDB();
  const userIndex = db.users.findIndex(u => u.id === studentId);
  if (userIndex === -1) return { success: false, message: "Student not found" };

  db.users[userIndex].registeredFingerprint = fingerprint;
  saveDB(db);

  writeAuditLog(
    "INFO", 
    `Device Binding Successful: ${db.users[userIndex].name}`, 
    `Fingerprint ${fingerprint} bound to student ID: ${studentId}`
  );
  return { success: true, message: "Device bound successfully." };
}

// Admin Unbinds Device Fingerprint
export function unbindStudentDevice(studentId) {
  const db = loadDB();
  const userIndex = db.users.findIndex(u => u.id === studentId);
  if (userIndex === -1) return { success: false, message: "Student not found" };

  const prevFp = db.users[userIndex].registeredFingerprint;
  db.users[userIndex].registeredFingerprint = null;
  saveDB(db);

  writeAuditLog(
    "WARN", 
    `Device Unbound by Admin: ${db.users[userIndex].name}`, 
    `Cleared fingerprint ${prevFp || "None"} from student ID: ${studentId}`
  );
  return { success: true, message: "Device unbound successfully." };
}

// Submit Attendance Scan
export function verifyAndSubmitAttendance(studentId, token) {
  const db = loadDB();
  const timeOffset = db.simulation.timeOffsetSeconds * 1000;
  const scanTime = Date.now() + timeOffset;
  const student = db.users.find(u => u.id === studentId);

  if (!student) {
    return { success: false, message: "Invalid Student ID" };
  }

  // Get active client fingerprint (either real browser one or simulation override)
  const clientFingerprint = db.simulation.fingerprintOverride || generateBrowserFingerprint();
  const clientIp = db.simulation.clientIp;

  // 1. Decode token
  let payload;
  try {
    const decodedStr = atob(token);
    payload = JSON.parse(decodedStr);
  } catch (err) {
    writeAuditLog(
      "CRITICAL",
      `Cheating Flagged: Invalid QR Payload from ${student.name}`,
      `Token: "${token.substring(0, 20)}...". IP: ${clientIp}. Fingerprint: ${clientFingerprint}. Details: Base64 decode / JSON parse failed.`
    );
    return { success: false, message: "Invalid QR scan token format. (Cheating Flagged)" };
  }

  let session = db.sessions.find(s => s.id === payload.sessionId);
  if (!session) {
    if (!payload.subjectId) {
      writeAuditLog(
        "WARN",
        `Scan Failed: Session Not Found for ${student.name}`,
        `Requested Session ID: ${payload.sessionId}. IP: ${clientIp}.`
      );
      return { success: false, message: "Attendance session is no longer active or does not exist." };
    }

    session = {
      id: payload.sessionId,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId || "remote_teacher",
      startedAt: payload.timestamp
    };
  }

  const subject = db.subjects.find(s => s.id === session.subjectId) || {
    id: payload.subjectId,
    name: payload.subjectName || payload.subjectId,
    subnet: payload.subnet || ""
  };

  // 2. Check Device Binding
  if (!student.registeredFingerprint) {
    writeAuditLog(
      "INFO",
      `Scan Denied: Device Not Bound for ${student.name}`,
      `Student attempted to scan before binding their device. IP: ${clientIp}. Fingerprint: ${clientFingerprint}`
    );
    return { success: false, message: "Device binding required. Please register your device fingerprint before scanning." };
  }

  if (student.registeredFingerprint !== clientFingerprint) {
    writeAuditLog(
      "CRITICAL",
      `Cheating Flagged: Unauthorized Device for ${student.name}`,
      `Attempted scan using fingerprint ${clientFingerprint}, but user is bound to ${student.registeredFingerprint}. IP: ${clientIp}`
    );
    return { success: false, message: "Access Denied: Different device fingerprint detected (Cheating Flagged)." };
  }

  // 3. Check Dynamic QR Time-To-Live (5 seconds TTL)
  const tokenAge = scanTime - payload.timestamp;
  if (tokenAge < 0 || tokenAge > 5000) {
    writeAuditLog(
      "CRITICAL",
      `Cheating Flagged: Expired QR Scan / Screenshot sharing by ${student.name}`,
      `QR code age: ${(tokenAge / 1000).toFixed(1)}s (Exceeded 5.0s TTL limit). Token timestamp: ${payload.timestamp}, Scan timestamp: ${scanTime}. IP: ${clientIp}`
    );
    return { success: false, message: "Access Denied: Expired QR Code (Screenshot sharing or delayed scanning detected)." };
  }

  // 4. IP Subnet Verification
  // Match check. Expected: e.g., '192.168.1.*'
  const expectedSubnet = subject.subnet;
  let ipMatches = true;

  if (expectedSubnet) {
    const subnetPrefix = expectedSubnet.replace("*", ""); // '192.168.1.'
    if (!clientIp.startsWith(subnetPrefix)) {
      ipMatches = false;
    }
  }

  if (!ipMatches) {
    writeAuditLog(
      "CRITICAL",
      `Cheating Flagged: Location Subnet Mismatch for ${student.name}`,
      `Scanned from IP ${clientIp}, but classroom subnet requires ${expectedSubnet}. VPN or proxy suspected.`
    );
    return { success: false, message: "Access Denied: Classroom Network Mismatch. Please connect to the class Wi-Fi." };
  }

  // 5. Double-scanning protection (already marked present in this session)
  const alreadyMarked = db.attendance.find(a => a.studentId === studentId && a.sessionId === session.id);
  if (alreadyMarked) {
    return { success: true, message: "Already marked present for this session.", alreadyDone: true };
  }

  // If all checks pass, write attendance record!
  const newAttendance = {
    id: "att_" + Math.random().toString(36).substr(2, 9),
    studentId,
    studentName: student.name,
    sessionId: session.id,
    subjectId: subject.id,
    subjectName: subject.name,
    timestamp: scanTime,
    status: "Present",
    ipAddress: clientIp,
    fingerprint: clientFingerprint,
    method: "Dynamic QR Verified"
  };

  db.attendance.push(newAttendance);
  saveDB(db);

  writeAuditLog(
    "INFO",
    `Attendance Marked: ${student.name} - ${subject.name}`,
    `Status: Present. Method: Dynamic QR. IP: ${clientIp}. Fingerprint: ${clientFingerprint}. TTL drift: ${tokenAge}ms.`
  );

  return { success: true, message: `Attendance marked successfully for ${subject.name}!` };
}

// Teacher Manual Override
export function submitManualOverride(studentId, sessionId, status) {
  const db = loadDB();
  const student = db.users.find(u => u.id === studentId);
  const session = db.sessions.find(s => s.id === sessionId);
  const subject = db.subjects.find(s => s.id === session.subjectId);

  const existingIndex = db.attendance.findIndex(a => a.studentId === studentId && a.sessionId === sessionId);

  if (existingIndex !== -1) {
    const prevStatus = db.attendance[existingIndex].status;
    if (status === "Absent") {
      db.attendance.splice(existingIndex, 1); // Delete record for Absent
    } else {
      db.attendance[existingIndex].status = status;
      db.attendance[existingIndex].method = "Teacher Manual Override";
    }
    writeAuditLog(
      "WARN",
      `Attendance Override: ${student.name}`,
      `Changed status from '${prevStatus}' to '${status}' in session ${sessionId} (${subject.name}).`
    );
  } else if (status !== "Absent") {
    const timeOffset = db.simulation.timeOffsetSeconds * 1000;
    const newRecord = {
      id: "att_" + Math.random().toString(36).substr(2, 9),
      studentId,
      studentName: student.name,
      sessionId: session.id,
      subjectId: subject.id,
      subjectName: subject.name,
      timestamp: Date.now() + timeOffset,
      status: status,
      ipAddress: "Manual",
      fingerprint: "Manual",
      method: "Teacher Manual Override"
    };
    db.attendance.push(newRecord);
    writeAuditLog(
      "WARN",
      `Attendance Override: ${student.name}`,
      `Manually marked as '${status}' in session ${sessionId} (${subject.name}) by teacher.`
    );
  }

  saveDB(db);
  return { success: true };
}

// Create new class session
export function startTeacherSession(teacherId, subjectId) {
  const db = loadDB();
  const subject = db.subjects.find(s => s.id === subjectId);
  if (!subject) return { success: false, message: "Subject not found" };

  // End any currently running sessions for this teacher
  db.sessions = db.sessions.filter(s => {
    const sub = db.subjects.find(x => x.id === s.subjectId);
    return !sub || sub.teacherId !== teacherId;
  });

  const timeOffset = db.simulation.timeOffsetSeconds * 1000;
  const newSession = {
    id: "sess_" + Math.random().toString(36).substr(2, 9),
    subjectId,
    teacherId,
    createdAt: Date.now() + timeOffset
  };

  db.sessions.push(newSession);
  saveDB(db);

  writeAuditLog(
    "INFO",
    `Attendance Session Started: ${subject.name}`,
    `Session ID: ${newSession.id}. Subject Subnet Constraint: ${subject.subnet}.`
  );

  return { success: true, session: newSession };
}

// End class session
export function endTeacherSession(sessionId) {
  const db = loadDB();
  const index = db.sessions.findIndex(s => s.id === sessionId);
  if (index === -1) return { success: false };

  const session = db.sessions[index];
  const subject = db.subjects.find(x => x.id === session.subjectId);

  db.sessions.splice(index, 1);
  saveDB(db);

  writeAuditLog(
    "INFO",
    `Attendance Session Closed: ${subject ? subject.name : "Unknown Subject"}`,
    `Session ID: ${sessionId} has been closed and QR codes invalidated.`
  );

  return { success: true };
}

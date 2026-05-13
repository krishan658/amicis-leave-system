import React, { useEffect, useMemo, useRef, useState } from "react";

const LEAVE_TYPES = {
  Casual: { allowance: 7, description: "Short personal leave" },
  Annual: { allowance: 14, description: "Planned vacation leave" },
  Sick: { allowance: 7, description: "Medical / health leave" },
};

const USERS = [
  { name: "Prabath", password: "Prabath@123", role: "Director", supervisor: "Deric" },
  { name: "Deric", password: "Deric@123", role: "Director", supervisor: "Prabath" },
  { name: "Krishan", password: "Krishan@123", role: "Manager", supervisor: "Prabath" },
  { name: "Damitha", password: "Damitha@123", role: "Manager", supervisor: "Krishan" },
  { name: "Roshini", password: "Roshini@123", role: "Executive", supervisor: "Prabath" },
  { name: "Chalani", password: "Chalani@123", role: "Executive", supervisor: "Prabath" },
  { name: "Manjula", password: "Manjula@123", role: "Executive", supervisor: "Prabath" },
  { name: "Kasun", password: "Kasun@123", role: "Executive", supervisor: "Deric" },
  { name: "Nethini", password: "Nethini@123", role: "Executive", supervisor: "Deric" },
  { name: "Keren", password: "Keren@123", role: "Executive", supervisor: "Deric" },
];

const initialRequests = [
  {
    id: 1,
    employee: "Krishan",
    type: "Casual",
    startDate: "2026-05-15",
    endDate: "2026-05-16",
    days: 2,
    reason: "Personal work",
    status: "Approved",
    approvedBy: "Prabath",
  },
  {
    id: 2,
    employee: "Roshini",
    type: "Sick",
    startDate: "2026-05-20",
    endDate: "2026-05-20",
    days: 1,
    reason: "Medical appointment",
    status: "Pending",
    approvedBy: "",
  },
];

const FIREBASE_DATABASE_URL = "https://amicis-leave-system-default-rtdb.asia-southeast1.firebasedatabase.app";
const FIREBASE_REQUESTS_PATH = "amicisLeaveSystem/leaveRequests";
const LIVE_SYNC_INTERVAL_MS = 3000;

const SRI_LANKA_MERCANTILE_HOLIDAYS_2026 = [
  "2026-01-15",
  "2026-02-04",
  "2026-03-21",
  "2026-04-03",
  "2026-04-13",
  "2026-04-14",
  "2026-05-01",
  "2026-05-28",
  "2026-05-30",
  "2026-06-29",
  "2026-07-29",
  "2026-08-26",
  "2026-08-27",
  "2026-09-26",
  "2026-10-25",
  "2026-11-08",
  "2026-11-24",
  "2026-12-23",
  "2026-12-25",
];

function isFirebaseConfigured() {
  return FIREBASE_DATABASE_URL.startsWith("https://") && !FIREBASE_DATABASE_URL.includes("PASTE_YOUR_FIREBASE");
}

function getFirebaseEndpoint() {
  return `${FIREBASE_DATABASE_URL.replace(/\/$/, "")}/${FIREBASE_REQUESTS_PATH}.json`;
}

async function fetchRemoteRequests() {
  if (!isFirebaseConfigured()) return null;
  const response = await fetch(getFirebaseEndpoint());
  if (!response.ok) throw new Error("Could not load live leave requests.");
  const data = await response.json();
  if (!data) return [];
  return Array.isArray(data) ? data : Object.values(data);
}

async function saveRemoteRequests(requests) {
  if (!isFirebaseConfigured()) return false;
  const response = await fetch(getFirebaseEndpoint(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requests),
  });
  if (!response.ok) throw new Error("Could not save live leave requests.");
  return true;
}

function Icon({ name, className = "h-5 w-5" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "calendar") {
    return (
      <svg {...props}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    );
  }
  if (name === "plus") {
    return (
      <svg {...props}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }
  if (name === "team") {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-white/70 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`min-h-12 touch-manipulation rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition active:scale-[0.98] hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }) {
  return <label className="mb-2 block text-sm font-semibold text-slate-700">{children}</label>;
}

function mobileInputClass(extra = "") {
  return `min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 ${extra}`;
}

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isMercantileHoliday(dateString) {
  return SRI_LANKA_MERCANTILE_HOLIDAYS_2026.includes(dateString);
}

export function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let totalDays = 0;
  const current = new Date(start);
  while (current <= end) {
    const dateString = current.toISOString().split("T")[0];
    if (!isWeekend(current) && !isMercantileHoliday(dateString)) totalDays += 1;
    current.setDate(current.getDate() + 1);
  }
  return totalDays;
}

export function getUser(name) {
  return USERS.find((user) => user.name === name);
}

export function getSupervisorName(employeeName) {
  return getUser(employeeName)?.supervisor || "";
}

export function canApproveLeave(approverName, employeeName) {
  if (!approverName || !employeeName) return false;
  if (approverName === employeeName) return false;
  return getSupervisorName(employeeName) === approverName;
}

export function validateLogin(username, password) {
  const user = USERS.find((item) => item.name === username);
  return Boolean(user && user.password === password);
}

export function getVisibleEmployeesForLeaveApplication(currentUser) {
  const restrictedUsers = ["Deric", "Prabath", "Krishan"];
  if (restrictedUsers.includes(currentUser)) return [];
  const user = getUser(currentUser);
  return user ? [user.name] : [];
}

export function getVisibleEmployeesForReview(currentUser) {
  const ownName = getUser(currentUser)?.name;
  const subordinateNames = USERS.filter((user) => user.supervisor === currentUser).map((user) => user.name);
  return ownName ? [ownName, ...subordinateNames] : [];
}

export function calculateApprovedUsage(requests, employee) {
  const usage = Object.keys(LEAVE_TYPES).reduce((acc, item) => ({ ...acc, [item]: 0 }), {});
  requests
    .filter((request) => request.employee === employee && request.status === "Approved")
    .forEach((request) => {
      if (usage[request.type] !== undefined) usage[request.type] += request.days;
    });
  return usage;
}

export function calculateRemainingBalance(requests, employee) {
  const approvedUsage = calculateApprovedUsage(requests, employee);
  return Object.entries(LEAVE_TYPES).reduce((acc, [leaveType, details]) => {
    acc[leaveType] = details.allowance - approvedUsage[leaveType];
    return acc;
  }, {});
}

function runSelfTests() {
  return [
    { name: "same day leave counts as 1 day", pass: calculateDays("2026-05-15", "2026-05-15") === 1 },
    { name: "two working days count correctly", pass: calculateDays("2026-05-14", "2026-05-15") === 2 },
    { name: "weekends should not count as leave days", pass: calculateDays("2026-05-15", "2026-05-17") === 1 },
    { name: "Sri Lankan mercantile holidays should not count as leave days", pass: calculateDays("2026-12-24", "2026-12-26") === 1 },
    { name: "Mercantile Poya holidays should not count as leave days", pass: calculateDays("2026-11-23", "2026-11-25") === 2 },
    { name: "end date before start date returns 0", pass: calculateDays("2026-05-16", "2026-05-15") === 0 },
    { name: "approved leave reduces only the matching leave type balance", pass: calculateRemainingBalance(initialRequests, "Krishan").Casual === 5 },
    { name: "pending leave does not reduce balance", pass: calculateRemainingBalance(initialRequests, "Roshini").Sick === 7 },
    { name: "employee cannot approve own leave", pass: canApproveLeave("Krishan", "Krishan") === false },
    { name: "direct supervisor can approve subordinate leave", pass: canApproveLeave("Prabath", "Roshini") === true },
    { name: "non-supervisor cannot approve leave", pass: canApproveLeave("Damitha", "Roshini") === false },
    { name: "valid credentials should authenticate user", pass: validateLogin("Krishan", "Krishan@123") === true },
    { name: "invalid password should fail login", pass: validateLogin("Krishan", "wrongpassword") === false },
    { name: "unknown user should fail login", pass: validateLogin("Unknown", "Unknown@123") === false },
    {
      name: "leave application employee list should show only logged-in user",
      pass: getVisibleEmployeesForLeaveApplication("Damitha").length === 1 && getVisibleEmployeesForLeaveApplication("Damitha")[0] === "Damitha",
    },
    {
      name: "Deric, Prabath and Krishan should not be eligible for leave application",
      pass:
        getVisibleEmployeesForLeaveApplication("Deric").length === 0 &&
        getVisibleEmployeesForLeaveApplication("Prabath").length === 0 &&
        getVisibleEmployeesForLeaveApplication("Krishan").length === 0,
    },
    {
      name: "review list should include logged-in user and direct subordinates only",
      pass:
        getVisibleEmployeesForReview("Prabath").includes("Prabath") &&
        getVisibleEmployeesForReview("Prabath").includes("Krishan") &&
        !getVisibleEmployeesForReview("Prabath").includes("Damitha") &&
        getVisibleEmployeesForReview("Prabath").includes("Roshini") &&
        !getVisibleEmployeesForReview("Prabath").includes("Keren"),
    },
    { name: "Krishan should supervise Damitha", pass: canApproveLeave("Krishan", "Damitha") === true },
    {
      name: "Deric should supervise Nethini, Keren and Kasun",
      pass: canApproveLeave("Deric", "Nethini") && canApproveLeave("Deric", "Keren") && canApproveLeave("Deric", "Kasun"),
    },
    { name: "Firebase sync should stay disabled until database URL is added", pass: FIREBASE_DATABASE_URL.includes("PASTE_YOUR_FIREBASE") ? !isFirebaseConfigured() : isFirebaseConfigured() },
    { name: "mobile inputs should use large touch target classes", pass: mobileInputClass().includes("min-h-12") && mobileInputClass().includes("text-base") },
    { name: "PWA standalone helper should be available", pass: typeof isStandaloneApp === "function" && typeof isIOSDevice === "function" },
  ];
}

function statusStyle(status) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function StatusIcon({ status }) {
  if (status === "Approved") return <Icon name="check" className="h-3 w-3" />;
  if (status === "Rejected") return <Icon name="x" className="h-3 w-3" />;
  return <Icon name="clock" className="h-3 w-3" />;
}

function LeaveRequestMobileCard({ request, currentUser, onApprove, onReject, onDelete }) {
  const canApprove = canApproveLeave(currentUser, request.employee);
  const ownerIsLoggedIn = currentUser === request.employee;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">{request.employee}</p>
          <p className="text-xs text-slate-500">Supervisor: {getSupervisorName(request.employee)}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(request.status)}`}>
          <StatusIcon status={request.status} />
          {request.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-indigo-50 p-3">
          <p className="text-xs text-indigo-500">Type</p>
          <p className="font-semibold text-indigo-900">{request.type}</p>
        </div>
        <div className="rounded-2xl bg-fuchsia-50 p-3">
          <p className="text-xs text-fuchsia-500">Days</p>
          <p className="font-semibold text-fuchsia-900">{request.days}</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
        <p>{request.startDate} to {request.endDate}</p>
        <p className="mt-1">Reason: {request.reason}</p>
        {request.approvedBy && <p className="mt-1 text-xs text-slate-400">By {request.approvedBy}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {request.status === "Pending" && canApprove && (
          <>
            <button type="button" onClick={() => onApprove(request.id)} className="min-h-10 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Approve</button>
            <button type="button" onClick={() => onReject(request.id)} className="min-h-10 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white">Reject</button>
          </>
        )}
        {request.status === "Pending" && !canApprove && (
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
            {ownerIsLoggedIn ? "Awaiting supervisor" : `Only ${getSupervisorName(request.employee)} can approve`}
          </span>
        )}
        <button type="button" onClick={() => onDelete(request.id)} className="min-h-10 rounded-xl bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">Delete</button>
      </div>
    </div>
  );
}

export default function LeaveSystemStarter() {
  const [requests, setRequests] = useState(initialRequests);
  const [syncStatus, setSyncStatus] = useState(isFirebaseConfigured() ? "Connecting to live sync..." : "Live sync not configured");
  const hasLoadedRemoteData = useRef(false);
  const lastSavedPayload = useRef(JSON.stringify(initialRequests));
  const isSavingRemote = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState("Krishan");
  const [loginPassword, setLoginPassword] = useState("Krishan@123");
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState("Krishan");
  const [selectedEmployee, setSelectedEmployee] = useState("Krishan");
  const [type, setType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneApp());

  const days = calculateDays(startDate, endDate);
  const testResults = useMemo(() => runSelfTests(), []);
  const supervisorName = getSupervisorName(selectedEmployee);

  const remainingBalance = useMemo(() => calculateRemainingBalance(requests, selectedEmployee), [requests, selectedEmployee]);
  const approvalQueue = useMemo(() => requests.filter((request) => request.status === "Pending" && canApproveLeave(currentUser, request.employee)), [requests, currentUser]);
  const leaveApplicationEmployees = useMemo(() => getVisibleEmployeesForLeaveApplication(currentUser), [currentUser]);
  const reviewEmployees = useMemo(() => getVisibleEmployeesForReview(currentUser), [currentUser]);
  const employeeRequests = requests.filter((request) => request.employee === selectedEmployee || canApproveLeave(currentUser, request.employee));
  const allTestsPassed = testResults.every((test) => test.pass);
  const isIOS = isIOSDevice();

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // Service worker file must exist in the deployed public folder.
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setInstallPrompt(null);
  }

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    async function loadAndRefreshRequests() {
      if (!isFirebaseConfigured()) {
        if (isMounted) setSyncStatus("Live sync not configured");
        return;
      }
      try {
        const remoteRequests = await fetchRemoteRequests();
        if (!isMounted || remoteRequests === null || isSavingRemote.current) return;

        if (remoteRequests.length === 0 && !hasLoadedRemoteData.current) {
          await saveRemoteRequests(initialRequests);
          lastSavedPayload.current = JSON.stringify(initialRequests);
          setRequests(initialRequests);
        } else {
          const remotePayload = JSON.stringify(remoteRequests);
          if (remotePayload !== lastSavedPayload.current) {
            setRequests(remoteRequests);
            lastSavedPayload.current = remotePayload;
          }
        }

        hasLoadedRemoteData.current = true;
        setSyncStatus("Live sync active");
      } catch {
        if (isMounted) setSyncStatus("Live sync error. Check Firebase URL/rules.");
      }
    }

    loadAndRefreshRequests();
    intervalId = window.setInterval(loadAndRefreshRequests, LIVE_SYNC_INTERVAL_MS);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function persistRequests(nextRequests) {
    if (!isFirebaseConfigured()) return;
    lastSavedPayload.current = JSON.stringify(nextRequests);
    isSavingRemote.current = true;
    setSyncStatus("Saving live sync...");
    try {
      await saveRemoteRequests(nextRequests);
      setSyncStatus("Live sync active");
    } catch {
      setSyncStatus("Live sync save failed. Check Firebase connection.");
    } finally {
      isSavingRemote.current = false;
    }
  }

  function resetForm() {
    setType("Casual");
    setStartDate("");
    setEndDate("");
    setReason("");
    setError("");
  }

  function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    if (!validateLogin(loginUsername, loginPassword)) {
      setLoginError("Invalid username or password.");
      return;
    }
    setCurrentUser(loginUsername);
    setSelectedEmployee(loginUsername);
    setIsAuthenticated(true);
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setLoginPassword("");
    setError("");
    setNotice("");
  }

  function submitRequest(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (leaveApplicationEmployees.length === 0) {
      setError("This account is not eligible to apply for leave.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start date and end date.");
      return;
    }
    if (days <= 0) {
      setError("Selected dates are holidays/weekends or invalid. Please select working dates.");
      return;
    }
    if (days > remainingBalance[type]) {
      setError(`Insufficient ${type} leave balance. Available: ${remainingBalance[type]} day(s).`);
      return;
    }

    const newRequest = {
      id: Date.now(),
      employee: currentUser,
      type,
      startDate,
      endDate,
      days,
      reason: reason.trim() || "Not specified",
      status: "Pending",
      approvedBy: "",
    };

    const nextRequests = [newRequest, ...requests];
    setRequests(nextRequests);
    persistRequests(nextRequests);
    setNotice(`Leave request submitted. Approval required from ${getSupervisorName(currentUser)}.`);
    resetForm();
  }

  function updateStatus(id, status) {
    setError("");
    setNotice("");
    const targetRequest = requests.find((request) => request.id === id);
    if (!targetRequest) return;
    if (!canApproveLeave(currentUser, targetRequest.employee)) {
      setError(`${currentUser} cannot ${status.toLowerCase()} ${targetRequest.employee}'s leave. Only ${getSupervisorName(targetRequest.employee)} can approve or reject this request.`);
      return;
    }
    const nextRequests = requests.map((request) => (request.id === id ? { ...request, status, approvedBy: currentUser } : request));
    setRequests(nextRequests);
    persistRequests(nextRequests);
    setNotice(`${targetRequest.employee}'s leave has been ${status.toLowerCase()} by ${currentUser}.`);
  }

  function deleteRequest(id) {
    setError("");
    setNotice("");
    const targetRequest = requests.find((request) => request.id === id);
    if (!targetRequest) return;
    if (targetRequest.employee !== currentUser && !canApproveLeave(currentUser, targetRequest.employee)) {
      setError("Only the leave owner or the assigned supervisor can delete this request.");
      return;
    }
    const nextRequests = requests.filter((request) => request.id !== id);
    setRequests(nextRequests);
    persistRequests(nextRequests);
    setNotice("Leave request deleted.");
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-gradient-to-br from-indigo-100 via-sky-50 to-fuchsia-100 px-4 py-6 sm:p-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-indigo-200/70 backdrop-blur sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-200 sm:h-16 sm:w-16">
            <Icon name="calendar" className="h-8 w-8" />
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Amicis Leave System</h1>
          <p className="mt-2 text-center text-slate-500">Employee Login Portal</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-5 sm:mt-8">
            <div>
              <FieldLabel>Username</FieldLabel>
              <select value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} className={mobileInputClass()}>
                {USERS.map((user) => (
                  <option key={user.name} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Password</FieldLabel>
              <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className={mobileInputClass()} placeholder="Enter password" />
            </div>

            {loginError && <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{loginError}</div>}

            <PrimaryButton type="submit" className="w-full py-4 text-base">Login</PrimaryButton>
          </form>

          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
            <p className="font-semibold text-slate-800">Demo Password Format</p>
            <p className="mt-1">Each user password format: Name@123</p>
            <p className="mt-1 text-xs text-slate-500">Example: Damitha@123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50 px-3 py-4 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-600 p-1 shadow-2xl shadow-indigo-200/70">
          <div className="rounded-[1.8rem] bg-white/95 p-4 backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 sm:text-sm">Amicis Leave System</p>
                <h1 className="bg-gradient-to-r from-indigo-700 to-fuchsia-600 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">Employee Leave Management</h1>
                <p className="mt-1 text-sm text-slate-600 sm:text-base">Apply, approve and track leave requests in real time.</p>
                <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${syncStatus === "Live sync active" ? "bg-emerald-50 text-emerald-700" : syncStatus.includes("error") || syncStatus.includes("failed") ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                  {syncStatus}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Logged in as</label>
                    <div className="mt-1 font-medium text-slate-900">{currentUser}</div>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Viewing employee</label>
                    <select
                      value={selectedEmployee}
                      onChange={(event) => {
                        setSelectedEmployee(event.target.value);
                        setError("");
                        setNotice("");
                      }}
                      className="mt-1 w-full bg-transparent text-base font-medium outline-none"
                    >
                      {reviewEmployees.map((employeeName) => (
                        <option key={employeeName} value={employeeName}>{employeeName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="button" onClick={handleLogout} className="min-h-12 touch-manipulation rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 active:scale-[0.98] hover:scale-[1.02]">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-4 text-white sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white/80">Mobile App Mode</p>
                <h2 className="text-xl font-black">Install Amicis Leave System</h2>
                <p className="mt-1 text-sm text-white/80">
                  {isInstalled
                    ? "You are already using the installed app version."
                    : isIOS
                      ? "On iPhone: tap Share, then Add to Home Screen."
                      : installPrompt
                        ? "Install this system as an app on your phone."
                        : "Open this link on mobile Chrome or Safari to install it as an app."}
                </p>
              </div>

              {installPrompt && !isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="min-h-12 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg active:scale-[0.98]"
                >
                  Install App
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3"><Icon name="user" className="h-5 w-5 text-indigo-600" /></div>
                <div>
                  <h2 className="text-lg font-bold text-indigo-900">Current Employee</h2>
                  <p className="mt-1 text-sm text-slate-600">{selectedEmployee}</p>
                  <p className="mt-1 text-sm text-slate-500">Supervisor: <span className="font-semibold text-slate-700">{supervisorName || "Not assigned"}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-fuchsia-50 p-3"><Icon name="team" className="h-5 w-5 text-fuchsia-600" /></div>
                <div>
                  <h2 className="text-lg font-bold text-fuchsia-900">Approval Access</h2>
                  <p className="mt-1 text-sm text-slate-600">{currentUser}</p>
                  <p className="mt-1 text-sm text-slate-500">Pending requests assigned to this user: <span className="font-semibold text-slate-700">{approvalQueue.length}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {(error || notice) && <div className={`rounded-2xl p-4 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{error || notice}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(LEAVE_TYPES).map(([leaveType, details]) => {
            const leaveTheme = leaveType === "Casual" ? "from-sky-500 to-cyan-500" : leaveType === "Annual" ? "from-violet-500 to-fuchsia-500" : "from-emerald-500 to-teal-500";
            const remaining = remainingBalance[leaveType] ?? details.allowance;
            const percentage = Math.max(0, Math.min(100, (remaining / details.allowance) * 100));
            return (
              <Card key={leaveType} className="overflow-hidden">
                <CardContent className={`bg-gradient-to-br ${leaveTheme} p-5 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/80">{leaveType} Leave</p>
                      <h2 className="mt-1 text-3xl font-bold">{remaining}</h2>
                      <p className="mt-1 text-sm text-white/80">Remaining of {details.allowance} days</p>
                    </div>
                    <Icon name="calendar" className="h-7 w-7 text-white/80" />
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/25"><div className="h-2 rounded-full bg-white" style={{ width: `${percentage}%` }} /></div>
                  <p className="mt-3 text-sm text-white/80">{details.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Icon name="plus" className="h-5 w-5" />
                <h2 className="text-xl font-bold text-indigo-900">Apply for Leave</h2>
              </div>

              {leaveApplicationEmployees.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">This account is not eligible to apply for leave.</div>
              ) : (
                <form onSubmit={submitRequest} className="space-y-4">
                  <div>
                    <FieldLabel>Employee</FieldLabel>
                    <select value={currentUser} disabled className={mobileInputClass("cursor-not-allowed bg-slate-50 text-slate-700")}>
                      {leaveApplicationEmployees.map((employeeName) => <option key={employeeName} value={employeeName}>{employeeName}</option>)}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">Approval will go to: {getSupervisorName(currentUser)}</p>
                  </div>

                  <div>
                    <FieldLabel>Leave Type</FieldLabel>
                    <select value={type} onChange={(event) => setType(event.target.value)} className={mobileInputClass()}>
                      {Object.keys(LEAVE_TYPES).map((leaveType) => <option key={leaveType} value={leaveType}>{leaveType}</option>)}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Start Date</FieldLabel>
                      <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={mobileInputClass()} />
                    </div>
                    <div>
                      <FieldLabel>End Date</FieldLabel>
                      <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={mobileInputClass()} />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-700">Working leave duration: <span className="font-bold">{days}</span> day(s)</div>

                  <div>
                    <FieldLabel>Reason</FieldLabel>
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} className={mobileInputClass("min-h-28 resize-none")} placeholder="Enter reason for leave" />
                  </div>

                  <PrimaryButton type="submit" className="w-full py-4 text-base">Submit Leave Request</PrimaryButton>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-indigo-900">Leave Requests</h2>
                  <p className="text-sm text-slate-500">Supervisors can view and approve their team leave requests.</p>
                </div>
                <span className="w-fit rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">{employeeRequests.length} record(s)</span>
              </div>

              <div className="space-y-3 md:hidden">
                {employeeRequests.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No leave requests yet.</div>
                ) : (
                  employeeRequests.map((request) => (
                    <LeaveRequestMobileCard key={request.id} request={request} currentUser={currentUser} onApprove={(id) => updateStatus(id, "Approved")} onReject={(id) => updateStatus(id, "Rejected")} onDelete={deleteRequest} />
                  ))
                )}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 md:block">
                <table className="w-full min-w-[940px] text-left text-sm">
                  <thead className="bg-gradient-to-r from-indigo-100 to-fuchsia-100 text-indigo-900">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Supervisor</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Days</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {employeeRequests.length === 0 ? (
                      <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">No leave requests yet.</td></tr>
                    ) : (
                      employeeRequests.map((request) => {
                        const canApprove = canApproveLeave(currentUser, request.employee);
                        const ownerIsLoggedIn = currentUser === request.employee;
                        return (
                          <tr key={request.id}>
                            <td className="px-4 py-3 font-medium">{request.employee}</td>
                            <td className="px-4 py-3 text-slate-600">{getSupervisorName(request.employee)}</td>
                            <td className="px-4 py-3 font-medium">{request.type}</td>
                            <td className="px-4 py-3 text-slate-600">{request.startDate} to {request.endDate}</td>
                            <td className="px-4 py-3">{request.days}</td>
                            <td className="px-4 py-3 text-slate-600">{request.reason}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(request.status)}`}><StatusIcon status={request.status} />{request.status}</span>
                              {request.approvedBy && <p className="mt-1 text-xs text-slate-400">By {request.approvedBy}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {request.status === "Pending" && canApprove && (
                                  <>
                                    <button type="button" onClick={() => updateStatus(request.id, "Approved")} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600">Approve</button>
                                    <button type="button" onClick={() => updateStatus(request.id, "Rejected")} className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-600">Reject</button>
                                  </>
                                )}
                                {request.status === "Pending" && !canApprove && <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">{ownerIsLoggedIn ? "Awaiting supervisor" : `Only ${getSupervisorName(request.employee)} can approve`}</span>}
                                <button type="button" onClick={() => deleteRequest(request.id)} className="rounded-xl bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-200">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Built-in Logic Tests</h2>
                <p className="text-sm text-slate-500">{allTestsPassed ? "All date, balance, hierarchy, login and mobile tests passed." : "Some tests failed. Check the list below."}</p>
              </div>
              <button type="button" onClick={() => setShowTests((current) => !current)} className="min-h-10 w-fit rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">{showTests ? "Hide Tests" : "Show Tests"}</button>
            </div>
            {showTests && (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {testResults.map((test) => (
                  <div key={test.name} className={`rounded-2xl border p-3 text-sm ${test.pass ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{test.pass ? "PASS" : "FAIL"}: {test.name}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

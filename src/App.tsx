import React, { useState, useEffect } from "react";
import {
  Target,
  Activity,
  PhoneCall,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Briefcase,
  Users,
  Save,
  Database,
  Calendar,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// --- Firebase Initialization (Dual Environment) ---
// This checks if the app is running in the preview environment or deployed externally (like Vercel).
let firebaseConfig;
if (typeof __firebase_config !== "undefined") {
  firebaseConfig = JSON.parse(__firebase_config);
} else {
  // Your private Firebase Config for external deployment (Vercel, CodeSandbox, etc.)
  firebaseConfig = {
    apiKey: "AIzaSyCSGA07jR_OyXEN7HFjqkThcm-t828D7HQ",
    authDomain: "edivy-cqm.firebaseapp.com",
    projectId: "edivy-cqm",
    storageBucket: "edivy-cqm.firebasestorage.app",
    messagingSenderId: "170943340642",
    appId: "1:170943340642:web:3939fee2f7f95cf531713b",
    measurementId: "G-0P6GGXSS3J",
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "edivy-cqm-app";

const EdivyCQM = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("pitch"); // 'pitch' or 'database'
  const [teamRecords, setTeamRecords] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [authError, setAuthError] = useState("");

  const [formData, setFormData] = useState({
    teamMemberName: "",
    companyName: "",
    contactName: "",
    contactNumber: "",
    gatekeeper: "",
    companySignal: "",
    workforceSize: "",
    industry: "",
  });

  const [result, setResult] = useState(null);
  const [checklist, setChecklist] = useState({
    q1: false,
    q2: false,
    q3: false,
  });

  // --- Authentication & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Must use custom token in the preview environment, fallback to anonymous for external deployments
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
        if (
          error.code === "auth/configuration-not-found" ||
          error.code === "auth/operation-not-allowed"
        ) {
          setAuthError(
            "Firebase Setup Required: Please go to your Firebase Console -> Authentication -> Sign-in method, and enable 'Anonymous'."
          );
        } else if (error.code === "auth/unauthorized-domain") {
          setAuthError(
            "Domain not authorized. Add your deployment URL to Firebase Auth -> Settings -> Authorized Domains."
          );
        } else {
          setAuthError(`Authentication Error: ${error.message}`);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch public team data
    const recordsRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "cqm_records"
    );

    const unsubscribe = onSnapshot(
      recordsRef,
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort in memory (newest first)
        records.sort((a, b) => new Date(b.dateSaved) - new Date(a.dateSaved));
        setTeamRecords(records);
      },
      (error) => {
        console.error("Error fetching records:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const signals = [
    {
      id: "rto",
      label: 'Mandating "Return to Office" (RTO)',
      stressScore: 85,
      angleName: "The Transition Angle",
      internalFocus: "Managing employee pushback and commuting stress.",
      pitch:
        "Returning to the office means parents can no longer micromanage homework at 4 PM. AutoLearn makes kids self-directed so your employees can commute home without anxiety.",
      hookTemplate:
        "I'm calling because your recent RTO mandate is going to cause a spike in evening parental stress, and Edivy has a zero-cost way to fix it for your team.",
    },
    {
      id: "hiring",
      label: "Rapid Scaling / Massive Hiring Spree",
      stressScore: 70,
      angleName: "The Performance Angle",
      internalFocus: "Onboarding fast and preventing early burnout.",
      pitch:
        "Rapid growth demands high focus. We neutralize 'Academic Presenteeism' so your new hires aren't distracted by their children's exam stress during Q3.",
      hookTemplate:
        "I noticed your massive hiring push. I'm calling because rapid growth usually spikes 'academic presenteeism' among parent-employees, and Edivy neutralizes that distraction completely.",
    },
    {
      id: "eap",
      label: 'Promoting EAP / "Great Place to Work" Awards',
      stressScore: 45,
      angleName: "The Innovation Angle",
      internalFocus: "Maintaining their employer brand and wellness metrics.",
      pitch:
        "You already offer great mental health perks. AutoLearn is the next-level wellness benefit—tackling the root cause of evening stress for the 50% of your workforce who are parents.",
      hookTemplate:
        "I saw you were named a Great Place to Work. I'm calling because Edivy provides the next-level wellness benefit that targets the hidden evening stress your parent-employees face.",
    },
    {
      id: "glassdoor",
      label: 'Poor Glassdoor Reviews mentioning "Work-Life Balance"',
      stressScore: 95,
      angleName: "The Relief Angle",
      internalFocus: "Stopping employee turnover and fixing morale.",
      pitch:
        "You can't always change company hours, but you can change what employees go home to. We turn their evening 'tutor shifts' back into family time.",
      hookTemplate:
        "I'm calling because I saw some recent feedback on work-life balance, and while you can't always change company hours, Edivy offers a zero-cost way to change what your employees go home to.",
    },
    {
      id: "diversity",
      label: "Pushing Women-in-Tech / Diversity Initiatives",
      stressScore: 75,
      angleName: "The Retention Angle",
      internalFocus:
        "Preventing working mothers from dropping out of the leadership pipeline.",
      pitch:
        "Diversity initiatives fail when working mothers burn out from the 'second shift' of tutoring. AutoLearn takes the academic burden off their plates so they can focus on their careers.",
      hookTemplate:
        "I saw your recent push for Women in Leadership. I'm calling because the #1 reason working mothers step back is evening burnout from kids' academics, and Edivy solves that completely.",
    },
    {
      id: "enrollment",
      label: "Approaching Q4 / Open Enrollment Period",
      stressScore: 60,
      angleName: "The Benefits Edge Angle",
      internalFocus:
        "Finding high-impact, low-cost perks to stand out in a tight labor market.",
      pitch:
        "Health insurance is table stakes. If you want to actually impact your employees' daily lives, you have to solve the problem they face at 6 PM every night at the kitchen table.",
      hookTemplate:
        "I know you're planning benefits for the upcoming cycle. I'm calling because Edivy is a zero-cost, high-impact perk that specifically targets the 50% of your workforce who are parents.",
    },
    {
      id: "restructure",
      label: 'Recent Restructuring / "Do More With Less" Mandate',
      stressScore: 88,
      angleName: "The Productivity Angle",
      internalFocus:
        "Preventing the remaining lean team from burning out and missing targets.",
      pitch:
        "When teams shrink, the remaining employees take on double the work. They literally cannot afford to be distracted by 'Academic Presenteeism' during the workday.",
      hookTemplate:
        "I'm calling because your recent restructuring means your remaining team has to do more with less, and Edivy ensures your parent-employees aren't distracted by their kids' academics during crucial hours.",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChecklist = (id) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generatePitch = () => {
    if (
      !formData.companySignal ||
      !formData.gatekeeper ||
      !formData.companyName
    ) {
      return;
    }

    const selectedSignal = signals.find((s) => s.id === formData.companySignal);

    let modifier = 0;
    if (formData.workforceSize === "enterprise") modifier = 10;
    if (formData.workforceSize === "large") modifier = 5;
    if (formData.workforceSize === "small") modifier = -5;

    const finalScore = Math.min(
      100,
      Math.max(0, selectedSignal.stressScore + modifier)
    );

    setResult({
      ...selectedSignal,
      finalScore,
      gatekeeper: formData.gatekeeper,
    });

    setChecklist({ q1: false, q2: false, q3: false });
    setSaveSuccess(false);
  };

  const saveToDatabase = async () => {
    if (!user) {
      alert("Authentication failed. Check your connection or refresh.");
      return;
    }
    setIsSaving(true);

    try {
      const selectedSignal = signals.find(
        (s) => s.id === formData.companySignal
      );

      const recordData = {
        teamMemberName: formData.teamMemberName || "Anonymous Rep",
        companyName: formData.companyName,
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        gatekeeper: formData.gatekeeper,
        signalLabel: selectedSignal.label,
        workforceSize: formData.workforceSize,
        industry: formData.industry,
        stressScore: result.finalScore,
        angleName: result.angleName,
        userId: user.uid,
      };

      if (editingId) {
        const docRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "cqm_records",
          editingId
        );
        await updateDoc(docRef, {
          ...recordData,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        const recordsRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "cqm_records"
        );
        await addDoc(recordsRef, {
          ...recordData,
          dateSaved: new Date().toISOString(),
        });
      }

      setSaveSuccess(true);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Error saving: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setSaveSuccess(false);
    setEditingId(null);
    setFormData((prev) => ({
      ...prev,
      companyName: "",
      contactName: "",
      contactNumber: "",
      gatekeeper: "",
      companySignal: "",
      workforceSize: "",
      industry: "",
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    return "text-yellow-500";
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleEdit = (record) => {
    const signalObj = signals.find((s) => s.label === record.signalLabel);

    setFormData({
      teamMemberName: record.teamMemberName || "",
      companyName: record.companyName || "",
      contactName: record.contactName || "",
      contactNumber: record.contactNumber || "",
      gatekeeper: record.gatekeeper || "",
      companySignal: signalObj ? signalObj.id : "",
      workforceSize: record.workforceSize || "",
      industry: record.industry || "",
    });

    if (signalObj) {
      setResult({
        ...signalObj,
        finalScore: record.stressScore,
        gatekeeper: record.gatekeeper,
        angleName: record.angleName,
      });
      setChecklist({ q1: true, q2: true, q3: true });
    }

    setEditingId(record.id);
    setSaveSuccess(false);
    setActiveTab("pitch");
  };

  const confirmDelete = async (id) => {
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "cqm_records", id)
      );
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Auth Error Banner */}
        {authError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm font-medium">{authError}</p>
          </div>
        )}

        {/* Header & Navigation */}
        <header className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Edivy C.Q.M. + CRM
                </h1>
              </div>
              <p className="text-slate-400 text-sm md:text-base max-w-xl">
                Corporate Qualification Matrix & Team Tracker. Locate signals,
                generate pitches, and track your accounts.
              </p>
            </div>
            <div className="mt-4 md:mt-0 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">
                {teamRecords.length} Target Accounts
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-6 bg-slate-800/50">
            <button
              onClick={() => setActiveTab("pitch")}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === "pitch"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" /> New Pitch Strategy
              </div>
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === "database"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" /> Team Database
              </div>
            </button>
          </div>
        </header>

        {activeTab === "pitch" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Input Form */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Step 1: Account Info & Signals
                </h2>

                <div className="space-y-4">
                  {/* Rep Info */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Your Name (Rep)
                    </label>
                    <input
                      type="text"
                      name="teamMemberName"
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.teamMemberName}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2"
                    />
                  </div>

                  {/* Company Info */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        placeholder="e.g. TechCorp India"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                          placeholder="+91..."
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Signals */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Target Gatekeeper Role *
                    </label>
                    <select
                      name="gatekeeper"
                      value={formData.gatekeeper}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                      <option value="">Select the decision maker...</option>
                      <option value="HR Director / CHRO">
                        HR Director / CHRO
                      </option>
                      <option value="VP of Total Rewards / Benefits">
                        VP of Total Rewards / Benefits
                      </option>
                      <option value="Head of Employee Wellness">
                        Head of Employee Wellness
                      </option>
                      <option value="Diversity & Inclusion Lead">
                        Diversity & Inclusion Lead
                      </option>
                      <option value="Women's ERG Leader">
                        Women's ERG Leader
                      </option>
                      <option value="HR Business Partner">
                        HR Business Partner
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Primary Company Signal *
                    </label>
                    <select
                      name="companySignal"
                      value={formData.companySignal}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                      <option value="">Select the primary signal...</option>
                      {signals.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Company Size
                      </label>
                      <select
                        name="workforceSize"
                        value={formData.workforceSize}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      >
                        <option value="">Optional...</option>
                        <option value="startup">Under 50 (Startup)</option>
                        <option value="small">50 - 200 (Growth)</option>
                        <option value="medium">201 - 1000 (Mid-Market)</option>
                        <option value="large">1000 - 5000 (Large)</option>
                        <option value="enterprise">5000+ (Enterprise)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Location Hub
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      >
                        <option value="">Optional...</option>
                        <option value="hitec">HITEC City</option>
                        <option value="financial">
                          Financial District / Gachibowli
                        </option>
                        <option value="mindspace">Mindspace IT Park</option>
                        <option value="genome">Genome Valley</option>
                        <option value="hybrid">Remote / Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={generatePitch}
                    disabled={
                      !formData.companySignal ||
                      !formData.gatekeeper ||
                      !formData.companyName
                    }
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Analyze & Generate Pitch{" "}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Results Dashboard */}
            <div className="lg:col-span-7">
              {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Score Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10"></div>

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          Targeting Matrix Active
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                          Pitch channeling customized for {formData.companyName}
                        </p>
                      </div>
                      <button
                        onClick={resetForm}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        title="Reset Form"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                      <div className="relative flex items-center justify-center w-24 h-24">
                        <svg
                          className="w-full h-full transform -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            className="text-slate-200"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`${getScoreColor(
                              result.finalScore
                            )} transition-all duration-1000 ease-out`}
                            strokeDasharray={`${result.finalScore}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-800">
                            {result.finalScore}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">
                          Corporate Stress Score
                        </p>
                        <h3
                          className={`text-lg font-bold ${getScoreColor(
                            result.finalScore
                          )}`}
                        >
                          {result.finalScore >= 80
                            ? "Critical Intervention Needed"
                            : result.finalScore >= 60
                            ? "High Agitation Detected"
                            : "Opportunity Window Open"}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          HR is actively stressed about:{" "}
                          <strong>{result.internalFocus}</strong>
                        </p>
                      </div>
                    </div>

                    {/* The Angle */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-800 text-lg">
                          {result.angleName}
                        </h3>
                      </div>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <p className="text-blue-900 font-medium leading-relaxed italic">
                          "{result.pitch}"
                        </p>
                      </div>
                    </div>

                    {/* The Hook */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PhoneCall className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-slate-800 text-lg">
                          Your 10-Second Hook
                        </h3>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                        <p className="text-emerald-900 font-semibold text-lg leading-relaxed">
                          "{result.hookTemplate}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Call Checklist & Save Option */}
                  <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-blue-400" />
                        3-Point Pre-Call Checklist
                      </h3>

                      {/* Save to CRM Button */}
                      {checklist.q1 && checklist.q2 && checklist.q3 && (
                        <button
                          onClick={saveToDatabase}
                          disabled={isSaving || saveSuccess}
                          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                            saveSuccess
                              ? "bg-emerald-500 text-white"
                              : "bg-blue-600 hover:bg-blue-500 text-white"
                          }`}
                        >
                          <Save className="w-4 h-4" />
                          {isSaving
                            ? "Saving..."
                            : saveSuccess
                            ? editingId
                              ? "Updated!"
                              : "Saved to CRM!"
                            : editingId
                            ? "Update Record"
                            : "Log to Database"}
                        </button>
                      )}
                    </div>

                    <p className="text-slate-400 text-sm mb-6">
                      Check these off. If you can't check all three, you aren't
                      ready to pitch. Once checked, log this target into the
                      team CRM.
                    </p>

                    <div className="space-y-3">
                      <label
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checklist.q1
                            ? "bg-slate-800 border-blue-500"
                            : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checklist.q1}
                          onChange={() => handleChecklist("q1")}
                          className="mt-1 w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
                        />
                        <span
                          className={`text-sm ${
                            checklist.q1 ? "text-white" : "text-slate-300"
                          }`}
                        >
                          <strong>Who is the specific Gatekeeper?</strong>{" "}
                          <br />
                          <span className="text-slate-400">
                            I am specifically targeting the {result.gatekeeper}{" "}
                            at {formData.companyName}.
                          </span>
                        </span>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checklist.q2
                            ? "bg-slate-800 border-blue-500"
                            : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checklist.q2}
                          onChange={() => handleChecklist("q2")}
                          className="mt-1 w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
                        />
                        <span
                          className={`text-sm ${
                            checklist.q2 ? "text-white" : "text-slate-300"
                          }`}
                        >
                          <strong>What is the Company Signal?</strong> <br />
                          <span className="text-slate-400">
                            I have verified their situation: {result.label}.
                          </span>
                        </span>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checklist.q3
                            ? "bg-slate-800 border-blue-500"
                            : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checklist.q3}
                          onChange={() => handleChecklist("q3")}
                          className="mt-1 w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
                        />
                        <span
                          className={`text-sm ${
                            checklist.q3 ? "text-white" : "text-slate-300"
                          }`}
                        >
                          <strong>What is my 10-Second Hook?</strong> <br />
                          <span className="text-slate-400">
                            I have my opening line customized and ready to
                            deliver confidently.
                          </span>
                        </span>
                      </label>
                    </div>

                    {checklist.q1 &&
                      checklist.q2 &&
                      checklist.q3 &&
                      !saveSuccess && (
                        <div className="mt-6 bg-emerald-500/20 border border-emerald-500 text-emerald-300 p-3 rounded-lg flex items-center justify-center gap-2 font-bold animate-pulse">
                          <PhoneCall className="w-5 h-5" /> You are cleared to
                          make the call. Don't forget to Log it!
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] bg-slate-200/50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                  <Target className="w-16 h-16 text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-500 mb-2">
                    Awaiting Account Data
                  </h3>
                  <p className="text-slate-400 max-w-md">
                    Fill out the parameters on the left based on your prospect
                    research. Once completed, your customized targeting matrix
                    and CRM log option will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DATABASE TAB */}
        {activeTab === "database" && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Team Target History
                </h2>
                <p className="text-sm text-slate-500">
                  All saved prospects and the strategic angle used by the team.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Company & Contact</th>
                    <th className="px-6 py-4">Target Role</th>
                    <th className="px-6 py-4">Signal Identified</th>
                    <th className="px-6 py-4">Strategic Angle</th>
                    <th className="px-6 py-4">Rep</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        <Database className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        No records saved yet. Start researching and log your
                        first target!
                      </td>
                    </tr>
                  ) : (
                    teamRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="bg-white border-b hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-4 h-4" />{" "}
                            {formatDate(record.dateSaved)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">
                            {record.companyName}
                          </div>
                          {record.contactName && (
                            <div className="text-xs text-slate-500">
                              {record.contactName}
                            </div>
                          )}
                          {record.contactNumber && (
                            <div className="text-xs text-slate-400">
                              {record.contactNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {record.gatekeeper}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold border border-slate-200">
                            {record.signalLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-blue-600 font-semibold">
                            {record.angleName}
                          </span>
                          <div className="text-xs font-bold text-slate-400 mt-1">
                            Score: {record.stressScore}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {record.teamMemberName}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {deletingId === record.id ? (
                            <div className="flex items-center justify-end gap-2 animate-in fade-in">
                              <span className="text-xs text-red-500 font-bold mr-1">
                                Sure?
                              </span>
                              <button
                                onClick={() => confirmDelete(record.id)}
                                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Record"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingId(record.id)}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EdivyCQM;

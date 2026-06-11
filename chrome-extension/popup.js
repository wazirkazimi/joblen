// JobLens Chrome Extension - popup.js

const SUPABASE_URL = "https://soyrrlmvypbreobhwtez.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveXJsbXZ5cGJyZW9ib2h3dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDc0MDQsImV4cCI6MjA5MzgyMzQwNH0.g_MYRi7eNywGv1x5AtULNV-brTweIrYiGDvq54d0PLw";

// DOM Elements
const syncStatus = document.getElementById("sync-status");
const viewSync = document.getElementById("view-sync");
const viewReady = document.getElementById("view-ready");
const viewLoading = document.getElementById("view-loading");
const viewResults = document.getElementById("view-results");

const btnOpenWeb = document.getElementById("btn-open-web");
const btnResync = document.getElementById("btn-resync");
const btnAnalyze = document.getElementById("btn-analyze");
const btnBack = document.getElementById("btn-back");
const btnCopyDraft = document.getElementById("btn-copy-draft");

const userDisplayName = document.getElementById("user-display-name");
const userDisplayDetails = document.getElementById("user-display-details");
const jobRole = document.getElementById("job-role");
const jobCompany = document.getElementById("job-company");
const manualJd = document.getElementById("manual-jd");
const apiUrlInput = document.getElementById("api-url");
const loaderTitle = document.getElementById("loader-title");

// Result Elements
const resultScore = document.getElementById("result-score");
const scoreGaugeFill = document.getElementById("score-gauge-fill");
const resultProbability = document.getElementById("result-probability");
const resultCompName = document.getElementById("result-comp-name");
const resultSummary = document.getElementById("result-summary");
const listPros = document.getElementById("list-pros");
const listFlags = document.getElementById("list-flags");
const draftText = document.getElementById("draft-text");

// Cache variables
let cachedProfile = null;
let currentScrapedJd = "";
let currentAnalysisResult = null;
let activeTabDraft = "draft-email";

// Init popup
document.addEventListener("DOMContentLoaded", async () => {
  // Load cached profile
  chrome.storage.local.get(["userProfile", "apiUrl"], (result) => {
    if (result.userProfile) {
      cachedProfile = result.userProfile;
      updateSyncStatus(true);
      showView(viewReady);
      updateProfileDisplay(cachedProfile);
    } else {
      updateSyncStatus(false);
      showView(viewSync);
    }
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
  });

  // Attempt to auto-sync if active tab is JobLens web app
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && (activeTab.url.includes("localhost") || activeTab.url.includes("joblen.vercel.app"))) {
      trySyncFromTab(activeTab);
    }
    
    // Auto-scrape active tab if profile is ready
    if (cachedProfile && activeTab) {
      scrapeJobFromTab(activeTab);
    }
  });

  // Event Listeners
  btnOpenWeb.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://joblen.vercel.app/dashboard" });
  });

  btnResync.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        trySyncFromTab(activeTab, true);
      } else {
        alert("Please navigate to your logged-in JobLens page to sync profile.");
      }
    });
  });

  btnAnalyze.addEventListener("click", handleAnalyze);
  btnBack.addEventListener("click", () => {
    showView(viewReady);
  });

  btnCopyDraft.addEventListener("click", () => {
    navigator.clipboard.writeText(draftText.innerText);
    btnCopyDraft.innerText = "Copied! ✓";
    setTimeout(() => {
      btnCopyDraft.innerText = "Copy Draft";
    }, 1500);
  });

  // Results Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      
      e.target.classList.add("active");
      const target = e.target.getAttribute("data-target");
      document.getElementById(target).classList.add("active");
    });
  });

  // Draft Toggle Buttons
  document.querySelectorAll(".draft-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".draft-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      activeTabDraft = e.target.getAttribute("data-draft");
      renderActiveDraft();
    });
  });
});

// Helper: Show/Hide Views
function showView(targetView) {
  [viewSync, viewReady, viewLoading, viewResults].forEach(v => {
    v.classList.add("hidden");
  });
  targetView.classList.remove("hidden");
}

// Update Sync indicator
function updateSyncStatus(connected) {
  const dot = syncStatus.querySelector(".status-dot");
  const txt = syncStatus.querySelector(".status-text");
  if (connected) {
    dot.className = "status-dot green";
    txt.innerText = "Connected";
  } else {
    dot.className = "status-dot red";
    txt.innerText = "Disconnected";
  }
}

// Update profile cards
function updateProfileDisplay(profile) {
  const name = profile.profile?.name || "Student Account";
  const city = profile.profile?.city || "";
  const edu = profile.profile?.education || "";
  userDisplayName.innerText = name;
  userDisplayDetails.innerText = [edu, city].filter(Boolean).join(" · ");
}

// Scrape job description
function scrapeJobFromTab(tab) {
  chrome.tabs.sendMessage(tab.id, { action: "GET_JOB_DESCRIPTION" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      console.warn("Failed to scrape, content script not active or load delay.");
      return;
    }
    
    jobRole.innerText = response.role || "Job Posting";
    jobCompany.innerText = response.company || "Job Board Post";
    manualJd.value = response.text || "";
    currentScrapedJd = response.text || "";
  });
}

// Attempt profile sync
async function trySyncFromTab(tab, manualClick = false) {
  chrome.tabs.sendMessage(tab.id, { action: "GET_JOBLENS_SESSION" }, async (response) => {
    if (chrome.runtime.lastError || !response || !response.success) {
      if (manualClick) {
        alert("Failed to find session on current tab. Make sure you are logged in to the JobLens web app.");
      }
      return;
    }

    const { session } = response;
    const accessToken = session?.access_token;
    const userId = session?.user?.id;

    if (!accessToken || !userId) return;

    try {
      // Direct REST API fetch to Supabase using access token
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      
      if (data && data[0]) {
        cachedProfile = data[0].profile_data;
        chrome.storage.local.set({ userProfile: cachedProfile });
        updateSyncStatus(true);
        updateProfileDisplay(cachedProfile);
        
        if (manualClick) {
          alert("Profile Synced Successfully!");
          showView(viewReady);
          scrapeJobFromTab(tab);
        }
      }
    } catch (err) {
      console.error("Fetch profile failed:", err);
      if (manualClick) alert("Failed to fetch profile: " + err.message);
    }
  });
}

// Analyze button handler
async function handleAnalyze() {
  const jdText = manualJd.value.trim();
  if (!jdText) {
    alert("Please enter or scrape a Job Description first.");
    return;
  }

  const serverUrl = apiUrlInput.value.trim() || "http://localhost:5000";
  chrome.storage.local.set({ apiUrl: serverUrl });

  loaderTitle.innerText = "Analyzing Job Post...";
  showView(viewLoading);

  try {
    const res = await fetch(`${serverUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobDescription: jdText,
        userProfile: cachedProfile
      })
    });
    
    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || "Failed to analyze");
    }

    const result = await res.json();
    currentAnalysisResult = result;
    renderAnalysisResults(result);
    showView(viewResults);
  } catch (err) {
    console.error("Analysis failed:", err);
    alert("Analysis Failed: " + err.message + "\nMake sure your JobLens backend server is running on " + serverUrl);
    showView(viewReady);
  }
}

// Render Results View
function renderAnalysisResults(res) {
  // Score
  const score = res.fitScore || 0;
  resultScore.innerText = score;
  
  // Radial Gauge fill calculation
  const gaugePercent = (score / 10) * 100;
  scoreGaugeFill.setAttribute("stroke-dasharray", `${gaugePercent}, 100`);
  
  // Verdict Badge
  const prob = res.probability || "Medium";
  resultProbability.innerText = `${prob} Fit`;
  resultProbability.className = `badge ${prob.toLowerCase()}`;
  
  // Details
  resultCompName.innerText = res.company || "Job Profile";
  document.querySelector(".result-verdict").querySelector("div").innerText = res.role || "Job Target";
  resultSummary.innerText = res.fitReason || "";

  // Pros List
  listPros.innerHTML = "";
  (res.pros || []).forEach(p => {
    const li = document.createElement("li");
    li.innerText = p;
    listPros.appendChild(li);
  });
  if ((res.pros || []).length === 0) {
    listPros.innerHTML = "<li>No specific strengths highlighted</li>";
  }

  // Flags List
  listFlags.innerHTML = "";
  (res.flags || []).forEach(f => {
    const li = document.createElement("li");
    li.innerText = f;
    listFlags.appendChild(li);
  });
  if ((res.flags || []).length === 0) {
    listFlags.innerHTML = "<li>No major concern flags</li>";
  }

  // Preference Check Lists
  renderPreferenceItem("pref-salary", res.preferenceCheck?.salary);
  renderPreferenceItem("pref-location", res.preferenceCheck?.location);
  renderPreferenceItem("pref-culture", res.preferenceCheck?.culture);

  // Skills Gaps
  renderSkillsChips("skills-strong", res.skillsGapAnalysis?.strongMatches, "green");
  renderSkillsChips("skills-missing", res.skillsGapAnalysis?.missingSkills, "red");
  renderSkillsChips("skills-bonus", res.skillsGapAnalysis?.bonusSkills, "purple");

  // Drafts
  renderActiveDraft();
}

function renderPreferenceItem(elementId, data) {
  const el = document.getElementById(elementId);
  if (!el || !data) return;

  const label = el.querySelector(".pref-label");
  const val = el.querySelector(".pref-val");
  const icon = el.querySelector(".pref-icon");

  if (elementId === "pref-salary") {
    val.innerText = `${data.jdOffers} vs Min ${data.candidateExpects}`;
  } else if (elementId === "pref-location") {
    val.innerText = `${data.jdLocation}`;
  } else if (elementId === "pref-culture") {
    val.innerText = data.redFlag ? "Clashes with Hard No's" : "Fits Hard No's";
  }

  const isMatch = data.match === "Yes" || data.redFlag === false;
  const isMismatch = data.match === "No" || data.redFlag === true;

  if (isMatch) {
    el.className = "pref-item match";
    icon.innerText = "✓";
  } else if (isMismatch) {
    el.className = "pref-item mismatch";
    icon.innerText = "✗";
  } else {
    el.className = "pref-item unclear";
    icon.innerText = "?";
  }
}

function renderSkillsChips(containerId, list, colorClass) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
  
  (list || []).forEach(skill => {
    const span = document.createElement("span");
    span.className = `chip ${colorClass}`;
    span.innerText = skill;
    el.appendChild(span);
  });

  if ((list || []).length === 0) {
    el.innerHTML = `<span style="font-size:0.75rem; color:var(--text-secondary);">None</span>`;
  }
}

function renderActiveDraft() {
  if (!currentAnalysisResult) return;
  
  if (activeTabDraft === "draft-email") {
    draftText.innerText = currentAnalysisResult.emailDraft || "No draft generated.";
  } else {
    draftText.innerText = currentAnalysisResult.dmDraft || "No draft generated.";
  }
}

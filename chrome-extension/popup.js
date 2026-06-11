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
const btnUploadResume = document.getElementById("btn-upload-resume");
const inputResumeFile = document.getElementById("input-resume-file");
const btnUseDefault = document.getElementById("btn-use-default");

const btnResync = document.getElementById("btn-resync");
const btnDisconnect = document.getElementById("btn-disconnect");
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
  chrome.storage.local.get(["userProfile", "apiUrl", "disconnected"], (result) => {
    if (result.userProfile) {
      cachedProfile = result.userProfile;
      updateSyncStatus(true);
      showView(viewReady);
      updateProfileDisplay(cachedProfile);
    } else {
      updateSyncStatus(false);
      showView(viewSync);

      // Attempt to scan ALL tabs to auto-sync from any background JobLens website tab if not explicitly disconnected
      if (!result.disconnected) {
        chrome.tabs.query({}, (allTabs) => {
          const joblensTab = allTabs.find(isJobLensTab);
          if (joblensTab) {
            trySyncFromTab(joblensTab);
          }
        });
      }
    }
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
  });

  // Auto-scrape active tab if profile is ready
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab) {
      chrome.storage.local.get("userProfile", (result) => {
        if (result.userProfile) {
          scrapeJobFromTab(activeTab);
        }
      });
    }
  });

  // Event Listeners
  btnOpenWeb.addEventListener("click", () => {
    chrome.storage.local.set({ disconnected: false }, () => {
      chrome.tabs.query({}, (allTabs) => {
        const joblensTab = allTabs.find(isJobLensTab);
        if (joblensTab) {
          trySyncFromTab(joblensTab, true);
        } else {
          chrome.tabs.create({ url: "https://joblen.vercel.app/dashboard" });
        }
      });
    });
  });

  // Direct Resume PDF upload handler
  btnUploadResume.addEventListener("click", () => {
    inputResumeFile.click();
  });

  inputResumeFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const serverUrl = apiUrlInput.value.trim() || "http://localhost:5000";
    chrome.storage.local.set({ apiUrl: serverUrl, disconnected: false });

    loaderTitle.innerText = "Parsing Resume PDF...";
    showView(viewLoading);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch(`${serverUrl}/api/parse-resume`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to parse resume PDF. Is the server running?");
      }

      const parsedData = await res.json();
      
      // Map parsed fields into unified userProfile schema
      const profile = {
        profile: {
          name: parsedData.profile?.name || "Uploaded Resume",
          city: parsedData.profile?.city || "Remote",
          education: parsedData.profile?.education || "Degree",
          gradYear: parsedData.profile?.gradYear || "2026",
          employed: "No - actively looking"
        },
        experiences: parsedData.experiences || [],
        selectedSkills: (parsedData.skills || "").split(",").map(s => s.trim()).filter(Boolean),
        selectedTools: (parsedData.tools || "").split(",").map(t => t.trim()).filter(Boolean),
        selectedAiTools: [],
        links: {
          resumeText: parsedData.rawText || ""
        }
      };

      cachedProfile = profile;
      chrome.storage.local.set({ userProfile: cachedProfile });
      updateSyncStatus(true);
      updateProfileDisplay(cachedProfile);
      showView(viewReady);

      // Trigger scraping on current page
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        if (activeTabs[0]) {
          scrapeJobFromTab(activeTabs[0]);
        }
      });

    } catch (err) {
      console.error("Resume upload parsing failed:", err);
      alert("Resume Parsing Failed: " + err.message + "\nMake sure your JobLens backend server is running on " + serverUrl);
      showView(viewSync);
    }
  });

  // Demo Profile click handler
  btnUseDefault.addEventListener("click", () => {
    const demoProfile = {
      profile: {
        name: "Demo Candidate",
        city: "Bangalore, India",
        education: "B.Tech, Computer Science, IIT Bombay",
        gradYear: "2026",
        employed: "No - actively looking"
      },
      goals: ["Finding internships / first job", "Switching roles"],
      experiences: [
        {
          company: "Coding Club, IIT Bombay",
          role: "Lead Frontend Developer",
          duration: "Jul 2024 - Present",
          metric: "Built open source portfolio tool used by 400+ students, increasing registration by 35%",
          types: ["Tech/Dev", "Product"]
        }
      ],
      selectedSkills: ["JavaScript", "TypeScript", "React", "Next.js", "HTML/CSS", "Git", "Node.js", "SQL"],
      selectedTools: ["VS Code", "GitHub", "Vercel", "Slack", "Figma"],
      selectedAiTools: ["ChatGPT", "Claude", "Cursor AI"],
      targetRoles: ["Frontend Engineer", "Full Stack Engineer"],
      preferences: {
        workTypes: ["Full-time", "Internship", "Remote"],
        locations: ["Bangalore, India", "Remote - India"],
        stipend: "₹25,000/mo or ₹8 LPA",
        availability: "Immediately",
        hardNos: "Unpaid roles, micromanaging environment"
      },
      personalitySignal: "I built a customized portfolio generator that helped 400+ peers showcase their coding metrics."
    };

    cachedProfile = demoProfile;
    chrome.storage.local.set({ userProfile: cachedProfile, disconnected: false });
    updateSyncStatus(true);
    updateProfileDisplay(cachedProfile);
    showView(viewReady);

    // Trigger scraping on current page
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (activeTabs[0]) {
        scrapeJobFromTab(activeTabs[0]);
      }
    });
  });

  btnResync.addEventListener("click", () => {
    chrome.tabs.query({}, (allTabs) => {
      const joblensTab = allTabs.find(isJobLensTab);
      if (joblensTab) {
        trySyncFromTab(joblensTab, true);
      } else {
        alert("Please navigate to your logged-in JobLens page to sync profile.");
      }
    });
  });

  btnDisconnect.addEventListener("click", () => {
    chrome.storage.local.set({ disconnected: true }, () => {
      chrome.storage.local.remove("userProfile", () => {
        cachedProfile = null;
        updateSyncStatus(false);
        showView(viewSync);
      });
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

// Check if a tab is a JobLens tab
function isJobLensTab(tab) {
  if (!tab || !tab.url) return false;
  const url = tab.url.toLowerCase();
  return url.includes("localhost") || 
         url.includes("127.0.0.1") || 
         url.includes("joblen.vercel.app") || 
         url.includes("joblens");
}

// Send message to tab, automatically injecting content.js if connection fails
function sendMessageWithRetry(tab, message, callback) {
  chrome.tabs.sendMessage(tab.id, message, (response) => {
    if (chrome.runtime.lastError) {
      console.log("Connection failed, attempting to inject content.js:", chrome.runtime.lastError.message);
      
      // Inject content.js programmatically
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to inject content.js:", chrome.runtime.lastError.message);
          callback(null);
          return;
        }
        
        // Wait 100ms and try sending the message again
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, message, (retryResponse) => {
            if (chrome.runtime.lastError) {
              callback(null);
            } else {
              callback(retryResponse);
            }
          });
        }, 100);
      });
    } else {
      callback(response);
    }
  });
}

// Scrape job description
function scrapeJobFromTab(tab) {
  sendMessageWithRetry(tab, { action: "GET_JOB_DESCRIPTION" }, (response) => {
    if (!response) {
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
  sendMessageWithRetry(tab, { action: "GET_JOBLENS_SESSION" }, async (response) => {
    if (!response || !response.success) {
      if (manualClick) {
        alert("Failed to find active login session on the JobLens tab. Navigating tab to dashboard/login...");
        let targetUrl = "https://joblen.vercel.app/dashboard";
        try {
          const tabUrlObj = new URL(tab.url);
          targetUrl = `${tabUrlObj.origin}/dashboard`;
        } catch (e) {
          console.error(e);
        }
        chrome.tabs.update(tab.id, { url: targetUrl, active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }
      return;
    }

    const { session } = response;
    const accessToken = session?.access_token;
    const userId = session?.user?.id;

    if (!accessToken || !userId) {
      if (manualClick) {
        alert("No login session found on the JobLens tab. Navigating tab to dashboard/login...");
        let targetUrl = "https://joblen.vercel.app/dashboard";
        try {
          const tabUrlObj = new URL(tab.url);
          targetUrl = `${tabUrlObj.origin}/dashboard`;
        } catch (e) {
          console.error(e);
        }
        chrome.tabs.update(tab.id, { url: targetUrl, active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }
      return;
    }

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
        
        // Transition to ready view if we are on viewSync
        const isSyncViewVisible = viewSync.style.display !== "none" && !viewSync.classList.contains("hidden");
        if (manualClick || isSyncViewVisible) {
          showView(viewReady);
          scrapeJobFromTab(tab);
        }
        
        if (manualClick) {
          alert("Profile Synced Successfully!");
        }
      } else {
        throw new Error("No profile data found in database.");
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

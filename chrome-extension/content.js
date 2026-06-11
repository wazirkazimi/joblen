// Content script for JobLens Chrome Extension
console.log("JobLens Content Script Active");

// Listen for messages from popup
if (!window.__joblensContentScriptInjected) {
  window.__joblensContentScriptInjected = true;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_JOB_DESCRIPTION") {
      const scrapedData = getJobDetails();
      sendResponse(scrapedData);
    } else if (request.action === "GET_JOBLENS_SESSION") {
      // If the user is on the JobLens site, read the supabase auth token from localStorage
      const sessionKey = Object.keys(localStorage).find(key => key.startsWith("sb-") && key.endsWith("-auth-token"));
      if (sessionKey) {
        try {
          const sessionData = JSON.parse(localStorage.getItem(sessionKey));
          sendResponse({ success: true, session: sessionData });
        } catch (err) {
          sendResponse({ success: false, error: "Failed to parse session" });
        }
      } else {
        sendResponse({ success: false, error: "Not on JobLens or not logged in" });
      }
    }
    return true; // Keep message channel open for async response
  });
}

// Helper to scrape job posting text
function getJobDetails() {
  // 1. If user has highlighted text on the page, prioritize that selection
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 50) {
    return {
      text: selectedText,
      source: "User Selection",
      role: document.title.split("|")[0].trim() || "Selected Job",
      company: "Unknown Company"
    };
  }

  // 2. Selectors for major job boards
  const url = window.location.href.toLowerCase();
  let text = "";
  let role = "";
  let company = "";

  if (url.includes("linkedin.com/jobs")) {
    // LinkedIn Job Post
    const descElement = document.querySelector(".jobs-description__container") || 
                        document.querySelector(".jobs-box__html-content") ||
                        document.querySelector("#job-details");
    text = descElement ? descElement.innerText.trim() : "";
    role = document.querySelector(".job-details-jobs-unified-top-card__job-title")?.innerText.trim() || 
           document.querySelector(".jobs-details-top-card__job-title")?.innerText.trim() || "";
    company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.innerText.trim() ||
              document.querySelector(".jobs-details-top-card__company-url")?.innerText.trim() || "";
  } else if (url.includes("internshala.com")) {
    // Internshala
    const descElement = document.querySelector(".text-container") || 
                        document.querySelector(".job-description") ||
                        document.querySelector(".internship_meta");
    text = descElement ? descElement.innerText.trim() : "";
    role = document.querySelector(".profile_heading")?.innerText.trim() || "";
    company = document.querySelector(".company_and_premium")?.innerText.trim() || "";
  } else if (url.includes("indeed.com")) {
    // Indeed
    const descElement = document.querySelector("#jobDescriptionText");
    text = descElement ? descElement.innerText.trim() : "";
    role = document.querySelector(".jobsearch-JobInfoHeader-title")?.innerText.trim() || "";
    company = document.querySelector(".jobsearch-CompanyInfoWithoutHeaderImage")?.innerText.trim() || "";
  } else if (url.includes("naukri.com")) {
    // Naukri
    const descElement = document.querySelector(".job-desc") || 
                        document.querySelector(".jd-desc") ||
                        document.querySelector("#jobDescription");
    text = descElement ? descElement.innerText.trim() : "";
    role = document.querySelector(".jd-header-title")?.innerText.trim() || "";
    company = document.querySelector(".jd-header-comp-name")?.innerText.trim() || "";
  }

  // Fallback: If no job board matched, grab text from main container
  if (!text) {
    const mainContent = document.querySelector("main") || document.querySelector("article") || document.body;
    // Strip script and style tags
    const clone = mainContent.cloneNode(true);
    clone.querySelectorAll("script, style, nav, footer, header").forEach(el => el.remove());
    text = clone.innerText.trim();
  }

  // Final sanitization: clean redundant whitespace
  text = text.replace(/\s+/g, " ");

  return {
    text: text.slice(0, 10000), // Cap description at 10k characters
    source: "Auto Scraped",
    role: role || document.title || "Job Posting",
    company: company || "Job Company"
  };
}

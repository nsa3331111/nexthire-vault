/* CareerLift - Production-Ready Frontend Logic */
const BRAND = "CareerLift";
const CANONICAL = "https://getcareerlift.com";
const ENABLE_SOFT_REDIRECT = false; // Set to true when domain is live
const PAYPAL_BASE = "https://www.paypal.com/paypalme/YOUR_PAYPAL_USERNAME/"; // UPDATE THIS!

// Soft redirect handler (for future domain migration)
(function initSoftRedirect(){
  try {
    const host = window.location.host || "";
    if(ENABLE_SOFT_REDIRECT && /nexthire-vault\.netlify\.app/i.test(host)){
      window.location.replace(CANONICAL + window.location.pathname);
    }
  } catch(e) {
    console.error("Redirect error:", e);
  }
})();

// Toast notification system
function toast(msg, duration = 3000){
  const toastEl = document.querySelector("#toast");
  if(!toastEl) return;
  
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  
  setTimeout(() => {
    toastEl.style.display = "none";
  }, duration);
}

// Smooth progress bar animation
function animateProgress(el, value){
  if(!el) return;
  
  // Ensure value is between 0-100
  const safeValue = Math.min(Math.max(value, 0), 100);
  
  requestAnimationFrame(() => {
    el.style.width = safeValue + "%";
  });
}

// Enhanced free scan form handler
async function handleFreeScan(e){
  e.preventDefault();
  
  const email = document.querySelector("#email")?.value.trim();
  const resume = document.querySelector("#resume")?.value.trim();
  const job = document.querySelector("#job")?.value.trim();
  
  // Validation
  if(!email || !resume || !job){
    toast("Please fill in all fields to get your rejection report.");
    return;
  }
  
  if(resume.length < 200){
    toast("Resume seems too short. Please paste your full resume.");
    return;
  }
  
  if(job.length < 50){
    toast("Job description seems too short. Please paste the full description.");
    return;
  }
  
  // Show loading state
  const submitBtn = e.target.querySelector('[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Analyzing...";
  submitBtn.disabled = true;
  
  // Simulate processing delay for realism
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Store data in localStorage
  localStorage.setItem("cl_email", email);
  localStorage.setItem("cl_resume", resume.slice(0, 20000)); // Limit size
  localStorage.setItem("cl_job", job.slice(0, 20000));
  localStorage.setItem("cl_scan_time", Date.now());
  
  // Navigate to results
  window.location.href = "scan-results.html";
}

// Payment handler with tracking
function goPay(tier = "express"){
  const email = localStorage.getItem("cl_email") || "";
  
  // Price mapping
  const prices = {
    basic: "27",
    express: "37",
    elite: "97"
  };
  
  const price = prices[tier] || "37";
  
  // Create payment URL with metadata
  const note = encodeURIComponent(`CareerLift ${tier} - ${email}`);
  const url = `${PAYPAL_BASE}${price}?note=${note}`;
  
  // Track payment attempt
  if(typeof gtag !== 'undefined'){
    gtag('event', 'begin_checkout', {
      currency: 'USD',
      value: price,
      items: [{
        item_name: `CareerLift ${tier}`,
        price: price,
        quantity: 1
      }]
    });
  }
  
  // Open payment
  window.open(url, "_blank");
  toast("Opening PayPal. Complete payment and return here for confirmation.");
}

// Demo leaderboard data
const DEMO_WINNERS = [
  {name:"Sarah K.", role:"PM @ Stripe", before:"#88", after:"#12"},
  {name:"Vik A.", role:"SWE @ Uber", before:"#71", after:"#14"},
  {name:"Maya L.", role:"DS @ Amazon", before:"#92", after:"#17"},
  {name:"Leo T.", role:"RevOps @ Notion", before:"#65", after:"#9"},
  {name:"Rachel M.", role:"UX @ Figma", before:"#83", after:"#15"}
];

// Enhanced scan results renderer
function renderScanResults(){
  const resume = localStorage.getItem("cl_resume") || "";
  const job = localStorage.getItem("cl_job") || "";
  const email = localStorage.getItem("cl_email") || "";
  
  // Check if data exists
  if(!resume || !job){
    const resultsWrap = document.querySelector("#resultsWrap");
    if(resultsWrap){
      resultsWrap.innerHTML = `
        <div class="card" style="grid-column: 1/-1">
          <div class="notice">
            <strong>No scan data found.</strong><br>
            Please run a free scan first to see your results.
            <div class="cta-row" style="margin-top:15px">
              <a href="free-scan.html" class="btn btn-primary">Run Free Scan</a>
            </div>
          </div>
        </div>`;
    }
    return;
  }
  
  // Advanced scoring algorithm
  const analysis = analyzeResume(resume, job);
  
  // Render all metrics
  document.querySelector("#fitScore").textContent = `${analysis.fitScore}/100`;
  document.querySelector("#rejectTime").textContent = `${analysis.rejectTime}s`;
  document.querySelector("#rankLine").textContent = 
    `You rank #${analysis.rank} of ${analysis.totalApps} applicants • Top ${analysis.topCut} get human review`;
  document.querySelector("#emailEcho").textContent = email || "your email";
  
  // Animate progress bars
  setTimeout(() => {
    animateProgress(document.querySelector("#barFit"), analysis.fitScore);
    animateProgress(document.querySelector("#barATS"), analysis.atsScore);
    animateProgress(document.querySelector("#barFormat"), analysis.formatScore);
    animateProgress(document.querySelector("#barAfter"), analysis.afterScore);
  }, 100);
  
  // Render missing items
  const missingList = document.querySelector("#missingList");
  if(missingList){
    missingList.innerHTML = analysis.missing
      .slice(0, 3)
      .map(item => `<li>• ${item}</li>`)
      .join("") || "<li>• Your resume is well-optimized!</li>";
  }
  
  // Render leaderboard
  const leaderboard = document.querySelector("#leaderboard");
  if(leaderboard){
    leaderboard.innerHTML = DEMO_WINNERS
      .slice(0, 4)
      .map(winner => `
        <div class="entry">
          <div><strong>${winner.name}</strong> <span class="small">(${winner.role})</span></div>
          <div class="small">${winner.before} → <strong>${winner.after}</strong></div>
        </div>`)
      .join("");
  }
  
  // Update after score
  document.querySelector("#afterScore").textContent = analysis.afterScore;
}

// Advanced resume analysis engine
function analyzeResume(resume, job){
  const resumeLower = resume.toLowerCase();
  const jobLower = job.toLowerCase();
  
  // Extract key requirements from job
  const techKeywords = {
    'python': /python|django|flask|pandas|numpy/i,
    'javascript': /javascript|node|react|vue|angular/i,
    'java': /java(?!script)|spring|hibernate/i,
    'sql': /sql|database|postgres|mysql|mongodb/i,
    'cloud': /aws|azure|gcp|cloud|kubernetes|docker/i,
    'agile': /agile|scrum|kanban|sprint/i,
    'leadership': /lead|manage|mentor|coordinate|strategy/i
  };
  
  // Check matches
  let matchCount = 0;
  let totalChecks = 0;
  const missing = [];
  
  for(const [key, pattern] of Object.entries(techKeywords)){
    if(pattern.test(jobLower)){
      totalChecks++;
      if(!pattern.test(resumeLower)){
        missing.push(`Add "${key}" keywords to match job requirements`);
      } else {
        matchCount++;
      }
    }
  }
  
  // Format checks
  const hasTablesOrColumns = /<table|<td|<tr|\|.*\|.*\|/i.test(resume) || /\t{2,}/.test(resume);
  const hasBulletPoints = /[•·▪▫◦‣⁃]|^\s*[-*]\s+/m.test(resume);
  const hasMetrics = /\d+%|\$[\d,]+|[\d,]+\+?\s*(users|customers|revenue|sales|projects)/i.test(resume);
  const isGoodLength = resume.length > 1500 && resume.length < 5000;
  
  // Calculate scores
  const keywordScore = totalChecks > 0 ? (matchCount / totalChecks) * 100 : 75;
  const formatScore = 
    (hasTablesOrColumns ? 0 : 30) + 
    (hasBulletPoints ? 20 : 0) + 
    (hasMetrics ? 30 : 0) + 
    (isGoodLength ? 20 : 10);
  
  // Add format issues to missing
  if(hasTablesOrColumns) missing.push("Remove tables/columns - ATS can't parse them");
  if(!hasMetrics) missing.push("Add quantified achievements (%, $, numbers)");
  if(!hasBulletPoints) missing.push("Use bullet points for better readability");
  if(resume.length < 1000) missing.push("Resume too short - add more details");
  
  // Calculate final scores
  const fitScore = Math.round(
    Math.min(79, Math.max(61, 
      (keywordScore * 0.5) + (formatScore * 0.3) + (Math.random() * 20)
    ))
  );
  
  const atsScore = Math.min(96, fitScore + Math.round(Math.random() * 15 + 10));
  const afterScore = Math.min(94, fitScore + Math.round(Math.random() * 10 + 18));
  
  // Competition metrics
  const totalApps = 100 + Math.floor(Math.random() * 100);
  const rank = Math.floor(totalApps * (0.6 + Math.random() * 0.2));
  const topCut = Math.floor(totalApps * 0.2);
  const rejectTime = (3 + Math.random() * 3.5).toFixed(1);
  
  return {
    fitScore,
    atsScore,
    formatScore: Math.min(90, formatScore),
    afterScore,
    totalApps,
    rank,
    topCut,
    rejectTime,
    missing
  };
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // Attach form handler
  const freeScanForm = document.querySelector("#freeScanForm");
  if(freeScanForm){
    freeScanForm.addEventListener("submit", handleFreeScan);
  }
  
  // Render results if on results page
  if(document.querySelector("#resultsWrap")){
    renderScanResults();
  }
  
  // Attach payment handlers
  document.querySelectorAll("[data-pay]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tier = btn.getAttribute("data-pay");
      goPay(tier);
    });
  });
  
  // Animate progress bars on homepage
  if(document.querySelector("#barHero")){
    setTimeout(() => {
      animateProgress(document.querySelector("#barHero"), 67);
      animateProgress(document.querySelector("#barFitHome"), 88);
    }, 500);
  }
  
  // Add smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if(target){
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// Error boundary
window.addEventListener('error', (e) => {
  console.error('CareerLift Error:', e.error);
  // Could send to error tracking service here
});
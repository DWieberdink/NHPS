// 1. Define popupWindow and openPopup
let popupWindow = null;

function openPopup() {
  popupWindow = window.open('indexDecisionLogic.html', '_blank', 'width=1200,height=800');
  popupWindow.onload = () => {
    console.log('Popup is loaded and ready');
  };
}

// 2. Define broadcastThresholds
function broadcastThresholds() {
  const thresholds = {
    utilization: parseFloat(document.getElementById("utilSlider")?.value),
    utilizationHigh: parseFloat(document.getElementById("utilHighSlider")?.value),
    enrollmentGrowth: parseFloat(document.getElementById("growthSlider")?.value),
    projectedUtilization: parseFloat(document.getElementById("projUtilSlider")?.value),
    distanceUnderutilized: parseFloat(document.getElementById("distSlider")?.value),
    buildingThreshold: parseFloat(document.getElementById("buildSlider")?.value),
    adequateProgramsMin: parseFloat(document.getElementById("progSlider")?.value)
  };

    // NEW: Check for NaN
    if (Object.values(thresholds).some(val => isNaN(val))) {
      console.warn("⚠️ Not broadcasting because thresholds contain NaN:", thresholds);
      return;
    }
  

  console.log("📤 Broadcasting thresholds to iframe:", thresholds);

  const msg = { thresholds };
  const targetOrigin = window.location.origin;

  const iframe = document.querySelector("iframe");
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage(msg, targetOrigin);
  }
  if (popupWindow && !popupWindow.closed) {
    popupWindow.postMessage(msg, targetOrigin);
  }
}

// 3. Attach listeners to the sliders
[
  "utilSlider",
  "utilHighSlider",
  "growthSlider",
  "projUtilSlider",
  "distSlider",
  "buildSlider",
  "progSlider"
].forEach(id => {
  const slider = document.getElementById(id);
  if (slider) {
    slider.addEventListener("input", broadcastThresholds);
  }
});

// 4. Send school selection
document.getElementById("schoolSelect").addEventListener("change", function () {
  const selectedSchool = this.value;
  const targetOrigin = window.location.origin;

  console.log("Sending selected school to iframe:", selectedSchool);

  const iframe = document.querySelector("iframe");
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ school: selectedSchool }, targetOrigin);
  }
  if (popupWindow && !popupWindow.closed) {
    popupWindow.postMessage({ school: selectedSchool }, targetOrigin);
  }
});



// 5. Listen for messages coming from iframe
window.addEventListener("message", (event) => {
  const { from, thresholds, syncState, schoolData, school } = event.data || {};

  console.log("📨 Full message received by parent:", event.data);

  if (from === "DecisionLogicReady") {
    console.log("✅ iframe says it is ready! Broadcasting thresholds now...");
    broadcastThresholds();
    return;
  }

  if (from?.startsWith("DecisionLogic") && Array.isArray(schoolData)) {
    console.log(`📨 Received UPDATED schoolData from ${from}:`, schoolData);

    // 🔥 Always save the latest schoolData
    window.schoolData = schoolData;

    // 🔥 Always re-merge on new schoolData!
    if (Object.keys(mapExportLookup).length > 0) {
      console.log("🔄 Merging updated schoolData...");
      startMerging(window.schoolData);
    } else {
      console.log("⏳ mapExportLookup not ready yet, saving for later...");
      pendingSchoolData = schoolData;
    }
  }

  if (from === "DecisionLogic" && syncState) {
    const iframe = document.querySelector("iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ syncState }, window.location.origin);
    }
    if (popupWindow && !popupWindow.closed) {
      popupWindow.postMessage({ syncState }, window.location.origin);
    }
  }

  if (thresholds) {
    console.log("📨 Thresholds received:", thresholds);
    const iframe = document.querySelector("iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ thresholds }, window.location.origin);
    }
    if (popupWindow && !popupWindow.closed) {
      popupWindow.postMessage({ thresholds }, window.location.origin);
    }
  }

  if (school) {
    console.log("📨 School received:", school);
    const iframe = document.querySelector("iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ school }, window.location.origin);
    }
    if (popupWindow && !popupWindow.closed) {
      popupWindow.postMessage({ school }, window.location.origin);
    }
  }
});
 

// 6. Broadcast thresholds when iframe loads
const iframe = document.querySelector("iframe");

iframe.addEventListener('load', () => {
  console.log('Iframe is loaded! Broadcasting initial thresholds...');
  setTimeout(() => {
    broadcastThresholds();
  }, 500);  // 🔥 wait a tiny bit for page+sliders to exist
});

// 🔥 NEW helper function: request updated schoolData
function requestSchoolData() {
  console.log("📤 Requesting schoolData update from iframe...");
  const iframe = document.querySelector("iframe");
  if (iframe?.contentWindow) iframe.contentWindow.postMessage({ action: "requestSchoolData" }, window.location.origin);
  if (popupWindow && !popupWindow.closed) popupWindow.postMessage({ action: "requestSchoolData" }, window.location.origin);
}
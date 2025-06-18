
let pendingThresholds = null;
document.addEventListener("DOMContentLoaded", () => {
 

function sendToParentOrOpener(message) {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, "*");
    }
    if (window.parent !== window) {
      window.parent.postMessage(message, "*");
    }
  }
  
  function notifyParentOfChanges(state) {
    sendToParentOrOpener({ from: "DecisionLogic", state });
  }
  
  function applyState(state) {
    console.log("🔄 Applying state:", state); // Debug log
    if (state.utilization !== undefined) {
      document.getElementById("utilSlider").value = state.utilization;
      document.getElementById("utilOut").textContent = state.utilization;
    }
    if (state.utilizationHigh !== undefined) {
      document.getElementById("utilHighSlider").value = state.utilizationHigh;
    }
    if (state.enrollmentGrowth !== undefined) {
      document.getElementById("growthSlider").value = state.enrollmentGrowth;
      document.getElementById("growthOut").textContent = state.enrollmentGrowth;
    }
    if (state.projectedUtilization !== undefined) {
      document.getElementById("projUtilSlider").value = state.projectedUtilization;
      document.getElementById("projUtilOut").textContent = state.projectedUtilization;
    }
    if (state.distanceUnderutilized !== undefined) {
      document.getElementById("distSlider").value = state.distanceUnderutilized;
      document.getElementById("distOut").textContent = state.distanceUnderutilized;
    }
    if (state.buildingThreshold !== undefined) {
      document.getElementById("buildSlider").value = state.buildingThreshold;
      document.getElementById("buildOut").textContent = state.buildingThreshold;
    }
    if (state.adequateProgramsMin !== undefined) {
      document.getElementById("progSlider").value = state.adequateProgramsMin;
      document.getElementById("progOut").textContent = state.adequateProgramsMin;
    }
    if (state.school !== undefined) {
      document.getElementById("schoolSelect").value = state.school;
    }
}
      function collectState() {
        return {
          utilization: parseFloat(document.getElementById("utilSlider").value),
          utilizationHigh: parseFloat(document.getElementById("utilHighSlider").value),
          enrollmentGrowth: parseFloat(document.getElementById("growthSlider").value),
          projectedUtilization: parseFloat(document.getElementById("projUtilSlider").value),
          distanceUnderutilized: parseFloat(document.getElementById("distSlider").value),
          buildingThreshold: parseFloat(document.getElementById("buildSlider").value),
          adequateProgramsMin: parseFloat(document.getElementById("progSlider").value),
          school: document.getElementById("schoolSelect").value
        };
  }
  
  // ✅ Connect with other pages
  window.addEventListener("message", (event) => {
    console.log("📨 Iframe received message:", event.data);
    const { thresholds, school } = event.data || {};
  
    // Handle thresholds update
    if (thresholds) {
      console.log("📨 Received thresholds:", thresholds);
      applyState(thresholds);
      window.thresholds = thresholds;
  
      const selectedSchool = document.getElementById("schoolSelect").value;
      if (selectedSchool && typeof updateFlowForSchool === "function") {
        updateFlowForSchool(selectedSchool, thresholds);
      }
    }
  
    // Handle school selection update
    if (school) {
      console.log("📨 Received school:", school);
      const schoolSelect = document.getElementById("schoolSelect");
      schoolSelect.value = school;
  
      if (typeof updateFlowForSchool === "function") {
        updateFlowForSchool(school, window.thresholds || {});
      }
    }
  
  });
  // -- Tell parent "I'm ready" after iframe is fully loaded --

  window.addEventListener("load", () => {
    console.log("Iframe is fully loaded, telling parent I'm ready.");
    if (typeof sendToParentOrOpener === "function") {
      sendToParentOrOpener({ from: "DecisionLogicReady" });
    } else {
      console.warn("⚠️ sendToParentOrOpener not found!");
    }
  });
  
});
  
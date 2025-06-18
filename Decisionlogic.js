// ✅ DecisionLogic.js — Synced with FlowchartLogic.js

// ✅ Identify if this is the master
if (window.opener) {
  // If you have an opener, you are a popup = Master
  window.isMaster = true;
} else {
  // Otherwise (iframe), you are slave
  window.isMaster = false;
}

console.log("✅ isMaster:", window.isMaster);

let schoolData = [];

document.addEventListener("DOMContentLoaded", () => {

  // 🔥 Define FrameMessenger first so it's ready
  const FrameMessenger = {
    sendThresholds(thresholds) {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ thresholds }, "*");
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ thresholds }, "*");
      }
    }
  };

const thresholds = {
    utilization: 0.65,
    utilizationHigh: 0.95,
    enrollmentGrowth: 0,
    projectedUtilization: 0.95,
    distanceUnderutilized: 1.0,
    buildingThreshold: 1.5,
    adequateProgramsMin: 2,
  };

function broadcastThresholds() {
  const newThresholds = {
    utilization: parseFloat(document.getElementById("utilSlider")?.value) || 0.65,
    utilizationHigh: parseFloat(document.getElementById("utilHighSlider")?.value) || 0.95,
    enrollmentGrowth: parseFloat(document.getElementById("growthSlider")?.value) || 0,
    projectedUtilization: parseFloat(document.getElementById("projUtilSlider")?.value) || 0.95,
    distanceUnderutilized: parseFloat(document.getElementById("distSlider")?.value) || 1.0,
    buildingThreshold: parseFloat(document.getElementById("buildSlider")?.value) || 1.5,
    adequateProgramsMin: parseInt(document.getElementById("progSlider")?.value, 10)
  };

  Object.assign(thresholds, newThresholds); // 🔥 Update master copy

  const msg = { thresholds: newThresholds }; // 📡 Send fresh values
  const targetOrigin = window.location.origin;

  const iframe = document.querySelector("iframe");
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage(msg, targetOrigin);
  }
  if (window.popupWindow && !window.popupWindow.closed) {
    window.popupWindow.postMessage(msg, targetOrigin);
  }
}

  let lastData = [];

  function formatSliderValue(key, value) {
    const num = parseFloat(value);
    switch (key) {
      case "utilSlider":
      case "utilHighSlider":
      case "projUtilSlider":
        return `${Math.round(num * 100)}%`;
      case "growthSlider":
        return `${Math.round(num)}%`;
      case "distSlider":
      case "buildSlider":
        return num.toFixed(1);
      case "progSlider":
        return parseInt(value, 10);
      default:
        return value;
    }
  }

  function updateLabels() {
    const elements = [
      { id: "utilOut", slider: "utilSlider", value: thresholds.utilization },
      { id: "utilHighOut", slider: "utilHighSlider", value: thresholds.utilizationHigh },
      { id: "growthOut", slider: "growthSlider", value: thresholds.enrollmentGrowth },
      { id: "projUtilOut", slider: "projUtilSlider", value: thresholds.projectedUtilization },
      { id: "distOut", slider: "distSlider", value: thresholds.distanceUnderutilized },
      { id: "buildOut", slider: "buildSlider", value: thresholds.buildingThreshold },
      { id: "progOut", slider: "progSlider", value: thresholds.adequateProgramsMin }
    ];
  
    elements.forEach(({ id, slider, value }) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = formatSliderValue(slider, value);
      } else {
        console.warn(`⚠️ updateLabels skipped missing element #${id}`);
      }
    });
  }
  

  // event listeners to sliders
function sliderListeners() {
  const map = [
    ["utilSlider", "utilization"],
    ["utilHighSlider", "utilizationHigh"],
    ["growthSlider", "enrollmentGrowth"],
    ["projUtilSlider", "projectedUtilization"],
    ["distSlider", "distanceUnderutilized"],
    ["buildSlider", "buildingThreshold"],
    ["progSlider", "adequateProgramsMin"]
  ];

  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", (e) => {
        thresholds[key] = key === "adequateProgramsMin"
          ? parseInt(e.target.value)
          : parseFloat(e.target.value);

        updateLabels();
        window.thresholds = thresholds;

        // 🧡 IN IFRAME — trigger recalculation
        if (typeof recalculateEverything === "function") {
          recalculateEverything(); 
        }

        // 🧡 FROM INDEX.HTML — separately broadcast thresholds to iframe
        if (typeof FrameMessenger?.sendThresholds === "function") {
          FrameMessenger.sendThresholds(thresholds);
        }
      });
    }
  });
}

  
  
  // Broadcast updated thresholds
  function sendThresholdsToParent() {
    const msg = { thresholds };
    const targetOrigin = window.location.origin;
  
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, targetOrigin);
    }
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(msg, targetOrigin);
    }
  }
  

  function classifyRow(decision) {
    if (decision.includes("Closure")) return "Closure";
    if (decision.includes("Monitoring")) return "Monitoring";
    if (decision.includes("Building") && decision.includes("Programmatic")) return "BuildingProgramInvestment";
    if (decision.includes("Building Investment")) return "BuildingInvestment";
    if (decision.includes("Programmatic Investment")) return "ProgramInvestment";
    if (decision.includes("Building Addition")) return "BuildingAddition";
    if (decision.includes("evaluation")) return "Evaluation";
    return "Unknown";
  }

  function evaluateSchool(row, t = thresholds) {
    const decisions = {
      F: +row.Utilization > t.utilization ? "Yes" : "No",
      G: +row.Utilization > t.utilizationHigh ? "Yes" : "No",
      K: +row.ExpectedUtilization10yrs > t.projectedUtilization ? "Yes" : "No",
      I: +row["2014-2024_EnrollmentGrowth"] > t.enrollmentGrowth ? "Yes" : "No",
      M: +row.DistanceUnderutilizedschools <= t.distanceUnderutilized ? "Yes" : "No",
      U: +row.BuildingTreshhold <= t.buildingThreshold ? "Yes" : "No",
      X: +row.AdequateProgramOffer >= t.adequateProgramsMin ? "Yes" : "No",
      W: +row.AdequateProgramOffer >= t.adequateProgramsMin ? "Yes" : "No",
      Z: (row.SiteCapacity || "").toLowerCase().includes("yes") ? "Yes" : "No"
    };
    decisions.O = decisions.M;

    if (decisions.F === "No") {
      if (decisions.I === "No") {
        if (decisions.M === "Yes") return "Possibility of Closure/Merger";
        if (decisions.U === "Yes") return decisions.X === "Yes" ? "Ongoing Monitoring & Evaluation" : "Programmatic Investment";
        return decisions.W === "Yes" ? "Building Investment" : "Building & Programmatic Investments";
      }
      if (decisions.U === "Yes") return decisions.X === "Yes" ? "Ongoing Monitoring & Evaluation" : "Programmatic Investment";
      return decisions.W === "Yes" ? "Building Investment" : "Building & Programmatic Investments";
    }

    if (decisions.G === "No") {
      if (decisions.U === "Yes") return decisions.X === "Yes" ? "Ongoing Monitoring & Evaluation" : "Programmatic Investment";
      return decisions.W === "Yes" ? "Building Investment" : "Building & Programmatic Investments";
    }

    if (decisions.K === "No") {
      if (decisions.U === "Yes") return decisions.X === "Yes" ? "Ongoing Monitoring & Evaluation" : "Programmatic Investment";
      return decisions.W === "Yes" ? "Building Investment" : "Building & Programmatic Investments";
    }

    if (decisions.O === "Yes") return "School-specific evaluation of alternative options";
    if (decisions.Z === "Yes") return "Candidate for Building Addition";
    return "School-specific evaluation of alternative options";
  }

  

  function renderTable(data) {
    const allDecisions = [
      "Ongoing Monitoring & Evaluation",
      "Programmatic Investment",
      "Building Investment",
      "Building & Programmatic Investments",
      "Candidate for Building Addition",
      "School-specific evaluation of alternative options",
      "Possibility of Closure/Merger"
    ];
  
    const decisionCounts = {};
    allDecisions.forEach(decision => decisionCounts[decision] = 0);
  
    const rows = data.map(row => {
      const decision = row.decision || "Unknown";
      const cls = classifyRow(decision);
  
      if (decisionCounts.hasOwnProperty(decision)) {
        decisionCounts[decision]++;
      } else {
        decisionCounts[decision] = 1;
      }
  
      return `<tr class="${cls}"><td>${row["Building Name"]}</td><td>${decision}</td></tr>`;
    }).join("");
  
    const totalCount = Object.values(decisionCounts).reduce((sum, count) => sum + count, 0);
  
    const summaryRows = allDecisions.map(decision =>
      `<tr><td>${decision}</td><td>${decisionCounts[decision] || 0}</td></tr>`
    ).join("");
  
    // ✅ Ensure summary div exists
    let summaryDiv = document.getElementById("summary");
    if (!summaryDiv) {
      summaryDiv = document.createElement("div");
      summaryDiv.id = "summary";
      document.body.appendChild(summaryDiv);
    }
  
    // ✅ Ensure results div exists
    let resultsDiv = document.getElementById("results");
    if (!resultsDiv) {
      resultsDiv = document.createElement("div");
      resultsDiv.id = "results";
      document.body.appendChild(resultsDiv);
    }
  
    summaryDiv.innerHTML = `
      <h2>Summary</h2>
      <table>
        <thead><tr><th>Decision</th><th># Schools</th></tr></thead>
        <tbody>${summaryRows}</tbody>
        <tfoot><tr><th>Total</th><th>${totalCount}</th></tr></tfoot>
      </table>`;
  
    resultsDiv.innerHTML = `
      <h2>Full Results</h2>
      <table>
        <thead><tr><th>School</th><th>Decision</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

Papa.parse("Decision Data Export.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {
    if (results?.data?.length) {
      window.schoolData = results.data.map(row => {
        row.decision = evaluateSchool(row);
        return row;
      });
    
      lastData = window.schoolData;

      console.log("✅ calling renderTable with updated data");

      // ✅ FIRST: Add the school dropdown container
      const schoolSelectContainer = document.createElement("div");
      schoolSelectContainer.innerHTML = `
        <label>Select School:
          <select id="schoolSelect"><option value="">-- Select School --</option></select>
        </label>`;
      document.body.appendChild(schoolSelectContainer);

      // ✅ Populate the dropdown
      const select = document.getElementById("schoolSelect");
      if (select) {
        window.schoolData.forEach(row => {
          const option = document.createElement("option");
          option.value = row["Building Name"];
          option.textContent = row["Building Name"];
          select.appendChild(option);
        });

        select.addEventListener("change", () => {
          const selectedSchool = select.value;
          window.updateFlowForSchool?.(selectedSchool, window.thresholds);
        });
      }

      // ✅ THEN: Ensure results container exists
      let resultsContainer = document.getElementById("results");
      if (!resultsContainer) {
        resultsContainer = document.createElement("div");
        resultsContainer.id = "results";
        document.body.appendChild(resultsContainer);
      }
      resultsContainer.innerHTML = ""; // clear old results

      // ✅ THEN: Render results in the popup
      renderTable(window.schoolData);

// ✅ THEN: Setup sliders listeners
sliderListeners();

// ✅ THEN: Handle pending thresholds
if (window.pendingThresholds) {
  console.log("✅ Applying pending thresholds after PapaParse!");
  
  applyState(window.pendingThresholds);
  window.thresholds = window.pendingThresholds;
  
  const selectedSchool = document.getElementById("schoolSelect")?.value;
  if (selectedSchool && typeof window.updateFlowForSchool === "function") {
    window.updateFlowForSchool(selectedSchool, window.thresholds);
  }
  
  // ✅ AFTER thresholds are applied, now update labels
  if (typeof updateLabels === "function") {
    updateLabels();
  }

  window.pendingThresholds = null;
}

// ✅ Finally: Send schoolData to parent
sendToParentOrOpener({
  from: "DecisionLogic-A",
  schoolData: window.schoolData
});


    } else {
      console.error("❌ Failed to parse CSV data");
    }
  },
  error: err => console.error("Error loading CSV file:", err),
});


function sendToParentOrOpener(message) {
  if (window.parent) {
    window.parent.postMessage(message, "*");
  } else if (window.opener) {
    window.opener.postMessage(message, "*");
  } else {
    console.error("❌ No parent or opener to send the message to.");
  }
}

// ✅ Helper: Update sliders based on received thresholds
function applyState(state) {
  if (state.utilization !== undefined) {
    document.getElementById("utilSlider").value = state.utilization;
    document.getElementById("utilOut").textContent = (state.utilization * 100).toFixed(0) + "%";
  }
  if (state.utilizationHigh !== undefined) {
    document.getElementById("utilHighSlider").value = state.utilizationHigh;
    document.getElementById("utilHighOut").textContent = (state.utilizationHigh * 100).toFixed(0) + "%";
  }
  if (state.enrollmentGrowth !== undefined) {
    document.getElementById("growthSlider").value = state.enrollmentGrowth;
    document.getElementById("growthOut").textContent = state.enrollmentGrowth.toFixed(0) + "%";
  }
  if (state.projectedUtilization !== undefined) {
    document.getElementById("projUtilSlider").value = state.projectedUtilization;
    document.getElementById("projUtilOut").textContent = (state.projectedUtilization * 100).toFixed(0) + "%";
  }
  if (state.distanceUnderutilized !== undefined) {
    document.getElementById("distSlider").value = state.distanceUnderutilized;
    document.getElementById("distOut").textContent = state.distanceUnderutilized.toFixed(1);
  }
  if (state.buildingThreshold !== undefined) {
    document.getElementById("buildSlider").value = state.buildingThreshold;
    document.getElementById("buildOut").textContent = state.buildingThreshold.toFixed(1);
  }
  if (state.adequateProgramsMin !== undefined) {
    document.getElementById("progSlider").value = state.adequateProgramsMin;
    document.getElementById("progOut").textContent = state.adequateProgramsMin;
  }
  if (state.school !== undefined) {
    document.getElementById("schoolSelect").value = state.school;
  }
}

// ✅ Recalculate everything when thresholds change
function recalculateEverything() {
  console.log("♻️ Recalculating everything...", window.thresholds);

  if (window.schoolData) {
    console.log("⚡ First school row keys BEFORE adding decision:", Object.keys(window.schoolData[0]));
    window.schoolData.forEach((row, idx) => {
      row.decision = evaluateSchool(row, window.thresholds);
      console.log("⚡ After adding decision, school row keys:", Object.keys(row));

      if (!row.decision) {
        console.warn(`⚠️ No decision for row ${idx}:`, row);
      }
      console.log(`🧠 Row ${idx}: decision = ${row.decision}`);
    });

    lastData = window.schoolData;

    console.log("✅ Finished recalculating. First school decision:", window.schoolData[0]?.decision);

    renderTable(window.schoolData); // ✅ re-render your own iframe DOM
    console.log("🔍 Inside recalculateEverything, full window.schoolData:", window.schoolData);

    // ✅ AFTER re-rendering and logging, NOW broadcast schoolData
    if (window.parent && window.parent !== window) {
      console.log("📤 Broadcasting updated schoolData to parent...");
      window.parent.postMessage({ from: "DecisionLogic-A", schoolData: window.schoolData }, "*");
    }
    if (window.opener && !window.opener.closed) {
      console.log("📤 Broadcasting updated schoolData to opener...");
      window.opener.postMessage({ from: "DecisionLogic-A", schoolData: window.schoolData }, "*");
    }

    const selectedSchool = document.getElementById("schoolSelect")?.value;
    if (selectedSchool && typeof window.updateFlowForSchool === "function") {
      window.updateFlowForSchool(selectedSchool, window.thresholds);
    }

    // ✅ NOW Broadcast updated schoolData after recalculation
    if (window.parent && window.parent !== window) {
      console.log("✅ About to broadcast entire schoolData:", JSON.parse(JSON.stringify(window.schoolData)));
      console.trace("📍 Stack trace when broadcasting schoolData");
      window.parent.postMessage({
        from: "DecisionLogic-A",
        schoolData: window.schoolData
      }, window.location.origin);
    }
  }
}


// ✅ Listen for messages from parent page
window.addEventListener("message", (event) => {
  const { thresholds, syncState, school} = event.data || {};
  console.log("📨 iframe received:", event.data);

  if (thresholds) {
    applyState(thresholds);
    window.thresholds = thresholds; // 🛠 Always update memory
    recalculateEverything();
  }

  if (syncState) {
    applyState(syncState);
    window.thresholds = syncState; // 🛠 Update memory
    recalculateEverything();
  }


  if (school) {
    document.getElementById("schoolSelect").value = school;
    if (typeof window.updateFlowForSchool === "function") {
      window.updateFlowForSchool(school, window.thresholds);
    }
  }
});

// ✅ Listen for "requestSchoolData" messages
window.addEventListener("message", (event) => {
  const { action } = event.data || {};

  if (action === "requestSchoolData") {
    console.log("📤 iframe received 'requestSchoolData' message, sending schoolData back...");

    if (window.schoolData && window.parent) {
      window.parent.postMessage({
        from: "DecisionLogic-A",
        schoolData: window.schoolData
      }, "*");
    } else {
      console.warn("⚠️ No schoolData available to send yet!");
    }
  }
});

// ✅ Notify parent that iframe is ready
window.addEventListener("load", () => {
  console.log("✅ iframe fully loaded, telling parent...");
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ from: "DecisionLogicReady" }, "*");
  }
});
});
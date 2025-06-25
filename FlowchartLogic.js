// ✅ FlowchartLogic.js
let g;
let svg; // ✅ Make svg globally accessible
let nodes = []; 
window.FlowUtils = {};
let links = []; 
let schoolData = [];

// ✅ Global initialization function for main page
window.initializeFlowchartFromScript = function(svgElement) {
  console.log("🎯 Initializing flowchart from main script...");
  
  // Set up the SVG
  svg = d3.select(svgElement.node()); // ✅ Assign to global svg
  g = svg.append("g");

  g.append("g").attr("class", "links");
  g.append("g").attr("class", "nodes");
  g.append("g").attr("class", "link-labels");

  svg.call(d3.zoom().scaleExtent([0.5, 2]).on("zoom", e => g.attr("transform", e.transform)))
     .call(d3.zoom().transform, d3.zoomIdentity.translate(100, 250).scale(0.65)); // ✅ Pushed down vertically

  svg.append("defs").append("marker")
    .attr("id", "arrow-active").attr("viewBox", "0 -5 10 10").attr("refX", 10)
    .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
    .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#f0ad4e");

  // Initialize the flowchart
  initializeFlowchartData();
  renderFlowchart();
  
  // Load school data
  loadSchoolData();
};

// ✅ Manual setup function for fallback
window.setupFlowchartManually = function(svgElement) {
  console.log("🎯 Setting up flowchart manually...");
  window.initializeFlowchartFromScript(svgElement);
};

function mapSliderKeyToThresholdKey(sliderId) {
  const mapping = {
    utilSlider: "utilization",
    utilHighSlider: "utilizationHigh",
    growthSlider: "enrollmentGrowth",
    projUtilSlider: "projectedUtilization",
    distSlider: "distanceUnderutilized",
    buildSlider: "buildingThreshold",
    progSlider: "adequateProgramsMin"
  };
  return mapping[sliderId];
}

// ✅ Initialize flowchart data
function initializeFlowchartData() {
  // Data Definition for the flowchart
  nodes = [
     // First Row
    { id: "F", label: "Utilization above", fx: 5, fy: 0, thresholdKey: "utilSlider" },
    { id: "I", label: "Past 10 year growth", fx: 255, fy: 0, thresholdKey: "growthSlider" },
    { id: "M", label: "Within mile of another underutilized school", fx: 505, fy: 0, thresholdKey: "distSlider" },
   
   
     // Second Row
    { id: "G", label: "Utilization above", fx: 5, fy: 105, thresholdKey: "utilHighSlider" },

    // Third Row
    { id: "K", label: "5-yr projection above", fx: 5, fy: 205, thresholdKey: "projUtilSlider" },
    { id: "U", label: "Building Score ≤", fx: 255, fy: 205, thresholdKey: "buildSlider" },
    { id: "1", label: "Closure/Merger", fx: 505, fy: 155 },
    
   
    // Fourth Row
    { id: "O", label: "Within mile of another underutilized school", fx: 5, fy: 305, thresholdKey: "distSlider" },
    { id: "X", label: "More programs than", fx: 255, fy: 305, thresholdKey: "progSlider" },
    { id: "W", label: "More programs than", fx: 505, fy: 305, thresholdKey: "progSlider" },
    

    // Fifth Row
    { id: "Z", label: "Can School expand on site?", fx: 105, fy: 405, thresholdKey: null },

    // Outcomes (shifted to the right a bit)
    //Sixth Row
    { id: "5", label: "Building Investment", fx: 600, fy: 500 }, 
    { id: "20", label: "School-Specific Evaluation", fx: -50, fy: 500},

    // Seventh Row 
    { id: "4", label: "Bldg + Program Investment", fx: 475, fy: 580 },
    { id: "21", label: "Building Addition", fx: 25, fy: 580 },

    // Eighth Row
    { id: "2", label: "Monitoring", fx: 150, fy: 650 },
    { id: "3", label: "Program Investment", fx: 350, fy: 650 },
  ];

  links = [
    { source: "F", target: "G", label: "Yes" }, 
    { source: "G", target: "K" }, 
    { source: "G", target: "U" },
    { source: "F", target: "I", label: "No"}, 
    { source: "I", target: "U" }, 
    { source: "I", target: "M" },
    { source: "M", target: "1" }, 
    { source: "M", target: "U" }, 
    { source: "K", target: "O" },
    { source: "K", target: "U" }, 
    { source: "O", target: "20" }, { source: "O", target: "Z" },
    { source: "Z", target: "21" }, { source: "Z", target: "20" }, { source: "U", target: "X" },
    { source: "U", target: "W" }, { source: "X", target: "2" }, { source: "X", target: "3" },
    { source: "W", target: "5" }, { source: "W", target: "4" }
  ];
}

// ✅ Render flowchart
function renderFlowchart() {
  // Clear all existing highlights
  svg.selectAll(".node")
    .classed("highlight", false)
    .classed("special-highlight", false);

  svg.selectAll(".link")
    .classed("active", false);

  //Draw Lines (Links)
  g.select(".links")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("x1", d => nodes.find(n => n.id === d.source).fx)
    .attr("y1", d => nodes.find(n => n.id === d.source).fy)
    .attr("x2", d => nodes.find(n => n.id === d.target).fx)
    .attr("y2", d => nodes.find(n => n.id === d.target).fy);

  g.select(".nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.fx},${d.fy})`)
    .each(function (d) {
      const group = d3.select(this);
      const ellipseIds = ["1","4", "5", "2", "3", "20", "21"];
  
      if (ellipseIds.includes(d.id)) {
        group.append("rect")
          .attr("width", 150)
          .attr("height", 65)
          .attr("x", -75)
          .attr("y", -32.5)
          .attr("rx", 20)
          .attr("ry", 20)
          .attr("class", "ellipse-node");
      } else {
        group.append("rect")
          .attr("width", 180)
          .attr("height", 80)
          .attr("x", -90)
          .attr("y", -40)
          .attr("rx", 6)
          .attr("ry", 6);
      }
  
      let text = d.label;
      if (d.thresholdKey && window.thresholds) {
        const key = mapSliderKeyToThresholdKey(d.thresholdKey);
        if (key && window.thresholds[key] !== undefined) {
          const rawVal = window.thresholds[key];
          const formatted = formatSliderValue(d.thresholdKey, rawVal);
          text += `\n(${formatted})`;
        }
      }
  
      group.append("foreignObject")
        .attr("x", -75)
        .attr("y", -32.5)
        .attr("width", 150)
        .attr("height", 65)
        .append("xhtml:div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("height", "100%")
        .style("width", "100%")
        .style("font", "16px franklin-gothic")
        .style("text-align", "center")
        .style("word-wrap", "break-word")
        .text(text);
    });

  FlowUtils.updateNodeLabels();
}

// ✅ Load school data
function loadSchoolData() {
  Papa.parse("https://raw.githubusercontent.com/DWieberdink/NHPS/main/Decision%20Data%20Export.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (res) {
      schoolData = res.data;
      console.log("✅ School data loaded for flowchart:", schoolData.length, "schools");
      
      // Make updateFlowForSchool available globally
      window.updateFlowForSchool = updateFlowForSchool;
      window.schoolData = schoolData;
      
      // Set default thresholds if not already set
      window.thresholds = window.thresholds || {
        utilization: 0.65,
        utilizationHigh: 0.95,
        enrollmentGrowth: 0,
        projectedUtilization: 0.95,
        distanceUnderutilized: 1.0,
        buildingThreshold: 1.5,
        adequateProgramsMin: 2
      };
      
      FlowUtils.updateNodeLabels();
    },
    error: function(err) {
      console.error("❌ Failed to load school data for flowchart:", err);
    }
  });
}

// Label Formatting
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

//Update Node Labels
FlowUtils.updateNodeLabels = function () {
  d3.selectAll(".node").each(function (d) {
    const group = d3.select(this);
    const foreign = group.select("foreignObject div");
    let text = d.label;
    if (d.thresholdKey && window.thresholds) {
      const rawVal = window.thresholds[mapSliderKeyToThresholdKey(d.thresholdKey)];
      const formatted = formatSliderValue(d.thresholdKey, rawVal);
      text += `\n(${formatted})`;
    }
    foreign.text(text);
  });
};

// ✅ Evaluate Path function
function evaluatePath(row, t) {
  const d = {
    F: +row.Utilization > t.utilization ? "Yes" : "No",
    G: +row.Utilization > t.utilizationHigh ? "Yes" : "No",
    K: +row.ExpectedUtilization10yrs > t.projectedUtilization ? "Yes" : "No",
    I: +row["2014-2024_EnrollmentGrowth"] > t.enrollmentGrowth ? "Yes" : "No",
    M: +row.DistanceUnderutilizedschools <= t.distanceUnderutilized ? "Yes" : "No",
    U: +row.BuildingTreshhold <= t.buildingThreshold ? "Yes" : "No",
    X: +row.AdequateProgramOffer >= t.adequateProgramsMin ? "Yes" : "No",
    W: +row.AdequateProgramOffer >= t.adequateProgramsMin ? "Yes" : "No",
    Z: (row.SiteCapacity || "").toLowerCase().includes("yes") ? "Yes" : "No",
  };
  d.O = d.M;

  const path = [];
  if (d.F === "No") {
    path.push("F", "I");
    if (d.I === "No") {
      path.push("M");
      if (d.M === "Yes") path.push("1");
      else {
        path.push("U");
        if (d.U === "Yes") {
          if (d.X === "Yes") path.push("X", "2");
          else path.push("X", "3");
        } else {
          if (d.W === "Yes") path.push("W", "5");
          else path.push("W", "4");
        }
      }
    } else {
      path.push("U");
      if (d.U === "Yes") {
        if (d.X === "Yes") path.push("X", "2");
        else path.push("X", "3");
      } else {
        if (d.W === "Yes") path.push("W", "5");
        else path.push("W", "4");
      }
    }
  } else if (d.G === "No") {
    path.push("F", "G", "U");
    if (d.U === "Yes") {
      if (d.X === "Yes") path.push("X", "2");
      else path.push("X", "3");
    } else {
      if (d.W === "Yes") path.push("W", "5");
      else path.push("W", "4");
    }
  } else if (d.K === "No") {
    path.push("F", "G", "K", "U");
    if (d.U === "Yes") {
      if (d.X === "Yes") path.push("X", "2");
      else path.push("X", "3");
    } else {
      if (d.W === "Yes") path.push("W", "5");
      else path.push("W", "4");
    }
  } else {
    path.push("F", "G", "K", "O");
    if (d.O === "Yes") path.push("20");
    else path.push("Z", d.Z === "Yes" ? "21" : "20");
  }
  return { path, decisions: d };
}

// ✅ highlight flow function
function highlightFlow(path, decisions) {
  // Clear all existing highlights
  d3.selectAll(".node")
    .classed("highlight", false)
    .classed("special-highlight", false); 

  d3.selectAll(".link")
    .classed("active", false)
    .attr("marker-end", null);

  d3.selectAll(".link-label")
    .classed("active-label", false);

  // Highlight the path
  d3.selectAll(".node")
    .filter(d => path.includes(d.id))
    .classed("highlight", true);

  d3.selectAll(".node")
    .filter(d => ["1", "2", "3", "4", "5", "20", "21"].includes(d.id) && path.includes(d.id))
    .classed("special-highlight", true);

  // Highlight the links
  d3.selectAll(".link")
    .filter(d => {
      const i = path.indexOf(d.source);
      return i >= 0 && path[i + 1] === d.target;
    })
    .classed("active", true)
    .attr("marker-end", "url(#arrow-active)");

  // Highlight labels for active links
  const labelGroup = d3.select(".link-labels");
  labelGroup.selectAll("text").remove();

  for (let i = 0; i < path.length - 1; i++) {
    const source = nodes.find(n => n.id === path[i]);
    const target = nodes.find(n => n.id === path[i + 1]);

    if (!source || !target) {
      console.warn(`⚠️ Could not find node for: ${path[i]} ➝ ${path[i + 1]}`);
      continue; // Skip this label
    }
    const midX = (source.fx + target.fx) / 2;
    const midY = (source.fy + target.fy) / 2;
    const label = decisions[source.id] || "";
    labelGroup.append("text")
      .attr("x", midX)
      .attr("y", midY +5)
      .attr("text-anchor", "middle")
      .attr("class", "link-label")
      .text(label);
  }
}

function updateFlowForSchool(name, thresholds) {
  const row = schoolData.find(r => r["Building Name"] === name);
  if (row) {
    const { path, decisions} = evaluatePath(row, thresholds);
    highlightFlow(path, decisions);
  }
}

// ✅ Make window globally available
window.updateFlowForSchool = updateFlowForSchool;

// ✅ Listen for incoming thresholds and update labels
window.addEventListener("message", (event) => {
  const { thresholds } = event.data || {};

  if (thresholds) {
    console.log("📨 FlowchartLogic received thresholds:", thresholds);
    window.thresholds = thresholds;
    
    if (typeof FlowUtils.updateNodeLabels === 'function') {
      FlowUtils.updateNodeLabels();
    }

    // ✅ Re-evaluate and highlight the path for the currently selected school in the main view
    const mainFlowchartSelect = document.getElementById('mainFlowchartSchoolSelect');
    if (mainFlowchartSelect) { // Check ensures this only runs for the main page's flowchart
      const selectedSchool = mainFlowchartSelect.value;
      if (selectedSchool && typeof updateFlowForSchool === 'function') {
        updateFlowForSchool(selectedSchool, window.thresholds);
      }
    }
  }
});

// ✅ Initialize for iframe context (original functionality)
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we're in the iframe context
  if (document.getElementById("flowchart-container") && !document.getElementById("main-flowchart-container")) {
    svg = d3.select("svg"); // ✅ Assign to global svg
    g = svg.append("g");

    g.append("g").attr("class", "links");
    g.append("g").attr("class", "nodes");
    g.append("g").attr("class", "link-labels");

    svg.call(d3.zoom().scaleExtent([0.5, 2]).on("zoom", e => g.attr("transform", e.transform)))
       .call(d3.zoom().transform, d3.zoomIdentity.translate(100, 250).scale(0.65)); // ✅ Pushed down vertically

    svg.append("defs").append("marker")
      .attr("id", "arrow-active").attr("viewBox", "0 -5 10 10").attr("refX", 10)
      .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
      .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#f0ad4e");

    initializeFlowchartData();
    renderFlowchart();
    loadSchoolData();

    // Set up school select for iframe
    const select = document.getElementById("schoolSelect");
    if (select) {
      select.addEventListener("change", () => updateFlowForSchool(select.value, window.thresholds));
    }
  }
});
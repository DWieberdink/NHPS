mapboxgl.accessToken = 'pk.eyJ1IjoicGF0d2QwNSIsImEiOiJjbTZ2bGVhajIwMTlvMnFwc2owa3BxZHRoIn0.moDNfqMUolnHphdwsIF87w';

// Welcome Popup Password Functionality
document.addEventListener('DOMContentLoaded', function() {
  const welcomePopup = document.getElementById('welcomePopup');
  const passwordInput = document.getElementById('passwordInput');
  const enterBtn = document.getElementById('enterBtn');
  const errorMessage = document.getElementById('errorMessage');
  
  function checkPassword() {
    const password = passwordInput.value.trim();
    if (password === 'NHPS') {
      welcomePopup.style.display = 'none';
      errorMessage.style.display = 'none';
      passwordInput.value = '';
      // Start onboarding walkthrough after successful login
      // Wait for DOM to be fully ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(startOnboardingWalkthrough, 500);
        });
      } else {
        setTimeout(startOnboardingWalkthrough, 500);
      }
    } else {
      errorMessage.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }
  
  // Enter button click
  enterBtn.addEventListener('click', checkPassword);
  
  // Enter key press
  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
  
  // Focus on password input when popup loads
  passwordInput.focus();

  // Add manual tour trigger button
  const tourButton = document.createElement('button');
  tourButton.textContent = '📋 Start Tour';
  tourButton.style.position = 'fixed';
  tourButton.style.top = '10px';
  tourButton.style.right = '10px';
  tourButton.style.zIndex = '1000';
  tourButton.style.background = '#007cbf';
  tourButton.style.color = '#fff';
  tourButton.style.border = 'none';
  tourButton.style.borderRadius = '4px';
  tourButton.style.padding = '8px 16px';
  tourButton.style.fontSize = '14px';
  tourButton.style.cursor = 'pointer';
  tourButton.onclick = startOnboardingWalkthrough;
  document.body.appendChild(tourButton);

  // Auto-open "School Decision Evaluation: Results" when "School Decision Evaluation" is opened
  const decisionInputPanel = document.getElementById('decision-input-panel');
  const decisionOutputPanel = document.getElementById('decision-output-panel');
  
  if (decisionInputPanel && decisionOutputPanel) {
    decisionInputPanel.addEventListener('toggle', function() {
      if (this.open) {
        // When the input panel opens, also open the results panel
        decisionOutputPanel.open = true;
      }
    });
  }

  // --- Scenario Modeling: Show options only after decision type is selected ---
  const decisionFilter = document.getElementById('decisionFilter');
  const scenarioOptionsContainer = document.getElementById('scenarioOptionsContainer');
  const assignmentModeDetails = document.getElementById('assignmentModeDetails');

  if (decisionFilter && scenarioOptionsContainer && assignmentModeDetails) {
    // --- Add a container for the investments table ---
    let investmentsTableContainer = document.getElementById('investmentsTableContainer');
    if (!investmentsTableContainer) {
      investmentsTableContainer = document.createElement('div');
      investmentsTableContainer.id = 'investmentsTableContainer';
      investmentsTableContainer.style.marginTop = '1em';
      scenarioOptionsContainer.parentNode.insertBefore(investmentsTableContainer, scenarioOptionsContainer.nextSibling);
    }

    function updateScenarioOptionsVisibility() {
      const ongoingContainer = document.getElementById('ongoingMonitoringContainer');
      const ongoingMessage = document.getElementById('ongoingMonitoringMessage');
      const ongoingList = document.getElementById('ongoingMonitoringList');
      // Hide all by default
      scenarioOptionsContainer.style.display = 'none';
      assignmentModeDetails.style.display = 'none';
      if (ongoingContainer) ongoingContainer.style.display = 'none';
      // Hide investments table by default
      investmentsTableContainer.style.display = 'none';
      investmentsTableContainer.innerHTML = '';

      if (decisionFilter.value === 'Ongoing Monitoring & Evaluation') {
        // Show only the message and list
        if (scenarioOptionsContainer) scenarioOptionsContainer.style.display = '';
        if (ongoingContainer && ongoingMessage && ongoingList) {
          ongoingContainer.style.display = '';
          ongoingMessage.textContent = 'These schools are in good condition and no immediate action is required.';
          // Get list of schools in this category
          let schools = [];
          if (window.decisionLogic && window.decisionLogic.schoolData) {
            schools = window.decisionLogic.schoolData.filter(row => row.decision === 'Ongoing Monitoring & Evaluation').map(row => row['Building Name']);
          }
          ongoingList.innerHTML = schools.length ? schools.map(s => `<li>${s}</li>`).join('') : '<li>No schools found.</li>';
        }
      }
      // --- Show investments table for Building & Programmatic Investments, Programmatic Investment, or Building Investment ---
      if (
        decisionFilter.value === 'Building & Programmatic Investments' ||
        decisionFilter.value === 'Programmatic Investment' ||
        decisionFilter.value === 'Building Investment'
      ) {
        if (scenarioOptionsContainer) scenarioOptionsContainer.style.display = '';
        if (assignmentModeDetails) assignmentModeDetails.style.display = '';
        // Build the table
        if (window.decisionLogic && window.decisionLogic.schoolData) {
          const data = window.decisionLogic.schoolData;
          // Helper to format square footage with 'K' for thousands
          function formatSquareFt(value) {
            if (!value) return '';
            const num = parseFloat(value.toString().replace(/,/g, ''));
            if (isNaN(num)) return value;
            if (num >= 1000) return (num / 1000).toLocaleString(undefined, {maximumFractionDigits: 0}) + 'K';
            return num.toLocaleString();
          }
          // Helper to format cost (optional: add $ and commas)
          function formatCost(value) {
            if (!value) return '';
            const num = parseFloat(value.toString().replace(/,/g, ''));
            if (isNaN(num)) return value;
            return '$' + num.toLocaleString();
          }
          // Helper to build rows for a category
          function buildRows(decisionType) {
            return data.filter(row => row.decision === decisionType)
              .map(row => `<tr><td>${row['Building Name']}</td><td>${formatSquareFt(row['SquareFt'])}</td><td>${formatCost(row['Cost'])}</td></tr>`)
              .join('');
          }
          let tableHTML = `<table class=\"data-table\"><thead><tr><th>School Name</th><th>Square Footage</th><th>Cost</th></tr></thead><tbody>`;
          // Determine order based on selected filter
          let sectionOrder;
          if (decisionFilter.value === 'Programmatic Investment') {
            sectionOrder = [
              {type: 'Programmatic Investment', label: 'Programmatic Investment', color: '#27ae60'},
              {type: 'Building & Programmatic Investments', label: 'Building & Programmatic Investments', color: '#1abc9c'},
              {type: 'Building Investment', label: 'Building Investment', color: '#2ecc71'}
            ];
          } else if (decisionFilter.value === 'Building Investment') {
            sectionOrder = [
              {type: 'Building Investment', label: 'Building Investment', color: '#2ecc71'},
              {type: 'Building & Programmatic Investments', label: 'Building & Programmatic Investments', color: '#1abc9c'},
              {type: 'Programmatic Investment', label: 'Programmatic Investment', color: '#27ae60'}
            ];
          } else {
            sectionOrder = [
              {type: 'Building & Programmatic Investments', label: 'Building & Programmatic Investments', color: '#1abc9c'},
              {type: 'Programmatic Investment', label: 'Programmatic Investment', color: '#27ae60'},
              {type: 'Building Investment', label: 'Building Investment', color: '#2ecc71'}
            ];
          }
          sectionOrder.forEach(section => {
            const rows = buildRows(section.type);
            if (rows) {
              tableHTML += `<tr><td colspan=\"2\" style=\"font-weight:bold;background:${section.color};color:#fff;\">${section.label}</td></tr>` + rows;
            }
          });
          tableHTML += '</tbody></table>';
          investmentsTableContainer.innerHTML = tableHTML;
          investmentsTableContainer.style.display = '';
        }
        return;
      }
      // Show normal options
      if (scenarioOptionsContainer) scenarioOptionsContainer.style.display = '';
      if (ongoingContainer) ongoingContainer.style.display = 'none';
      if (assignmentModeDetails) assignmentModeDetails.style.display = '';
    }
    decisionFilter.addEventListener('change', updateScenarioOptionsVisibility);
    // Initial state
    updateScenarioOptionsVisibility();
  }
});

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-72.9279, 41.3083], // New Haven, CT
  zoom: 12
});

let geojsonData;
let initialDecisionData = null; // Store data if it arrives before geojson
let mapIsReady = false; // Flag to track if the map's core is loaded
let selectedEnrollment = 0;
let odData = [];
let selectedTypes = [];
let minEnrollment = 0;
let maxEnrollment = 2000;
let minSeats = 0;
let maxSeats = 500;
let showVariableRadius = false;

function updateLayer() {
    if (!geojsonData) { return; } // Do not run if geojson data is not loaded yet

  const filteredFeatures = geojsonData.features.filter(f => {
    const enrollment = parseInt(f.properties['Enrollment']) || 0;
    const availableSeats = parseInt(f.properties['Available Seats']) || 0;
    const level = f.properties['School Level'];

    const matchesEnrollment = enrollment >= minEnrollment && enrollment <= maxEnrollment;
    const matchesSeats = availableSeats >= minSeats && availableSeats <= maxSeats;
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(level);

    return matchesEnrollment && matchesSeats && matchesType;
  });

  const updatedData = { ...geojsonData, features: filteredFeatures };
  map.getSource('schools').setData(updatedData);

  map.setPaintProperty('schools-layer', 'circle-radius',
    showVariableRadius
      ? ['interpolate', ['linear'], ['get', 'Available Seats'], 0, 4, 200, 20]
      : 6
  );
}

function normalize(str) {
    return str?.toLowerCase().replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
}

// ✅ Move updateLegend function outside map.on('load') for global access
let showingAssignments = false;
function updateLegend() {
  const legendContent = document.getElementById('legend-content');
  if (!legendContent) return;
  
  legendContent.innerHTML = '';

  const decisionLegend = {
    "Ongoing Monitoring & Evaluation": '#3498db',
    "Programmatic Investment": '#27ae60',
    "Building Investment": '#2ecc71',
    "Building & Programmatic Investments": '#1abc9c',
    "Candidate for Building Addition": '#9b59b6',
    "School-specific evaluation of alternative options": '#f1c40f',
    "Possibility of Closure/Merger": '#e74c3c',
    "Other / Unknown": '#7f8c8d'
  };

  const assignmentLegend = {
    "Assigned Students": '#FF530D'
  };

  const items = showingAssignments ? assignmentLegend : decisionLegend;

  const title = document.createElement('div');
  title.innerHTML = `<strong>${showingAssignments ? 'Assignment View' : 'Decision Types'}</strong>`;
  legendContent.appendChild(title);

  for (const [label, color] of Object.entries(items)) {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `<span class="legend-swatch" style="background:${color};"></span>${label}`;
    legendContent.appendChild(row);
  }
}

// ✅ Global popup for assignment circles
let assignmentPopup = null;

function setupAssignmentPopup() {
  console.log("🔧 Setting up assignment popup...");
  
  // Check if the layer exists
  if (!map.getLayer('assigned-schools-layer')) {
    console.error("❌ assigned-schools-layer does not exist!");
    return;
  }
  
  // Check layer visibility
  const layerVisibility = map.getLayoutProperty('assigned-schools-layer', 'visibility');
  console.log("👁️ Layer visibility:", layerVisibility);
  
  // Check if source exists and has data
  const source = map.getSource('assigned-schools');
  if (source) {
    console.log("📊 Source exists, current data:", source._data);
    console.log("📊 Number of features in source:", source._data?.features?.length || 0);
  } else {
    console.error("❌ assigned-schools source does not exist!");
  }
  
  if (!assignmentPopup) {
    assignmentPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    console.log("✅ Created new assignment popup");
  }
  
  // Remove existing listeners to avoid duplicates
  map.off('mouseenter', 'assigned-schools-layer');
  map.off('mouseleave', 'assigned-schools-layer');
  
  console.log("🎯 Adding mouse event listeners to assigned-schools-layer...");
  
  // Add popup for assigned-schools layer
  map.on('mouseenter', 'assigned-schools-layer', (e) => {
    console.log("🖱️ Mouse entered assigned-schools layer!");
    console.log("🖱️ Event features:", e.features);
    console.log("🖱️ First feature properties:", e.features[0]?.properties);
    
    if (e.features && e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      const coordinates = e.features[0].geometry.coordinates.slice();
      const schoolName = e.features[0].properties.name;
      const assignedCount = e.features[0].properties.assigned;
      
      console.log("🏫 School:", schoolName, "Assigned:", assignedCount);
      
      const popupContent = `
        <strong>${schoolName}</strong><br>
        <span style="color: #FF530D; font-weight: bold;">📚 Received ${assignedCount} students</span>
      `;
      
      assignmentPopup.setLngLat(coordinates).setHTML(popupContent).addTo(map);
      console.log("✅ Popup added for:", schoolName);
    } else {
      console.warn("⚠️ No features found in mouseenter event");
    }
  });

  map.on('mouseleave', 'assigned-schools-layer', () => {
    console.log("🖱️ Mouse left assigned-schools layer");
    map.getCanvas().style.cursor = '';
    assignmentPopup.remove();
  });
  
  console.log("✅ Assignment popup setup complete");
}

map.on('load', () => {
  console.log("Map loaded. Fetching initial data...");

  const geojsonPromise = fetch('NHPSSchools.geojson').then(res => res.json());
  const decisionDataPromise = window.decisionLogic.initialize();

  Promise.all([geojsonPromise, decisionDataPromise])
    .then(([geojson, decisionData]) => {
      console.log("✅ Both GeoJSON and Decision Data are loaded.");
      geojsonData = geojson;
      
      injectDecisionsIntoGeoJSON(geojsonData, decisionData);
      initializeDropdownFilters(decisionData);

      // Add the source for the school data
      map.addSource('schools', {
        type: 'geojson',
        data: geojsonData
      });

      // Add a source and layer for the selected school's "halo" highlight
      map.addSource('selected-school', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add the highlight layer first, so it's drawn underneath the school dots
      map.addLayer({
        id: 'selected-school-highlight',
        type: 'circle',
        source: 'selected-school',
        paint: {
          'circle-radius': 10,
          'circle-color': '#007cbf',
          'circle-opacity': 0.6
        }
      });

      // Add the main schools layer on top of the halo
      map.addLayer({
        id: 'schools-layer',
        type: 'circle',
        source: 'schools',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'Decision Type'],
            "Ongoing Monitoring & Evaluation", '#3498db',
            "Programmatic Investment", '#27ae60',
            "Building Investment", '#2ecc71',
            "Building & Programmatic Investments", '#1abc9c',
            "Candidate for Building Addition", '#9b59b6',
            "School-specific evaluation of alternative options", '#f1c40f',
            "Possibility of Closure/Merger", '#e74c3c',
            '#7f8c8d'
          ]
        }
      });
      
      updateLegend();

      // Setup other map features that depend on the 'schools' source
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.on('mouseenter', 'schools-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const coordinates = e.features[0].geometry.coordinates.slice();
        const schoolName = e.features[0].properties['Building Name'];
        let popupContent = `<strong>${schoolName}</strong>`;
        if (showingAssignments) {
          const assignedSource = map.getSource('assigned-schools');
          if (assignedSource && assignedSource._data?.features) {
            const assignedFeature = assignedSource._data.features.find(f => f.properties.name === schoolName);
            if (assignedFeature) {
              popupContent += `<br><span style="color: #FF530D; font-weight: bold;">📚 Received ${assignedFeature.properties.assigned} students</span>`;
            }
          }
        }
        popup.setLngLat(coordinates).setHTML(popupContent).addTo(map);
      });

      map.on('mouseleave', 'schools-layer', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.addSource('assigned-schools', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      
      map.addLayer({
        id: 'assigned-schools-layer',
        type: 'circle',
        source: 'assigned-schools',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'assigned'], 0, 4, 10, 8, 50, 16, 100, 24],
          'circle-color': '#FF530D',
          'circle-opacity': 0.8,
          'circle-stroke-color': '#333',
          'circle-stroke-width': 1
        }
      });
      
      setupAssignmentPopup();

      // Populate excludedSchools select with all school names
      const excludedSchoolsSelect = document.getElementById('excludedSchools');
      if (excludedSchoolsSelect) {
        excludedSchoolsSelect.innerHTML = '';
        geojsonData.features.forEach(f => {
          const name = f.properties['Building Name'];
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          excludedSchoolsSelect.appendChild(option);
        });
        // Initialize Choices.js for a better multi-select dropdown
        if (window.Choices) {
          if (excludedSchoolsSelect.choicesInstance) {
            excludedSchoolsSelect.choicesInstance.destroy();
          }
          excludedSchoolsSelect.choicesInstance = new Choices(excludedSchoolsSelect, {
            removeItemButton: true,
            searchResultLimit: 20,
            placeholder: true,
            placeholderValue: 'Select schools to exclude',
            shouldSort: false
          });
        }
      }

      // --- Blinking Halo for Sending School ---
      let haloInterval = null;
      let haloRadius = 15;
      let haloGrowing = true;

      function startBlinkingHalo() {
        if (haloInterval) clearInterval(haloInterval);
        haloRadius = 15;
        haloGrowing = true;
        haloInterval = setInterval(() => {
          if (!map.getLayer('sending-school-halo')) return;
          map.setPaintProperty('sending-school-halo', 'circle-radius', haloRadius);
          map.setPaintProperty('sending-school-halo', 'circle-opacity', 0.5 + 0.5 * Math.sin(Date.now() / 300));
          if (haloGrowing) {
            haloRadius += 1;
            if (haloRadius >= 30) haloGrowing = false;
          } else {
            haloRadius -= 1;
            if (haloRadius <= 15) haloGrowing = true;
          }
        }, 50);
      }

      function stopBlinkingHalo() {
        if (haloInterval) {
          clearInterval(haloInterval);
          haloInterval = null;
        }
        if (map.getLayer('sending-school-halo')) {
          map.setPaintProperty('sending-school-halo', 'circle-opacity', 0);
        }
      }

      // Add the sending-school-halo layer on map load
      map.addSource('sending-school', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'sending-school-halo',
        type: 'circle',
        source: 'sending-school',
        paint: {
          'circle-radius': 15,
          'circle-color': '#FFD700',
          'circle-opacity': 0.8,
          'circle-blur': 0.6
        }
      });
    })
    .catch(error => {
      console.error("❌ Failed to load initial map data:", error);
    });

  // --- MAP FILTERS INITIALIZATION ---
  const enrollmentSlider = document.getElementById('enrollmentRangeSlider');
  const seatsSlider = document.getElementById('seatsRangeSlider');
  const minEnrollDisplay = document.getElementById('minEnrollDisplay');
  const maxEnrollDisplay = document.getElementById('maxEnrollDisplay');
  const minSeatsDisplay = document.getElementById('minSeatsDisplay');
  const maxSeatsDisplay = document.getElementById('maxSeatsDisplay');
  const toggleYes = document.getElementById('toggleYes');
  const toggleNo = document.getElementById('toggleNo');
  const schoolTypeFilter = document.getElementById('schoolTypeFilter');
  const unselectAllSchoolsBtn = document.getElementById('unselectAllSchoolsBtn');

  noUiSlider.create(enrollmentSlider, {
    start: [0, 2000], connect: true, step: 10, range: { min: 0, max: 2000 }
  });
  noUiSlider.create(seatsSlider, {
    start: [0, 500], connect: true, step: 1, range: { min: 0, max: 500 }
  });

  enrollmentSlider.noUiSlider.on('update', values => {
    minEnrollment = parseInt(values[0]);
    maxEnrollment = parseInt(values[1]);
    minEnrollDisplay.textContent = minEnrollment;
    maxEnrollDisplay.textContent = maxEnrollment;
    updateLayer();
  });

  seatsSlider.noUiSlider.on('update', values => {
    minSeats = parseInt(values[0]);
    maxSeats = parseInt(values[1]);
    minSeatsDisplay.textContent = minSeats;
    maxSeatsDisplay.textContent = maxSeats;
    updateLayer();
  });

  toggleYes.addEventListener('click', () => {
    showVariableRadius = true;
    toggleYes.classList.add('active');
    toggleNo.classList.remove('active');
    updateLayer();
  });

  toggleNo.addEventListener('click', () => {
    showVariableRadius = false;
    toggleNo.classList.add('active');
    toggleYes.classList.remove('active');
    updateLayer();
  });

  schoolTypeFilter.addEventListener('change', () => {
    selectedTypes = Array.from(schoolTypeFilter.selectedOptions).map(o => o.value);
    updateLayer();
  });

  unselectAllSchoolsBtn.addEventListener('click', () => {
    for (let i = 0; i < schoolTypeFilter.options.length; i++) {
      schoolTypeFilter.options[i].selected = false;
    }
    schoolTypeFilter.dispatchEvent(new Event('change'));
  });

  // --- LEGEND AND TOGGLE LOGIC ---
  const toggleDecisionsBtn = document.getElementById('toggleViewDecisions');
  const toggleAssignmentsBtn = document.getElementById('toggleViewAssignments');
  
  toggleDecisionsBtn.addEventListener('click', () => {
    showingAssignments = false;
    toggleDecisionsBtn.classList.add('active');
    toggleAssignmentsBtn.classList.remove('active');

    if (map.getLayer('schools-layer')) {
      map.setPaintProperty(
        'schools-layer',
        'circle-color',
        ['match', ['get', 'Decision Type'],
          "Ongoing Monitoring & Evaluation", '#3498db',
          "Programmatic Investment", '#27ae60',
          "Building Investment", '#2ecc71',
          "Building & Programmatic Investments", '#1abc9c',
          "Candidate for Building Addition", '#9b59b6',
          "School-specific evaluation of alternative options", '#f1c40f',
          "Possibility of Closure/Merger", '#e74c3c',
          '#7f8c8d']
      );
    }

    if (map.getLayer('assigned-schools-layer')) {
      map.setLayoutProperty(
        'assigned-schools-layer',
        'visibility',
        'none'
      );
    }

    updateLegend();
  });

  toggleAssignmentsBtn.addEventListener('click', () => {
    showingAssignments = true;
    toggleAssignmentsBtn.classList.add('active');
    toggleDecisionsBtn.classList.remove('active');

    if (map.getLayer('schools-layer')) {
      map.setPaintProperty(
        'schools-layer',
        'circle-color',
        '#007cbf'
      );
    }

    if (map.getLayer('assigned-schools-layer')) {
      const assignedSource = map.getSource('assigned-schools');
      const hasAssignments = assignedSource && assignedSource._data?.features?.length > 0;

      map.setLayoutProperty(
        'assigned-schools-layer',
        'visibility',
        hasAssignments ? 'visible' : 'none'
      );
    }

    updateLegend();
  });

  // --- SIDEBAR AND MAP RESIZE LOGIC ---
  const sidebar = document.getElementById('map-sidebar');
  const mapContainer = document.getElementById('map-container');
  const mapToggleGroup = document.getElementById('map-toggle-group');

  // All toggle buttons
  const buttons = {
    wide: [document.getElementById('sidebar-wide-btn'), document.getElementById('flowchart-sidebar-wide-btn')],
    normal: [document.getElementById('sidebar-normal-btn'), document.getElementById('flowchart-sidebar-normal-btn')],
    hidden: [document.getElementById('sidebar-hidden-btn'), document.getElementById('flowchart-sidebar-hidden-btn')],
  };

  function updateSidebarState(newState) {
    const center = map.getCenter();

    // Update sidebar classes
    sidebar.classList.remove('wide', 'hidden');
    if (newState === 'wide' || newState === 'hidden') {
      sidebar.classList.add(newState);
    }
    
    // Update map toggle group classes for positioning
    mapToggleGroup.classList.remove('state-wide', 'state-hidden');
    if (newState === 'wide' || newState === 'hidden') {
      mapToggleGroup.classList.add(`state-${newState}`);
    }

    // Update active class on all relevant buttons
    Object.values(buttons).flat().forEach(btn => btn?.classList.remove('active'));
    buttons[newState].forEach(btn => btn?.classList.add('active'));

    // Recalculate container sizes
    const sidebarWidth = (newState === 'wide') ? 800 : (newState === 'normal') ? 400 : 0;
    const activeContainer = (mapContainer.style.display !== 'none') ? mapContainer : document.getElementById('main-flowchart-container');
    activeContainer.style.flexBasis = `calc(100% - ${sidebarWidth}px)`;

    // Resize map if it's visible
    if (mapContainer.style.display !== 'none') {
      setTimeout(() => {
        map.resize();
        map.setCenter(center);
      }, 350);
    }
  }

  // Add event listeners to all buttons
  Object.entries(buttons).forEach(([state, btnPair]) => {
    btnPair.forEach(btn => btn?.addEventListener('click', () => updateSidebarState(state)));
  });

  // --- INITIAL MARGIN & CENTER ON LOAD ---
  const sidebarWidth = sidebar.offsetWidth;
  mapContainer.style.flexBasis = `calc(100% - ${sidebarWidth}px)`;
  map.resize();

  setTimeout(() => {
    requestAnimationFrame(() => {
      map.setCenter([-72.9279, 41.3083]);
    });
  }, 300);

  // --- IFRAME COMMUNICATION ---
  // The iframe has been removed. All communication is now direct function calls.
  // The DecisionLogic.js script, once loaded, will expose `window.decisionLogic`.
  
  // --- MAP/FLOWCHART TOGGLE ---
  let showingFlowchart = false;
  const toggleMapFlowchartMap = document.getElementById('toggleMapFlowchartMap');
  const toggleMapFlowchartFlowchart = document.getElementById('toggleMapFlowchartFlowchart');
  const toggleMapFlowchartMap2 = document.getElementById('toggleMapFlowchartMap2');
  const toggleMapFlowchartFlowchart2 = document.getElementById('toggleMapFlowchartFlowchart2');
  const toggleViewContainer = document.querySelector('#map-container .toggle-buttons');
  const flowchartContainer = document.getElementById('main-flowchart-container');
  const flowchartSchoolSelect = document.getElementById('mainFlowchartSchoolSelect');

  function switchToFlowchart() {
    showingFlowchart = true;
    flowchartContainer.style.display = 'flex';
    mapContainer.style.display = 'none';
    
    // Update toggle button states
    toggleMapFlowchartMap.classList.remove('active');
    toggleMapFlowchartFlowchart.classList.add('active');
    toggleMapFlowchartMap2.classList.remove('active');
    toggleMapFlowchartFlowchart2.classList.add('active');
    
    // Hide the decisions/assignments toggle when in flowchart view
    toggleViewContainer.style.display = 'none';
    
    if (!window.flowchartInitialized) {
      initializeFlowchart();
    }
  }

  function switchToMap() {
    showingFlowchart = false;
    flowchartContainer.style.display = 'none';
    mapContainer.style.display = 'block';
    
    // Update toggle button states
    toggleMapFlowchartMap.classList.add('active');
    toggleMapFlowchartFlowchart.classList.remove('active');
    toggleMapFlowchartMap2.classList.add('active');
    toggleMapFlowchartFlowchart2.classList.remove('active');
    
    // Show the decisions/assignments toggle when in map view
    toggleViewContainer.style.display = 'flex';
    
    setTimeout(() => {
      map.resize();
    }, 100);
  }

  // Add event listeners for all toggle buttons
  toggleMapFlowchartMap.addEventListener('click', switchToMap);
  toggleMapFlowchartFlowchart.addEventListener('click', switchToFlowchart);
  toggleMapFlowchartMap2.addEventListener('click', switchToMap);
  toggleMapFlowchartFlowchart2.addEventListener('click', switchToFlowchart);

  function initializeFlowchart() {
    console.log("🎯 Initializing flowchart...");
    setupFlowchart();
  }

  function setupFlowchart() {
    console.log("🎯 Setting up flowchart...");
    
    const svg = d3.select("#main-flowchart-svg");
    if (svg.empty()) {
      console.error("❌ Could not find flowchart SVG element");
      return;
    }

    svg.selectAll("*").remove();
    svg.attr("viewBox", "20 -130 520 960").attr("preserveAspectRatio", "xMidYMid meet");

    if (typeof window.initializeFlowchartFromScript === 'function') {
      window.initializeFlowchartFromScript(svg);
    } else {
      console.error("❌ initializeFlowchartFromScript function not found!");
    }

    if (geojsonData && geojsonData.features) {
      flowchartSchoolSelect.innerHTML = '<option value="">-- Select School --</option>';
      geojsonData.features.forEach(feature => {
        const option = document.createElement('option');
        option.value = feature.properties['Building Name'];
        option.textContent = feature.properties['Building Name'];
        flowchartSchoolSelect.appendChild(option);
      });

      flowchartSchoolSelect.addEventListener('change', (e) => {
        const selectedSchool = e.target.value;
        if (selectedSchool && typeof window.updateFlowForSchool === 'function') {
          window.updateFlowForSchool(selectedSchool, window.thresholds || {});
        }
      });
    }

    window.flowchartInitialized = true;
  }
});

// ✅ Inject decisions into geojson features
function normalizeName(name) {
  return name?.toLowerCase().replace(/\s+/g, ' ').trim();
}

function injectDecisionsIntoGeoJSON(geojson, decisions) {
  const decisionMap = new Map(decisions.map(row => [normalizeName(row["Building Name"]), row["decision"] || "Unknown"]));
  const scorecardMap = new Map(decisions.map(row => [normalizeName(row["Building Name"]), parseFloat(row["Scorecard"] || "0")]));
  const buildingQualityMap = new Map(decisions.map(row => [normalizeName(row["Building Name"]), parseFloat(row["BuildingTreshhold"] || "0")]));
  // Add a map for Utilization
  const utilizationMap = new Map(decisions.map(row => [normalizeName(row["Building Name"]), parseFloat(row["Utilization"] || "0")]));

  geojson.features.forEach(f => {
    const name = normalizeName(f.properties["Building Name"]);
    f.properties["Decision Type"] = decisionMap.get(name) || "Unknown";
    f.properties["Scorecard"] = scorecardMap.get(name) || 0;
    f.properties["Building Quality"] = buildingQualityMap.get(name) || 0;
    // Inject Utilization
    f.properties["Utilization"] = utilizationMap.get(name) || 0;
  });
}

function initializeDropdownFilters(schoolData) {
  const allSchoolData = schoolData;
  const decisionFilter = document.getElementById("decisionFilter");
  const schoolSelect = document.getElementById("schoolSelect");

  if (!decisionFilter || !schoolSelect) {
    console.warn("⚠️ Missing #decisionFilter or #schoolSelect element.");
    return;
  }

  const uniqueDecisions = [...new Set(
    allSchoolData.map(row => row.decision || "Unknown")
  )].sort();

  decisionFilter.innerHTML = '<option value="">-- All Decisions --</option>';
  uniqueDecisions.forEach(decision => {
    const option = document.createElement("option");
    option.value = decision;
    option.textContent = decision;
    decisionFilter.appendChild(option);
  });

  function updateSchoolSelect(filterDecision = "") {
    schoolSelect.innerHTML = '<option value="">-- Select --</option>';
    allSchoolData.forEach(row => {
      if (!filterDecision || row.decision === filterDecision) {
        const option = document.createElement("option");
        option.value = row["Building Name"];
        option.textContent = row["Building Name"];
        schoolSelect.appendChild(option);
      }
    });
  }

  updateSchoolSelect(); // Populate with all schools initially

  decisionFilter.addEventListener("change", () => {
    const selectedDecision = decisionFilter.value;
    updateSchoolSelect(selectedDecision);
    console.log("🎯 Updated school list for decision:", selectedDecision);
  });
}

// ✅ Move slider setup inside DOMContentLoaded to ensure elements are loaded
document.addEventListener('DOMContentLoaded', function() {
  // ✅ Set up slider event listeners
  const distanceWeightSlider = document.getElementById('distanceWeightSlider');
  const distanceWeightLabel = document.getElementById('distanceWeightLabel');
  const enrollmentWeightSlider = document.getElementById('enrollmentWeightSlider');
  const enrollmentWeightLabel = document.getElementById('enrollmentWeightLabel');
  const buildingWeightSlider = document.getElementById('buildingWeightSlider');
  const buildingWeightLabel = document.getElementById('buildingWeightLabel');
  const scorecardWeightSlider = document.getElementById('scorecardWeightSlider');
  const scorecardWeightLabel = document.getElementById('scorecardWeightLabel');

  if (distanceWeightSlider && distanceWeightLabel) {
    distanceWeightSlider.addEventListener('input', () => {
      distanceWeightLabel.textContent = distanceWeightSlider.value;
    });
  }
  if (enrollmentWeightSlider && enrollmentWeightLabel) {
    enrollmentWeightSlider.addEventListener('input', () => {
      enrollmentWeightLabel.textContent = enrollmentWeightSlider.value;
    });
  }
  if (buildingWeightSlider && buildingWeightLabel) {
    buildingWeightSlider.addEventListener('input', () => {
      buildingWeightLabel.textContent = buildingWeightSlider.value;
    });
  }
  if (scorecardWeightSlider && scorecardWeightLabel) {
    scorecardWeightSlider.addEventListener('input', () => {
      scorecardWeightLabel.textContent = scorecardWeightSlider.value;
    });
  }

  const select = document.getElementById('schoolSelect');
  const isoDistanceSelect = document.getElementById('isoDistance');
  const manualBtn = document.getElementById('manualBtn');
  const modelBtn = document.getElementById('modelBtn');
  const manualView = document.getElementById('manualView');
  const modelView = document.getElementById('modelView');

  let selectedFeatureForIsochrone = null;

  function triggerIsochroneUpdate() {
      if(selectedFeatureForIsochrone) {
          const [lng, lat] = selectedFeatureForIsochrone.geometry.coordinates;
          const distance = isoDistanceSelect.value;
          drawIsochrone([lng, lat], distance);
      }
  }

  select.addEventListener('change', async function () {
    const selectedSchoolName = this.value;
    selectedFeatureForIsochrone = geojsonData.features.find(
      f => normalize(f.properties['Building Name']) === normalize(selectedSchoolName)
    );

    // Update the highlight layer data source
    const highlightSource = map.getSource('selected-school');
    if (highlightSource) {
      if (selectedFeatureForIsochrone) {
        highlightSource.setData({
          type: 'FeatureCollection',
          features: [selectedFeatureForIsochrone]
        });
      } else {
        // If "-- Select --" is chosen, clear the highlight
        highlightSource.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
    }
    
    if (!selectedFeatureForIsochrone) {
        // Clear isochrone if no school is selected
        if (map.getSource('isochrone')) {
            map.getSource('isochrone').setData({ type: 'FeatureCollection', features: [] });
        }
        document.querySelector("#isoTable tbody").innerHTML = "";
        return;
    }
    
    const [lng, lat] = selectedFeatureForIsochrone.geometry.coordinates;
    selectedEnrollment = parseInt(selectedFeatureForIsochrone.properties['Enrollment']) || 0;
    map.flyTo({ center: [lng, lat], zoom: 14 });

    // Only trigger isochrone update if in manual mode
    if (manualView.style.display !== 'none') {
        triggerIsochroneUpdate();
    } else {
        // Clear isochrone if switching to model mode
        if (map.getSource('isochrone')) {
            map.getSource('isochrone').setData({ type: 'FeatureCollection', features: [] });
        }
        document.querySelector("#isoTable tbody").innerHTML = "";
    }

    // OD Matrix logic for Model Simulation
    odData = [];
    Papa.parse("https://raw.githubusercontent.com/DWieberdink/NHPS/main/OD_Draft.csv" , {
      download: true,
      header: true,
      delimiter: ",",
      skipEmptyLines: true,
      complete: function(results) {
        odData = results.data.filter(row =>
          normalize(row.CurrentSchoolName) === normalize(selectedSchoolName)
        );
        console.log("✅ OD Matrix loaded for:", selectedSchoolName, "Rows:", odData.length);
      },
      error: function(err) {
        console.error("❌ Failed to load OD matrix:", err);
      }
    });

    // --- Blinking Halo Logic ---
    const sendingSource = map.getSource('sending-school');
    if (sendingSource) {
      if (selectedFeatureForIsochrone) {
        sendingSource.setData({
          type: 'FeatureCollection',
          features: [selectedFeatureForIsochrone]
        });
        startBlinkingHalo();
      } else {
        sendingSource.setData({ type: 'FeatureCollection', features: [] });
        stopBlinkingHalo();
      }
    }
  });

  isoDistanceSelect.addEventListener('change', triggerIsochroneUpdate);

  manualBtn.addEventListener('click', () => {
    manualView.style.display = 'block';
    modelView.style.display = 'none';
    manualBtn.classList.add('active');
    modelBtn.classList.remove('active');
    
    // Trigger isochrone update when switching to manual mode if a school is selected
    if (selectedFeatureForIsochrone) {
        triggerIsochroneUpdate();
    }
  });

  modelBtn.addEventListener('click', () => {
    manualView.style.display = 'none';
    modelView.style.display = 'block';
    manualBtn.classList.remove('active');
    modelBtn.classList.add('active');
    
    // Clear isochrone when switching to model mode
    if (map.getSource('isochrone')) {
        map.getSource('isochrone').setData({ type: 'FeatureCollection', features: [] });
    }
    document.querySelector("#isoTable tbody").innerHTML = "";
  });

  // ✅ Debug assign button existence
  const assignButton = document.getElementById('assignButton');
  console.log("🔍 Assign button check during setup:");
  console.log("  assignButton exists:", !!assignButton);
  if (assignButton) {
    console.log("  assignButton text:", assignButton.textContent);
    console.log("  assignButton id:", assignButton.id);
  }

  assignButton.addEventListener('click', async () => {
    console.log("🔘 Assign button clicked!");
    
    // ✅ Get modal elements
    const progressModal = document.getElementById('assignmentProgress');
    const assignedCountElement = document.getElementById('assignedCount');
    const cancelButton = document.getElementById('cancelAssignment');
    
    console.log("🔍 Modal elements check:");
    console.log("  progressModal exists:", !!progressModal);
    console.log("  assignedCountElement exists:", !!assignedCountElement);
    console.log("  cancelButton exists:", !!cancelButton);
    
    // ✅ Show modal and initialize progress
    if (progressModal && assignedCountElement) {
      progressModal.style.display = 'block';
      assignedCountElement.textContent = '0';
      console.log("📊 Modal displayed and progress initialized to 0");
    } else {
      console.error("❌ Modal elements not found!");
      return;
    }

    // ✅ Add cancel functionality
    let assignmentCancelled = false;
    if (cancelButton) {
      cancelButton.onclick = () => {
        assignmentCancelled = true;
        progressModal.style.display = 'none';
        console.log("❌ Assignment cancelled by user");
      };
    }

    // ✅ Function to hide modal
    const hideModal = () => {
      if (progressModal) {
        progressModal.style.display = 'none';
        console.log("✅ Modal hidden");
      }
    };

    // ✅ Function to update progress
    const updateProgress = (count) => {
      if (assignedCountElement) {
        assignedCountElement.textContent = count;
        console.log("📊 Progress updated:", count);
      }
    };

    try {
        const selectedSchoolName = select.options[select.selectedIndex].textContent;
        console.log("🏫 Selected school:", selectedSchoolName);
      
        const studentsToAssign = odData.filter(d =>
          d.CurrentSchoolName &&
          normalize(d.CurrentSchoolName) === normalize(selectedSchoolName)
        );
        console.log("👥 Students to assign:", studentsToAssign.length);

        if (studentsToAssign.length === 0) {
          alert("No students found for the selected school.");
          hideModal();
          return;
        }

        const excluded = new Set(Array.from(document.getElementById("excludedSchools").selectedOptions).map(opt => normalize(opt.value)));
        console.log("🚫 Excluded schools:", excluded.size);

        const schoolLookup = new Map(geojsonData.features.map(f => [normalize(f.properties["Building Name"]), f.properties]));
        const odLookup = new Map();
        odData.forEach(d => {
            if (!odLookup.has(d.StudentID)) {
                odLookup.set(d.StudentID, []);
            }
            odLookup.get(d.StudentID).push(d);
        });

        // ✅ Get slider values directly from DOM elements
        const weightDistance = parseFloat(document.getElementById('distanceWeightSlider').value);
        const weightEnrollment = parseFloat(document.getElementById('enrollmentWeightSlider').value);
        const weightBuilding = parseFloat(document.getElementById('buildingWeightSlider').value);
        const weightScorecard = parseFloat(document.getElementById('scorecardWeightSlider').value);
        console.log("⚖️ Weights - Distance:", weightDistance, "Enrollment:", weightEnrollment, "Building:", weightBuilding, "Scorecard:", weightScorecard);
        
        // ✅ Calculate normalization factors for better scoring
        let maxDistance = 0;
        let maxQuality = 0;
        let maxScorecard = 0;
        let minScorecard = Infinity;
        let maxUtilization = 0;
        
        // Find max values for normalization
        for (const d of odData) {
          if (d.Distance) {
            const distance = parseFloat((d.Distance || "").replace(/[^\d.-]/g, "")) || 0;
            maxDistance = Math.max(maxDistance, distance);
          }
        }
        
        for (const feature of geojsonData.features) {
          const enrollment = parseInt(feature.properties["Enrollment"]) || 0;
          const quality = parseFloat(feature.properties["Building Quality"]) || 0;
          const scorecard = parseFloat(feature.properties["Scorecard"]) || 0;
          const utilization = parseFloat(feature.properties["Utilization"]) || 0;
          
          maxEnrollment = Math.max(maxEnrollment, enrollment);
          maxQuality = Math.max(maxQuality, quality);
          maxScorecard = Math.max(maxScorecard, scorecard);
          minScorecard = Math.min(minScorecard, scorecard);
          maxUtilization = Math.max(maxUtilization, utilization);
        }
        
        console.log("📊 Normalization factors - Max Distance:", maxDistance, "Max Enrollment:", maxEnrollment, "Max Quality:", maxQuality, "Max Scorecard:", maxScorecard, "Min Scorecard:", minScorecard, "Max Utilization:", maxUtilization);
        
        const finalAssignments = {};
        console.log("🔄 Starting assignment algorithm...");
        
        // ✅ Track assigned counts for each school to enforce seat limits
        const assignedCounts = {};
        geojsonData.features.forEach(f => {
            assignedCounts[normalize(f.properties["Building Name"])] = 0;
        });
        
        // ✅ Process students with progress tracking
        let processedCount = 0;
        
        for(const student of studentsToAssign) {
            // ✅ Check if assignment was cancelled
            if (assignmentCancelled) {
              console.log("❌ Assignment cancelled during processing");
              return;
            }
            
            const studentChoices = odLookup.get(student.StudentID) || [];
            const choices = studentChoices.filter(d =>
                d.DestinationSchoolName &&
                normalize(d.DestinationSchoolName) !== normalize(d.CurrentSchoolName) &&
                !excluded.has(normalize(d.DestinationSchoolName))
            );

            let bestSchool = null;
            let bestScore = -Infinity;

            for (const d of choices) {
                const distance = parseFloat((d.Distance || "").replace(/[^\d.-]/g, "")) || 0;
                const destName = normalize(d.DestinationSchoolName);
                const destProperties = schoolLookup.get(destName);
                if (!destProperties) continue;

                // ✅ Check seat availability (capacity constraint)
                const enrollment = parseInt(destProperties["Enrollment"]) || 0;
                const capacity = parseInt(destProperties["Capacity"]) || 0;
                const assignedSoFar = assignedCounts[destName] || 0;
                if ((enrollment + assignedSoFar) >= capacity) {
                    continue; // Skip if assigning would exceed capacity
                }

                const availableSeats = parseInt(destProperties["Available Seats"]) || 0;
                const quality = parseFloat(destProperties["Building Quality"]) || 0;
                const scorecard = parseFloat(destProperties["Scorecard"]) || 0;
                const utilization = parseFloat(destProperties["Utilization"]) || 0;

                // Lower Building Quality (BuildingTreshhold) is better
                const qualityScore = maxQuality > 0 ? (1 - (quality / maxQuality)) : 0; // Lower is better
                const distanceScore = maxDistance > 0 ? (1 - (distance / maxDistance)) : 0; // Closer is better
                const enrollmentScore = maxUtilization > 0 ? (utilization / maxUtilization) : 0; // Higher utilization is better
                // Lower scorecard is better, but 1 is best and 5 is worst
                // Normalize so that 1 gets highest score, 5 gets lowest
                let scorecardScore = 0;
                if (maxScorecard > minScorecard) {
                  scorecardScore = (maxScorecard - scorecard) / (maxScorecard - minScorecard);
                } else {
                  scorecardScore = 1; // If all scorecards are the same
                }

                const score =
                  (weightDistance * distanceScore) +
                  (weightEnrollment * enrollmentScore) +
                  (weightBuilding * qualityScore) +
                  (weightScorecard * scorecardScore);

                // Debug logging for first few choices
                console.log(`🏫 ${destName}: Student=${student.StudentID}, Distance=${distance}(${distanceScore.toFixed(3)}), Utilization=${(utilization * 100).toFixed(1)}%(${enrollmentScore.toFixed(3)}), Quality=${quality}(${qualityScore.toFixed(3)}), Scorecard=${scorecard}(${scorecardScore.toFixed(3)}), Total=${score.toFixed(3)}`);

                if (score > bestScore) {
                  bestScore = score;
                  bestSchool = d.DestinationSchoolName;
                }
            }

            if (bestSchool) {
                finalAssignments[student.StudentID] = bestSchool;
                // ✅ Increment assigned count for the chosen school
                assignedCounts[normalize(bestSchool)]++;
            }
            
            // ✅ Update progress
            processedCount++;
            updateProgress(processedCount);
            
            // Allow UI to update every 5 students
            if (processedCount % 5 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        // ✅ Check if assignment was cancelled before proceeding
        if (assignmentCancelled) {
          console.log("❌ Assignment cancelled after processing");
          return;
        }
        
        console.log("✅ Assignment algorithm completed. Assignments:", Object.keys(finalAssignments).length);

        const summaryCounts = {};
        for (const school of Object.values(finalAssignments)) {
            summaryCounts[school] = (summaryCounts[school] || 0) + 1;
        }
        
        // ✅ Update map with assignment results
        const assignedFeatures = geojsonData.features
          .filter(f => summaryCounts[f.properties['Building Name']])
          .map(f => {
            const assignedCount = summaryCounts[f.properties['Building Name']];
            return {
              type: 'Feature',
              geometry: f.geometry,
              properties: {
                name: f.properties['Building Name'],
                assigned: assignedCount
              }
            };
          });

        const assignedGeoJSON = {
          type: 'FeatureCollection',
          features: assignedFeatures
        };

        // Update the assigned-schools source on the map
        if (map.getSource('assigned-schools')) {
          console.log("🗺️ Updating assigned-schools source with data:", assignedGeoJSON);
          console.log("📊 Number of assigned features:", assignedGeoJSON.features.length);
          console.log("🏫 Assigned schools:", assignedGeoJSON.features.map(f => f.properties.name));
          
          map.getSource('assigned-schools').setData(assignedGeoJSON);
          map.setLayoutProperty('assigned-schools-layer', 'visibility', 'visible');
          
          // ✅ Check if data was set correctly
          setTimeout(() => {
            const source = map.getSource('assigned-schools');
            console.log("🔍 Source data after update:", source._data);
            console.log("👁️ Layer visibility after update:", map.getLayoutProperty('assigned-schools-layer', 'visibility'));
          }, 100);
          
          // ✅ Popup is already set up when layer was created
          console.log("✅ Assigned-schools layer updated");
        } else {
          console.error("❌ assigned-schools source not found!");
        }
        
        // ✅ Switch to assignment view to show the results
        showingAssignments = true;
        if (map.getLayer('schools-layer')) {
          map.setPaintProperty('schools-layer', 'circle-color', '#007cbf');
        }
        
        // Update the toggle button states
        const toggleDecisionsBtn = document.getElementById('toggleViewDecisions');
        const toggleAssignmentsBtn = document.getElementById('toggleViewAssignments');
        if (toggleDecisionsBtn && toggleAssignmentsBtn) {
          toggleDecisionsBtn.classList.remove('active');
          toggleAssignmentsBtn.classList.add('active');
        }
        
        // Update the legend
        updateLegend();
        
        const sortedSummary = Object.entries(summaryCounts).sort((a, b) => b[1] - a[1]);
        let output = `<strong>Most Representative Assignment (Deterministic)</strong><br/>`;
        output += `<table style="width:100%;margin-top:8px;border-collapse:collapse;">`;
        output += `<thead><tr style="background-color:#f2f2f2;">
                    <th style="border:1px solid #ccc;padding:6px;text-align:left;">School Name</th>
                    <th style="border:1px solid #ccc;padding:6px;text-align:left;"># Students</th></tr>
                    </thead><tbody>`;
        for (const [school, count] of sortedSummary) {
            output += `<tr><td class="truncate-cell" data-tooltip="${school}">${school}</td>
                    <td style="border:1px solid #ccc;padding:6px;text-align:center;">${count}</td></tr>`;
        //  output += `<tr><td class=\"truncate-cell\">${school}</td>
                // <td style=\"border:1px solid #ccc;padding:6px;text-align:center;\">${count}</td></tr>`;
        }
        output += `</tbody></table>`;
        
        const chartLabels = [];
        const baseEnrollment = [];
        const simulatedAdds = [];
        const capacity = [];

        for (const [schoolName, added] of Object.entries(summaryCounts)) {
            const school = geojsonData.features.find(f => f.properties['Building Name'] === schoolName);
            if (school) {
                const current = parseInt(school.properties['Enrollment']) || 0;
                const cap = parseInt(school.properties['Capacity']) || 0;
                chartLabels.push(schoolName);
                baseEnrollment.push(current);
                simulatedAdds.push(added);
                capacity.push(cap);
            }
        }

        let totalOriginalDistance = 0;
        let totalAssignedDistance = 0;
        let studentCount = 0;

        studentsToAssign.forEach(student => {
            const sid = student.StudentID;
            const original = odData.find(d => d.StudentID === sid && normalize(d.CurrentSchoolName) === normalize(d.DestinationSchoolName));
            if (original) totalOriginalDistance += parseFloat(original.Distance);

            const assignedSchool = finalAssignments[sid];
            const reassigned = odData.find(d => d.StudentID === sid && normalize(d.DestinationSchoolName) === normalize(assignedSchool));
            if (reassigned) totalAssignedDistance += parseFloat(reassigned.Distance);

            studentCount++;
        });

        const avgOriginal = totalOriginalDistance / studentCount;
        const avgAssigned = totalAssignedDistance / studentCount;
        
        const resultsData = {
            summaryHTML: output,
            enrollmentChartData: {
                labels: chartLabels,
                datasets: [
                    { label: 'Current Enrollment', data: baseEnrollment, backgroundColor: '#0033A0', barThickness: 12 },
                    { label: 'New Assignments', data: simulatedAdds, backgroundColor: '#FFC72C', barThickness: 12 },
                    { label: 'Capacity', data: capacity, type: 'line', borderColor: '#FF530D', borderWidth: 2, pointStyle: 'diamond', pointRadius: 7, showLine: false, fill: '#FF530D', yAxisID: 'y' }
                ]
            },
            distanceChartData: {
                labels: ['Current School', 'Assigned School'],
                datasets: [{ label: 'Avg Distance (mi)', data: [avgOriginal.toFixed(2), avgAssigned.toFixed(2)], backgroundColor: ['#0033A0', '#ffcc00'] }]
            },
            assignments: finalAssignments,
            selectedSchoolName: selectedSchoolName
        };

        console.log("📤 Sending results directly to DecisionLogic...");
        if (window.decisionLogic && window.decisionLogic.handleAssignmentResults) {
            console.log("📤 Sending results directly to DecisionLogic...");
            window.decisionLogic.handleAssignmentResults(resultsData);
        } else {
            console.error("❌ DecisionLogic handler not found!");
        }

        // ✅ Hide the modal when assignment completes
        hideModal();
        console.log("✅ Assignment process completed successfully!");

        // Open the Model Output: Impact Analysis section
        const scenarioOutputPanel = document.getElementById('scenario-output-panel');
        if (scenarioOutputPanel) {
          scenarioOutputPanel.open = true;
        }

    } catch (error) {
        console.error('❌ Error in assignment process:', error);
        // ✅ Hide the modal on error too
        hideModal();
        alert('An error occurred during the assignment process. Please try again.');
    }
  });
});

let currentIsochronePolygon = null;

async function drawIsochrone(centerCoords, distanceMeters) {
  if (!centerCoords || !distanceMeters) return;
  try {
      const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${centerCoords[0]},${centerCoords[1]}?contours_meters=${distanceMeters}&polygons=true&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!data.features || data.features.length === 0) {
          console.warn("No isochrone feature returned from API.");
          if (map.getSource('isochrone')) {
            map.getSource('isochrone').setData({ type: 'FeatureCollection', features: [] });
          }
          return;
      }
      const simplified = turf.simplify(data.features[0], { tolerance: 0.001, highQuality: true });
      
      if (map.getSource('isochrone')) {
        map.getSource('isochrone').setData(simplified);
      } else {
        map.addSource('isochrone', { type: 'geojson', data: simplified });
        map.addLayer({
          id: 'isochrone-layer',
          type: 'fill',
          source: 'isochrone',
          paint: { 'fill-color': '#1E90FF', 'fill-opacity': 0.3 }
        });
      }
      
      currentIsochronePolygon = simplified;
      filterSchoolsInIsochrone(currentIsochronePolygon);
  } catch (err) {
    console.error('Failed to fetch or display isochrone:', err);
  }
}

function filterSchoolsInIsochrone(polygon) {
  const isoTableBody = document.querySelector("#isoTable tbody");
  if (!isoTableBody) return;

  const visibleFeatures = geojsonData.features.filter(f => turf.booleanPointInPolygon(f.geometry, polygon));

  isoTableBody.innerHTML = '';
  visibleFeatures.forEach(f => {
    const row = document.createElement('tr');
    const name = f.properties['Building Name'];
    const originalSeats = parseInt(f.properties['Available Seats']) || 0;

    row.innerHTML = `
      <td class="truncate-cell" data-tooltip="${name}">${name}</td>
      <td class="percent-cell"><input type="number" class="assign-percent" min="0" max="100" value="0" /> <span>%</span></td>
      <td class="assigned-count text-center">0</td>
      <td class="updated-seats text-center">${originalSeats}</td>
    `;
    isoTableBody.appendChild(row);
  });

  addPercentageListeners(visibleFeatures);
}

function addPercentageListeners(visibleFeatures) {
  const inputs = document.querySelectorAll('.assign-percent');
  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      if(i >= visibleFeatures.length) return;
      const percent = parseFloat(input.value) || 0;
      const assignedCell = input.closest('tr').querySelector('.assigned-count');
      const updatedCell = input.closest('tr').querySelector('.updated-seats');

      const assignedStudents = Math.round((percent / 100) * selectedEnrollment);
      const originalSeats = parseInt(visibleFeatures[i].properties['Available Seats']) || 0;
      const remainingSeats = originalSeats - assignedStudents;

      assignedCell.textContent = assignedStudents;
      updatedCell.textContent = remainingSeats;
    });
  });
}

// ✅ New script to connect sidebar sliders to the DecisionLogic iframe - REPLACED
document.addEventListener("DOMContentLoaded", function() {
    const sliderIds = [
      "utilSlider", "utilHighSlider", "growthSlider", 
      "projUtilSlider", "distSlider", "buildSlider", "progSlider"
    ];

    const sliders = sliderIds.map(id => document.getElementById(id));

    function sendSliderData() {
      const thresholds = {
        utilization: parseFloat(document.getElementById("utilSlider").value)/100,
        utilizationHigh: parseFloat(document.getElementById("utilHighSlider").value)/100,
        enrollmentGrowth: parseFloat(document.getElementById("growthSlider").value)/100,
        projectedUtilization: parseFloat(document.getElementById("projUtilSlider").value)/100,
        distanceUnderutilized: parseFloat(document.getElementById("distSlider").value),
        buildingThreshold: parseFloat(document.getElementById("buildSlider").value),
        adequateProgramsMin: parseInt(document.getElementById("progSlider").value, 10),
      };
      
      // Store thresholds globally for flowchart access
      window.thresholds = thresholds;
      
      if (window.decisionLogic) {
        window.decisionLogic.updateThresholds(thresholds);
        const updatedSchoolData = window.decisionLogic.schoolData;
        
        if (geojsonData && map.getSource('schools')) {
          injectDecisionsIntoGeoJSON(geojsonData, updatedSchoolData);
          map.getSource('schools').setData(geojsonData);
          updateLegend();
        }
      } else {
        console.warn("⚠️ DecisionLogic not ready, cannot send slider data.");
      }

      // ✅ Update flowchart node labels with new threshold values
      if (typeof window.FlowUtils !== 'undefined' && typeof window.FlowUtils.updateNodeLabels === 'function') {
        window.FlowUtils.updateNodeLabels();
      }
      
      // ✅ Update flowchart path for currently selected school
      const flowchartSelect = document.getElementById('mainFlowchartSchoolSelect');
      if (flowchartSelect && flowchartSelect.value && typeof window.updateFlowForSchool === 'function') {
        window.updateFlowForSchool(flowchartSelect.value, thresholds);
      }
    }

    sliders.forEach(slider => {
      if (slider) {
        // Use 'input' for real-time updates
        slider.addEventListener("input", () => {
          const outSpan = document.getElementById(slider.id.replace("Slider", "Out"));
          if (outSpan) outSpan.textContent = slider.value;
          sendSliderData(); // Call the main update function
        });
      }
    });

    // Set initial values on load
    if (sliders.every(s => s)) {
      sendSliderData();
    }
});

// --- ONBOARDING WALKTHROUGH LOGIC ---
function startOnboardingWalkthrough() {
  console.log('🚀 Starting onboarding walkthrough...');
  
  const steps = [
    {
      target: 'body',
      title: 'How to use this Tool',
      text: 'We will walk you through the main features of this tool. You can skip this explanation at any time.',
      isIntro: true
    },
    {
      target: '#sidebar',
      title: 'Sidebar',
      text: 'This is the main sidebar. It contains navigation and controls for the planning tool.'
    },
    {
      target: '#decision-input-panel',
      title: 'School Decision Evaluation',
      text: 'Adjust how schools are evaluated using these sliders. This affects the results and recommendations.'
    },
    {
      target: '#scenario-input-panel',
      title: 'Scenario Modeling',
      text: 'Test and evaluate the impact of different portfolio decisions here.'
    },
    {
      target: '#map-container',
      title: 'Map',
      text: 'The map shows all schools and their current status. You can interact with the map to explore data.'
    },
    {
      target: '#main-flowchart-container',
      title: 'Flowchart',
      text: 'The flowchart visualizes the decision logic for a selected school.'
    },
    {
      target: '#decision-output-panel',
      title: 'School Decision Evaluation: Results',
      text: 'This section shows the results of your evaluation. It summarizes recommended actions for each school based on the criteria you set on the left. You can view both a summary and detailed results for each school.'
    },
    {
      target: '#scenario-output-panel',
      title: 'Model Output: Impact Analysis',
      text: 'After running a scenario or simulation, this section displays the impact analysis, including changes in enrollment, utilization, and travel distances for students. Use this to understand the effects of your decisions on the school system.'
    }
  ];

  let currentStep = 0;
  let overlay = null;
  let popup = null;

  function showStep(stepIdx) {
    console.log(`📋 Showing step ${stepIdx}: ${steps[stepIdx].target}`);
    
    try {
      // Remove previous overlay/popup
      if (overlay) overlay.remove();
      if (popup) popup.remove();

      const step = steps[stepIdx];
      let target = document.querySelector(step.target);
      
      console.log(`🎯 Target element found:`, target);
      
      // Open dropdown <details> if the step is for a details section
      const detailsIds = ['#decision-input-panel', '#scenario-input-panel', '#decision-output-panel', '#scenario-output-panel'];
      if (detailsIds.includes(step.target) && target && !target.open) {
        console.log(`📂 Opening details element: ${step.target}`);
        target.open = true;
      }

      // --- ADD THIS: If the step is the flowchart, switch to flowchart view ---
      if (step.target === '#main-flowchart-container') {
        // This is the flowchart step; show the flowchart view
        const flowchartBtn = document.getElementById('toggleMapFlowchartFlowchart');
        if (flowchartBtn && !flowchartBtn.classList.contains('active')) {
          console.log('🔄 Switching to flowchart view');
          flowchartBtn.click();
        }
      }

      // For scenario/model output, wait for the section to open before highlighting
      if ((step.target === '#scenario-input-panel' || step.target === '#scenario-output-panel') && target) {
        // Scroll into view
        target.scrollIntoView({behavior: 'smooth', block: 'center'});
        setTimeout(() => {
          drawHighlight(target, step, stepIdx);
        }, 200);
        // Draw popup after highlight
        setTimeout(() => {
          drawPopup(target, step, stepIdx);
        }, 210);
        return;
      }

      if (!target) {
        console.warn(`⚠️ Target element not found: ${step.target}, skipping to next step`);
        nextStep();
        return;
      }

      // Default: draw highlight and popup immediately
      drawHighlight(target, step, stepIdx);
      drawPopup(target, step, stepIdx);
    } catch (error) {
      console.error('❌ Error in showStep:', error);
      // Continue to next step on error
      nextStep();
    }
  }

  function drawHighlight(target, step, stepIdx) {
    try {
      console.log(`🎨 Drawing highlight for step ${stepIdx}`);
      
      // Create overlay
      overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(0,0,0,0.1)';
      overlay.style.zIndex = '20000';
      overlay.style.pointerEvents = 'auto';
      document.body.appendChild(overlay);

      // Highlight target (skip for intro step)
      let rect = {left: 0, top: 0, width: 0, height: 0};
      let highlight = null;
      if (!step.isIntro) {
        rect = target.getBoundingClientRect();
        highlight = document.createElement('div');
        highlight.style.position = 'fixed';
        highlight.style.left = rect.left + 'px';
        highlight.style.top = rect.top + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        highlight.style.border = '3px solid #FFD600';
        highlight.style.borderRadius = '10px';
        highlight.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.7)';
        highlight.style.zIndex = '20001';
        highlight.style.pointerEvents = 'none';
        document.body.appendChild(highlight);
        overlay.appendChild(highlight);
      }
    } catch (error) {
      console.error('❌ Error in drawHighlight:', error);
    }
  }

  function drawPopup(target, step, stepIdx) {
    try {
      console.log(`💬 Drawing popup for step ${stepIdx}`);
      
      // Create popup
      popup = document.createElement('div');
      popup.style.position = 'fixed';
      if (step.isIntro) {
        popup.style.left = '50%';
        popup.style.top = '20%';
        popup.style.transform = 'translate(-50%, 0)';
      } else if (step.target === '#decision-output-panel' || step.target === '#scenario-output-panel') {
        // Position to the left of the panel, with a larger gap
        const rect = target.getBoundingClientRect();
        const popupWidth = 340;
        const gap = 100; // Consistent gap for both panels
        popup.style.left = (rect.left - popupWidth - gap > 20 ? rect.left - popupWidth - gap : 20) + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.right = '';
        popup.style.transform = '';
      } else {
        const rect = target.getBoundingClientRect();
        popup.style.left = (rect.left + rect.width + 20) + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.transform = '';
      }
      popup.style.background = '#fff';
      popup.style.color = '#222';
      popup.style.border = '2px solid #007cbf';
      popup.style.borderRadius = '8px';
      popup.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)';
      popup.style.padding = '24px 32px';
      popup.style.zIndex = '20002';
      popup.style.maxWidth = '340px';
      popup.style.fontSize = '16px';
      popup.innerHTML = `<h3 style='margin-top:0;color:#007cbf;'>${step.title}</h3><p>${step.text}</p>`;
      // Next/Close/Skip button(s)
      if (step.isIntro) {
        // Skip button
        const skipBtn = document.createElement('button');
        skipBtn.textContent = 'Skip';
        skipBtn.style.marginTop = '18px';
        skipBtn.style.background = '#e74c3c';
        skipBtn.style.color = '#fff';
        skipBtn.style.border = 'none';
        skipBtn.style.borderRadius = '4px';
        skipBtn.style.padding = '8px 20px';
        skipBtn.style.fontSize = '16px';
        skipBtn.style.cursor = 'pointer';
        skipBtn.style.marginRight = '12px';
        skipBtn.onclick = endWalkthrough;
        popup.appendChild(skipBtn);
        // Start button
        const startBtn = document.createElement('button');
        startBtn.textContent = 'Start Tour';
        startBtn.style.marginTop = '18px';
        startBtn.style.background = '#007cbf';
        startBtn.style.color = '#fff';
        startBtn.style.border = 'none';
        startBtn.style.borderRadius = '4px';
        startBtn.style.padding = '8px 20px';
        startBtn.style.fontSize = '16px';
        startBtn.style.cursor = 'pointer';
        startBtn.onclick = nextStep;
        popup.appendChild(startBtn);
      } else {
        const btn = document.createElement('button');
        btn.textContent = (stepIdx === steps.length - 1) ? 'Finish' : 'Next';
        btn.style.marginTop = '18px';
        btn.style.background = '#007cbf';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.padding = '8px 20px';
        btn.style.fontSize = '16px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => {
          if (stepIdx === steps.length - 1) {
            endWalkthrough();
          } else {
            nextStep();
          }
        };
        popup.appendChild(btn);
      }
      document.body.appendChild(popup);
    } catch (error) {
      console.error('❌ Error in drawPopup:', error);
    }
  }

  function nextStep() {
    currentStep++;
    if (currentStep < steps.length) {
      showStep(currentStep);
    } else {
      endWalkthrough();
    }
  }

  function endWalkthrough() {
    console.log('🏁 Ending walkthrough');
    if (overlay) overlay.remove();
    if (popup) popup.remove();
  }

  // Add a small delay to ensure DOM is ready
  setTimeout(() => {
    showStep(currentStep);
  }, 100);
}
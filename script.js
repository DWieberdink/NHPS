mapboxgl.accessToken = 'pk.eyJ1IjoicGF0d2QwNSIsImEiOiJjbTZ2bGVhajIwMTlvMnFwc2owa3BxZHRoIn0.moDNfqMUolnHphdwsIF87w';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-72.9279, 41.3083], // New Haven, CT
  zoom: 12
});

let geojsonData;
let selectedEnrollment = 0;
let odData = [];
let selectedTypes = [];
let minEnrollment = 0;
let maxEnrollment = 2000;
let minSeats = 0;
let maxSeats = 500;
let showVariableRadius = false;

       // ✅ Connect to Filter.JS
       window.addEventListener("message", (event) => {
        if (event.data?.from === "FiltersPanel") {
          const settings = event.data.filterSettings;
          minEnrollment = settings.minEnrollment;
          maxEnrollment = settings.maxEnrollment;
          minSeats = settings.minSeats;
          maxSeats = settings.maxSeats;
          showVariableRadius = settings.showVariableRadius;
          selectedTypes = settings.schoolTypes;
      
          updateLayer();
          if (currentIsochronePolygon) {
            filterSchoolsInIsochrone(currentIsochronePolygon);
          }
        }
      });

function updateLayer() {
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

  // map.setPaintProperty('schools-layer', 'circle-radius',
  //   showVariableRadius
  //     ? ['interpolate', ['linear'], ['get', 'Available Seats'], 0, 4, 200, 20]
  //     : 6
  // );
}

function normalize(str) {
    return str?.toLowerCase().replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
  }
  

map.on('load', () => {
  // --- MAP DATA AND LAYERS ---
  fetch('NHPSSchools.geojson')
    .then(response => response.json())
    .then(data => {
      geojsonData = data;

const excludeSelect = document.getElementById("excludedSchools");

// Populate options
geojsonData.features.forEach(f => {
  const option = document.createElement("option");
  option.value = normalize(f.properties["Building Name"]);
  option.textContent = f.properties["Building Name"];
  excludeSelect.appendChild(option);
});

// Enhance with Choices.js
const choices = new Choices(excludeSelect, {
  removeItemButton: true,
  placeholder: true,
  placeholderValue: 'Select schools to exclude',
  searchPlaceholderValue: 'Search schools'
});

       geojsonData.features.forEach(f => {
      if (!f.properties["Decision Type"]) {
        f.properties["Decision Type"] = "Unknown";
      }
    });

      map.addSource('schools', {
        type: 'geojson',
        data: geojsonData
      });
      
      map.addLayer({
        id: 'schools-layer',
        type: 'circle',
        source: 'schools',
        paint: {
          'circle-radius': 6,
          'circle-color': '#7f8c8d'  // default color at map load
        }
      });

      // Hover popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.on('mouseenter', 'schools-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const coordinates = e.features[0].geometry.coordinates.slice();
        const schoolName = e.features[0].properties['Building Name'];
        popup.setLngLat(coordinates).setHTML(`<strong>${schoolName}</strong>`).addTo(map);
      });

      map.on('mouseleave', 'schools-layer', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.setPaintProperty('schools-layer', 'circle-color', [
        'match', ['get', 'Decision Type'],
        "Ongoing Monitoring & Evaluation", '#3498db',
        "Programmatic Investment", '#27ae60',
        "Building Investment", '#2ecc71',
        "Building & Programmatic Investments", '#1abc9c',
        "Candidate for Building Addition", '#9b59b6',
        "School-specific evaluation of alternative options", '#f1c40f',
        "Possibility of Closure/Merger", '#e74c3c',
        '#7f8c8d'
      ]);

      map.addSource('assigned-schools', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } // placeholder
      });
      
      map.addLayer({
        id: 'assigned-schools-layer',
        type: 'circle',
        source: 'assigned-schools',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'assigned'],
            0, 4,
            10, 8,
            50, 16,
            100, 24
          ],
          'circle-color': '#FF530D',
          'circle-opacity': 0.8,
          'circle-stroke-color': '#333',
          'circle-stroke-width': 1
        }
      });

      // Optional: move it above or below
      map.moveLayer('assigned-schools-layer', 'schools-layer'); // comment out to place it below
    });

  // --- LEGEND AND TOGGLE LOGIC ---
  let showingAssignments = false;
  function updateLegend() {
    const legendContent = document.getElementById('legend-content');
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

  const toggleBtn = document.getElementById('toggleView');
  toggleBtn.addEventListener('click', () => {
    showingAssignments = !showingAssignments;

    if (map.getLayer('schools-layer')) {
      map.setPaintProperty(
        'schools-layer',
        'circle-color',
        showingAssignments
          ? '#007cbf'
          : ['match', ['get', 'Decision Type'],
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
      const assignedSource = map.getSource('assigned-schools');
      const hasAssignments = assignedSource && assignedSource._data?.features?.length > 0;

      map.setLayoutProperty(
        'assigned-schools-layer',
        'visibility',
        (showingAssignments && hasAssignments) ? 'visible' : 'none'
      );
    }

    toggleBtn.textContent = showingAssignments ? 'Show Decisions' : 'Show Assignments';
    updateLegend();
  });

  // --- SIDEBAR AND MAP RESIZE LOGIC ---
  const sidebar = document.getElementById('map-sidebar');
  const toggleButton = document.getElementById('map-sidebar-toggle');
  const mapContainer = document.getElementById('map-container');

  toggleButton.addEventListener('click', () => {
    const center = map.getCenter();
    sidebar.style.width = '';
    const isHidden = sidebar.classList.toggle('hidden');

    // Compute actual visible width based on current style
    const sidebarWidth = isHidden ? 0 : sidebar.offsetWidth;
    mapContainer.style.flexBasis = isHidden ? '100%' : `calc(100% - ${sidebarWidth}px)`;

    setTimeout(() => {
      map.resize();
      map.setCenter(center);
    }, 350);
  });

  // --- INITIAL MARGIN & CENTER ON LOAD ---
  const sidebarWidth = sidebar.offsetWidth;
  mapContainer.style.flexBasis = `calc(100% - ${sidebarWidth}px)`;
  map.resize();

  // Defer center set after a couple of frames
  setTimeout(() => {
    requestAnimationFrame(() => {
      map.setCenter([-72.9279, 41.3083]);
    });
  }, 300);
});


// ✅ Inject decisions into geojson features
function normalizeName(name) {
  return name?.toLowerCase().replace(/\s+/g, ' ').trim();
}

function injectDecisionsIntoGeoJSON(geojson, decisions) {
  const decisionMap = new Map(decisions.map(row => [normalizeName(row["Building Name"]), row["decision"] || "Unknown"]));

  geojson.features.forEach(f => {
    const name = normalizeName(f.properties["Building Name"]);
    f.properties["Decision Type"] = decisionMap.get(name) || "Unknown";
  });
}

window.addEventListener("message", (event) => {
  const { from, schoolData } = event.data || {};

  if (from === "DecisionLogic-A" && Array.isArray(schoolData)) {
    console.log("✅ Received updated schoolData for map");

    injectDecisionsIntoGeoJSON(geojsonData, schoolData);
    map.getSource("schools").setData(geojsonData); // Refresh with new properties

    // 👇 Update decision layer color
    if (map.getLayer("schools-layer")) {
      map.setPaintProperty('schools-layer', 'circle-color', [
        'match', ['get', 'Decision Type'],
        "Ongoing Monitoring & Evaluation", '#3498db', // blue
        "Programmatic Investment", '#27ae60',          // green
        "Building Investment", '#2ecc71',              // lighter green
        "Building & Programmatic Investments", '#1abc9c', // teal
        "Candidate for Building Addition", '#9b59b6',  // purple
        "School-specific evaluation of alternative options", '#f1c40f', // yellow
        "Possibility of Closure/Merger", '#e74c3c',     // red
        '#7f8c8d' // fallback color if no match
      ]);
    }
  }
 map.setPaintProperty('schools-layer', 'circle-radius',
    showVariableRadius
      ? ['interpolate', ['linear'], ['get', 'Available Seats'], 0, 4, 200, 20]
      : 6
  );
  updateLegend();

}); 


      const distanceWeightSlider = document.getElementById('distanceWeightSlider');
      const distanceWeightLabel = document.getElementById('distanceWeightLabel');

      const enrollmentWeightSlider = document.getElementById('distanceWeightSlider');
      const enrollmentWeightLabel = document.getElementById('distanceWeightLabel');
      
      distanceWeightSlider.addEventListener('input', () => {
        distanceWeightLabel.textContent = distanceWeightSlider.value;
      });
      
      async function drawIsochrone(centerCoords, distanceMeters) {
        try {
            const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${centerCoords[0]},${centerCoords[1]}?contours_meters=${distanceMeters}&polygons=true&access_token=${mapboxgl.accessToken}`; 
            const res = await fetch(url);
            const data = await res.json();
            
            // Smooth the polygon
            const simplified = turf.simplify(data.features[0], { tolerance: 0.001, highQuality: true });
            
            if (map.getSource('isochrone')) {
              map.getSource('isochrone').setData(simplified);
            } else {
              map.addSource('isochrone', {
                type: 'geojson',
                data: simplified
              });
            
              map.addLayer({
                id: 'isochrone-layer',
                type: 'fill',
                source: 'isochrone',
                paint: {
                  'fill-color': '#1E90FF',
                  'fill-opacity': 0.3
                }
              });
            }
            
            currentIsochronePolygon = simplified;
            filterSchoolsInIsochrone(currentIsochronePolygon);
            


        } catch (err) {
          console.error('Failed to fetch or display isochrone:', err);
        }
      }

      function filterSchoolsInIsochrone(polygon) {
        const schoolTypeFilter = document.getElementById('schoolTypeFilter');
        const selectedTypes = Array.from(schoolTypeFilter.selectedOptions).map(opt => opt.value);
      

const visibleFeatures = geojsonData.features.filter(f => {
  const isInside = turf.booleanPointInPolygon(f.geometry, polygon);
  const level = f.properties['School Level'];
  const matchesType = selectedTypes.length === 0 || selectedTypes.includes(level);
  return isInside && matchesType;
});


        isoTableBody.innerHTML = '';

        visibleFeatures.forEach((f, idx) => {
          const row = document.createElement('tr');
          const name = f.properties['Building Name'];
          const originalSeats = parseInt(f.properties['Available Seats']) || 0;

          row.innerHTML = `
            <td>${name}</td>
            <td class="percent-cell">
                <input type="number" class="assign-percent" min="0" max="100" value="0" /> <span>%</span>
            </td>
            <td class="assigned-count">0</td>
            <td class="updated-seats">${originalSeats}</td>
          `;

          isoTableBody.appendChild(row);
        });

        addPercentageListeners(visibleFeatures);
      }

      function addPercentageListeners(visibleFeatures) {
        const inputs = document.querySelectorAll('.assign-percent');
        inputs.forEach((input, i) => {
          input.addEventListener('input', () => {
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

document.addEventListener('DOMContentLoaded', function() {
  const select = document.getElementById('schoolSelect');
  const distanceWeightSlider = document.getElementById('distanceWeightSlider');
  const summaryDiv = document.getElementById('assignmentSummary');

  select.addEventListener('change', async function () {
    console.log("Dropdown changed!");
    const selectedSchoolName = this.value;
    console.log("Selected school name:", selectedSchoolName);
    const selectedFeature = geojsonData.features.find(
      f => normalize(f.properties['Building Name']) === normalize(selectedSchoolName)
    );
    console.log("Selected feature:", selectedFeature);
    if (!selectedFeature) {
      console.log("No selected feature, returning early.");
      return;
    }
    const [lng, lat] = selectedFeature.geometry.coordinates;
    selectedEnrollment = parseInt(selectedFeature.properties['Enrollment']) || 0;
    map.flyTo({ center: [lng, lat], zoom: 15 });

    // ✅ Re-load OD data based on school name
    odData = [];

    console.log("About to start PapaParse");
    //odmatrix
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
        console.log("Matching rows for", selectedSchoolName, ":", odData);
      },
      error: function(err) {
        console.error("❌ Failed to load OD matrix:", err);
      }
    });
  });

  function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
  }

  function hideLoadingModal() {
    document.getElementById('loadingModal').style.display = 'none';
  }

  document.getElementById('assignButton').addEventListener('click', async () => {
    showLoadingModal();

    try {
      const selectedSchoolName = select.options[select.selectedIndex].textContent;
      const weightPower = parseFloat(distanceWeightSlider.value);

      odData.forEach(row => {
        console.log("Comparing:", normalize(row.CurrentSchoolName), "vs", normalize(selectedSchoolName));
      });

      if (!odData || odData.length === 0) {
        alert("OD matrix not loaded.");
        return;
      }

      const studentsToAssign = odData.filter(d =>
        d.CurrentSchoolName &&
        normalize(d.CurrentSchoolName) === normalize(selectedSchoolName)
      );

      const destinationCounts = {};

      studentsToAssign.forEach(student => {
        const studentID = student.StudentID;

        const allRows = odData.filter(d => d.StudentID === studentID);

        const destinations = [...new Set(
          allRows
            .filter(d => normalize(d.DestinationSchoolName) !== normalize(d.CurrentSchoolName))
            .map(d => normalize(d.DestinationSchoolName))
        )];

        destinationCounts[studentID] = destinations.length;
      });

      const countHistogram = {};
      Object.values(destinationCounts).forEach(count => {
        countHistogram[count] = (countHistogram[count] || 0) + 1;
      });

      const assignmentFrequencies = {};

      document.getElementById("assignmentProgress").style.display = "block";
      document.getElementById("assignedCount").textContent = "0";
      
      let simulatedCount = 0;
      const targetCount = studentsToAssign.length;
      const simulatedStep = Math.max(1, Math.floor(targetCount / 60));
      const countElem = document.getElementById("assignedCount");
      
      const simulatedCounter = setInterval(() => {
        simulatedCount += simulatedStep;
        if (simulatedCount >= targetCount) {
          simulatedCount = targetCount;
          clearInterval(simulatedCounter);
        }
        countElem.textContent = simulatedCount;
      }, 30);
      

// ✅ Let the browser render the popup first
setTimeout(async () => {
const liveAssignedStudents = new Set(); // ✅ Track unique students assigned
      for (let run = 0; run < 30; run++) {
        await new Promise(resolve => setTimeout(resolve, 0));
        const runAssignments = {};
  
        studentsToAssign.forEach(student => {
          const choices = odData.filter(d =>
            d.StudentID === student.StudentID &&
            d.DestinationSchoolName &&
            normalize(d.DestinationSchoolName) !== normalize(d.CurrentSchoolName)
          );
  
          const excluded = Array.from(document.getElementById("excludedSchools").selectedOptions)
                      .map(opt => normalize(opt.value));

        const weighted = choices
          .filter(d => !excluded.includes(normalize(d.DestinationSchoolName)))
          .map(d => {
            const distance = parseFloat((d.Distance || "").replace(/[^\d.-]/g, ""));
            const weight = 1 / Math.pow(distance + 1, weightPower);
            return { school: d.DestinationSchoolName, weight };
          });

  
          const totalWeight = weighted.reduce((sum, d) => sum + d.weight, 0);
          let rand = Math.random() * totalWeight;
  
          for (const choice of weighted) {
            rand -= choice.weight;
            if (rand <= 0) {
              runAssignments[student.StudentID] = choice.school;
              break;
            }
          }
        });
  
        for (const [studentID, school] of Object.entries(runAssignments)) {
          if (!assignmentFrequencies[studentID]) {
            assignmentFrequencies[studentID] = {};
          }
          assignmentFrequencies[studentID][school] = (assignmentFrequencies[studentID][school] || 0) + 1;
        
        }
      }
  
      const finalAssignments = {};
      for (const [studentID, schoolCounts] of Object.entries(assignmentFrequencies)) {
        const mostFrequent = Object.entries(schoolCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        finalAssignments[studentID] = mostFrequent;
      }

      clearInterval(simulatedCounter); // ✅ stop the animation

      const finalCount = Object.keys(finalAssignments).length;
      document.getElementById("assignedCount").textContent = finalCount;
      
      setTimeout(() => {
        document.getElementById("assignmentProgress").style.display = "none";
      }, 500);
      const summaryCounts = {};
      for (const school of Object.values(finalAssignments)) {
        summaryCounts[school] = (summaryCounts[school] || 0) + 1;
      }
  
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
  
      map.getSource('assigned-schools').setData(assignedGeoJSON);
      if (map.getLayer('assigned-schools-layer')) {
        map.setLayoutProperty('assigned-schools-layer', 'visibility', 'visible');
      }
      
      console.log('Assigned features count:', assignedGeoJSON.features.length);
      console.log('Assigned source data:', map.getSource('assigned-schools')._data);  
  
      let output = `<strong>Most Representative Assignment (30 Simulations)</strong><br/><ul>`;
      for (const [school, count] of Object.entries(summaryCounts)) {
        output += `<li>${school}: ${count} students</li>`;
      }
      output += `</ul>`;
      summaryDiv.innerHTML = output;
  
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
  
      if (window.assignmentChartInstance) {
        window.assignmentChartInstance.destroy();
      }
  
      const canvas = document.getElementById('assignmentChart');
      canvas.height = chartLabels.length * 14;
  
      const ctx = canvas.getContext('2d');
      window.assignmentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [
            {
              label: 'Current Enrollment',
              data: baseEnrollment,
              backgroundColor: '#0033A0',
              barThickness: 12
            },
            {
              label: 'New Assignments',
              data: simulatedAdds,
              backgroundColor: '#FFC72C',
              barThickness: 12
            },
            {
              label: 'Capacity',
              data: capacity,
              type: 'line',
              borderColor: '#FF530D',
              borderWidth: 2,
              pointStyle: 'diamond',
              pointRadius: 7,
              showLine: false,
              fill: "#FF530D",
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          layout: { padding: { top: 0, bottom: 0 } },
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: 'Students'
              }
            },
            y: {
              stacked: true
            }
          },
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
  
      const csvRows = [['StudentID', 'AssignedSchool']];
      for (const [studentID, assignedSchool] of Object.entries(finalAssignments)) {
        csvRows.push([studentID, assignedSchool]);
      }
  
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
link.setAttribute('href', url);
link.setAttribute('download', `student_assignments_${selectedSchoolName.replace(/\s+/g, '_')}.csv`);
link.textContent = 'Download Assignment CSV';
link.style.display = 'inline-block';
link.style.marginTop = '10px';
summaryDiv.appendChild(link);

      // Distance comparison
      let totalOriginalDistance = 0;
      let totalAssignedDistance = 0;
      let studentCount = 0;
  
      studentsToAssign.forEach(student => {
        const sid = student.StudentID;
  
        const original = odData.find(d =>
          d.StudentID === sid &&
          normalize(d.CurrentSchoolName) === normalize(d.DestinationSchoolName)
        );
        if (original) totalOriginalDistance += parseFloat(original.Distance);
  
        const assignedSchool = finalAssignments[sid];
        const reassigned = odData.find(d =>
          d.StudentID === sid &&
          normalize(d.DestinationSchoolName) === normalize(assignedSchool)
        );
        if (reassigned) totalAssignedDistance += parseFloat(reassigned.Distance);
  
        studentCount++;
      });
  
      const avgOriginal = totalOriginalDistance / studentCount;
      const avgAssigned = totalAssignedDistance / studentCount;
  
      if (window.distanceCompareChartInstance) {
        window.distanceCompareChartInstance.destroy();
      }
  
     // Distance chart
const ctx2 = document.getElementById('distanceCompareChart').getContext('2d');
window.distanceCompareChartInstance = new Chart(ctx2, {
  type: 'bar',
  data: {
    labels: ['Current School', 'Assigned School'],
    datasets: [{
      label: 'Avg Distance (mi)',
      data: [avgOriginal.toFixed(2), avgAssigned.toFixed(2)],
      backgroundColor: ['#0033A0', '#ffcc00']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.raw} mi`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Distance (miles)'
        }
      }
    }
  }
});
    }); // end of setTimeout
    } finally {
      hideLoadingModal();
    }
  }); // end of assignButton click
}); // end of DOMContentLoaded event handler

const manualBtn = document.getElementById('manualBtn');
const modelBtn = document.getElementById('modelBtn');
const manualView = document.getElementById('manualView');
const modelView = document.getElementById('modelView');

manualBtn.addEventListener('click', () => {
  manualView.style.display = 'block';
  modelView.style.display = 'none';
  manualBtn.classList.add('active');
  modelBtn.classList.remove('active');
});

modelBtn.addEventListener('click', () => {
  manualView.style.display = 'none';
  modelView.style.display = 'block';
  manualBtn.classList.remove('active');
  modelBtn.classList.add('active');
});

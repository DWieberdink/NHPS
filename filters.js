// filters.js

let minEnrollment = 0;
let maxEnrollment = 2000;
let minSeats = 0;
let maxSeats = 500;

const enrollmentSlider = document.getElementById('enrollmentRange');
const seatsSlider = document.getElementById('seatsRange');

const minEnrollDisplay = document.getElementById('minEnrollDisplay');
const maxEnrollDisplay = document.getElementById('maxEnrollDisplay');

const minSeatsDisplay = document.getElementById('minSeatsDisplay');
const maxSeatsDisplay = document.getElementById('maxSeatsDisplay');

const toggleYes = document.getElementById('toggleYes');
const toggleNo = document.getElementById('toggleNo');
const schoolTypeFilter = document.getElementById('schoolTypeFilter');

let showVariableRadius = false;

noUiSlider.create(enrollmentSlider, {
  start: [0, 2000],
  connect: true,
  step: 10,
  range: { min: 0, max: 2000 }
});

noUiSlider.create(seatsSlider, {
  start: [0, 500],
  connect: true,
  step: 1,
  range: { min: 0, max: 500 }
});

enrollmentSlider.noUiSlider.on('update', values => {
  minEnrollment = parseInt(values[0]);
  maxEnrollment = parseInt(values[1]);
  minEnrollDisplay.textContent = minEnrollment;
  maxEnrollDisplay.textContent = maxEnrollment;
  notifyParent();
});

seatsSlider.noUiSlider.on('update', values => {
  minSeats = parseInt(values[0]);
  maxSeats = parseInt(values[1]);
  minSeatsDisplay.textContent = minSeats;
  maxSeatsDisplay.textContent = maxSeats;
  notifyParent();
});

toggleYes.addEventListener('click', () => {
  showVariableRadius = true;
  notifyParent();
});

toggleNo.addEventListener('click', () => {
  showVariableRadius = false;
  notifyParent();
});

schoolTypeFilter.addEventListener('change', () => {
  notifyParent();
});

function notifyParent() {
  parent.postMessage({
    from: 'FiltersPanel',
    filterSettings: {
      minEnrollment,
      maxEnrollment,
      minSeats,
      maxSeats,
      showVariableRadius,
      schoolTypes: Array.from(schoolTypeFilter.selectedOptions).map(o => o.value)
    }
  }, '*');
}

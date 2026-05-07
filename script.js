// script.js - Parañaque City Government Budget Dashboard
// All JavaScript functionality separated from HTML

// Chart instances storage
let chartInstances = {
  education: null,
  health: null,
  infra: null
};

// ======================== TIME API & LOCAL FALLBACK ========================
async function updateParanaqueTime() {
  const timeElement = document.getElementById('paranaque-time');
  if (!timeElement) return;
  try {
    // Fetch official time for Asia/Manila (Parañaque timezone)
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila');
    if (!response.ok) throw new Error('API responded with status ' + response.status);
    const data = await response.json();
    const dateTimeStr = data.dateTime;
    const paranaqueDate = new Date(dateTimeStr);
    if (isNaN(paranaqueDate.getTime())) throw new Error('Invalid date');
    const timeString = paranaqueDate.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Manila'
    });
    timeElement.textContent = `🕒 Parañaque City Time: ${timeString}`;
  } catch (error) {
    console.warn('Time API fallback:', error);
    // fallback: manual UTC+8
    const now = new Date();
    const localOffset = now.getTimezoneOffset() * 60000;
    const utcTime = now.getTime() + localOffset;
    const phTime = new Date(utcTime + (8 * 60 * 60 * 1000));
    const fallbackString = phTime.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    timeElement.textContent = `🕒 Parañaque City Time: ${fallbackString} (local estimate)`;
  }
}

// ======================== LAGRANGE POLYNOMIAL UTILS ========================
function lagrangeInterpolate(points, xValue) {
  let result = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    let term = points[i].y;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        term *= (xValue - points[j].x) / (points[i].x - points[j].x);
      }
    }
    result += term;
  }
  return result;
}

function createPolynomialCurve(points) {
  if (!points.length) return [];
  const curve = [];
  const start = points[0].x;
  const end = points[points.length - 1].x;
  const step = 0.1;
  for (let x = start; x <= end + 1e-9; x += step) {
    let yVal = lagrangeInterpolate(points, x);
    // guard against extreme negative values (budget context)
    if (isNaN(yVal)) yVal = 0;
    if (yVal < 0) yVal = Math.max(0, yVal);
    curve.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(yVal.toFixed(2)) });
  }
  return curve;
}

// ======================== CHART CREATION with MAX HEIGHT CONSTRAINT ========================
function createBudgetChart(canvasId, title, points) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas with id "${canvasId}" not found`);
    return null;
  }

  // destroy existing chart instance if present to prevent memory leaks
  let existingKey = null;
  if (canvasId === 'educationChart') existingKey = 'education';
  if (canvasId === 'healthChart') existingKey = 'health';
  if (canvasId === 'infraChart') existingKey = 'infra';
  if (existingKey && chartInstances[existingKey]) {
    chartInstances[existingKey].destroy();
    chartInstances[existingKey] = null;
  }

  const rawData = points.map(p => ({ x: p.x, y: p.y }));
  const curveData = createPolynomialCurve(points);

  // Ensure the canvas container does NOT grow beyond 500px.
  const wrapper = canvas.closest('.canvas-wrapper');
  if (wrapper) {
    wrapper.style.maxHeight = '500px';
    wrapper.style.overflow = 'hidden';
  }
  // canvas style: maintain responsiveness and never exceed parent max-height
  canvas.style.maxHeight = '440px';
  canvas.style.width = '100%';
  canvas.style.height = 'auto';

  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: `${title} (Interpolated Trend)`,
          data: curveData,
          borderColor: '#145f33',
          backgroundColor: 'rgba(20, 95, 51, 0.12)',
          borderWidth: 2.8,
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 5,
          order: 1,
        },
        {
          label: `${title} (Actual Allocation)`,
          data: rawData,
          borderColor: '#ffb347',
          backgroundColor: '#ffb347',
          pointRadius: 7,
          pointHoverRadius: 11,
          pointBorderColor: '#bc6f1e',
          pointBorderWidth: 2,
          showLine: false,
          order: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: {
        padding: {
          top: 12,
          bottom: 8,
          left: 6,
          right: 8
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#1f4d2e',
            font: { size: 12, weight: '500' },
            boxWidth: 14,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              let val = context.raw;
              if (typeof val === 'object') val = val.y;
              return `${label}: ₱${val} M`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Calendar Year',
            color: '#145f33',
            font: { weight: 'bold', size: 12 }
          },
          ticks: {
            stepSize: 1,
            color: '#2b5a3b',
            callback: function(val) {
              return Number(val).toFixed(0);
            }
          },
          grid: {
            color: '#cfe3c4'
          },
          min: 2023.5,
          max: 2026.5
        },
        y: {
          title: {
            display: true,
            text: 'Budget (₱ Millions)',
            color: '#145f33',
            font: { weight: 'bold', size: 12 }
          },
          ticks: {
            color: '#2b5a3b',
            callback: function(value) {
              return '₱' + value;
            }
          },
          grid: {
            color: '#ddecd2'
          },
          beginAtZero: true,
        }
      },
      elements: {
        line: {
          borderJoin: 'round',
        },
        point: {
          hoverRadius: 9,
        }
      }
    }
  });

  if (existingKey) {
    chartInstances[existingKey] = chart;
  }
  return chart;
}

// ======================== BUDGET DATA (Realistic 2024-2026 projections) ========================
const educationPoints = [
  { x: 2024, y: 420 },
  { x: 2025, y: 485 },
  { x: 2026, y: 575 }
];

const healthPoints = [
  { x: 2024, y: 380 },
  { x: 2025, y: 445 },
  { x: 2026, y: 530 }
];

const infraPoints = [
  { x: 2024, y: 610 },
  { x: 2025, y: 720 },
  { x: 2026, y: 850 }
];

// ======================== INITIALIZE ALL CHARTS ========================
function initAllCharts() {
  createBudgetChart('educationChart', 'Education Budget', educationPoints);
  createBudgetChart('healthChart', 'Health Budget', healthPoints);
  createBudgetChart('infraChart', 'Infrastructure Budget', infraPoints);
}

// ======================== NAVIGATION (smooth scroll) ========================
function initNavigation() {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (targetId === 'education' || targetId === 'health' || targetId === 'infrastructure') {
        const cardSection = document.getElementById(targetId);
        if (cardSection) cardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // City image interactive click alert
  const cityImg = document.querySelector('.city-image');
  if (cityImg) {
    cityImg.addEventListener('click', function() {
      alert('🌾 You clicked on the Parañaque City image! 🌾\n"Parañaque — where progress meets heritage."');
    });
  }
}

// ======================== ENFORCE HEIGHT CONSTRAINTS ========================
function enforceHeightConstraints() {
  const wrappers = document.querySelectorAll('.canvas-wrapper');
  wrappers.forEach(wrapper => {
    wrapper.style.maxHeight = '500px';
    wrapper.style.overflow = 'visible';
    const canvasElem = wrapper.querySelector('canvas');
    if (canvasElem) {
      canvasElem.style.maxHeight = '440px';
      canvasElem.style.height = 'auto';
      canvasElem.style.width = '100%';
    }
  });
  // Update charts if they exist
  for (let key in chartInstances) {
    if (chartInstances[key] && typeof chartInstances[key].resize === 'function') {
      chartInstances[key].resize();
    }
  }
}

// ======================== DOM CONTENT LOADED EVENT ========================
window.addEventListener('DOMContentLoaded', async function() {
  console.log('🏛️ City Government of Parañaque | Budget Dashboard — Chart height capped at 500px');
  
  // Initialize time display
  await updateParanaqueTime();
  setInterval(updateParanaqueTime, 60000);
  
  // Initialize navigation and charts
  initNavigation();
  initAllCharts();
  
  // Enforce max height rules after a slight delay
  setTimeout(() => {
    enforceHeightConstraints();
  }, 150);
  
  // Handle window resize
  window.addEventListener('resize', function() {
    enforceHeightConstraints();
  });
  
  // MutationObserver to maintain constraints if any style changes occur
  const observer = new MutationObserver(() => {
    enforceHeightConstraints();
  });
  observer.observe(document.body, { attributes: true, subtree: false, childList: false, attributeFilter: ['style'] });
});
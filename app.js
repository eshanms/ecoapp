// TerraSphere - Application Logic (Iteration 2)
// Expanded Localized Location Database (with states, districts, and electricity grid emission factors in kg CO2/kWh)
const LOCATION_DB = {
  global: {
    name: "Global Average",
    factor: 0.45,
    states: {}
  },
  india: {
    name: "India",
    factor: 0.82,
    states: {
      kerala: {
        name: "Kerala (Hydro/Solar Rich Grid)",
        factor: 0.37,
        cities: {
          ernakulam: { name: "Ernakulam District", factor: 0.38 },
          trivandrum: { name: "Thiruvananthapuram", factor: 0.35 },
          kozhikode: { name: "Kozhikode", factor: 0.37 }
        }
      },
      maharashtra: {
        name: "Maharashtra (Coal Heavy Grid)",
        factor: 0.82,
        cities: {
          mumbai: { name: "Mumbai City", factor: 0.78 },
          pune: { name: "Pune District", factor: 0.82 },
          nagpur: { name: "Nagpur District", factor: 0.85 }
        }
      },
      delhi: {
        name: "Delhi",
        factor: 0.72,
        cities: {
          new_delhi: { name: "New Delhi", factor: 0.72 },
          east_delhi: { name: "East Delhi", factor: 0.74 },
          south_delhi: { name: "South Delhi", factor: 0.71 }
        }
      },
      tamil_nadu: {
        name: "Tamil Nadu",
        factor: 0.64,
        cities: {
          chennai: { name: "Chennai City", factor: 0.65 },
          coimbatore: { name: "Coimbatore", factor: 0.63 },
          madurai: { name: "Madurai City", factor: 0.64 }
        }
      },
      karnataka: {
        name: "Karnataka",
        factor: 0.61,
        cities: {
          bengaluru: { name: "Bengaluru City", factor: 0.62 },
          mysuru: { name: "Mysuru City", factor: 0.60 },
          mangaluru: { name: "Mangaluru City", factor: 0.61 }
        }
      },
      west_bengal: {
        name: "West Bengal",
        factor: 0.75,
        cities: {
          kolkata: { name: "Kolkata City", factor: 0.84 },
          howrah: { name: "Howrah District", factor: 0.86 },
          darjeeling: { name: "Darjeeling (Hydro)", factor: 0.55 }
        }
      }
    }
  },
  usa: {
    name: "United States",
    factor: 0.37,
    states: {
      california: {
        name: "California (Renewable grid)",
        factor: 0.21,
        cities: {
          la: { name: "Los Angeles", factor: 0.24 },
          sf: { name: "San Francisco", factor: 0.18 },
          sd: { name: "San Diego", factor: 0.22 }
        }
      },
      texas: {
        name: "Texas (Mixed gas/wind)",
        factor: 0.41,
        cities: {
          houston: { name: "Houston", factor: 0.44 },
          austin: { name: "Austin", factor: 0.38 },
          dallas: { name: "Dallas", factor: 0.42 }
        }
      },
      ny: {
        name: "New York (Nuclear/Hydro mix)",
        factor: 0.13,
        cities: {
          nyc: { name: "New York City", factor: 0.16 },
          buffalo: { name: "Buffalo (Niagara Hydro)", factor: 0.10 },
          albany: { name: "Albany", factor: 0.14 }
        }
      }
    }
  },
  uk: {
    name: "United Kingdom",
    factor: 0.15,
    states: {
      england: {
        name: "England",
        factor: 0.20,
        cities: {
          london: { name: "London", factor: 0.19 },
          manchester: { name: "Manchester", factor: 0.21 },
          birmingham: { name: "Birmingham", factor: 0.20 }
        }
      },
      scotland: {
        name: "Scotland (Wind Heavy Grid)",
        factor: 0.05,
        cities: {
          edinburgh: { name: "Edinburgh", factor: 0.06 },
          glasgow: { name: "Glasgow", factor: 0.04 },
          aberdeen: { name: "Aberdeen", factor: 0.05 }
        }
      }
    }
  }
};
// Transport factors (kg CO2e per km/flight)
const TRANS_FACTORS = {
  car_fuel: { petrol: 0.18, diesel: 0.19, hybrid: 0.09 },
  transit: 0.06,
  flight: 250
};
// Application State
let state = {
  region: 'global',
  calculator: {
    state: '',
    city: '',
    carDistance: 100,
    carFuel: 'petrol',
    transitDistance: 30,
    flights: 2,
    diet: 'meat-average',
    foodWaste: 'low',
    electricity: 250,
    heating: 'gas',
    householdSize: 3,
    shopping: 'average',
    trashBags: 2,
    sortPlastics: true,
    sortPaper: true,
    sortMetals: true,
    sortCompost: true,
    ewaste: 'moderate',
    landArea: 1000,
    landType: 'urban',
    constPet: false,
    constFarm: false,
    constGarage: false,
    constShed: false,
    includeWorkplace: false,
    w_wfh: false,
    w_transit: false,
    w_energy: false,
    w_hvac: false,
    w_solar: false,
    w_plastics: false,
    w_paperless: false,
    w_recycling: false
  },
  commitments: {} // commitments selected on the action plan page
};
// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  setupEventListeners();
  populateStates(); // Initial fill of state selector if needed
  calculateFootprint(true); // Quiet initial calculation without switching views
});
// Setup Listeners for dynamic updates (excluding calculator run)
function setupEventListeners() {
  // Sync sliders text readout dynamically
  const sliderSync = [
    { slider: 'input-car-distance', text: 'val-car-distance', unit: ' km' },
    { slider: 'input-transit-distance', text: 'input-val-transit-distance', unit: ' km' },
    { slider: 'input-flights', text: 'input-val-flights', unit: ' flights' },
    { slider: 'input-electricity', text: 'val-electricity', unit: ' kWh' },
    { slider: 'input-household-size', text: 'val-household-size', unit: ' people' },
    { slider: 'input-trash-bags', text: 'val-trash-bags', unit: ' bags' },
    { slider: 'input-land-area', text: 'val-land-area', unit: ' sq ft' }
  ];
  sliderSync.forEach(item => {
    const sliderEl = document.getElementById(item.slider);
    const textEl = document.getElementById(item.text);
    if (sliderEl && textEl) {
      sliderEl.addEventListener('input', (e) => {
        textEl.textContent = e.target.value + item.unit;
      });
    }
  });
  // Search logic for articles (Understand Section)
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const articles = document.querySelectorAll('.article-card');
      articles.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const text = card.querySelector('p').textContent.toLowerCase();
        if (title.includes(query) || text.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
}
// Switch between views/tabs
function switchView(viewName) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${viewName}`);
  if (activeNav) activeNav.classList.add('active');
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(sec => sec.classList.remove('active'));
  const activeSec = document.getElementById(`section-${viewName}`);
  if (activeSec) activeSec.classList.add('active');
  document.querySelector('main').scrollTop = 0;
}
// Reset data helper
function resetAllData() {
  if (confirm('Are you sure you want to reset all calculations, commitments, and audit data?')) {
    localStorage.clear();
    location.reload();
  }
}
// --- DYNAMIC LOCATION BINDING ---
function handleRegionChange() {
  const regionVal = document.getElementById('calc-region').value;
  state.region = regionVal;
  state.calculator.state = '';
  state.calculator.city = '';
  populateStates();
}
function handleStateChange() {
  const stateVal = document.getElementById('calc-state').value;
  state.calculator.state = stateVal;
  state.calculator.city = '';
  populateCities();
}
function handleCityChange() {
  const cityVal = document.getElementById('calc-city').value;
  state.calculator.city = cityVal;
}
// Populate State dropdown based on region
function populateStates() {
  const stateGroup = document.getElementById('group-state');
  const stateSelect = document.getElementById('calc-state');
  const cityGroup = document.getElementById('group-city');
  if (!stateSelect || !stateGroup || !cityGroup) return;
  const regionData = LOCATION_DB[state.region];
  
  if (!regionData || Object.keys(regionData.states).length === 0) {
    stateGroup.style.display = 'none';
    cityGroup.style.display = 'none';
    stateSelect.innerHTML = '';
    return;
  }
  // Populate States
  stateGroup.style.display = 'block';
  cityGroup.style.display = 'none';
  
  let options = '<option value="">-- Select State --</option>';
  Object.keys(regionData.states).forEach(key => {
    options += `<option value="${key}">${regionData.states[key].name}</option>`;
  });
  stateSelect.innerHTML = options;
  // Restore state value if exists
  if (state.calculator.state && regionData.states[state.calculator.state]) {
    stateSelect.value = state.calculator.state;
    populateCities();
  }
}
// Populate City dropdown based on state
function populateCities() {
  const cityGroup = document.getElementById('group-city');
  const citySelect = document.getElementById('calc-city');
  if (!citySelect || !cityGroup) return;
  const regionData = LOCATION_DB[state.region];
  const stateKey = state.calculator.state;
  if (!regionData || !stateKey || !regionData.states[stateKey]) {
    cityGroup.style.display = 'none';
    citySelect.innerHTML = '';
    return;
  }
  const stateData = regionData.states[stateKey];
  cityGroup.style.display = 'block';
  let options = '<option value="">-- Select City/District --</option>';
  Object.keys(stateData.cities).forEach(key => {
    options += `<option value="${key}">${stateData.cities[key].name}</option>`;
  });
  citySelect.innerHTML = options;
  // Restore city value if exists
  if (state.calculator.city && stateData.cities[state.calculator.city]) {
    citySelect.value = state.calculator.city;
  }
}
// --- CONSOLIDATED WORKPLACE AUDIT TOGGLE ---
function toggleWorkplaceForm() {
  const checkbox = document.getElementById('include-workplace-toggle');
  const block = document.getElementById('workplace-audit-block');
  if (checkbox && block) {
    block.style.display = checkbox.checked ? 'block' : 'none';
  }
}
// --- CALCULATION ENGINE ---
function triggerCalculation() {
  // Activate loading overlay
  const overlay = document.getElementById('loader-overlay');
  const btn = document.getElementById('btn-calculate');
  
  if (overlay) overlay.classList.add('active');
  if (btn) btn.disabled = true;
  // Simulate premium calculation timing
  setTimeout(() => {
    calculateFootprint();
    
    if (overlay) overlay.classList.remove('active');
    if (btn) btn.disabled = false;
    // Route to Dashboard to reveal results
    switchView('dashboard');
  }, 1000);
}
// Quiet footprint calculator on state load, or full run
function calculateFootprint(isQuiet = false) {
  // 1. Gather all inputs from DOM
  const carDistance = parseFloat(document.getElementById('input-car-distance').value);
  const transitDistance = parseFloat(document.getElementById('input-transit-distance').value);
  const flights = parseFloat(document.getElementById('input-flights').value);
  const electricity = parseFloat(document.getElementById('input-electricity').value);
  const householdSize = parseFloat(document.getElementById('input-household-size').value);
  const trashBags = parseFloat(document.getElementById('input-trash-bags').value);
  const landArea = parseFloat(document.getElementById('input-land-area').value);
  
  const carFuelEl = document.querySelector('input[name="car-fuel"]:checked');
  const carFuel = carFuelEl ? carFuelEl.value : 'petrol';
  
  const diet = document.getElementById('input-diet').value;
  
  const foodWasteEl = document.querySelector('input[name="food-waste"]:checked');
  const foodWaste = foodWasteEl ? foodWasteEl.value : 'low';
  
  const heating = document.getElementById('input-heating').value;
  const shopping = document.getElementById('input-shopping').value;
  const ewaste = document.getElementById('input-ewaste').value;
  const landType = document.getElementById('input-land-type').value;
  // Checkboxes
  const sortPlastics = document.getElementById('sort-plastics').checked;
  const sortPaper = document.getElementById('sort-paper').checked;
  const sortMetals = document.getElementById('sort-metals').checked;
  const sortCompost = document.getElementById('sort-compost').checked;
  const constPet = document.getElementById('const-pet').checked;
  const constFarm = document.getElementById('const-farm').checked;
  const constGarage = document.getElementById('const-garage').checked;
  const constShed = document.getElementById('const-shed').checked;
  const includeWorkplace = document.getElementById('include-workplace-toggle').checked;
  // Workplace individual questions
  const w_wfh = document.getElementById('w_wfh').checked;
  const w_transit = document.getElementById('w_transit').checked;
  const w_energy = document.getElementById('w_energy').checked;
  const w_hvac = document.getElementById('w_hvac').checked;
  const w_solar = document.getElementById('w_solar').checked;
  const w_plastics = document.getElementById('w_plastics').checked;
  const w_paperless = document.getElementById('w_paperless').checked;
  const w_recycling = document.getElementById('w_recycling').checked;
  // Sync to state
  state.calculator = {
    ...state.calculator,
    carDistance, carFuel, transitDistance, flights, diet, foodWaste,
    electricity, heating, householdSize, shopping, trashBags,
    sortPlastics, sortPaper, sortMetals, sortCompost, ewaste,
    landArea, landType, constPet, constFarm, constGarage, constShed,
    includeWorkplace, w_wfh, w_transit, w_energy, w_hvac, w_solar,
    w_plastics, w_paperless, w_recycling
  };
  // --- RESOLVE ELECTRICITY GRID FACTOR ---
  let activeGridFactor = LOCATION_DB.global.factor; // fallback
  let locationLabel = "Global Average";
  const regionData = LOCATION_DB[state.region];
  if (regionData) {
    activeGridFactor = regionData.factor;
    locationLabel = regionData.name;
    const stateKey = state.calculator.state;
    if (stateKey && regionData.states[stateKey]) {
      const stateData = regionData.states[stateKey];
      activeGridFactor = stateData.factor;
      locationLabel = `${stateData.name}, ${regionData.name}`;
      const cityKey = state.calculator.city;
      if (cityKey && stateData.cities[cityKey]) {
        activeGridFactor = stateData.cities[cityKey].factor;
        locationLabel = `${stateData.cities[cityKey].name}, ${locationLabel}`;
      }
    }
  }
  // Update header text grid factor
  const gridFactorHeader = document.getElementById('header-grid-factor');
  if (gridFactorHeader) gridFactorHeader.textContent = activeGridFactor.toFixed(2);
  const subtextHeader = document.getElementById('dashboard-subtext');
  if (subtextHeader) subtextHeader.textContent = `Location Set: ${locationLabel}`;
  // --- FOOTPRINT MATH ALGORITHMS ---
  // A. Transport Emissions
  let carFactor = TRANS_FACTORS.car_fuel[carFuel];
  if (carFuel === 'electric') {
    // EV uses ~0.16 kWh per km
    carFactor = 0.16 * activeGridFactor;
  }
  const transportEmissionsTonne = ((carDistance * 52 * carFactor) + 
                                   (transitDistance * 52 * TRANS_FACTORS.transit) + 
                                   (flights * TRANS_FACTORS.flight)) / 1000;
  // B. Energy Emissions
  const electricityEmissionsKg = electricity * 12 * activeGridFactor;
  
  let heatingEmissionsKg = 0;
  if (heating === 'gas') heatingEmissionsKg = 1200;
  else if (heating === 'lpg') heatingEmissionsKg = 800;
  else if (heating === 'electric') heatingEmissionsKg = 30 * 12 * activeGridFactor;
  
  const energyEmissionsTonne = ((electricityEmissionsKg + heatingEmissionsKg) / householdSize) / 1000;
  // C. Diet Emissions
  let dietEmissionsKg = 2000;
  if (diet === 'meat-heavy') dietEmissionsKg = 3300;
  else if (diet === 'vegetarian') dietEmissionsKg = 1500;
  else if (diet === 'vegan') dietEmissionsKg = 900;
  if (foodWaste === 'high') {
    dietEmissionsKg *= 1.25;
  }
  const dietEmissionsTonne = dietEmissionsKg / 1000;
  // D. Shopping & Deeper Waste Emissions
  // weekly trash bags: 100 kg CO2e per year per bag
  const baseLandfillWasteKg = trashBags * 100;
  
  // Sorting checklist multipliers
  let sortedSavingRatio = 0.0;
  if (sortPlastics) sortedSavingRatio += 0.15;
  if (sortPaper) sortedSavingRatio += 0.20;
  if (sortMetals) sortedSavingRatio += 0.15;
  if (sortCompost) sortedSavingRatio += 0.30;
  
  const landfillWasteTonne = (baseLandfillWasteKg * (1 - sortedSavingRatio)) / 1000;
  // ewaste upgrade multiplier
  let ewasteTonne = 0.08; // average
  if (ewaste === 'yearly') ewasteTonne = 0.20;
  else if (ewaste === 'rarely') ewasteTonne = 0.01;
  // shopping profile
  let shoppingTonne = 0.70;
  if (shopping === 'rarely') shoppingTonne = 0.30;
  else if (shopping === 'frequently') shoppingTonne = 1.50;
  const totalWasteEmissionsTonne = landfillWasteTonne + ewasteTonne + shoppingTonne;
  // E. Workplace Emissions Option
  let workplaceEmissionsTonne = 0.0;
  let w_score = 0;
  if (includeWorkplace) {
    const workplaceKeys = ['w_wfh', 'w_transit', 'w_energy', 'w_hvac', 'w_solar', 'w_plastics', 'w_paperless', 'w_recycling'];
    workplaceKeys.forEach(k => {
      if (state.calculator[k]) w_score++;
    });
    // Base workplace footprint of 1.5 tonnes, reduced by 0.15 tonnes per green action checked
    workplaceEmissionsTonne = Math.max(0.2, 1.5 - (w_score * 0.15));
  }
  // --- MERGE SUB-TOTALS & ADJUST COMMITMENTS ---
  // Total initial calculations
  const totalOriginalTonne = transportEmissionsTonne + energyEmissionsTonne + dietEmissionsTonne + totalWasteEmissionsTonne + workplaceEmissionsTonne;
  
  // Evaluate Action Plan savings
  let committedSavingsTonne = 0;
  Object.keys(state.commitments).forEach(key => {
    if (state.commitments[key]) {
      if (key === 'carpool' || key === 'public_transit') {
        committedSavingsTonne += Math.min(0.7, transportEmissionsTonne * 0.4);
      } else if (key === 'flights_fewer') {
        committedSavingsTonne += Math.min(0.4, flights * TRANS_FACTORS.flight / 1000);
      } else if (key === 'phantom_load') {
        committedSavingsTonne += Math.min(0.15, energyEmissionsTonne * 0.10);
      } else if (key === 'cold_laundry') {
        committedSavingsTonne += Math.min(0.12, energyEmissionsTonne * 0.08);
      } else if (key === 'air_drying') {
        committedSavingsTonne += Math.min(0.25, energyEmissionsTonne * 0.15);
      } else if (key === 'fridge_eco') {
        committedSavingsTonne += Math.min(0.08, energyEmissionsTonne * 0.05);
      } else if (key === 'lid_cooking') {
        committedSavingsTonne += Math.min(0.1, energyEmissionsTonne * 0.06);
      } else if (key === 'shower_remedy') {
        committedSavingsTonne += Math.min(0.2, energyEmissionsTonne * 0.12);
      } else if (key === 'meatless_days') {
        committedSavingsTonne += Math.min(0.5, dietEmissionsTonne * 0.35);
      } else if (key === 'recycle_strict') {
        committedSavingsTonne += Math.min(0.2, totalWasteEmissionsTonne * 0.25);
      }
    }
  });
  const finalFootprintTonne = Math.max(0.1, totalOriginalTonne - committedSavingsTonne);
  // --- RENDER UPDATES ---
  if (!isQuiet) {
    // Render Dashboard numbers
    const totalEl = document.getElementById('dashboard-total-footprint');
    if (totalEl) totalEl.innerHTML = `${finalFootprintTonne.toFixed(1)} <span>tonnes CO₂e</span>`;
    // Circular Gauge Update
    const gaugeFill = document.getElementById('dashboard-gauge-fill');
    const gaugeValue = document.getElementById('dashboard-gauge-value');
    const gaugeMsg = document.getElementById('dashboard-gauge-message');
    
    if (gaugeFill && gaugeValue) {
      const targetTonne = 2.0;
      const percentage = Math.min((finalFootprintTonne / targetTonne) * 100, 100);
      const circleLength = 440;
      const offset = circleLength - (circleLength * percentage) / 100;
      
      gaugeFill.style.strokeDashoffset = offset;
      gaugeValue.textContent = finalFootprintTonne.toFixed(1);
      if (finalFootprintTonne <= 2.0) {
        gaugeFill.style.stroke = 'var(--color-accent-mint)';
        if (gaugeMsg) gaugeMsg.textContent = 'Excellent! You are within the climate sustainable target. 🎉';
      } else if (finalFootprintTonne <= 5.0) {
        gaugeFill.style.stroke = 'var(--color-accent-orange)';
        if (gaugeMsg) gaugeMsg.textContent = 'Moderate. Take action in commitments to reach the target.';
      } else {
        gaugeFill.style.stroke = 'var(--color-accent-rose)';
        if (gaugeMsg) gaugeMsg.textContent = 'High emissions. Explore transit shifts or home energy changes.';
      }
    }
    // Horizontal bars
    const categories = [
      { id: 'transport', val: transportEmissionsTonne },
      { id: 'energy', val: energyEmissionsTonne },
      { id: 'diet', val: dietEmissionsTonne },
      { id: 'waste', val: totalWasteEmissionsTonne }
    ];
    const maxVal = Math.max(...categories.map(c => c.val), 0.1);
    categories.forEach(c => {
      const valText = document.getElementById(`val-cat-${c.id}`);
      const fillBar = document.getElementById(`bar-cat-${c.id}`);
      const dashBar = document.getElementById(`bar-${c.id}`);
      if (valText) valText.textContent = `${c.val.toFixed(1)} t`;
      const pct = (c.val / maxVal) * 100;
      if (fillBar) fillBar.style.width = `${pct}%`;
      if (dashBar) dashBar.style.height = `${Math.max(10, pct)}%`;
    });
    // Suggest Eco Land & Constructions
    renderLandSuggestions(landArea, landType, constPet, constFarm, constGarage, constShed);
    // Workplace widget
    renderWorkplaceWidget(includeWorkplace, w_score);
    // Action plan scorecard updates
    const rOriginal = document.getElementById('reduce-original-val');
    const rCommitted = document.getElementById('reduce-committed-val');
    const rPotential = document.getElementById('reduce-potential-val');
    if (rOriginal) rOriginal.textContent = `${totalOriginalTonne.toFixed(1)} t`;
    if (rCommitted) rCommitted.textContent = `${committedSavingsTonne.toFixed(1)} t`;
    if (rPotential) rPotential.textContent = `${finalFootprintTonne.toFixed(1)} t`;
    // Action plan prioritized remedies scanner
    renderPrioritizedRemedies(transportEmissionsTonne, energyEmissionsTonne, dietEmissionsTonne, totalWasteEmissionsTonne);
    // Badges
    updateBadges(finalFootprintTonne, transportEmissionsTonne, dietEmissionsTonne);
  }
  // Save to persistence
  saveToLocalStorage();
}
// --- ECO-LAND RECOMMENDATIONS ENGINE ---
function renderLandSuggestions(area, type, pet, farm, garage, shed) {
  const box = document.getElementById('land-suggestions-box');
  if (!box) return;
  box.innerHTML = '';
  let itemsCount = 0;
  // Helper to add suggestion markup
  const addSuggestion = (title, text, iconPath) => {
    itemsCount++;
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <svg viewBox="0 0 24 24">${iconPath}</svg>
      <div>
        <h5>${title}</h5>
        <p>${text}</p>
      </div>
    `;
    box.appendChild(item);
  };
  const leafIcon = '<path d="M17 8C8 10 5.9 16.1 5 21C5.7 20 6.7 19.3 8 19C10.5 18.5 13.5 19.5 16 18C19 16.2 19 11.2 17 8ZM2 2C6 3.5 9 8.5 7.5 13C12.5 10 16.5 5 19 2C14.5 4.5 9 4 2 2Z"/>';
  const waterIcon = '<path d="M12 2c-4.42 0-8 3.58-8 8 0 4.13 6 12 8 12s8-7.87 8-12c0-4.42-3.58-8-8-8zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>';
  const sunIcon = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1V3c0-.55-.45-1-1-1zm0 16c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1zM5.22 5.22a.996.996 0 0 0 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L6.63 5.22a.996.996 0 0 0-1.41 0zm10.6 10.6a.996.996 0 0 0 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-1.41-1.41a.996.996 0 0 0-1.41 0zM3 11H1c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1zm16 0h2c.55 0 1 .45 1 1s-.45 1-1 1h-2c-.55 0-1-.45-1-1s.45-1 1-1zM7.05 15.54L5.64 16.95a.996.996 0 1 0 1.41 1.41l1.41-1.41a.996.996 0 1 0-1.41-1.41zm10.6-10.6a.996.996 0 0 0-1.41 0l-1.41 1.41a.996.996 0 1 0 1.41 1.41l1.41-1.41a.996.996 0 0 0 0-1.41z"/>';
  // Area Specific Guidelines
  if (area > 0) {
    if (type === 'urban') {
      addSuggestion(
        "Vertical Garden Wall Layout",
        "Since your land is in an urban zone, setup green wall lattices to lower building temperatures, absorb ambient noise, and filter particulate matter.",
        leafIcon
      );
      if (area > 400) {
        addSuggestion(
          "Green Roof System",
          "With over 400 sq ft, configure a lightweight sedum green roof layer. This acts as visual insulation, lowering summer cooling bills by up to 15%.",
          sunIcon
        );
      }
    } else { // Suburban or Rural
      if (area > 800) {
        const waterCapture = Math.round(area * 0.62 * 20); // Capture formula (approx gallons based on 20 inches rain)
        addSuggestion(
          "Rainwater Harvesting Tank",
          `Install a bioswale and a 500-gallon collection tank. Your ${area} sq ft area can harvest up to ${waterCapture} gallons of clean water annually for gardens.`,
          waterIcon
        );
        addSuggestion(
          "Permaculture Zoning Layout",
          "Adopt a permaculture plan: Zone 1 (kitchen herbs near door) and Zone 3 (orchards or heavy crops on the boundary) to reduce labor energy.",
          leafIcon
        );
      }
    }
  }
  // Extra Construction specific suggestions
  if (pet) {
    addSuggestion(
      "Eco-Coop Thermal Insulation",
      "Insulate pet buildings using natural wood shavings, sheep wool, or clay-straw mixes. This keeps them warm naturally and reduces heat-lamp electric draw.",
      leafIcon
    );
  }
  if (farm) {
    addSuggestion(
      "Micro-Biogas & Solar Pumps",
      "Use small-scale anaerobic biogas digesters to process organic crop waste into cooking gas. Replace grid water pumps with dedicated solar-powered drip lines.",
      sunIcon
    );
  }
  if (garage) {
    addSuggestion(
      "Tooling Timers & High Ventilation",
      "Implement automatic timer shut-offs on heavy garage compressors and workshops to halt phantom motor idling. Use skylights for daytime work.",
      sunIcon
    );
  }
  if (shed) {
    addSuggestion(
      "Passive Skylights & Timber Frame",
      "Construct or retrofit sheds with natural timber frames and double-wall polycarbonate skylights to eliminate daytime bulb requirements.",
      leafIcon
    );
  }
  if (itemsCount === 0) {
    box.innerHTML = `
      <div style="padding:15px; text-align:center; color:var(--color-text-muted); font-size:13px;">
        Adjust land area or constructions in the Track tab to see tailored green building tips.
      </div>
    `;
  }
}
// --- WORKPLACE STATUS WIDGET RENDERER ---
function renderWorkplaceWidget(include, checkedCount) {
  const statusEl = document.getElementById('dashboard-workplace-status');
  const tierEl = document.getElementById('dashboard-workplace-tier');
  const scoreEl = document.getElementById('dashboard-workplace-score');
  const medalEl = document.getElementById('dashboard-workplace-medal');
  if (!statusEl || !tierEl || !scoreEl || !medalEl) return;
  if (!include) {
    statusEl.textContent = 'Excluded';
    tierEl.textContent = 'No Workplace Audit';
    scoreEl.textContent = 'Enable workplace calculator to audit office.';
    medalEl.className = 'workplace-medal-small';
    medalEl.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>`;
    return;
  }
  // Active tiers
  statusEl.textContent = 'Included';
  let tier = 'Unaudited';
  let badgeClass = '';
  
  if (checkedCount >= 1 && checkedCount <= 3) {
    tier = 'Bronze Leaf';
    badgeClass = 'bronze';
  } else if (checkedCount >= 4 && checkedCount <= 5) {
    tier = 'Silver Leaf';
    badgeClass = 'silver';
  } else if (checkedCount >= 6 && checkedCount <= 7) {
    tier = 'Gold Leaf';
    badgeClass = 'gold';
  } else if (checkedCount === 8) {
    tier = 'Platinum Leaf';
    badgeClass = 'platinum';
  }
  tierEl.textContent = tier;
  scoreEl.textContent = `${checkedCount} of 8 initiatives checked.`;
  medalEl.className = 'workplace-medal-small ' + badgeClass;
  
  if (checkedCount > 0) {
    medalEl.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
  } else {
    medalEl.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>`;
  }
}
// --- ACTION REMEDIES SCANNER ---
function renderPrioritizedRemedies(transport, energy, diet, waste) {
  const remedyBlock = document.getElementById('action-prioritized-remedy');
  if (!remedyBlock) return;
  const categories = [
    { name: 'Transport', val: transport, tip: '🚙 <strong>Transport is your largest emission source.</strong> Prioritize carpooling, taking public transit twice a week, and virtual meetings to eliminate regional flights.' },
    { name: 'Energy', val: energy, tip: '💡 <strong>Household Energy is your largest emission source.</strong> Focus on eliminating standby power (phantom loads), washing laundry in cold water (saves 75%), and air drying clothes.' },
    { name: 'Diet', val: diet, tip: '🥗 <strong>Diet is your largest emission source.</strong> Commit to 3 meat-free days per week, plan meals to avoid food waste, and support local/seasonal produce to eliminate food-miles.' },
    { name: 'Waste', val: waste, tip: '🗑️ <strong>Shopping & Waste is your largest emission source.</strong> Focus on reducing weekly trash bags, sorting plastics/metals/compost, and keeping mobile/laptop devices for 4+ years.' }
  ];
  // Find max category
  categories.sort((a, b) => b.val - a.val);
  const highest = categories[0];
  remedyBlock.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
    <div>
      <h4>Prioritized Remedy (Highest Emission: ${highest.name})</h4>
      <p>${highest.tip}</p>
    </div>
  `;
}
// --- COMMITMENTS AND BADGES ---
function toggleCommitment(element, key) {
  element.classList.toggle('committed');
  state.commitments[key] = element.classList.contains('committed');
  // Auto update simulated potential footprint on checkout!
  calculateFootprint(false);
}
function updateBadges(total, transport, diet) {
  const bFoot = document.getElementById('badge-footprint');
  if (bFoot) bFoot.classList.add('unlocked');
  const bTransit = document.getElementById('badge-transit');
  if (bTransit) {
    if (transport < 1.0 || state.commitments['carpool'] || state.commitments['public_transit']) {
      bTransit.classList.add('unlocked');
    } else {
      bTransit.classList.remove('unlocked');
    }
  }
  const bDiet = document.getElementById('badge-diet');
  if (bDiet) {
    if (state.calculator.diet === 'vegetarian' || state.calculator.diet === 'vegan' || state.commitments['meatless_days']) {
      bDiet.classList.add('unlocked');
    } else {
      bDiet.classList.remove('unlocked');
    }
  }
  const bOffset = document.getElementById('badge-offset');
  if (bOffset) {
    if (total < 3.0) {
      bOffset.classList.add('unlocked');
    } else {
      bOffset.classList.remove('unlocked');
    }
  }
}
// --- LOCAL STORAGE DATA SYNC ---
function saveToLocalStorage() {
  localStorage.setItem('terrasphere_state_v2', JSON.stringify(state));
}
function loadFromLocalStorage() {
  const saved = localStorage.getItem('terrasphere_state_v2');
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    state = { ...state, ...parsed };
    // Apply region selector in calculator DOM
    const regionSelect = document.getElementById('calc-region');
    if (regionSelect) regionSelect.value = state.region;
    // Apply simple elements
    const inputs = [
      { id: 'input-car-distance', key: 'carDistance', valId: 'val-car-distance', unit: ' km' },
      { id: 'input-transit-distance', key: 'transitDistance', valId: 'input-val-transit-distance', unit: ' km' },
      { id: 'input-flights', key: 'flights', valId: 'input-val-flights', unit: ' flights' },
      { id: 'input-electricity', key: 'electricity', valId: 'val-electricity', unit: ' kWh' },
      { id: 'input-household-size', key: 'householdSize', valId: 'val-household-size', unit: ' people' },
      { id: 'input-trash-bags', key: 'trashBags', valId: 'val-trash-bags', unit: ' bags' },
      { id: 'input-land-area', key: 'landArea', valId: 'val-land-area', unit: ' sq ft' }
    ];
    inputs.forEach(item => {
      const el = document.getElementById(item.id);
      const text = document.getElementById(item.valId);
      if (el) {
        el.value = state.calculator[item.key];
        if (text) text.textContent = el.value + item.unit;
      }
    });
    // Checkboxes
    const chks = [
      { id: 'sort-plastics', key: 'sortPlastics' },
      { id: 'sort-paper', key: 'sortPaper' },
      { id: 'sort-metals', key: 'sortMetals' },
      { id: 'sort-compost', key: 'sortCompost' },
      { id: 'const-pet', key: 'constPet' },
      { id: 'const-farm', key: 'constFarm' },
      { id: 'const-garage', key: 'constGarage' },
      { id: 'const-shed', key: 'constShed' },
      { id: 'include-workplace-toggle', key: 'includeWorkplace' },
      { id: 'w_wfh', key: 'w_wfh' },
      { id: 'w_transit', key: 'w_transit' },
      { id: 'w_energy', key: 'w_energy' },
      { id: 'w_hvac', key: 'w_hvac' },
      { id: 'w_solar', key: 'w_solar' },
      { id: 'w_plastics', key: 'w_plastics' },
      { id: 'w_paperless', key: 'w_paperless' },
      { id: 'w_recycling', key: 'w_recycling' }
    ];
    chks.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) el.checked = state.calculator[item.key];
    });
    // Workplace Block visibility toggle sync
    toggleWorkplaceForm();
    // Selects
    const selects = [
      { id: 'input-diet', key: 'diet' },
      { id: 'input-heating', key: 'heating' },
      { id: 'input-shopping', key: 'shopping' },
      { id: 'input-ewaste', key: 'ewaste' },
      { id: 'input-land-type', key: 'landType' }
    ];
    selects.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) el.value = state.calculator[item.key];
    });
    // Radios
    const fuelVal = state.calculator.carFuel;
    const fuelEl = document.getElementById(`fuel-${fuelVal}`);
    if (fuelEl) fuelEl.checked = true;
    const wasteVal = state.calculator.foodWaste;
    const wasteEl = document.getElementById(`waste-${wasteVal}`);
    if (wasteEl) wasteEl.checked = true;
    // Commitments list class active toggle sync
    const commitmentItems = document.querySelectorAll('.commitment-item');
    commitmentItems.forEach(item => {
      const onclickAttr = item.getAttribute('onclick');
      if (onclickAttr) {
        const match = onclickAttr.match(/'(\w+)'/);
        if (match && match[1]) {
          const key = match[1];
          if (state.commitments[key]) {
            item.classList.add('committed');
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed loading state:', err);
  }
}
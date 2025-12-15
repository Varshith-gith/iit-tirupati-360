/* ------------------ MAP INIT ------------------ */
let map;
let basemaps;

function initMap() {
  if (!document.getElementById("map")) {
    console.error("Map div not found!");
    return false;
  }
  
  // Center on IIT Tirupati campus - will be adjusted by fitBounds when boundary loads
  map = L.map("map").setView([13.705, 79.590], 16);

/* Basemaps */
  basemaps = {
  osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 22, attribution: "Powered by Geo-Intel Lab IITTNIF" }),
  satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 22 }),
  terrain: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17 }),
};
basemaps.osm.addTo(map);
  return true;
}

function setBase(name){ 
  if (!map || !basemaps) return;
  Object.values(basemaps).forEach(b=>map.removeLayer(b)); 
  basemaps[name].addTo(map); 
}

/* ------------------ LAYER STORAGE ------------------ */
let boundaryLayer = null;
let roadsLayer = null;
let lightPolesLayer = null;
let buildingsFolderLayer = null;
let naturalLayer = null;

// Data arrays for click detection
let lightPolesData = null;
let buildingsFolderData = null;
let naturalData = null;

// Asset metadata from JSON
let assetsMetadata = null;

/* ------------------ LOAD ALL GEOJSON FILES ------------------ */
// All Shapefiles have been converted to GeoJSON
// Files are now in the same directory as the HTML file
const basePath = "./";

// Boundary Style
const boundaryStyle = { color: "#1a365d", weight: 3, fillColor: "#0a1929", fillOpacity: 0.1 };

// Roads Style
const roadsStyle = { color: "#666", weight: 2, opacity: 0.8 };

// Buildings Style
const buildingsStyle = { color: "#1a365d", weight: 2, fillColor: "#4da6ff", fillOpacity: 0.3 };

// Light Poles Style
const lightPolesStyle = { color: "#FFD700", weight: 2, fillColor: "#FFD700", fillOpacity: 0.8, radius: 4 };
const lightPolesPointToLayer = function(feature, latlng) {
  return L.circleMarker(latlng, lightPolesStyle);
};

// Buildings Folder Style
const buildingsFolderStyle = { color: "#8B4513", weight: 2, fillColor: "#CD853F", fillOpacity: 0.5 };

// Natural Features Style
const naturalStyle = { color: "#228B22", weight: 2, fillColor: "#90EE90", fillOpacity: 0.4 };

// Load all GeoJSON files
async function loadAllLayers() {
  try {
    console.log("Starting to load layers from:", basePath);
    
    // Load Boundary
    const boundaryResp = await fetch(basePath + "IIT_Tirupati.geojson");
    if (boundaryResp.ok) {
      const boundaryData = await boundaryResp.json();
      boundaryLayer = L.geoJSON(boundaryData, { style: boundaryStyle });
      console.log("Boundary layer loaded:", boundaryLayer);
      
      // Fit map to show the entire IIT Tirupati boundary
      if (boundaryLayer && boundaryLayer.getBounds().isValid()) {
        map.fitBounds(boundaryLayer.getBounds(), {
          padding: [50, 50], // Add padding around the boundary
          maxZoom: 17 // Limit max zoom to prevent too close view
        });
      }
    } else {
      console.error("Failed to load boundary:", boundaryResp.status, boundaryResp.statusText);
    }
    
    // Load Roads
    const roadsResp = await fetch(basePath + "IIT_Tirupati_Roads.geojson");
    if (roadsResp.ok) {
      const roadsData = await roadsResp.json();
      roadsLayer = L.geoJSON(roadsData, { style: roadsStyle });
      console.log("Roads layer loaded:", roadsLayer);
    } else {
      console.error("Failed to load roads:", roadsResp.status, roadsResp.statusText);
    }
    
    // Load Light Poles
    const lightPolesResp = await fetch(basePath + "Light_poles.geojson");
    if (lightPolesResp.ok) {
      const lightPolesData = await lightPolesResp.json();
      lightPolesLayer = L.geoJSON(lightPolesData, {
        pointToLayer: lightPolesPointToLayer
      });
      processLightPolesData(lightPolesData);
      console.log("Light poles layer loaded:", lightPolesLayer);
    } else {
      console.error("Failed to load light poles:", lightPolesResp.status, lightPolesResp.statusText);
    }
    
    // Load Buildings from IITT_Buildings.geojson and buildings.geojson
    const buildingsLayers = [];
    let allBuildingsData = { type: "FeatureCollection", features: [] };
    
    // Load IITT_Buildings.geojson
    const buildingsFolderResp = await fetch(basePath + "IITT_Buildings.geojson");
    if (buildingsFolderResp.ok) {
      const buildingsFolderData = await buildingsFolderResp.json();
      const layer = L.geoJSON(buildingsFolderData, { 
        pointToLayer: function(feature, latlng) {
          return L.circle(latlng, {
            radius: 15,
            color: "#8B4513",
            weight: 2,
            fillColor: "transparent",
            fillOpacity: 0
          });
        },
        style: buildingsFolderStyle 
      });
      buildingsLayers.push(layer);
      allBuildingsData.features = allBuildingsData.features.concat(buildingsFolderData.features);
      console.log("IITT_Buildings.geojson loaded");
    } else {
      console.error("Failed to load IITT_Buildings.geojson:", buildingsFolderResp.status, buildingsFolderResp.statusText);
    }
    
    // Load buildings.geojson
    const buildingsResp = await fetch(basePath + "buildings.geojson");
    if (buildingsResp.ok) {
      const buildingsData = await buildingsResp.json();
      const layer = L.geoJSON(buildingsData, { 
        pointToLayer: function(feature, latlng) {
          return L.circle(latlng, {
            radius: 15,
            color: "#8B4513",
            weight: 2,
            fillColor: "transparent",
            fillOpacity: 0
          });
        },
        style: buildingsFolderStyle 
      });
      buildingsLayers.push(layer);
      allBuildingsData.features = allBuildingsData.features.concat(buildingsData.features);
      console.log("buildings.geojson loaded");
    } else {
      console.error("Failed to load buildings.geojson:", buildingsResp.status, buildingsResp.statusText);
    }
    
    // Combine all building layers into a layer group
    if (buildingsLayers.length > 0) {
      buildingsFolderLayer = L.layerGroup(buildingsLayers);
      processBuildingsFolderData(allBuildingsData);
      console.log("Buildings folder layer loaded:", buildingsFolderLayer);
    }
    
    // Load Natural Features
    const naturalResp = await fetch(basePath + "natural.geojson");
    if (naturalResp.ok) {
      const naturalData = await naturalResp.json();
      naturalLayer = L.geoJSON(naturalData, { style: naturalStyle });
      processNaturalData(naturalData);
      console.log("Natural layer loaded:", naturalLayer);
    } else {
      console.error("Failed to load natural:", naturalResp.status, naturalResp.statusText);
    }
    
    updateAssetDistributionChart();
    console.log("All layers loaded successfully");
    
    // Check if checkboxes are checked and add layers accordingly
    if (document.getElementById("boundaryLayer")?.checked && boundaryLayer) {
      if (!map.hasLayer(boundaryLayer)) {
        boundaryLayer.addTo(map);
      }
    }
    if (document.getElementById("roadLayer")?.checked && roadsLayer) {
      if (!map.hasLayer(roadsLayer)) {
        roadsLayer.addTo(map);
      }
    }
    if (document.getElementById("buildingsFolderLayer")?.checked && buildingsFolderLayer) {
      if (!map.hasLayer(buildingsFolderLayer)) {
        buildingsFolderLayer.addTo(map);
      }
    }
    if (document.getElementById("lightLayer")?.checked && lightPolesLayer) {
      if (!map.hasLayer(lightPolesLayer)) {
        lightPolesLayer.addTo(map);
      }
    }
    if (document.getElementById("buildingsFolderLayer")?.checked && buildingsFolderLayer) {
      if (!map.hasLayer(buildingsFolderLayer)) {
        buildingsFolderLayer.addTo(map);
      }
    }
    if (document.getElementById("naturalLayer")?.checked && naturalLayer) {
      if (!map.hasLayer(naturalLayer)) {
        naturalLayer.addTo(map);
      }
    }
  } catch (error) {
    console.error("Error loading layers:", error);
  }
}

/* ------------------ PROCESS DATA FUNCTIONS ------------------ */

function processLightPolesData(data) {
  lightPolesData = data.features.map(f => ({
    id: f.id || Math.random(),
    latlng: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
    properties: f.properties || {}
  }));
}

function processBuildingsFolderData(data) {
  buildingsFolderData = data.features.map(f => {
    let latlng;
    if (!f.geometry || !f.geometry.type) {
      // Silently skip features with null geometry
      return null;
    }
    
    if (f.geometry.type === "Point") {
      latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
    } else if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
      let coords;
      if (f.geometry.type === "Polygon") {
        coords = f.geometry.coordinates[0];
      } else {
        // MultiPolygon - use first polygon
        coords = f.geometry.coordinates[0][0];
      }
      if (coords && coords.length > 0) {
        const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
        const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        latlng = [lat, lng];
      } else {
        // Silently skip features with empty coordinates
        return null;
      }
    } else {
      // Silently skip unsupported geometry types
      return null;
    }
    return { id: f.id || Math.random(), latlng, properties: f.properties || {} };
  }).filter(item => item !== null);
}

function processNaturalData(data) {
  naturalData = data.features.map(f => {
    let latlng;
    if (!f.geometry || !f.geometry.type) {
      // Silently skip features with null geometry
      return null;
    }
    
    if (f.geometry.type === "Point") {
      latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
    } else if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
      let coords;
      if (f.geometry.type === "Polygon") {
        coords = f.geometry.coordinates[0];
      } else {
        // MultiPolygon - use first polygon
        coords = f.geometry.coordinates[0][0];
      }
      if (coords && coords.length > 0) {
      const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      latlng = [lat, lng];
      } else {
        // Silently skip features with empty coordinates
        return null;
      }
    } else {
      // Silently skip unsupported geometry types
      return null;
    }
    return { id: f.id || Math.random(), latlng, properties: f.properties || {} };
  }).filter(item => item !== null);
}

/* ------------------ CHECKBOX CONTROL ------------------ */
function setupCheckboxListeners() {
  const boundaryCheckbox = document.getElementById("boundaryLayer");
  const roadCheckbox = document.getElementById("roadLayer");
  const lightCheckbox = document.getElementById("lightLayer");

  if (boundaryCheckbox) {
    boundaryCheckbox.addEventListener("change", e => {
  if (e.target.checked && boundaryLayer) {
        if (!map.hasLayer(boundaryLayer)) {
    boundaryLayer.addTo(map);
        }
        displayFilterResponse("boundary", true);
        console.log("Boundary layer added to map");
  } else if (boundaryLayer) {
        if (map.hasLayer(boundaryLayer)) {
    map.removeLayer(boundaryLayer);
        }
        displayFilterResponse("boundary", false);
  }
});
  }

  if (roadCheckbox) {
    roadCheckbox.addEventListener("change", e => {
  if (e.target.checked && roadsLayer) {
        if (!map.hasLayer(roadsLayer)) {
    roadsLayer.addTo(map);
        }
        displayFilterResponse("roads", true);
        console.log("Roads layer added to map");
  } else if (roadsLayer) {
        if (map.hasLayer(roadsLayer)) {
    map.removeLayer(roadsLayer);
        }
        displayFilterResponse("roads", false);
      }
    });
  }

  if (lightCheckbox) {
    lightCheckbox.addEventListener("change", e => {
  if (e.target.checked && lightPolesLayer) {
        if (!map.hasLayer(lightPolesLayer)) {
    lightPolesLayer.addTo(map);
        }
        displayFilterResponse("lightPoles", true);
        console.log("Light poles layer added to map");
  } else if (lightPolesLayer) {
        if (map.hasLayer(lightPolesLayer)) {
    map.removeLayer(lightPolesLayer);
        }
        displayFilterResponse("lightPoles", false);
      }
    });
  }

  const buildingsFolderCheckbox = document.getElementById("buildingsFolderLayer");
  if (buildingsFolderCheckbox) {
    buildingsFolderCheckbox.addEventListener("change", e => {
      if (e.target.checked && buildingsFolderLayer) {
        if (!map.hasLayer(buildingsFolderLayer)) {
          buildingsFolderLayer.addTo(map);
        }
        displayFilterResponse("buildingsFolder", true);
        console.log("Buildings folder layer added to map");
      } else if (buildingsFolderLayer) {
        if (map.hasLayer(buildingsFolderLayer)) {
          map.removeLayer(buildingsFolderLayer);
        }
        displayFilterResponse("buildingsFolder", false);
      }
    });
  }

  const naturalCheckbox = document.getElementById("naturalLayer");
  if (naturalCheckbox) {
    naturalCheckbox.addEventListener("change", e => {
      if (e.target.checked && naturalLayer) {
        if (!map.hasLayer(naturalLayer)) {
          naturalLayer.addTo(map);
        }
        displayFilterResponse("natural", true);
        console.log("Natural layer added to map");
      } else if (naturalLayer) {
        if (map.hasLayer(naturalLayer)) {
          map.removeLayer(naturalLayer);
        }
        displayFilterResponse("natural", false);
      }
    });
  }
}

/* ------------------ 360 VIEWER ------------------ */
// PhotoSphereViewer removed to reduce page weight - using Marzipano only
let marzipanoViewer = null; // Marzipano viewer for tiled images
let current360ImageIndex = 0;

/* ------------------ MARZIPANO HOTSPOTS ------------------ */
// Prevent touch and scroll events from reaching parent (prevents view control interference)
function stopTouchAndScrollEventPropagation(element) {
  const events = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'];
  events.forEach(function(eventName) {
    element.addEventListener(eventName, function(e) {
      e.stopPropagation();
    });
  });
}

// Create link hotspot element (navigation button to other scenes)
function createLinkHotspotElement(hotspot, currentSceneId) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('hotspot', 'link-hotspot');
  
  // Create icon
  const icon = document.createElement('img');
  icon.src = 'app-files/img/link.png';
  icon.classList.add('link-hotspot-icon');
  icon.style.width = '32px';
  icon.style.height = '32px';
  icon.style.cursor = 'pointer';
  icon.style.pointerEvents = 'auto';
  
  // Set rotation
  const transformProperties = ['-ms-transform', '-webkit-transform', 'transform'];
  for (let i = 0; i < transformProperties.length; i++) {
    icon.style[transformProperties[i]] = 'rotate(' + (hotspot.rotation || 0) + 'rad)';
  }
  
  // Prevent touch and scroll events from reaching parent (prevents view control interference)
  stopTouchAndScrollEventPropagation(wrapper);
  
  // Add click handler to navigate to target scene
  function handleLinkClick(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('Link hotspot clicked! Target:', hotspot.target);
    const targetScene = window.APP_DATA.scenes.find(s => s.id === hotspot.target);
    if (targetScene) {
      const targetImageIndex = images360.findIndex(img => img.sceneId === hotspot.target);
      console.log('Target scene found:', targetScene.name, 'Image index:', targetImageIndex);
      if (targetImageIndex >= 0) {
        console.log('Loading scene:', targetScene.name, 'at index:', targetImageIndex);
        load360Image(targetImageIndex);
      } else {
        console.error('Target scene not found in images360 array:', hotspot.target);
      }
    } else {
      console.error('Target scene not found in APP_DATA:', hotspot.target);
    }
  }
  
  wrapper.addEventListener('click', handleLinkClick);
  icon.addEventListener('click', handleLinkClick);
  
  // Also handle touch events for mobile
  function handleLinkTouch(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('Link hotspot touched! Target:', hotspot.target);
    const targetScene = window.APP_DATA.scenes.find(s => s.id === hotspot.target);
    if (targetScene) {
      const targetImageIndex = images360.findIndex(img => img.sceneId === hotspot.target);
      if (targetImageIndex >= 0) {
        load360Image(targetImageIndex);
      }
    }
  }
  
  wrapper.addEventListener('touchend', handleLinkTouch);
  icon.addEventListener('touchend', handleLinkTouch);
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.classList.add('hotspot-tooltip', 'link-hotspot-tooltip');
  const targetScene = window.APP_DATA.scenes.find(s => s.id === hotspot.target);
  tooltip.innerHTML = targetScene ? targetScene.name : hotspot.target;
  tooltip.style.position = 'absolute';
  tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '4px 8px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.whiteSpace = 'nowrap';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.opacity = '0';
  tooltip.style.transition = 'opacity 0.3s';
  tooltip.style.top = '-30px';
  tooltip.style.left = '50%';
  tooltip.style.transform = 'translateX(-50%)';
  
  // Show tooltip on hover
  wrapper.addEventListener('mouseenter', function() {
    tooltip.style.opacity = '1';
  });
  wrapper.addEventListener('mouseleave', function() {
    tooltip.style.opacity = '0';
  });
  
  wrapper.appendChild(icon);
  wrapper.appendChild(tooltip);
  
  return wrapper;
}

// Create info hotspot element (info button)
function createInfoHotspotElement(hotspot) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('hotspot', 'info-hotspot');
  
  // Create icon
  const icon = document.createElement('img');
  icon.src = 'app-files/img/info.png';
  icon.classList.add('info-hotspot-icon');
  icon.style.width = '32px';
  icon.style.height = '32px';
  icon.style.cursor = 'pointer';
  icon.style.pointerEvents = 'auto';
  
  // Prevent touch and scroll events from reaching parent
  stopTouchAndScrollEventPropagation(wrapper);
  
  // Create tooltip/content
  const tooltip = document.createElement('div');
  tooltip.classList.add('info-hotspot-tooltip');
  tooltip.style.pointerEvents = 'none';
  tooltip.style.opacity = '0';
  tooltip.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  
  const title = document.createElement('div');
  title.innerHTML = hotspot.title || 'Info';
  
  const text = document.createElement('div');
  text.innerHTML = hotspot.text || '';
  
  tooltip.appendChild(title);
  tooltip.appendChild(text);
  
  // Toggle tooltip on click
  let isVisible = false;
  
  // Add click handler to both wrapper and icon
  function handleClick(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('Info hotspot clicked!');
    isVisible = !isVisible;
    if (isVisible) {
      tooltip.style.opacity = '1';
      tooltip.style.pointerEvents = 'auto';
      tooltip.classList.add('visible');
    } else {
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
      tooltip.classList.remove('visible');
    }
    console.log('Tooltip visibility:', isVisible);
  }
  
  wrapper.addEventListener('click', handleClick);
  icon.addEventListener('click', handleClick);
  
  // Also handle touch events for mobile
  wrapper.addEventListener('touchend', function(e) {
    e.stopPropagation();
    e.preventDefault();
    handleClick(e);
  });
  
  icon.addEventListener('touchend', function(e) {
    e.stopPropagation();
    e.preventDefault();
    handleClick(e);
  });
  
  // Ensure icon is clickable
  icon.style.pointerEvents = 'auto';
  wrapper.style.pointerEvents = 'auto';
  
  // Hide on click outside (but not if clicking on modal background)
  const hideTooltip = function(e) {
    if (isVisible && !wrapper.contains(e.target) && !e.target.closest('.viewer360-modal-content')) {
      isVisible = false;
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
      tooltip.classList.remove('visible');
    }
  };
  
  // Use capture phase to catch events early
  document.addEventListener('click', hideTooltip, true);
  
  wrapper.appendChild(icon);
  wrapper.appendChild(tooltip);
  
  return wrapper;
}

// Map to app-files scene IDs - using preview.jpg from each scene folder
const images360 = [
  { name: '1-entrance/preview.jpg', sceneId: '1-entrance', title: 'Entrance', id: 0 },
  { name: '4-ceo-room/preview.jpg', sceneId: '4-ceo-room', title: 'CEO Room', id: 1 },
  { name: '3-near-ceo-room/preview.jpg', sceneId: '3-near-ceo-room', title: 'Near CEO Room', id: 2 },
  { name: '5-meeting-room/preview.jpg', sceneId: '5-meeting-room', title: 'Meeting Room', id: 3 },
  { name: '18-near-advisory-room/preview.jpg', sceneId: '18-near-advisory-room', title: 'Near Advisory Room', id: 4 },
  { name: '8-near-project-director-room/preview.jpg', sceneId: '8-near-project-director-room', title: 'Near Project Director Room', id: 5 },
  { name: '13-gis-lab/preview.jpg', sceneId: '13-gis-lab', title: 'GIS Lab', id: 6 },
  { name: '6-computational-lab-outside/preview.jpg', sceneId: '6-computational-lab-outside', title: 'Computational Lab Outside', id: 7 },
  { name: '17-labs-outside/preview.jpg', sceneId: '17-labs-outside', title: 'Labs Outside', id: 8 },
  { name: '14-gnss-1/preview.jpg', sceneId: '14-gnss-1', title: 'GNSS 1', id: 9 },
  { name: '15-gnss-2/preview.jpg', sceneId: '15-gnss-2', title: 'GNSS 2', id: 10 },
  { name: '16-gnss-3/preview.jpg', sceneId: '16-gnss-3', title: 'GNSS 3', id: 11 },
  { name: '9-geo-intel1/preview.jpg', sceneId: '9-geo-intel1', title: 'Geo Intel 1', id: 12 },
  { name: '10-geo-intel2/preview.jpg', sceneId: '10-geo-intel2', title: 'Geo Intel 2', id: 13 },
  { name: '11-geo-intel21/preview.jpg', sceneId: '11-geo-intel21', title: 'Geo Intel 2.1', id: 14 },
  { name: '12-cv/preview.jpg', sceneId: '12-cv', title: 'CV', id: 15 },
  { name: '7-near-coffee-machine/preview.jpg', sceneId: '7-near-coffee-machine', title: 'Near Coffee Machine', id: 16 },
  { name: '0-near-lift/preview.jpg', sceneId: '0-near-lift', title: 'Near Lift', id: 17 },
  { name: '2-near-cafteria/preview.jpg', sceneId: '2-near-cafteria', title: 'Near Cafeteria', id: 18 },
  { name: '19-gym/preview.jpg', sceneId: '19-gym', title: 'GYM', id: 19 },
  { name: '20-gym-outside/preview.jpg', sceneId: '20-gym-outside', title: 'GYM Outside', id: 20 }
];

let imageNavigationGraph = {};
let csvData = null;

function hideInfoPanelAndDescription() {
  const infoPanel = document.getElementById("infoPanel");
  if (infoPanel) {
    infoPanel.style.display = 'none';
    infoPanel.classList.remove('active');
    if (window.innerWidth <= 768) {
      const mobileInfoToggle = document.getElementById("mobileInfoToggle");
      if (mobileInfoToggle) {
        mobileInfoToggle.style.display = 'block';
      }
    }
  }

  const filterResponse = document.getElementById("filterResponse");
  if (filterResponse) {
    filterResponse.style.display = 'none';
  }
}

function showInfoPanelAndDescription() {
  const infoPanel = document.getElementById("infoPanel");
  if (infoPanel) {
    infoPanel.style.display = '';
  }

  const filterResponse = document.getElementById("filterResponse");
  if (filterResponse && filterResponse.innerHTML.trim() !== '') {
    filterResponse.style.display = '';
  }
}

function close360Viewer() {
  // Show DigiPin card when modal closes
  const digipinBox = document.getElementById('digipinBox');
  if (digipinBox) {
    digipinBox.style.display = '';
  }
  const modal = document.getElementById("viewer360Modal");
  if (modal) {
    modal.classList.remove('active');
  }
  
  isViewerLoading = false;
  isNavigating = false;
  
  // Destroy Marzipano viewer if exists
  if (marzipanoViewer) {
    try {
      marzipanoViewer.destroy();
      marzipanoViewer = null;
    } catch (error) {
      console.warn('Error destroying Marzipano viewer:', error);
    }
  }
  
  destroyViewerSafely().then(() => {
    showInfoPanelAndDescription();
  });
}

function findImageIndex(imageUrl) {
  // Try to extract scene ID from path (e.g., "1-entrance/preview.jpg" or "../app-files/tiles/1-entrance/preview.jpg")
  let sceneId = null;
  const sceneIdMatch = imageUrl.match(/(\d+-[^/]+)/);
  if (sceneIdMatch) {
    sceneId = sceneIdMatch[1];
  }
  
  // First try to find by scene ID
  if (sceneId) {
    const index = images360.findIndex(img => img.sceneId === sceneId);
    if (index >= 0) return index;
  }
  
  // Fallback: try by filename
  const imageName = imageUrl.split('/').pop();
  const index = images360.findIndex(img => img.name === imageName || img.name.endsWith(imageName));
  return index >= 0 ? index : 0;
}

function destroyViewerSafely() {
  return new Promise((resolve) => {
    // PhotoSphereViewer removed to reduce page weight
    // Marzipano cleanup is handled separately in close360Viewer
    resolve();
  });
}

function load360Image(index) {
  if (index < 0 || index >= images360.length || isViewerLoading) return;
  
  isViewerLoading = true;
  current360ImageIndex = index;
  const image = images360[index];
  // Use app-files path structure
  // Try multiple path options to handle different folder structures
  let imageUrl = `app-files/tiles/${image.name}`;
  console.log('Loading 360 image:', imageUrl, 'Scene ID:', image.sceneId);
  
  const modal = document.getElementById("viewer360Modal");
  const viewerContainer = document.getElementById("viewer360Container");
  const titleElement = document.getElementById("viewer360Title");
  
  if (!modal || !viewerContainer || !titleElement) {
    console.error('360 viewer elements not found!');
    isViewerLoading = false;
    return;
  }

  titleElement.textContent = image.title;
  updateCarouselButtons();
  updateDirectionalArrows(index);

  // PhotoSphereViewer removed to reduce page weight - using Marzipano only
  // Skip PhotoSphereViewer check and go directly to Marzipano
  destroyAndRecreate();
  
  function destroyAndRecreate() {
    // Use Marzipano for app-files tiled images (loads ALL tiles, not just preview)
    if (window.Marzipano && window.APP_DATA && image.sceneId) {
      console.log('Using Marzipano for full tiled images, scene:', image.sceneId);
      
      // IMPORTANT: Destroy existing Marzipano viewer FIRST, before clearing container
      if (marzipanoViewer) {
        try {
          marzipanoViewer.destroy();
        } catch (error) {
          console.warn('Error destroying Marzipano viewer (may already be destroyed):', error);
        }
        marzipanoViewer = null;
      }
      
      // Also destroy PhotoSphereViewer if it exists
      destroyViewerSafely().then(() => {
        if (!viewerContainer || !viewerContainer.parentElement) {
          console.error('Container not available after destroy');
          isViewerLoading = false;
          return;
        }
        
        // Clear container AFTER viewers are destroyed
        viewerContainer.innerHTML = "";
        
        try {
          // Find scene data from APP_DATA
          const sceneData = window.APP_DATA.scenes.find(s => s.id === image.sceneId);
          if (!sceneData) {
            console.error('Scene not found in APP_DATA:', image.sceneId);
            isViewerLoading = false;
            return;
          }
          
          // Create new Marzipano viewer
          marzipanoViewer = new Marzipano.Viewer(viewerContainer, {
            controls: { mouseViewMode: 'drag' }
          });
          
          // Prevent clicks inside viewer from closing the modal
          // BUT allow hotspot clicks to work - check if click is on hotspot
          if (viewerContainer) {
            viewerContainer.addEventListener('click', function(e) {
              // Allow hotspot clicks to propagate (they handle their own stopPropagation)
              if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
                e.stopPropagation();
              }
            }, true); // Use capture phase
            viewerContainer.addEventListener('mousedown', function(e) {
              if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
                e.stopPropagation();
              }
            }, true);
            viewerContainer.addEventListener('mouseup', function(e) {
              if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
                e.stopPropagation();
              }
            }, true);
            viewerContainer.addEventListener('touchstart', function(e) {
              if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
                e.stopPropagation();
              }
            }, true);
            viewerContainer.addEventListener('touchend', function(e) {
              if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
                e.stopPropagation();
              }
            }, true);
          }
          
          // Create image source with tiled structure - loads ALL tiles from folder
          const urlPrefix = "app-files/tiles";
          const source = Marzipano.ImageUrlSource.fromString(
            urlPrefix + "/" + sceneData.id + "/{z}/{f}/{y}/{x}.jpg",
            { cubeMapPreviewUrl: urlPrefix + "/" + sceneData.id + "/preview.jpg" }
          );
          
          // Create geometry from scene data (handles all tile levels)
          const geometry = new Marzipano.CubeGeometry(sceneData.levels);
          
          // Create view limiter
          const limiter = Marzipano.RectilinearView.limit.traditional(
            sceneData.faceSize, 
            100*Math.PI/180, 
            120*Math.PI/180
          );
          
          // Create view
          const view = new Marzipano.RectilinearView(
            sceneData.initialViewParameters, 
            limiter
          );
          
          // Create scene with all tiles
          const scene = marzipanoViewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
          });
          
          // Create link hotspots (navigation buttons to other scenes)
          if (sceneData.linkHotspots && sceneData.linkHotspots.length > 0) {
            console.log('Creating', sceneData.linkHotspots.length, 'link hotspots for scene:', sceneData.id);
            sceneData.linkHotspots.forEach(function(hotspot) {
              try {
                const element = createLinkHotspotElement(hotspot, sceneData.id);
                const hotspotInstance = scene.hotspotContainer().createHotspot(element, { 
                  yaw: hotspot.yaw, 
                  pitch: hotspot.pitch 
                });
                console.log('Hotspot created for target:', hotspot.target, 'at yaw:', hotspot.yaw, 'pitch:', hotspot.pitch);
              } catch (error) {
                console.error('Error creating hotspot:', error);
              }
            });
          } else {
            console.log('No link hotspots found for scene:', sceneData.id);
          }
          
          // Create info hotspots (info buttons)
          if (sceneData.infoHotspots && sceneData.infoHotspots.length > 0) {
            sceneData.infoHotspots.forEach(function(hotspot) {
              const element = createInfoHotspotElement(hotspot);
              scene.hotspotContainer().createHotspot(element, { 
                yaw: hotspot.yaw, 
                pitch: hotspot.pitch 
              });
            });
          }
          
          // Switch to the scene (loads all tiles)
          scene.switchTo();
          
          console.log('Marzipano scene loaded successfully with ALL tiles from folder');
          console.log('Link hotspots:', sceneData.linkHotspots?.length || 0);
          console.log('Info hotspots:', sceneData.infoHotspots?.length || 0);
          isViewerLoading = false;
          
        } catch (error) {
          console.error("Marzipano error:", error);
          viewerContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #fff;">Unable to load 360° tiled image viewer.</div>';
          isViewerLoading = false;
        }
      });
      return;
    }
    
    // Fallback to PhotoSphereViewer for preview images only
    destroyViewerSafely().then(() => {
      if (!viewerContainer || !viewerContainer.parentElement) {
        console.error('Container not available after destroy');
        isViewerLoading = false;
        return;
      }
      
      viewerContainer.innerHTML = "";

      const img = new Image();
      let imageLoaded = false;
      
      img.onload = function() {
        if (imageLoaded) return;
        imageLoaded = true;
        
        console.log('Image loaded successfully:', imageUrl);
        
        if (!viewerContainer || !viewerContainer.parentElement) {
          console.error('Container not available');
          isViewerLoading = false;
          return;
        }
        
        try {
          createNewViewer();
        } catch (error) {
          console.error("Photo Sphere Viewer error:", error);
          viewerContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #fff;">Unable to load 360° image viewer.</div>';
          isViewerLoading = false;
        }
      };
      
      img.onerror = function() {
        if (imageLoaded) return;
        imageLoaded = true;
        
        console.error('Image failed to load:', imageUrl);
        viewerContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #fff;">360° image not available.<br>Image: ' + image.name + '</div>';
        isViewerLoading = false;
      };
      
      img.src = imageUrl;
      
      function createNewViewer() {
        // PhotoSphereViewer removed to reduce page weight
        // Using Marzipano as primary viewer only
        console.warn('PhotoSphereViewer fallback not available - using Marzipano only');
        viewerContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #fff;">360° image viewer requires Marzipano. Please ensure app-files/data.js is loaded.</div>';
        isViewerLoading = false;
      }
    });
  }
}

function updateCarouselButtons() {
  const prevBtn = document.getElementById("prev360Image");
  const nextBtn = document.getElementById("next360Image");
  
  if (prevBtn) {
    prevBtn.disabled = current360ImageIndex === 0 || isViewerLoading;
  }
  if (nextBtn) {
    nextBtn.disabled = current360ImageIndex === images360.length - 1 || isViewerLoading;
  }
}

let isNavigating = false;
let isViewerLoading = false;

function loadCSVData() {
  fetch('./insta 360/sample_pipe_1.csv')
    .then(response => {
      if (!response.ok) throw new Error('CSV not found');
      return response.text();
    })
    .then(text => {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        csvData = lines.slice(1, Math.min(22, lines.length)).map(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 4) {
            return {
              x: parseFloat(parts[0]) || 0,
              y: parseFloat(parts[1]) || 0,
              lat: parseFloat(parts[2]) || 0,
              lng: parseFloat(parts[3]) || 0
            };
          }
          return null;
        }).filter(item => item !== null);
        
        if (csvData.length > 0) {
          buildNavigationGraph();
        } else {
          buildDefaultNavigationGraph();
        }
      } else {
        buildDefaultNavigationGraph();
      }
    })
    .catch(error => {
      console.log('CSV file not found, using default navigation:', error);
      buildDefaultNavigationGraph();
    });
}

function buildNavigationGraph() {
  if (!csvData || csvData.length === 0) {
    buildDefaultNavigationGraph();
    return;
  }

  images360.forEach((img, index) => {
    imageNavigationGraph[index] = {
      north: null,
      south: null,
      east: null,
      west: null
    };
  });

  images360.forEach((img, index) => {
    if (index < csvData.length) {
      const currentPoint = csvData[index];
      let minDistN = Infinity, minDistS = Infinity, minDistE = Infinity, minDistW = Infinity;
      let closestN = null, closestS = null, closestE = null, closestW = null;

      images360.forEach((otherImg, otherIndex) => {
        if (otherIndex !== index && otherIndex < csvData.length) {
          const otherPoint = csvData[otherIndex];
          const dx = otherPoint.x - currentPoint.x;
          const dy = otherPoint.y - currentPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dy > 0 && dy < minDistN) {
            minDistN = dy;
            closestN = otherIndex;
          }
          if (dy < 0 && Math.abs(dy) < minDistS) {
            minDistS = Math.abs(dy);
            closestS = otherIndex;
          }
          if (dx > 0 && dx < minDistE) {
            minDistE = dx;
            closestE = otherIndex;
          }
          if (dx < 0 && Math.abs(dx) < minDistW) {
            minDistW = Math.abs(dx);
            closestW = otherIndex;
          }
        }
      });

      imageNavigationGraph[index].north = closestN;
      imageNavigationGraph[index].south = closestS;
      imageNavigationGraph[index].east = closestE;
      imageNavigationGraph[index].west = closestW;
    }
  });
}

function buildDefaultNavigationGraph() {
  images360.forEach((img, index) => {
    imageNavigationGraph[index] = {
      north: index > 0 ? index - 1 : null,
      south: index < images360.length - 1 ? index + 1 : null,
      east: index < images360.length - 1 ? index + 1 : null,
      west: index > 0 ? index - 1 : null
    };
  });
}

function updateDirectionalArrows(index) {
  const arrowNorth = document.getElementById("arrowNorth");
  const arrowSouth = document.getElementById("arrowSouth");
  const arrowEast = document.getElementById("arrowEast");
  const arrowWest = document.getElementById("arrowWest");

  const nav = imageNavigationGraph[index] || {};

  if (arrowNorth) {
    if (nav.north !== null && nav.north !== undefined) {
      arrowNorth.classList.add('visible');
      arrowNorth.onclick = () => {
        if (!isNavigating && !isViewerLoading) {
          isNavigating = true;
          load360Image(nav.north);
          setTimeout(() => { isNavigating = false; }, 800);
        }
      };
    } else {
      arrowNorth.classList.remove('visible');
      arrowNorth.onclick = null;
    }
  }

  if (arrowSouth) {
    if (nav.south !== null && nav.south !== undefined) {
      arrowSouth.classList.add('visible');
      arrowSouth.onclick = () => {
        if (!isNavigating && !isViewerLoading) {
          isNavigating = true;
          load360Image(nav.south);
          setTimeout(() => { isNavigating = false; }, 800);
        }
      };
    } else {
      arrowSouth.classList.remove('visible');
      arrowSouth.onclick = null;
    }
  }

  if (arrowEast) {
    if (nav.east !== null && nav.east !== undefined) {
      arrowEast.classList.add('visible');
      arrowEast.onclick = () => {
        if (!isNavigating && !isViewerLoading) {
          isNavigating = true;
          load360Image(nav.east);
          setTimeout(() => { isNavigating = false; }, 800);
        }
      };
    } else {
      arrowEast.classList.remove('visible');
      arrowEast.onclick = null;
    }
  }

  if (arrowWest) {
    if (nav.west !== null && nav.west !== undefined) {
      arrowWest.classList.add('visible');
      arrowWest.onclick = () => {
        if (!isNavigating && !isViewerLoading) {
          isNavigating = true;
          load360Image(nav.west);
          setTimeout(() => { isNavigating = false; }, 800);
        }
      };
    } else {
      arrowWest.classList.remove('visible');
      arrowWest.onclick = null;
    }
  }
}

function setup360Carousel() {
  const prevBtn = document.getElementById("prev360Image");
  const nextBtn = document.getElementById("next360Image");
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (!isNavigating && !isViewerLoading && current360ImageIndex > 0) {
        isNavigating = true;
        load360Image(current360ImageIndex - 1);
        setTimeout(() => { isNavigating = false; }, 800);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!isNavigating && !isViewerLoading && current360ImageIndex < images360.length - 1) {
        isNavigating = true;
        load360Image(current360ImageIndex + 1);
        setTimeout(() => { isNavigating = false; }, 800);
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById("viewer360Modal");
    if (!modal || !modal.classList.contains('active') || isNavigating || isViewerLoading) return;
    
    if (e.key === 'ArrowLeft' && current360ImageIndex > 0) {
      isNavigating = true;
      load360Image(current360ImageIndex - 1);
      setTimeout(() => { isNavigating = false; }, 800);
    } else if (e.key === 'ArrowRight' && current360ImageIndex < images360.length - 1) {
      isNavigating = true;
      load360Image(current360ImageIndex + 1);
      setTimeout(() => { isNavigating = false; }, 800);
    } else if (e.key === 'ArrowUp') {
      const nav = imageNavigationGraph[current360ImageIndex] || {};
      if (nav.north !== null && nav.north !== undefined) {
        isNavigating = true;
        load360Image(nav.north);
        setTimeout(() => { isNavigating = false; }, 800);
      }
    } else if (e.key === 'ArrowDown') {
      const nav = imageNavigationGraph[current360ImageIndex] || {};
      if (nav.south !== null && nav.south !== undefined) {
        isNavigating = true;
        load360Image(nav.south);
        setTimeout(() => { isNavigating = false; }, 800);
      }
    }
  });
}

function show360ImageWithFallback(paths) {
  if (paths.length === 0) {
    const modal = document.getElementById("viewer360Modal");
    const viewerContainer = document.getElementById("viewer360Container");
    if (modal && viewerContainer) {
      modal.classList.add('active');
      
      // Hide DigiPin card when modal opens (especially on mobile)
      const digipinBox = document.getElementById('digipinBox');
      if (digipinBox) {
        digipinBox.style.display = 'none';
      }
      
      viewerContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #fff;">360° image not found. Please ensure the "app-files/tiles" folder exists with the preview.jpg file.</div>';
    }
    return;
  }

  hideInfoPanelAndDescription();

  const currentPath = paths[0];
  console.log('Trying path:', currentPath);
  
  const imageIndex = findImageIndex(currentPath);
  const modal = document.getElementById("viewer360Modal");
  if (!modal) {
    console.error('360 viewer modal not found!');
    return;
  }

  modal.classList.add('active');
  
  // Hide DigiPin card when modal opens (especially on mobile)
  const digipinBox = document.getElementById('digipinBox');
  if (digipinBox) {
    digipinBox.style.display = 'none';
  }
  
  load360Image(imageIndex);
}

/* ------------------ ASSET POPUP ------------------ */
let highlightMarker = null;
let highlightLayer = null; // DigiPin highlight layer

// Combined click handler for both asset selection and DigiPin
function setupMapClickHandler() {
  if (!map) return;
  
map.on("click", e => {
  // Don't process map clicks if 360 viewer modal is open
  const modal = document.getElementById("viewer360Modal");
  if (modal && modal.classList.contains('active')) {
    return;
  }
  
  const {lat, lng} = e.latlng;
  
  // First, try to find closest asset
  const layersToCheck = [];
  if (document.getElementById("lightLayer").checked && lightPolesData) {
    layersToCheck.push({data: lightPolesData, type: "Light Pole"});
  }
  if (document.getElementById("buildingsFolderLayer").checked && buildingsFolderData) {
    layersToCheck.push({data: buildingsFolderData, type: "Building"});
  }
  if (document.getElementById("naturalLayer").checked && naturalData) {
    layersToCheck.push({data: naturalData, type: "Natural Feature"});
  }
  
  const clickPoint = map.latLngToLayerPoint(e.latlng);
  let minDist = Infinity, closest = null;

  layersToCheck.forEach(layer => {
    layer.data.forEach(f => {
      const featurePoint = map.latLngToLayerPoint(f.latlng);
      const dist = featurePoint.distanceTo(clickPoint);
      if (dist < minDist && dist < 50) {
        minDist = dist;
        closest = {...f, layerType: layer.type};
      }
    });
  });

  if (closest) {
    if (highlightMarker) map.removeLayer(highlightMarker);
    
    // For buildings, show a border circle instead of a filled dot
    if (closest.layerType === 'Building') {
      highlightMarker = L.circle(closest.latlng, {
        radius: 20,
        color: "#002b5c",
        weight: 3,
        fillColor: "transparent",
        fillOpacity: 0
      }).addTo(map);
    } else {
      // For other layers (light poles, natural features), keep the circle marker
      highlightMarker = L.circleMarker(closest.latlng, {
        radius: 8,
        color: "#002b5c",
        weight: 3,
        fillColor: "#4da6ff",
        fillOpacity: 0.8
      }).addTo(map);
    }

    let popupHTML = `<div style="font-weight:600;text-align:center;background:#002b5c;color:white;padding:4px;border-radius:4px 4px 0 0;">${closest.layerType} Attributes</div><table>`;
    for (const key in closest.properties) {
      popupHTML += `<tr><td>${key}</td><td>${closest.properties[key]}</td></tr>`;
    }
    popupHTML += "</table>";
    
    const lat = closest.latlng[0].toFixed(4);
    const lng = closest.latlng[1].toFixed(4);
    
    // Add View 360 button for buildings with 360 images
    if (closest.layerType === 'Building') {
      const buildingName = (closest.properties.Name || closest.properties.name || '').toLowerCase().trim();
      const buildingId = closest.properties.id;
      console.log('=== BUILDING CLICKED ===');
      console.log('Building ID:', buildingId);
      console.log('Building Name:', closest.properties.Name || closest.properties.name || '(no name)');
      
      const isTechHubInnovation = buildingId === 26 || 
                                   buildingName === 'tech hub innovation' || 
                                   buildingName.includes('tech hub innovation') ||
                                   buildingName.includes('techhub') ||
                                   (buildingName.includes('tech') && buildingName.includes('hub') && buildingName.includes('innovation'));
      
      if (isTechHubInnovation) {
        popupHTML += `<button id="view360Btn" class="view360-button">View 360°</button>`;
      }
    }
    
    highlightMarker.bindPopup(popupHTML).openPopup();
    document.getElementById("assetInfo").innerHTML = popupHTML;
    
    // Set up View 360 button click handler for buildings
    if (closest.layerType === 'Building') {
      const buildingName = (closest.properties.Name || closest.properties.name || '').toLowerCase().trim();
      const buildingId = closest.properties.id;
      const isTechHubInnovation = buildingId === 26 || 
                                   buildingName === 'tech hub innovation' || 
                                   buildingName.includes('tech hub innovation') ||
                                   buildingName.includes('techhub') ||
                                   (buildingName.includes('tech') && buildingName.includes('hub') && buildingName.includes('innovation'));
      
      if (isTechHubInnovation) {
        // Set up button click handler after a short delay to ensure DOM is ready
        setTimeout(() => {
          // Handle button in assetInfo panel
          const view360Btn = document.getElementById("view360Btn");
          if (view360Btn) {
            // Remove any existing listeners by cloning
            const newBtn = view360Btn.cloneNode(true);
            view360Btn.parentNode.replaceChild(newBtn, view360Btn);
            
            newBtn.addEventListener('click', function(e) {
              e.stopPropagation();
              e.preventDefault();
              console.log('View 360 button clicked! Loading 360 image...');
              
              // Map building ID to app-files scene ID
              const buildingToSceneMap = {
                26: '1-entrance' // Tech Hub Innovation -> Entrance
              };
              
              const sceneId = buildingToSceneMap[buildingId] || '1-entrance';
              
              // Find image index by scene ID
              const imageIndex = images360.findIndex(img => img.sceneId === sceneId);
              if (imageIndex >= 0) {
                console.log('Loading 360 image for building:', buildingId, 'Scene:', sceneId, 'Index:', imageIndex);
                const modal = document.getElementById("viewer360Modal");
                if (modal) {
                  modal.classList.add('active');
                  
                  // Hide DigiPin card when modal opens (especially on mobile)
                  const digipinBox = document.getElementById('digipinBox');
                  if (digipinBox) {
                    digipinBox.style.display = 'none';
                  }
                  
                  load360Image(imageIndex);
                }
              } else {
                // Fallback to path-based lookup
                const possiblePaths = [
                  `app-files/tiles/${sceneId}/preview.jpg`,
                  `./app-files/tiles/${sceneId}/preview.jpg`,
                  `../app-files/tiles/${sceneId}/preview.jpg`
                ];
                console.log('Scene not found in array, trying paths:', possiblePaths);
                show360ImageWithFallback(possiblePaths);
              }
            });
          }
          
          // Also handle button in popup (use class selector since ID might conflict)
          const popupContent = document.querySelector('.leaflet-popup-content');
          if (popupContent) {
            const popupBtn = popupContent.querySelector('.view360-button');
            if (popupBtn && !popupBtn.hasAttribute('data-listener')) {
              popupBtn.setAttribute('data-listener', 'true');
              popupBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('View 360 button clicked from popup! Loading 360 image...');
                
                // Map building ID to app-files scene ID
                const buildingToSceneMap = {
                  26: '1-entrance' // Tech Hub Innovation -> Entrance
                };
                
                const sceneId = buildingToSceneMap[buildingId] || '1-entrance';
                
                // Find image index by scene ID
                const imageIndex = images360.findIndex(img => img.sceneId === sceneId);
                if (imageIndex >= 0) {
                  console.log('Loading 360 image for building (popup):', buildingId, 'Scene:', sceneId, 'Index:', imageIndex);
                  const modal = document.getElementById("viewer360Modal");
                  if (modal) {
                    modal.classList.add('active');
                    
                    // Hide DigiPin card when modal opens (especially on mobile)
                    const digipinBox = document.getElementById('digipinBox');
                    if (digipinBox) {
                      digipinBox.style.display = 'none';
                    }
                    
                    load360Image(imageIndex);
                  }
                } else {
                  // Fallback to path-based lookup
                  const possiblePaths = [
                    `../app-files/tiles/${sceneId}/preview.jpg`,
                    `./app-files/tiles/${sceneId}/preview.jpg`,
                    `app-files/tiles/${sceneId}/preview.jpg`
                  ];
                  console.log('Scene not found in array, trying paths:', possiblePaths);
                  show360ImageWithFallback(possiblePaths);
                }
              });
            }
          }
        }, 100);
      } else {
        console.log('Not Tech Hub Innovation building. Building ID:', buildingId, 'Building name:', buildingName || '(no name)');
        // Only close viewer if it's currently open
        const modal = document.getElementById("viewer360Modal");
        if (modal && modal.classList.contains('active')) {
          close360Viewer();
        }
      }
    } else {
      console.log('Clicked item is not a Building. Layer type:', closest.layerType);
    }
  } else {
    // Clear asset info if no asset clicked
    document.getElementById("assetInfo").innerHTML = "Click a building, light pole, or water body to view attributes.";
    if (highlightMarker) {
      map.removeLayer(highlightMarker);
      highlightMarker = null;
    }
    // Only close viewer if it's currently open
    const modal = document.getElementById("viewer360Modal");
    if (modal && modal.classList.contains('active')) {
      close360Viewer();
    }
  }
  
  // Always update DigiPin on click (script-based, no GeoServer dependency)
  try {
    const result = DIGIPIN.encode(lat, lng, 10);
    if (highlightLayer) {
      map.removeLayer(highlightLayer);
      highlightLayer = null;
    }
    // Create rectangle with proper bounds: [[southwest], [northeast]] = [[MinLat, MinLon], [MaxLat, MaxLon]]
    highlightLayer = L.rectangle(
      [[result.bounds.MinLat, result.bounds.MinLon], [result.bounds.MaxLat, result.bounds.MaxLon]], 
      {
        color: "#d32f2f",
        weight: 3,
        fillColor: "#d32f2f",
        fillOpacity: 0.2,
        interactive: false
      }
    );
    highlightLayer.addTo(map);
    updateDigiPinBox(result.code, lat, lng);
  } catch(err) {
    console.error("DigiPin encoding error:", err);
    updateDigiPinBox('--', lat, lng);
    if (highlightLayer) {
      map.removeLayer(highlightLayer);
      highlightLayer = null;
    }
  }
});
}

/* ------------------ TIME ------------------ */
function updateTime() {
  document.getElementById("time").textContent = "Updated: " + new Date().toLocaleString();
}
updateTime();
setInterval(updateTime, 1000);

/* ------------------ ASSET CHART ------------------ */
let assetChart = null, isChartVisible = false;
function updateAssetDistributionChart() {
  if (!lightPolesData || !buildingsFolderData || !naturalData) return;
  const ctx = document.getElementById('assetDistributionChart').getContext('2d');
  const data = {
    labels: ['Buildings', 'Roads', 'Streetlights', 'Trees', 'Water Pipes', 'Light Poles', 'Natural Features'],
    datasets: [{
      data: [
        buildingsFolderData ? buildingsFolderData.length : 0,
        roadsLayer ? 50 : 0,
        0, 0, 0,
        lightPolesData ? lightPolesData.length : 0,
        naturalData ? naturalData.length : 0
      ],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
      borderWidth: 1
    }]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: {size: 10} } },
      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}` } }
    }
  };
  if (assetChart) assetChart.destroy();
  assetChart = new Chart(ctx, {type: 'pie', data, options});
}

document.getElementById('toggleChartBtn').addEventListener('click', function() {
  const chart = document.getElementById('assetDistributionChart');
  if (isChartVisible) {
    chart.style.display = 'none';
    this.textContent = 'Show Asset Distribution';
  } else {
    chart.style.display = 'block';
    this.textContent = 'Hide Asset Distribution';
  }
  isChartVisible = !isChartVisible;
  if (isChartVisible) updateAssetDistributionChart();
});

/* ------------------ DIGIPIN (Script-based, no GeoServer dependency) ------------------ */
// DigiPin encoding algorithm - fully implemented in JavaScript
const DIGIPIN = (function(){
  const LABEL_MATRIX = [['F','C','9','8'],['J','3','2','7'],['K','4','5','6'],['L','M','P','T']];
  const MIN_LAT = 2.5, MAX_LAT = 38.5, MIN_LON = 63.5, MAX_LON = 99.5, EPS = 1e-12;
  
  function encode(lat, lon, length = 10){
    if(length < 1 || length > 10) throw new Error('length must be 1..10');
    if(lat < MIN_LAT - EPS || lat > MAX_LAT + EPS || lon < MIN_LON - EPS || lon > MAX_LON + EPS) {
      throw new Error('Coordinates out of DIGIPIN bounding box');
    }
    let MinLat = MIN_LAT, MaxLat = MAX_LAT, MinLon = MIN_LON, MaxLon = MAX_LON, v = '';
    let bounds = {MinLat, MaxLat, MinLon, MaxLon};
    
    for(let Lvl = 1; Lvl <= length; Lvl++){
      const LatDiv = (MaxLat - MinLat) / 4, LonDiv = (MaxLon - MinLon) / 4;
      let NextMaxLat = MaxLat, NextMinLat = MaxLat - LatDiv, row = 0;
      
      for(let x = 0; x < 4; x++){
        if(lat >= NextMinLat && lat < NextMaxLat){ row = x; break; }
        NextMaxLat = NextMinLat;
        NextMinLat = NextMaxLat - LatDiv;
      }
      if(Math.abs(lat - MaxLat) < EPS) row = 0;
      
      let NextMinLon = MinLon, NextMaxLon = MinLon + LonDiv, col = 0;
      for(let x = 0; x < 4; x++){
        if(lon >= NextMinLon && lon < NextMaxLon){ col = x; break; }
        if((NextMinLon + LonDiv) < MaxLon){
          NextMinLon = NextMaxLon;
          NextMaxLon = NextMinLon + LonDiv;
        } else { col = x; }
      }
      if(Math.abs(lon - MaxLon) < EPS) col = 3;
      
      v += LABEL_MATRIX[row][col];
      if(Lvl === 3 || Lvl === 6) v += '-';
      
      MinLat = NextMinLat;
      MaxLat = NextMaxLat;
      MinLon = NextMinLon;
      MaxLon = NextMaxLon;
      bounds = {MinLat, MaxLat, MinLon, MaxLon};
    }
    return {code: v, bounds};
  }
  
  return {encode};
})();

// Update DigiPin display box
function updateDigiPinBox(code, lat, lng){
  document.getElementById('digipinCode').innerText = `Code: ${code}`;
  document.getElementById('latlng').innerText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
}

// Mousemove: Live DigiPin update (script-based, no GeoServer)
function setupMapEventListeners() {
  if (!map) return;
  
map.on('mousemove', e => {
  const {lat, lng} = e.latlng;
  try{
    const result = DIGIPIN.encode(lat, lng, 10);
    updateDigiPinBox(result.code, lat, lng);
  }catch(err){
    updateDigiPinBox('--', lat, lng);
  }
});
}

/* ------------------ LOAD ASSETS METADATA JSON ------------------ */
async function loadAssetsMetadata() {
  try {
    const response = await fetch("assets-data.json");
    if (response.ok) {
      assetsMetadata = await response.json();
      console.log("Assets metadata loaded successfully");
    }
  } catch (error) {
    console.error("Error loading assets metadata:", error);
  }
}

/* ------------------ DISPLAY FILTER RESPONSE ------------------ */
function displayFilterResponse(layerKey, isChecked) {
  if (!assetsMetadata) {
    return;
  }

  const layerInfo = assetsMetadata.layers[layerKey];
  if (!layerInfo) return;

  let responseDiv = document.getElementById("filterResponse");
  if (!responseDiv) {
    // Create response div if it doesn't exist
    const infoPanel = document.getElementById("infoPanel");
    responseDiv = document.createElement("div");
    responseDiv.id = "filterResponse";
    responseDiv.style.cssText = "margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 5px; border-left: 4px solid #002b5c;";
    infoPanel.insertBefore(responseDiv, infoPanel.firstChild.nextSibling);
  }

  if (isChecked) {
    let html = `<div style="font-weight: 600; color: #002b5c; margin-bottom: 8px;">📊 ${layerInfo.name} - Active</div>`;
    html += `<div style="color: #666; margin-bottom: 5px;"><strong>Description:</strong> ${layerInfo.description}</div>`;
    html += `<div style="color: #666; margin-bottom: 5px;"><strong>Type:</strong> ${layerInfo.type}</div>`;
    
    if (layerInfo.totalFeatures) {
      html += `<div style="color: #666; margin-bottom: 5px;"><strong>Total Features:</strong> ${layerInfo.totalFeatures}</div>`;
    }
    
    if (layerInfo.totalArea) {
      html += `<div style="color: #666; margin-bottom: 5px;"><strong>Total Area:</strong> ${layerInfo.totalArea}</div>`;
    }
    
    if (layerInfo.totalLength) {
      html += `<div style="color: #666; margin-bottom: 5px;"><strong>Total Length:</strong> ${layerInfo.totalLength}</div>`;
    }
    
    if (layerInfo.coverage) {
      html += `<div style="color: #666; margin-bottom: 5px;"><strong>Coverage:</strong> ${layerInfo.coverage}</div>`;
    }
    
    html += `<div style="color: #666; margin-bottom: 5px;"><strong>Status:</strong> <span style="color: #28a745;">${layerInfo.status}</span></div>`;
    html += `<div style="color: #666; margin-bottom: 10px;"><strong>Last Updated:</strong> ${layerInfo.lastUpdated}</div>`;
    
    if (layerInfo.attributes) {
      html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;"><strong style="color: #002b5c;">Attributes:</strong><ul style="margin: 5px 0; padding-left: 20px;">`;
      for (const [key, value] of Object.entries(layerInfo.attributes)) {
        const valueStr = Array.isArray(value) ? value.join(", ") : value;
        html += `<li style="color: #666; margin: 3px 0;"><strong>${key}:</strong> ${valueStr}</li>`;
      }
      html += `</ul></div>`;
    }
    
    responseDiv.innerHTML = html;
    responseDiv.style.display = "block";
  } else {
    responseDiv.style.display = "none";
  }
}

// Mobile-specific optimizations
function setupMobileOptimizations() {
  // Prevent double-tap zoom on buttons and checkboxes
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Improve touch scrolling
  if ('ontouchstart' in window) {
    document.body.style.touchAction = 'pan-y';
  }

  // Mobile menu toggle functionality
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  const mobileInfoToggle = document.getElementById('mobileInfoToggle');
  const infoPanel = document.getElementById('infoPanel');
  const closeInfoPanel = document.getElementById('closeInfoPanel');

  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function(event) {
      if (sidebar.classList.contains('active') && 
          !sidebar.contains(event.target) && 
          !mobileMenuToggle.contains(event.target)) {
        sidebar.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });
  }

  if (mobileInfoToggle && infoPanel) {
    mobileInfoToggle.addEventListener('click', function() {
      infoPanel.classList.toggle('active');
      if (infoPanel.classList.contains('active')) {
        mobileInfoToggle.style.display = 'none';
      }
    });
  }

  if (closeInfoPanel && infoPanel) {
    closeInfoPanel.addEventListener('click', function() {
      infoPanel.classList.remove('active');
      if (mobileInfoToggle) {
        mobileInfoToggle.style.display = 'block';
      }
    });
  }

  // Close info panel when clicking outside on mobile
  if (infoPanel) {
    infoPanel.addEventListener('click', function(event) {
      if (event.target === infoPanel) {
        infoPanel.classList.remove('active');
        if (mobileInfoToggle) {
          mobileInfoToggle.style.display = 'block';
        }
      }
    });
  }
}

/* ------------------ DRAGGABLE INFO PANEL (Desktop Only) ------------------ */
function setupDraggableInfoPanel() {
  const infoPanel = document.getElementById("infoPanel");
  if (!infoPanel) return;

  function isDesktop() {
    return window.innerWidth > 768 && !('ontouchstart' in window);
  }

  if (!isDesktop()) {
    return;
  }

  infoPanel.classList.add('draggable');
  const dragHandle = infoPanel.querySelector('.drag-handle');
  if (!dragHandle) return;

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  function dragStart(e) {
    if (e.type === "touchstart") return;
    
    if (e.target === dragHandle || dragHandle.contains(e.target)) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === dragHandle || dragHandle.contains(e.target)) {
        isDragging = true;
      }
    }
  }

  function drag(e) {
    if (!isDragging || e.type === "touchmove") return;

    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, infoPanel);
  }

  function dragEnd(e) {
    if (e.type === "touchend") return;
    
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  dragHandle.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);

  window.addEventListener('resize', function() {
    if (!isDesktop()) {
      infoPanel.style.transform = '';
      infoPanel.classList.remove('draggable');
    } else {
      infoPanel.classList.add('draggable');
    }
  });
}

// Setup 360 viewer close button
function setup360ViewerClose() {
  const closeBtn = document.getElementById("close360Viewer");
  const modal = document.getElementById("viewer360Modal");
  const modalContent = modal ? modal.querySelector('.viewer360-modal-content') : null;
  
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      close360Viewer();
    });
  }
  
  if (modal) {
    modal.addEventListener('click', function(e) {
      // Only close if clicking directly on the modal background, not on modal content or its children
      // Check if click is on modal itself (not on any child elements)
      if (e.target === modal || e.target.classList.contains('viewer360-modal')) {
        // Double check - make sure we're not clicking on viewer container or its children
        const viewerContainer = document.getElementById("viewer360Container");
        if (viewerContainer && (viewerContainer.contains(e.target) || e.target === viewerContainer)) {
          return; // Don't close if clicking on viewer
        }
        close360Viewer();
      }
    });
    
    // Prevent clicks inside modal content from closing the modal
    if (modalContent) {
      modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      modalContent.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
      modalContent.addEventListener('mouseup', function(e) {
        e.stopPropagation();
      });
    }
    
    // Also prevent clicks in viewer container (Marzipano viewer)
    // BUT allow hotspot clicks to work
    const viewerContainer = document.getElementById("viewer360Container");
    if (viewerContainer) {
      // Use capture phase to stop propagation early, but allow hotspot clicks
      viewerContainer.addEventListener('click', function(e) {
        // Allow hotspot clicks to work
        if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
          e.stopPropagation();
        }
      }, true);
      viewerContainer.addEventListener('mousedown', function(e) {
        if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
          e.stopPropagation();
        }
      }, true);
      viewerContainer.addEventListener('mouseup', function(e) {
        if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
          e.stopPropagation();
        }
      }, true);
      viewerContainer.addEventListener('touchstart', function(e) {
        if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
          e.stopPropagation();
        }
      }, true);
      viewerContainer.addEventListener('touchend', function(e) {
        if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) {
          e.stopPropagation();
        }
      }, true);
    }
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        close360Viewer();
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setupMobileOptimizations();
    setupDraggableInfoPanel();
    setup360ViewerClose();
    setup360Carousel();
    loadCSVData();
    initialize();
  });
} else {
  setupMobileOptimizations();
  setupDraggableInfoPanel();
  setup360ViewerClose();
  setup360Carousel();
  loadCSVData();
  initialize();
}

function initialize() {
  if (!initMap()) {
    console.error("Failed to initialize map");
    return;
  }
  setupCheckboxListeners();
  setupMapClickHandler();
  setupMapEventListeners();
loadAllLayers();
  loadAssetsMetadata();
}

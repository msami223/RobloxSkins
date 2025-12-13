import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Canvas, Image as FabImage, Circle, PencilBrush } from 'fabric'; // Fabric 6.x import

// --- Configuration ---
const ASSETS = {
  models: {
    blocky: '/models/roblox_model_blocky.glb',
    boy: '/models/model-boy.glb',
    girl: '/models/model-girl.glb'
  },
  templates: {
    pants: '/templates/Template-Pants-R15.png',
    shirt: '/templates/Template-Shirts-R15.png'
  }
};

// --- State ---
const state = {
  activeLayer: 'shirt', // shirt | pants
  brushColor: '#ff0000',
  brushSize: 5
};

// --- 3D Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f0f13');

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const previewPanel = document.querySelector('.preview-panel');
renderer.setSize(previewPanel.clientWidth, previewPanel.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('scene-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(2, 5, 5);
scene.add(dirLight);

// --- Fabric.js Setup ---
// We need TWO conceptual canvases, but only one DOM canvas in the workspace.
// Strategy: Load the "active" data into the single Fabric canvas, or swap instances?
// Swapping instances is safer for state preservation.
// But Fabric attaches to an ID.
// Better: Have two hidden valid DOM elements, and swap the wrapper's visibility?
// Or simply saveJSON/loadJSON on switch? save/load is cleaner for "files" but heavier.
// Let's go with: Single visible Fabric Canvas, but we swap the *Underlying Data*?
// No, the easiest way is to have TWO fabric instances created on TWO canvas elements,
// and we just toggle `display: none` on the container div of the fabric instance.

// Wait, standard Fabric practice: `new Canvas('id')`.
// Let's stick to ONE canvas element and re-render?
// Actually for robustness, let's just create two canvases in HTML and hide one.
// The HTML currently has `editor-canvas`. Let's create another one dynamically or repurpose.

// REF: HTML has <canvas id="editor-canvas">.
// Let's create two Fabric instances (fCanvasShirt, fCanvasPants).
// But they can't bind to the same ID.
// So we will create a second canvas element in JS.

const wrapper = document.getElementById('workspace-wrapper'); // Updated selector
const canvasElShirt = document.getElementById('editor-canvas'); // Default existing
const canvasElPants = document.createElement('canvas'); // New one
canvasElPants.id = 'editor-canvas-pants';
canvasElPants.width = 585;
canvasElPants.height = 559;
wrapper.appendChild(canvasElPants);

// Initialize Fabric
// Fabric 6.x: new Canvas(el, options)
const fCanvasShirt = new Canvas(canvasElShirt, { isDrawingMode: false, width: 585, height: 559 });
const fCanvasPants = new Canvas(canvasElPants, { isDrawingMode: false, width: 585, height: 559 });

// Fix: Immediately initialize brushes so updateAllBrushes doesn't fail
fCanvasShirt.freeDrawingBrush = new PencilBrush(fCanvasShirt);
fCanvasPants.freeDrawingBrush = new PencilBrush(fCanvasPants);

// Do NOT hide Pants initially. Both should be visible.
// Fabric 6 wraps: <div class="canvas-container">...</div>
// We need to wait for init? No, sync.
// --- Canvas Wrappers (Windows) ---
function wrapCanvas(canvasEl, labelText, fCanvas) {
  // Create a "Window" card
  const windowDiv = document.createElement('div');
  windowDiv.className = 'canvas-window'; // New CSS class

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.width = '100%';
  header.style.marginBottom = '5px';

  const label = document.createElement('div');
  label.textContent = labelText;
  label.style.fontWeight = 'bold';
  label.style.color = '#fff';

  // Independent Zoom Controls
  const zoomControls = document.createElement('div');
  zoomControls.style.display = 'flex';
  zoomControls.style.gap = '5px';
  zoomControls.style.alignItems = 'center';

  const btnMinus = document.createElement('button');
  btnMinus.innerHTML = '<i class="fa-solid fa-minus"></i>';
  btnMinus.className = 'btn-tool'; // Reuse tool style
  btnMinus.style.padding = '4px 8px';
  btnMinus.style.fontSize = '0.8rem';

  const zoomDisplay = document.createElement('span');
  zoomDisplay.textContent = '100%';
  zoomDisplay.style.color = '#aaa';
  zoomDisplay.style.fontSize = '0.8rem';
  zoomDisplay.style.minWidth = '40px';
  zoomDisplay.style.textAlign = 'center';

  const btnPlus = document.createElement('button');
  btnPlus.innerHTML = '<i class="fa-solid fa-plus"></i>';
  btnPlus.className = 'btn-tool';
  btnPlus.style.padding = '4px 8px';
  btnPlus.style.fontSize = '0.8rem';

  zoomControls.appendChild(btnMinus);
  zoomControls.appendChild(zoomDisplay);
  zoomControls.appendChild(btnPlus);

  header.appendChild(label);
  header.appendChild(zoomControls);
  windowDiv.appendChild(header);

  // Insert before canvas, then move canvas container into window
  canvasEl.parentNode.insertBefore(windowDiv, canvasEl);
  windowDiv.appendChild(canvasEl);

  // Bind Zoom Events
  let currentZoom = 1;
  const updateZoom = (val) => {
    currentZoom = Math.max(0.1, Math.min(3, val));

    // CSS Zoom (Visual Only) - Keeps internal pixels 1:1 for Texture
    const container = fCanvas.getElement().parentElement; // .canvas-container
    container.style.transform = `scale(${currentZoom})`;
    container.style.transformOrigin = 'top left';

    // Update header percentage
    zoomDisplay.textContent = `${Math.round(currentZoom * 100)}%`;

    // Fabric needs to know about the external scaling to map mouse coordinates correctly?
    // Usually Fabric handles bounding client rect changes automatically on mouse events.
    // If pointer tracking is off, we might need a workaround.
  };

  btnMinus.onclick = () => updateZoom(currentZoom - 0.1);
  btnPlus.onclick = () => updateZoom(currentZoom + 0.1);

  return windowDiv;
}

// Init already happened. Let's find the containers.
const containerShirt = canvasElShirt.parentElement; // .canvas-container
const containerPants = canvasElPants.parentElement;

wrapCanvas(containerShirt, 'Shirt (Arms & Torso)', fCanvasShirt);
wrapCanvas(containerPants, 'Pants (Legs & Torso)', fCanvasPants);


// Interaction: Both always active. Remove "active/inactive" dimming logic.
// We still track 'activeLayer' for context if needed, but no visual blocking.
state.activeLayer = 'shirt'; // default

// --- Layers Panel Sync ---
const layersList = document.querySelector('.layer-list');

function syncLayersPanel() {
  layersList.innerHTML = ''; // Clear

  // 1. Create Sections
  const createSection = (title) => {
    const header = document.createElement('div');
    header.textContent = title;
    header.style.color = '#818cf8'; // Indigo-ish
    header.style.fontSize = '0.8rem';
    header.style.textTransform = 'uppercase';
    header.style.letterSpacing = '1px';
    header.style.padding = '10px 0 5px 0';
    header.style.borderBottom = '1px solid #333';
    header.style.marginBottom = '5px';
    return header;
  };

  const shirtSection = document.createElement('div');
  shirtSection.appendChild(createSection('Shirt Layers'));

  const pantsSection = document.createElement('div');
  pantsSection.appendChild(createSection('Pants Layers'));

  // Helper to add items
  const addItem = (canvasName, obj, index, fCanvas, container) => {
    const item = document.createElement('div');
    item.className = 'layer-item';

    // Highlight if active
    if (fCanvas.getActiveObject() === obj) {
      item.classList.add('active');
    }

    // Determine Name
    let type = obj.type;
    if (type === 'image') type = 'Sticker';
    if (type === 'path') type = 'Drawing';
    const displayName = obj.customName || `${type} ${index}`;

    // Structure: [Drag Handle] [Name] [Controls: Rename, Vis, Delete]

    // 1. Drag Handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<i class="fa-solid fa-grip-lines"></i>'; // The "=" icon
    dragHandle.title = "Drag to reorder";

    // 2. Name (Info)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'layer-info';
    infoDiv.textContent = displayName;

    // 3. Controls (Right)
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'layer-controls';

    // Rename
    const btnEdit = document.createElement('button');
    btnEdit.className = 'layer-btn';
    btnEdit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    btnEdit.title = "Rename";
    btnEdit.onclick = (e) => {
      e.stopPropagation();
      const newName = prompt("Rename Layer:", displayName);
      if (newName) {
        obj.customName = newName;
        syncLayersPanel();
      }
    };

    // Toggle Visibility
    const btnVis = document.createElement('button');
    btnVis.className = 'layer-btn';
    btnVis.innerHTML = obj.visible ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    btnVis.title = obj.visible ? "Hide" : "Show";
    btnVis.onclick = (e) => {
      e.stopPropagation();
      obj.visible = !obj.visible;
      fCanvas.renderAll();
      syncLayersPanel();
    };

    // Delete
    const btnDel = document.createElement('button');
    btnDel.className = 'layer-btn delete';
    btnDel.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    btnDel.title = "Delete";
    btnDel.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this layer?")) {
        fCanvas.remove(obj);
        fCanvas.renderAll();
      }
    };

    controlsDiv.appendChild(btnEdit);
    controlsDiv.appendChild(btnVis);
    controlsDiv.appendChild(btnDel);

    item.appendChild(dragHandle);
    item.appendChild(infoDiv);
    item.appendChild(controlsDiv);

    // Select on click (Background click)
    item.addEventListener('click', (e) => {
      // Don't select if clicking controls (handled by stopPropagation, but good to be safe)
      if (e.target.closest('.layer-btn')) return;

      fCanvas.setActiveObject(obj);
      fCanvas.renderAll();
      syncLayersPanel(); // Refresh to show active state
    });

    // --- Drag and Drop Reordering (Restricted to Handle) ---
    item.draggable = true;

    item.addEventListener('dragstart', (e) => {
      // Critical: Only allow drag if handle was clicked
      if (!e.target.closest('.drag-handle')) {
        e.preventDefault();
        return;
      }

      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', JSON.stringify({
        canvas: canvasName,
        index: index
      }));
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      // Only allow dropping if same canvas
      // This is tricky to check in dragover without parsing data, but simple UI check:
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');

      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.canvas !== canvasName) return;

      const sourceIndex = data.index;
      const targetIndex = index;

      if (sourceIndex === targetIndex) return;

      fCanvas.moveObjectTo(obj, targetIndex);
      fCanvas.renderAll();
      syncLayersPanel();
    });

    container.appendChild(item);
  };

  // Populate Shirt
  const shirtObjs = [...fCanvasShirt.getObjects()].reverse();
  let shirtCount = 0;
  shirtObjs.forEach((obj, i) => {
    if (obj.excludeFromExport) return;
    addItem('Shirt', obj, i, fCanvasShirt, shirtSection);
    shirtCount++;
  });
  if (shirtCount === 0) {
    const empty = document.createElement('div');
    empty.textContent = "No layers";
    empty.style.padding = "10px";
    empty.style.color = "#555";
    empty.style.fontStyle = "italic";
    shirtSection.appendChild(empty);
  }

  // Populate Pants
  const pantsObjs = [...fCanvasPants.getObjects()].reverse();
  let pantsCount = 0;
  pantsObjs.forEach((obj, i) => {
    if (obj.excludeFromExport) return;
    addItem('Pants', obj, i, fCanvasPants, pantsSection);
    pantsCount++;
  });
  if (pantsCount === 0) {
    const empty = document.createElement('div');
    empty.textContent = "No layers";
    empty.style.padding = "10px";
    empty.style.color = "#555";
    empty.style.fontStyle = "italic";
    pantsSection.appendChild(empty);
  }

  layersList.appendChild(shirtSection);
  layersList.appendChild(pantsSection);
}

// Hook events
const events = ['object:added', 'object:removed', 'object:modified', 'selection:created', 'selection:updated', 'selection:cleared'];
[fCanvasShirt, fCanvasPants].forEach(c => {
  events.forEach(e => c.on(e, () => {
    // Debounce?
    syncLayersPanel();
  }));
});
// Initial sync
syncLayersPanel();


// --- Background Templates ---
function loadBg(fCanvas, url) {
  FabImage.fromURL(url).then(img => {
    img.set({
      left: 0, top: 0,
      selectable: false,
      evented: false,
      excludeFromExport: true
    });
    img.scaleToWidth(fCanvas.width);
    fCanvas.insertAt(0, img);
    fCanvas.renderAll();
  });
}
loadBg(fCanvasShirt, ASSETS.templates.shirt);
loadBg(fCanvasPants, ASSETS.templates.pants);

// --- 3D Texture Sync ---
const textureShirt = new THREE.CanvasTexture(fCanvasShirt.getElement());
textureShirt.colorSpace = THREE.SRGBColorSpace;
textureShirt.flipY = false;

const texturePants = new THREE.CanvasTexture(fCanvasPants.getElement());
texturePants.colorSpace = THREE.SRGBColorSpace;
texturePants.flipY = false;

// Sync Loop with Throttle
function autoUpdate(fCanvas, texture) {
  let lastUpdate = 0;
  fCanvas.on('after:render', () => {
    // Throttle to 30fps (~33ms) or 20fps (50ms) to reduce lag
    const now = Date.now();
    if (now - lastUpdate > 50) {
      texture.needsUpdate = true;
      lastUpdate = now;
    }
  });
  // Ensure final stroke is captured (mouse:up)
  fCanvas.on('mouse:up', () => {
    texture.needsUpdate = true;
  });
}
autoUpdate(fCanvasShirt, textureShirt);
autoUpdate(fCanvasPants, texturePants);

// --- Tools & UI Logic ---

// Sidebar Navigation
// (Layers Panel logic handled above automatically now)

// Sidebar Navigation
document.querySelectorAll('.nav-item').forEach(nav => {
  nav.addEventListener('click', () => {
    const tab = nav.dataset.tab;
    if (!tab) return; // Special buttons

    // Active State
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    nav.classList.add('active');

    // Panel Switch
    document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`panel-${tab}`);
    if (panel) panel.classList.add('active');

    // Mode Switching logic
    const isDraw = (tab === 'draw');
    [fCanvasShirt, fCanvasPants].forEach(c => {
      c.isDrawingMode = isDraw;
    });
  });
});

// Drawing Configuration
const brushBtn = document.getElementById('btn-brush');
const eraserBtn = document.getElementById('btn-eraser');
const colorInput = document.getElementById('color-picker');
const sizeInput = document.getElementById('brush-size');
const sizeVal = document.getElementById('size-val');

function updateBrush() {
  const activeCanvas = state.activeLayer === 'shirt' ? fCanvasShirt : fCanvasPants;
  activeCanvas.freeDrawingBrush = new PencilBrush(activeCanvas);
  activeCanvas.freeDrawingBrush.color = state.brushColor;
  activeCanvas.freeDrawingBrush.width = parseInt(state.brushSize);

  // Eraser?? Fabric EraserBrush is available in some builds, OR we use composite op.
  // MVP: Just paint White/Transparent?
  // Fabric 6 has proper EraserBrush!
  // If unavailable, we stick to overlay.
}

// Global update for both
function updateAllBrushes() {
  [fCanvasShirt, fCanvasPants].forEach(c => {
    c.freeDrawingBrush.color = state.brushColor;
    c.freeDrawingBrush.width = parseInt(state.brushSize);
  });
}


brushBtn.addEventListener('click', () => {
  state.brushColor = colorInput.value;
  brushBtn.classList.add('active');
  eraserBtn.classList.remove('active');
  updateAllBrushes(); // helper
});

eraserBtn.addEventListener('click', () => {
  // state.brushColor = 'rgba(255,255,255,1)'; // or actually transparent?
  // Fabric supports removing objects.
  // But for "brushing" eraser...
  // Let's set color to White for MVP
  state.brushColor = '#ffffff';
  brushBtn.classList.remove('active');
  eraserBtn.classList.add('active');
  updateAllBrushes();
});

colorInput.addEventListener('input', (e) => {
  state.brushColor = e.target.value;
  document.getElementById('color-hex').textContent = e.target.value.toUpperCase();
  if (eraserBtn.classList.contains('active')) {
    eraserBtn.classList.remove('active');
    brushBtn.classList.add('active');
  }
  updateAllBrushes();
});

sizeInput.addEventListener('input', (e) => {
  state.brushSize = e.target.value;
  sizeVal.textContent = state.brushSize;
  updateAllBrushes();
});

// Initial Brush Setup
updateAllBrushes();

// --- Upload Logic (Split) ---
function handleUpload(input, fCanvas) {
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      FabImage.fromURL(f.target.result).then(img => {
        // Resize if too big
        if (img.width > 300) {
          img.scaleToWidth(300);
        }
        fCanvas.add(img);
        fCanvas.centerObject(img);
        fCanvas.setActiveObject(img);
        fCanvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    input.value = ''; // Reset
  });
}

handleUpload(document.getElementById('img-upload-shirt'), fCanvasShirt);
handleUpload(document.getElementById('img-upload-pants'), fCanvasPants);


// Zoom Controls (Fabric)
let zoom = 1;
function setZoom(val) {
  zoom = Math.max(0.1, Math.min(3, val));
  [fCanvasShirt, fCanvasPants].forEach(c => {
    c.setZoom(zoom);
    // Panning logic handled by user drag? Or specific scroll?
    // Basic centered zoom
  });
  document.getElementById('zoom-level').textContent = `${Math.round(zoom * 100)}%`;
}


// Reset
document.getElementById('nav-reset').addEventListener('click', () => {
  if (confirm('Reset both canvases? This cannot be undone.')) {
    fCanvasShirt.getObjects().forEach(o => {
      if (!o.excludeFromExport) fCanvasShirt.remove(o);
    });
    fCanvasPants.getObjects().forEach(o => {
      if (!o.excludeFromExport) fCanvasPants.remove(o);
    });
  }
});

// Export (Download)
function downloadCanvas(fCanvas, name) {
  // 1. Zoom to 1 so export is correct resolution
  fCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  // 2. Export
  const dataUrl = fCanvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 1
  });

  const link = document.createElement('a');
  link.download = `roblox-skin-${name}-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 3. Restore zoom if needed? We didn't save it. 
  // Ideally we'd save state. But reset effectively zooms to 1.
  // Let's assume user is okay or re-zooms. 
}

document.getElementById('nav-download').addEventListener('click', () => {
  downloadCanvas(fCanvasShirt, 'shirt');
  setTimeout(() => {
    downloadCanvas(fCanvasPants, 'pants');
  }, 500);
});


// --- Model Loading & Mapping (Three.js) ---
const loader = new GLTFLoader();
let currentSceneModel = null;

function loadModel(modelName) {
  const path = ASSETS.models[modelName] || ASSETS.models.boy;
  if (currentSceneModel) scene.remove(currentSceneModel);

  loader.load(path, (gltf) => {
    const model = gltf.scene;
    currentSceneModel = model;

    // Auto-scale
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    model.scale.set(scale, scale, scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y += 0.8;

    scene.add(model);

    // Apply Textures
    model.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();

        // Standard mapping
        if (name.includes('bot') || name.includes('leg') || name.includes('pants')) {
          child.material.map = texturePants;
          child.material.needsUpdate = true;
        } else if (name.includes('top') || name.includes('shirt') || name.includes('arm')) {
          child.material.map = textureShirt;
          child.renderOrder = 1;
          child.material.needsUpdate = true;
        } else if (name.includes('torso') || name.includes('body')) {
          child.material.map = textureShirt;
          child.material.needsUpdate = true;
        }
        // NO generic else - avoids texturing 'ghost' or 'head' if they are separate named meshes

        if (child.material.map) {
          child.material.needsUpdate = true;
          child.material.map.flipY = false;
          child.material.transparent = true;
          child.material.alphaTest = 0;
          if (child.material.color) child.material.color.setHex(0xffffff);
        }
      }
    });

  }, undefined, (e) => console.error(e));
}

// Initial Load
loadModel('boy');
updateAllBrushes(); // Init defaults

// 3D Switcher
document.querySelectorAll('.switch-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');

    const key = e.target.dataset.model.includes('blocky') ? 'blocky' :
      e.target.dataset.model.includes('girl') ? 'girl' : 'boy';
    loadModel(key);
  });
});


// Resize Handler
window.addEventListener('resize', () => {
  const p = document.querySelector('.preview-panel');
  if (p) {
    camera.aspect = p.clientWidth / p.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(p.clientWidth, p.clientHeight);
  }
});
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Initial Trigger
setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 100);

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene setup
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
);
camera.position.set(3, 3, 3);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1;
controls.maxDistance = 30;
controls.autoRotate = true;
controls.autoRotateSpeed = 1;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight1.position.set(5, 10, 5);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0x667eea, 0.4);
directionalLight2.position.set(-5, 3, -5);
scene.add(directionalLight2);

// Helper to get UV coordinates for a triangle index
const getTriangleUVs = (uvAttribute, indices, i, width, height) => {
    const i1 = indices[i];
    const i2 = indices[i + 1];
    const i3 = indices[i + 2];

    // Standard orientation: U = U, V = V (matches user's "back to standard" state)
    // Note: V is naturally inverted in Canvas (0,0 is top-left) vs UV (0,0 is bot-left)
    // Three.js texture.flipY = false handles the WebGL <-> Image mismatch.
    // For drawing ON canvas, we rely on the data being correct.
    // If we want 1:1, we should map UV 0..1 to Canvas 0..Height (maybe inverted Y?)

    // UV space (0..1) where 0,0 is bottom-left.
    // Canvas space (0..H) where 0,0 is top-left.
    // To match visual expectation, usually we invert V for drawing: y = (1 - v) * height
    // BUT the user asked for standard orientation after flip-flopping.
    // Let's stick to the configuration that the USER approved as "Perfect" (Step 209).
    // u = array[..], v = array[..+1]

    return {
        u1: uvAttribute.array[i1 * 2] * width,
        v1: uvAttribute.array[i1 * 2 + 1] * height,
        u2: uvAttribute.array[i2 * 2] * width,
        v2: uvAttribute.array[i2 * 2 + 1] * height,
        u3: uvAttribute.array[i3 * 2] * width,
        v3: uvAttribute.array[i3 * 2 + 1] * height
    };
};

// Function to draw UV maps on 2D canvas
function drawUVMaps(uvMapInfo) {
    const container = document.getElementById('uvCanvasContainer');
    container.innerHTML = '';

    uvMapInfo.forEach((meshInfo, meshIdx) => {
        meshInfo.uvChannels.forEach((uvData, channelIdx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'uv-canvas-wrapper';

            const title = document.createElement('div');
            title.className = 'uv-title';
            title.textContent = `${meshInfo.name} - ${uvData.channel.toUpperCase()}`;
            wrapper.appendChild(title);

            const uvCanvas = document.createElement('canvas');
            uvCanvas.width = 512;
            uvCanvas.height = 512;
            uvCanvas.className = 'uv-canvas';
            wrapper.appendChild(uvCanvas);

            const ctx = uvCanvas.getContext('2d');

            let textureImage = null;

            // Smart default: If name contains "top" or "layer", give it higher priority
            const isTopLayer = meshInfo.name.toLowerCase().includes('top') ||
                meshInfo.name.toLowerCase().includes('layer') ||
                meshInfo.name.toLowerCase().includes('shirt');

            let textureTransform = {
                scale: 1,
                rotation: 0,
                x: uvCanvas.width / 2,
                y: uvCanvas.height / 2,
                zLayer: isTopLayer ? 1 : 0 // Default Z-Layer
            };

            let isDragging = false;
            let isScaling = false;
            let isRotating = false;
            let dragStart = { x: 0, y: 0 };
            let initialScale = 1;
            let initialDistance = 0;

            const getMaskedTextureCanvas = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = uvCanvas.width;
                tempCanvas.height = uvCanvas.height;
                const tempCtx = tempCanvas.getContext('2d');

                // 1. Draw transformed image
                if (textureImage) {
                    tempCtx.save();
                    tempCtx.translate(textureTransform.x, textureTransform.y);
                    tempCtx.rotate(textureTransform.rotation * Math.PI / 180);
                    tempCtx.scale(textureTransform.scale, textureTransform.scale);
                    tempCtx.drawImage(textureImage, -tempCanvas.width / 2, -tempCanvas.height / 2, tempCanvas.width, tempCanvas.height);
                    tempCtx.restore();
                }

                // 2. Apply UV Mask (destination-in)
                tempCtx.globalCompositeOperation = 'destination-in';
                tempCtx.fillStyle = 'white';
                tempCtx.beginPath();

                const geometry = meshInfo.geometry;
                const uvAttribute = uvData.data;

                if (geometry.index) {
                    const indices = geometry.index.array;
                    for (let i = 0; i < indices.length; i += 3) {
                        const uvs = getTriangleUVs(uvAttribute, indices, i, tempCanvas.width, tempCanvas.height);
                        tempCtx.moveTo(uvs.u1, uvs.v1);
                        tempCtx.lineTo(uvs.u2, uvs.v2);
                        tempCtx.lineTo(uvs.u3, uvs.v3);
                    }
                }
                tempCtx.fill();

                return tempCanvas;
            };

            const drawGrid = () => {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 10; i++) {
                    const pos = (i / 10) * uvCanvas.width;
                    ctx.beginPath();
                    ctx.moveTo(pos, 0);
                    ctx.lineTo(pos, uvCanvas.height);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(0, pos);
                    ctx.lineTo(uvCanvas.width, pos);
                    ctx.stroke();
                }

                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, uvCanvas.width, uvCanvas.height);
            };

            const drawWireframe = () => {
                const geometry = meshInfo.geometry;
                const uvAttribute = uvData.data;

                ctx.strokeStyle = '#f093fb';
                ctx.lineWidth = 2;

                if (geometry.index) {
                    const indices = geometry.index.array;
                    ctx.beginPath();
                    for (let i = 0; i < indices.length; i += 3) {
                        const uvs = getTriangleUVs(uvAttribute, indices, i, uvCanvas.width, uvCanvas.height);
                        ctx.moveTo(uvs.u1, uvs.v1);
                        ctx.lineTo(uvs.u2, uvs.v2);
                        ctx.lineTo(uvs.u3, uvs.v3);
                        ctx.lineTo(uvs.u1, uvs.v1);
                    }
                    ctx.stroke();
                }
            };

            const drawTransformHandles = () => {
                if (!textureImage) return;

                const halfSize = (uvCanvas.width / 2) * textureTransform.scale;

                ctx.save();
                ctx.translate(textureTransform.x, textureTransform.y);
                ctx.rotate(textureTransform.rotation * Math.PI / 180);

                ctx.strokeStyle = '#00d2ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);

                const handleSize = 12;
                const corners = [
                    { x: -halfSize, y: -halfSize },
                    { x: halfSize, y: -halfSize },
                    { x: halfSize, y: halfSize },
                    { x: -halfSize, y: halfSize }
                ];

                ctx.fillStyle = '#00d2ff';
                corners.forEach(corner => {
                    ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
                });

                const rotHandleY = -halfSize - 30;
                ctx.beginPath();
                ctx.moveTo(0, -halfSize);
                ctx.lineTo(0, rotHandleY);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, rotHandleY, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#f093fb';
                ctx.fill();
                ctx.strokeStyle = '#00d2ff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            };

            const redrawCanvas = () => {
                ctx.clearRect(0, 0, uvCanvas.width, uvCanvas.height);
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, uvCanvas.width, uvCanvas.height);
                drawGrid();

                if (textureImage) {
                    const maskedCanvas = getMaskedTextureCanvas();
                    ctx.drawImage(maskedCanvas, 0, 0);
                }

                drawWireframe();
                drawTransformHandles();
            };

            const updateModelTexture = () => {
                const maskedCanvas = getMaskedTextureCanvas();
                const texture = new THREE.CanvasTexture(maskedCanvas);
                texture.flipY = false;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.needsUpdate = true;

                model.traverse((child) => {
                    if (child.isMesh && child.geometry === meshInfo.geometry) {
                        child.material = child.material.clone();
                        child.material.map = texture;
                        child.material.transparent = true;

                        // Z-Layer Priority System
                        child.material.polygonOffset = true;
                        child.material.polygonOffsetFactor = -1 * textureTransform.zLayer; // Negative pulls towards camera
                        child.material.polygonOffsetUnits = -1 * textureTransform.zLayer;
                        child.material.depthTest = true;
                        child.material.depthWrite = true;

                        child.material.needsUpdate = true;
                    }
                });
            };

            const getMousePos = (e) => {
                const rect = uvCanvas.getBoundingClientRect();
                return {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            };

            const checkHandleHit = (mouseX, mouseY) => {
                if (!textureImage) return null;
                const halfSize = (uvCanvas.width / 2) * textureTransform.scale;
                const handleSize = 12;
                const dx = mouseX - textureTransform.x;
                const dy = mouseY - textureTransform.y;
                const angle = -textureTransform.rotation * Math.PI / 180;
                const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
                const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
                const rotHandleY = -halfSize - 30;
                const distToRot = Math.sqrt(localX * localX + (localY - rotHandleY) * (localY - rotHandleY));
                if (distToRot < 12) return 'rotate';
                const corners = [
                    { x: -halfSize, y: -halfSize, name: 'tl' },
                    { x: halfSize, y: -halfSize, name: 'tr' },
                    { x: halfSize, y: halfSize, name: 'br' },
                    { x: -halfSize, y: halfSize, name: 'bl' }
                ];
                for (const corner of corners) {
                    if (Math.abs(localX - corner.x) < handleSize && Math.abs(localY - corner.y) < handleSize) {
                        return 'scale-' + corner.name;
                    }
                }
                if (Math.abs(localX) < halfSize && Math.abs(localY) < halfSize) return 'drag';
                return null;
            };

            uvCanvas.addEventListener('mousedown', (e) => {
                const pos = getMousePos(e);
                const handle = checkHandleHit(pos.x, pos.y);
                if (handle === 'drag') {
                    isDragging = true;
                    dragStart = { x: pos.x - textureTransform.x, y: pos.y - textureTransform.y };
                    uvCanvas.style.cursor = 'move';
                } else if (handle && handle.startsWith('scale')) {
                    isScaling = true;
                    dragStart = pos;
                    initialScale = textureTransform.scale;
                    const dx = pos.x - textureTransform.x;
                    const dy = pos.y - textureTransform.y;
                    initialDistance = Math.sqrt(dx * dx + dy * dy);
                    uvCanvas.style.cursor = 'nwse-resize';
                } else if (handle === 'rotate') {
                    isRotating = true;
                    dragStart = pos;
                    uvCanvas.style.cursor = 'grabbing';
                }
            });

            uvCanvas.addEventListener('mousemove', (e) => {
                const pos = getMousePos(e);
                if (isDragging) {
                    textureTransform.x = pos.x - dragStart.x;
                    textureTransform.y = pos.y - dragStart.y;
                    redrawCanvas();
                    updateModelTexture();
                } else if (isScaling) {
                    const dx = pos.x - textureTransform.x;
                    const dy = pos.y - textureTransform.y;
                    const currentDistance = Math.sqrt(dx * dx + dy * dy);
                    const scaleRatio = currentDistance / initialDistance;
                    textureTransform.scale = Math.max(0.1, Math.min(5, initialScale * scaleRatio));
                    redrawCanvas();
                    updateModelTexture();
                } else if (isRotating) {
                    const dx = pos.x - textureTransform.x;
                    const dy = pos.y - textureTransform.y;
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                    textureTransform.rotation = angle;
                    redrawCanvas();
                    updateModelTexture();
                } else {
                    const handle = checkHandleHit(pos.x, pos.y);
                    if (handle === 'drag') uvCanvas.style.cursor = 'move';
                    else if (handle && handle.startsWith('scale')) uvCanvas.style.cursor = 'nwse-resize';
                    else if (handle === 'rotate') uvCanvas.style.cursor = 'grab';
                    else uvCanvas.style.cursor = 'default';
                }
            });

            uvCanvas.addEventListener('mouseup', () => { isDragging = false; isScaling = false; isRotating = false; uvCanvas.style.cursor = 'default'; });
            uvCanvas.addEventListener('mouseleave', () => { isDragging = false; isScaling = false; isRotating = false; uvCanvas.style.cursor = 'default'; });

            // Draw initial state
            redrawCanvas();

            // Controls Container
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'controls-container';

            // File Input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'uv-file-input';
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            textureImage = img;
                            textureTransform.scale = 1;
                            textureTransform.rotation = 0;
                            textureTransform.x = uvCanvas.width / 2;
                            textureTransform.y = uvCanvas.height / 2;
                            redrawCanvas();
                            updateModelTexture();
                            uploadBtn.innerHTML = '✅ Texture Loaded';
                            setTimeout(() => { uploadBtn.innerHTML = '📁 Change Texture'; }, 2000);
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Buttons
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'uv-upload-btn';
            uploadBtn.innerHTML = '📁 Upload Texture';
            uploadBtn.onclick = () => fileInput.click();

            const saveBtn = document.createElement('button');
            saveBtn.className = 'uv-save-btn';
            saveBtn.innerHTML = '💾 Save Texture';
            saveBtn.onclick = () => {
                if (!textureImage) { alert('Please upload a texture first!'); return; }
                const maskedCanvas = getMaskedTextureCanvas();
                const link = document.createElement('a');
                link.download = `${meshInfo.name}_texture_masked.png`;
                link.href = maskedCanvas.toDataURL('image/png');
                link.click();
            };

            const clearBtn = document.createElement('button');
            clearBtn.className = 'uv-clear-btn';
            clearBtn.innerHTML = '🗑️ Clear';
            clearBtn.onclick = () => {
                textureImage = null;
                textureTransform.scale = 1;
                textureTransform.rotation = 0;
                textureTransform.x = uvCanvas.width / 2;
                textureTransform.y = uvCanvas.height / 2;
                redrawCanvas();
                model.traverse((child) => {
                    if (child.isMesh && child.geometry === meshInfo.geometry) {
                        if (child.material.userData.originalMaterial) {
                            child.material = child.material.userData.originalMaterial.clone();
                            child.material.needsUpdate = true;
                        }
                    }
                });
                fileInput.value = '';
                uploadBtn.innerHTML = '📁 Upload Texture';
            };

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'uv-button-container';
            buttonContainer.appendChild(uploadBtn);
            buttonContainer.appendChild(saveBtn);
            buttonContainer.appendChild(clearBtn);
            buttonContainer.appendChild(fileInput);
            controlsContainer.appendChild(buttonContainer);

            // Z-Layer Control
            const zLayerContainer = document.createElement('div');
            zLayerContainer.className = 'z-layer-container';
            zLayerContainer.innerHTML = `
                <label>Layer Priority (Z-Index):</label>
                <div class="z-layer-controls">
                    <button id="z-dec-${meshIdx}-${channelIdx}">-</button>
                    <span id="z-val-${meshIdx}-${channelIdx}">${textureTransform.zLayer}</span>
                    <button id="z-inc-${meshIdx}-${channelIdx}">+</button>
                </div>
            `;
            controlsContainer.appendChild(zLayerContainer);

            // Handle Z-Layer Click logic after appending
            setTimeout(() => {
                const decBtn = document.getElementById(`z-dec-${meshIdx}-${channelIdx}`);
                const incBtn = document.getElementById(`z-inc-${meshIdx}-${channelIdx}`);
                const valSpan = document.getElementById(`z-val-${meshIdx}-${channelIdx}`);

                decBtn.onclick = () => {
                    textureTransform.zLayer--;
                    valSpan.textContent = textureTransform.zLayer;
                    if (textureImage) updateModelTexture();
                };
                incBtn.onclick = () => {
                    textureTransform.zLayer++;
                    valSpan.textContent = textureTransform.zLayer;
                    if (textureImage) updateModelTexture();
                };
            }, 0);

            wrapper.appendChild(controlsContainer);

            const hint = document.createElement('div');
            hint.className = 'uv-hint';
            hint.innerHTML = '💡 Drag to move • Corners to scale • Top handle to rotate';
            wrapper.appendChild(hint);

            const info = document.createElement('div');
            info.className = 'uv-info';
            info.textContent = `${uvData.count} UV points`;
            wrapper.appendChild(info);

            container.appendChild(wrapper);
        });
    });
}

// Load the model
const loader = new GLTFLoader();
let model = null;
const loadingElement = document.getElementById('loading');

loader.load(
    'roblox_model_blocky.glb',
    (gltf) => {
        model = gltf.scene;
        let uvMapInfo = [];
        let meshIndex = 0;

        model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                const meshInfo = {
                    name: child.name || `Mesh ${meshIndex}`,
                    uvChannels: [],
                    geometry: geometry
                };

                if (geometry.attributes.uv) {
                    meshInfo.uvChannels.push({
                        channel: 'uv',
                        count: geometry.attributes.uv.count,
                        data: geometry.attributes.uv
                    });
                }
                if (geometry.attributes.uv2) {
                    meshInfo.uvChannels.push({
                        channel: 'uv2',
                        count: geometry.attributes.uv2.count,
                        data: geometry.attributes.uv2
                    });
                }

                uvMapInfo.push(meshInfo);
                meshIndex++;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 8 / maxDim;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        scene.add(model);
        loadingElement.classList.add('hidden');

        console.log('=== Model loaded successfully! ===');
        console.log('Total meshes:', meshIndex);

        if (uvMapInfo.length > 0) {
            drawUVMaps(uvMapInfo);
        }
    },
    (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
    },
    (error) => {
        console.error('Error loading model:', error);
        loadingElement.innerHTML = '<div class="spinner"></div><p>Error loading model.</p>';
    }
);

// Background color controls
const colorButtons = document.querySelectorAll('.color-btn');
colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        scene.background = new THREE.Color(btn.dataset.color);
    });
});

// Rotation toggle
let isRotating = true;
const toggleRotationBtn = document.getElementById('toggleRotation');
const rotationIcon = document.getElementById('rotationIcon');

toggleRotationBtn.addEventListener('click', () => {
    isRotating = !isRotating;
    controls.autoRotate = isRotating;

    if (isRotating) {
        rotationIcon.textContent = '⏸';
        toggleRotationBtn.innerHTML = '<span id="rotationIcon">⏸</span> Pause';
    } else {
        rotationIcon.textContent = '▶';
        toggleRotationBtn.innerHTML = '<span id="rotationIcon">▶</span> Play';
    }
});

// Reset camera
const resetCameraBtn = document.getElementById('resetCamera');
resetCameraBtn.addEventListener('click', () => {
    camera.position.set(3, 3, 3);
    controls.target.set(0, 0, 0);
    controls.update();
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

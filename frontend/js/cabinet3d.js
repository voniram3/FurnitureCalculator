/**
 * Cabinet 3D Visualizer v3.0
 * 
 * Three.js 3D визуализация на шкаф.
 * Ляв бутон = завъртане, среден/десен бутон = преместване, скрол = zoom.
 */

const Cabinet3D = {
    scene: null,
    camera: null,
    renderer: null,
    cabinetGroup: null,
    animationId: null,
    container: null,
    initialized: false,
    lastParams: null,

    // Camera state
    cameraDistance: 1500,
    cameraAngleX: 0.5,   // vertical angle (radians)
    cameraAngleY: 0.6,   // horizontal angle (radians)
    cameraTarget: null,   // THREE.Vector3 — look-at point

    // Interaction
    isDragging: false,
    isPanning: false,
    prevMouse: { x: 0, y: 0 },

    COLORS: {
        corpus: 0xD4A574,
        door: 0xE8C99B,
        back: 0x9E9E9E,
        shelf: 0xCBB58A,
        drawer: 0xDEB887,
        drawerFront: 0xE8C99B,
        handle: 0x555555,
        legs: 0x444444,
        stabilizer: 0xC49666,
        closingPanel: 0xE0D0B8,
        ovenSpace: 0x333333,
    },

    T: 18, BT: 3, GAP: 3, LEG_H: 100,

    init(containerId = 'cabinet3dCanvas') {
        if (typeof THREE === 'undefined') return false;
        this.container = document.getElementById(containerId);
        if (!this.container) return false;

        const cw = this.container.clientWidth || 400;
        const ch = this.container.clientHeight || 300;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);

        this.camera = new THREE.PerspectiveCamera(35, cw / ch, 1, 20000);
        this.cameraTarget = new THREE.Vector3(0, 300, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(cw, ch);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(500, 800, 600);
        dir.castShadow = true;
        this.scene.add(dir);
        this.scene.add(new THREE.DirectionalLight(0xffffff, 0.25).translateX(-300).translateY(400).translateZ(-200));

        // Ground
        const gnd = new THREE.Mesh(
            new THREE.PlaneGeometry(4000, 4000),
            new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 })
        );
        gnd.rotation.x = -Math.PI / 2;
        gnd.position.y = -2;
        gnd.receiveShadow = true;
        this.scene.add(gnd);

        this.cabinetGroup = new THREE.Group();
        this.scene.add(this.cabinetGroup);

        this._bindMouse();
        this._resizeObs = new ResizeObserver(() => this._onResize());
        this._resizeObs.observe(this.container);

        this.initialized = true;
        this._animate();
        return true;
    },

    /**
     * Reset camera to default view
     */
    resetView() {
        this.cameraAngleX = 0.5;
        this.cameraAngleY = 0.6;
        this.cameraDistance = 1500;
        if (this.cameraTarget) {
            this.cameraTarget.set(0, 300, 0);
        }
    },

    /**
     * Update camera position from angles
     */
    _updateCamera() {
        if (!this.camera || !this.cameraTarget) return;
        const cx = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
        const cy = this.cameraDistance * Math.sin(this.cameraAngleX);
        const cz = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);

        this.camera.position.set(
            this.cameraTarget.x + cx,
            this.cameraTarget.y + cy,
            this.cameraTarget.z + cz
        );
        this.camera.lookAt(this.cameraTarget);
    },

    update(params) {
        if (!this.initialized && !this.init()) return;
        this.lastParams = params;

        // Clear
        while (this.cabinetGroup.children.length) {
            const c = this.cabinetGroup.children[0];
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
            this.cabinetGroup.remove(c);
        }

        const { type, width: w, height: h, depth: d, shelf_count = 0, door_count = 0, drawer_count = 0, has_back = true } = params;
        const t = this.T;
        const bt = this.BT;

        const isLower = ['base','sink','oven','blind','drawer','baseMechanism','baseBasket'].includes(type);
        const isUpper = ['upper','upperLift'].includes(type);
        const isColumn = ['column','fridge'].includes(type);
        const hasLegs = isLower;
        const legH = hasLegs ? this.LEG_H : 0;
        const by = legH;

        // ── PANEL / PLINTH ──
        if (type === 'panel' || type === 'plinth') {
            this._box(w/2, h/2, t/2, w, h, t, this.COLORS.corpus);
            this._setupCamera(w, h, d);
            return;
        }

        // ── КРАКА ──
        if (hasLegs) {
            const lp = w >= 800
                ? [[40,40],[w/2,40],[w-40,40],[40,d-40],[w/2,d-40],[w-40,d-40]]
                : [[40,40],[w-40,40],[40,d-40],[w-40,d-40]];
            lp.forEach(([x,z]) => this._box(x, legH/2, z, 30, legH, 30, this.COLORS.legs));
        }

        // ── СТРАНИЦИ ──
        this._box(t/2, by+h/2, d/2, t, h, d, this.COLORS.corpus);
        this._box(w-t/2, by+h/2, d/2, t, h, d, this.COLORS.corpus);

        // ── ДЪНО ──
        const bw = w - 2*t;
        this._box(w/2, by+t/2, d/2, bw, t, d, this.COLORS.corpus);

        // ── ФУРНА: второ дъно ──
        if (type === 'oven') {
            const secondY = by + t + 145 + t/2;
            this._box(w/2, secondY, d/2, bw, t, d, this.COLORS.corpus);
            // Тъмно пространство за фурна
            const ovenH = h - 145 - 3*t;
            this._box(w/2, secondY + t/2 + ovenH/2, d/2+10, bw-10, ovenH-10, d-30, this.COLORS.ovenSpace, 0.25);
        }

        // ── КАПАК ──
        if (isUpper || isColumn) {
            this._box(w/2, by+h-t/2, d/2, bw, t, d, this.COLORS.corpus);
        }

        // ── СТАБИЛИЗАТОРИ (долни, без чекмеджета) ──
        if (isLower && type !== 'drawer') {
            const stabW = bw;
            const stabDepth = d / 4;
            const stabY = by + h - t/2;

            // Преден стабилизатор (1/4 от предния ръб)
            this._box(w/2, stabY, stabDepth/2, stabW, t, stabDepth, this.COLORS.stabilizer);
            // Заден стабилизатор (1/4 от задния ръб)
            this._box(w/2, stabY, d - stabDepth/2, stabW, t, stabDepth, this.COLORS.stabilizer);

            // 3-ти стабилизатор (вертикален, на задната стена, под задния хоризонтален)
            if (type === 'sink' || w >= 800) {
                const thirdH = h * 0.3;
                // Позиция: по средата на ширината, притиснат до гръба (z ≈ bt),
                // вертикален от stabY надолу
                this._box(w/2, stabY - t/2 - thirdH/2, bt + t/2, stabW, thirdH, t, this.COLORS.stabilizer);
            }
        }

        // ── ГРЪБ ──
        if (has_back) {
            this._box(w/2, by+h/2, bt/2, w-2, h-2, bt, this.COLORS.back, 0.45);
        }

        // ── РАФТОВЕ ──
        if (shelf_count > 0) {
            const shW = bw - 1, shD = d - 30;
            for (let i = 0; i < shelf_count; i++) {
                const sy = by + t + ((h - 2*t) / (shelf_count + 1)) * (i + 1);
                this._box(w/2, sy, (d-15)/2, shW, t, shD, this.COLORS.shelf);
            }
        }

        // ── ВРАТИ ──
        if (door_count > 0 && type !== 'drawer') {
            const doorT = t;
            const doorZ = d + doorT/2 + 1;

            if (type === 'fridge' && door_count === 2) {
                const doorW = w - this.GAP;
                const bottomH = Math.floor((h - this.GAP) / 3);
                const topH = (h - this.GAP) - bottomH - this.GAP;
                this._box(w/2, by + bottomH/2 + 1, doorZ, doorW, bottomH, doorT, this.COLORS.door);
                this._box(w/2, by + bottomH/2 + 1, doorZ + doorT/2 + 3, 80, 8, 8, this.COLORS.handle);
                this._box(w/2, by + bottomH + this.GAP + topH/2, doorZ, doorW, topH, doorT, this.COLORS.door);
                this._box(w/2, by + bottomH + this.GAP + topH/2, doorZ + doorT/2 + 3, 80, 8, 8, this.COLORS.handle);
            }
            else if (type === 'oven') {
                // Фурна: лице на чекмедже 145мм
                const faceW = w - this.GAP*2;
                this._box(w/2, by + 145/2 + 1, doorZ, faceW, 145, doorT, this.COLORS.drawerFront);
                this._box(w/2, by + 145/2 + 1, doorZ + doorT/2 + 3, 80, 8, 8, this.COLORS.handle);
            }
            else if (type === 'blind') {
                const halfW = (w - this.GAP) / 2;
                const doorH = h - this.GAP;
                this._box(halfW/2 + 1, by + h/2, doorZ, halfW, doorH, doorT, this.COLORS.door);
                this._box(30, by + h/2, doorZ + doorT/2 + 3, 8, 80, 8, this.COLORS.handle);
                this._box(w - halfW/2 - 1, by + h/2, doorZ, halfW, doorH, doorT, this.COLORS.closingPanel);
            }
            else {
                const doorH = h - this.GAP;
                const doorW = (w - this.GAP) / door_count;
                for (let i = 0; i < door_count; i++) {
                    const dx = this.GAP/2 + doorW/2 + i * doorW;
                    this._box(dx, by + h/2, doorZ, doorW - 2, doorH, doorT, this.COLORS.door);
                    const hx = (i === 0) ? dx + doorW/2 - 30 : dx - doorW/2 + 30;
                    this._box(hx, by + h/2, doorZ + doorT/2 + 3, 8, 80, 8, this.COLORS.handle);
                }
            }
        }

        // ── ЧЕКМЕДЖЕТА ──
        if (drawer_count > 0) {
            let startY = by + t;
            let totalH = h - 2*t;

            if (type === 'oven') {
                totalH = 145 - 5;
            }

            const dH = (totalH - (drawer_count + 1) * 5) / drawer_count;
            const dW = bw - 4;
            const dD = d - 60;
            const pull = 15;
            const doorT = t;
            const doorZ = d + doorT/2 + 1;

            for (let i = 0; i < drawer_count; i++) {
                const dy = startY + 5 + (dH + 5) * i + dH/2;
                // Body
                this._box(w/2, dy, d/2 + pull, dW, dH-4, dD, this.COLORS.drawer, 0.4);
                // Front panel (за фурна вече има лице горе в секция врати, но за всички други показваме)
                this._box(w/2, dy, doorZ + pull, w - this.GAP*2, dH, doorT, this.COLORS.drawerFront);
                this._box(w/2, dy, doorZ + pull + doorT/2 + 3, 80, 8, 8, this.COLORS.handle);
            }
        }

        this._setupCamera(w, h + legH, d);
    },

    _setupCamera(w, h, d) {
        // Center
        const box = new THREE.Box3().setFromObject(this.cabinetGroup);
        const center = box.getCenter(new THREE.Vector3());
        this.cabinetGroup.position.x = -center.x;
        this.cabinetGroup.position.z = -center.z;

        // Set distance based on size
        this.cameraDistance = Math.max(w, h, d) * 2.2;
        this.cameraTarget.set(0, h * 0.35, 0);
        this._updateCamera();
    },

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this._resizeObs) this._resizeObs.disconnect();
        if (this.renderer && this.container) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        this.initialized = false;
    },

    // ═══════ PRIVATE ═══════

    _box(x, y, z, bw, bh, bd, color, opacity = 1.0) {
        const geo = new THREE.BoxGeometry(bw, bh, bd);
        const mat = new THREE.MeshStandardMaterial({
            color, roughness: 0.7, metalness: 0.05,
            transparent: opacity < 1, opacity
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const edges = new THREE.EdgesGeometry(geo);
        mesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.12, transparent: true })));
        this.cabinetGroup.add(mesh);
        return mesh;
    },

    _animate() {
        this.animationId = requestAnimationFrame(() => this._animate());
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    _onResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        const w = this.container.clientWidth, h = this.container.clientHeight;
        if (!w || !h) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    },

    _bindMouse() {
        const el = this.renderer.domElement;
        el.addEventListener('contextmenu', e => e.preventDefault());

        // Mouse
        el.addEventListener('mousedown', e => {
            if (e.button === 1 || e.button === 2) {
                this.isPanning = true;
            } else {
                this.isDragging = true;
            }
            this.prevMouse = { x: e.clientX, y: e.clientY };
        });

        el.addEventListener('mousemove', e => {
            const dx = e.clientX - this.prevMouse.x;
            const dy = e.clientY - this.prevMouse.y;
            this.prevMouse = { x: e.clientX, y: e.clientY };

            if (this.isDragging) {
                this.cameraAngleY += dx * 0.005;
                this.cameraAngleX += dy * 0.005;
                this.cameraAngleX = Math.max(0.05, Math.min(1.4, this.cameraAngleX));
                this._updateCamera();
            }
            if (this.isPanning) {
                // Move target up/down/left/right in screen space
                const panSpeed = this.cameraDistance * 0.001;
                this.cameraTarget.y += dy * panSpeed;
                // Lateral pan (perpendicular to view direction)
                const lateral = new THREE.Vector3(-dx * panSpeed, 0, 0);
                lateral.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngleY);
                this.cameraTarget.add(lateral);
                this._updateCamera();
            }
        });

        el.addEventListener('mouseup', () => { this.isDragging = false; this.isPanning = false; });
        el.addEventListener('mouseleave', () => { this.isDragging = false; this.isPanning = false; });

        // Touch
        let touchCount = 0;
        let lastPinchDist = 0;

        el.addEventListener('touchstart', e => {
            touchCount = e.touches.length;
            if (touchCount === 1) {
                this.isDragging = true;
                this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else if (touchCount === 2) {
                this.isDragging = false;
                this.isPanning = true;
                const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                this.prevMouse = { x: mx, y: my };
                lastPinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });

        el.addEventListener('touchmove', e => {
            if (touchCount === 1 && this.isDragging) {
                const dx = e.touches[0].clientX - this.prevMouse.x;
                const dy = e.touches[0].clientY - this.prevMouse.y;
                this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                this.cameraAngleY += dx * 0.005;
                this.cameraAngleX += dy * 0.005;
                this.cameraAngleX = Math.max(0.05, Math.min(1.4, this.cameraAngleX));
                this._updateCamera();
            }
            if (touchCount >= 2) {
                const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const dx = mx - this.prevMouse.x;
                const dy = my - this.prevMouse.y;
                this.prevMouse = { x: mx, y: my };

                // Pan
                const ps = this.cameraDistance * 0.001;
                this.cameraTarget.y += dy * ps;
                const lat = new THREE.Vector3(-dx * ps, 0, 0);
                lat.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngleY);
                this.cameraTarget.add(lat);

                // Pinch zoom
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (lastPinchDist > 0) {
                    this.cameraDistance *= lastPinchDist / dist;
                    this.cameraDistance = Math.max(200, Math.min(8000, this.cameraDistance));
                }
                lastPinchDist = dist;
                this._updateCamera();
            }
        }, { passive: true });

        el.addEventListener('touchend', () => {
            this.isDragging = false;
            this.isPanning = false;
            touchCount = 0;
            lastPinchDist = 0;
        });

        // Scroll zoom
        el.addEventListener('wheel', e => {
            e.preventDefault();
            this.cameraDistance *= 1 + e.deltaY * 0.001;
            this.cameraDistance = Math.max(200, Math.min(8000, this.cameraDistance));
            this._updateCamera();
        }, { passive: false });
    }
};

window.Cabinet3D = Cabinet3D;
export { Cabinet3D };

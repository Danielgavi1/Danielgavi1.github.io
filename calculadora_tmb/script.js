document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const inputs = {
        sexo: document.getElementById('sexo'),
        edad: document.getElementById('edad'),
        peso: document.getElementById('peso'),
        pesoObjetivo: document.getElementById('peso-objetivo'),
        altura: document.getElementById('altura'),
        actividad: document.getElementById('actividad'),
        grasa: document.getElementById('grasa'),
        formula: document.getElementById('formula'),
        objetivo: document.getElementById('objetivo'),
        caloriasCustom: document.getElementById('calorias-custom'),
        customGroup: document.getElementById('custom-calories-group'),
        themeToggle: document.getElementById('theme-toggle')
    };

    const display = {
        tmb: document.getElementById('tmb-output'),
        get: document.getElementById('get-output'),
        imc: document.getElementById('imc-output'),
        imcBadge: document.getElementById('imc-classification'),
        calories: document.getElementById('calories-output'),
        water: document.getElementById('water-output'),
        advice: document.getElementById('advice-text'),

        macros: {
            protein: { val: document.getElementById('protein-g'), cal: document.getElementById('protein-cals'), bar: document.getElementById('protein-bar') },
            carbs: { val: document.getElementById('carbs-g'), cal: document.getElementById('carbs-cals'), bar: document.getElementById('carbs-bar') },
            fats: { val: document.getElementById('fats-g'), cal: document.getElementById('fats-cals'), bar: document.getElementById('fats-bar') }
        }
    };

    const buttons = {
        reset: document.getElementById('reset-btn'),
        calculate: document.getElementById('calculate-btn')
    };

    // === CONSTANTS & CONFIG ===
    const GOAL_MULTIPLIERS = {
        'deficit_agresivo': 0.75, // -25% (Better standard)
        'deficit_moderado': 0.80, // -20%
        'mantenimiento': 1.00,
        'superavit_ligero': 1.10, // +10%
        'superavit_agresivo': 1.20 // +20%
    };

    const MACRO_RATIOS = {
        'deficit': { p: 0.40, f: 0.35, c: 0.25 }, // High protein/fat for satiety
        'mantenimiento': { p: 0.30, f: 0.35, c: 0.35 }, // Balanced
        'superavit': { p: 0.25, f: 0.25, c: 0.50 } // High carb for fuel
    };

    // === CORE LOGIC ===

    function calculateIMC(weight, heightCm) {
        if (!weight || !heightCm) return 0;
        const hM = heightCm / 100;
        return weight / (hM * hM);
    }

    function getIMCCategory(imc) {
        if (imc < 18.5) return { label: "Bajo Peso", color: "#3b82f6" };
        if (imc < 25) return { label: "Peso Normal", color: "#10b981" };
        if (imc < 30) return { label: "Sobrepeso", color: "#f59e0b" };
        return { label: "Obesidad", color: "#ef4444" };
    }

    function calculateTMB(data) {
        const { peso, altura, edad, sexo, formula, grasa } = data;
        let tmb = 0;

        if (formula === 'katch' && grasa) {
            // Katch-McArdle
            const leanMass = peso * (1 - (grasa / 100));
            tmb = 370 + (21.6 * leanMass);
        } else if (formula === 'harris') {
            // Harris-Benedict (Revised)
            if (sexo === 'masculino') {
                tmb = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad);
            } else {
                tmb = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad);
            }
        } else {
            // Mifflin-St Jeor (Default)
            const base = (10 * peso) + (6.25 * altura) - (5 * edad);
            tmb = (sexo === 'masculino') ? base + 5 : base - 161;
        }
        return tmb;
    }

    function calculateWaterIntake(weight) {
        return (weight * 0.035).toFixed(1);
    }

    function getRatiosByType(type) {
        return MACRO_RATIOS[type] || MACRO_RATIOS.mantenimiento;
    }

    function getAdviceText(goal, effectiveType) {
        if (goal === 'custom') {
            if (effectiveType === 'deficit') return 'Personalizado (Déficit): Hemos ajustado tus macros a ALTA PROTEÍNA para proteger tu músculo.';
            if (effectiveType === 'superavit') return 'Personalizado (Volumen): Hemos ajustado tus macros para priorizar la energía (Carbohidratos).';
            return 'Personalizado (Mantenimiento): Tus macros están balanceados para mantener tu peso.';
        }

        const texts = {
            'deficit_agresivo': 'Este es un déficit fuerte. Prioriza la proteína y el entrenamiento de fuerza.',
            'deficit_moderado': 'El ritmo ideal para perder grasa de forma sostenible. Mantén la constancia.',
            'mantenimiento': 'Perfecto para "Recomposición Corporal" o mantener tu físico.',
            'superavit_ligero': 'Volumen limpio. Ganarás músculo minimizando la ganancia de grasa.',
            'superavit_agresivo': 'Maximiza la ganancia muscular, cuidado con la grasa.'
        };
        return texts[goal] || 'Selecciona un objetivo.';
    }

    // === SKELETON LOADER UTILITIES ===
    function showSkeletons() {
        // Show skeleton loaders for KPI cards
        const skeletonElements = [
            'skeleton-tmb-icon', 'skeleton-tmb',
            'skeleton-get-icon', 'skeleton-get',
            'skeleton-imc-icon', 'skeleton-imc',
            'skeleton-protein', 'skeleton-protein-bar',
            'skeleton-carbs', 'skeleton-carbs-bar',
            'skeleton-fats', 'skeleton-fats-bar'
        ];

        const contentElements = [
            'tmb-icon', 'tmb-value',
            'get-icon', 'get-value',
            'imc-icon', 'imc-value',
            'protein-val', 'protein-bar-container',
            'carbs-val', 'carbs-bar-container',
            'fats-val', 'fats-bar-container'
        ];

        skeletonElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });

        contentElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

    function hideSkeletons() {
        const skeletonElements = [
            'skeleton-tmb-icon', 'skeleton-tmb',
            'skeleton-get-icon', 'skeleton-get',
            'skeleton-imc-icon', 'skeleton-imc',
            'skeleton-protein', 'skeleton-protein-bar',
            'skeleton-carbs', 'skeleton-carbs-bar',
            'skeleton-fats', 'skeleton-fats-bar'
        ];

        const contentElements = [
            'tmb-icon', 'tmb-value',
            'get-icon', 'get-value',
            'imc-icon', 'imc-value',
            'protein-val', 'protein-bar-container',
            'carbs-val', 'carbs-bar-container',
            'fats-val', 'fats-bar-container'
        ];

        skeletonElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        contentElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });
    }

    // === UI UPDATES ===

    function handleGoalChange() {
        const goal = inputs.objetivo.value;
        if (goal === 'custom') {
            inputs.customGroup.style.display = 'block';
            inputs.caloriasCustom.focus();
        } else {
            inputs.customGroup.style.display = 'none';
        }
        updateUI();
    }

    function updateUI() {
        // 1. Gather Inputs
        const data = {
            sexo: inputs.sexo.value,
            edad: parseFloat(inputs.edad.value),
            peso: parseFloat(inputs.peso.value),
            altura: parseFloat(inputs.altura.value),
            actividad: parseFloat(inputs.actividad.value),
            grasa: parseFloat(inputs.grasa.value),
            formula: inputs.formula.value,
            objetivo: inputs.objetivo.value
        };

        if (!data.edad || !data.peso || !data.altura) return;

        // Show skeleton loaders
        showSkeletons();

        // Simulate realistic calculation delay for better UX
        setTimeout(() => {
            // 2. Calculations
            const tmb = calculateTMB(data);
            const get = tmb * data.actividad;
            const imc = calculateIMC(data.peso, data.altura);
            const imcData = getIMCCategory(imc);
            const water = calculateWaterIntake(data.peso);

            // Target Calories Logic
            let targetCalories = 0;
            let effectiveType = 'mantenimiento';

            if (data.objetivo === 'custom') {
                const customVal = parseFloat(inputs.caloriasCustom.value);
                // Default to GET if empty, else use custom value
                targetCalories = customVal > 0 ? customVal : get;

                // Detect Type based on Custom Value vs GET
                if (targetCalories < get - 50) effectiveType = 'deficit';
                else if (targetCalories > get + 50) effectiveType = 'superavit';

            } else {
                targetCalories = get * GOAL_MULTIPLIERS[data.objetivo];
                // Detect Type based on preset
                if (data.objetivo.includes('deficit')) effectiveType = 'deficit';
                else if (data.objetivo.includes('superavit')) effectiveType = 'superavit';
            }

            // 3. Update Text Displays
            animateValue(display.tmb, tmb);
            animateValue(display.get, get);
            display.imc.textContent = imc.toFixed(1);

            display.imcBadge.textContent = imcData.label;
            display.imcBadge.style.backgroundColor = imcData.color + '33';
            display.imcBadge.style.color = imcData.color;

            animateValue(display.calories, targetCalories);
            display.water.textContent = `${water} L`;
            display.advice.textContent = getAdviceText(data.objetivo, effectiveType);

            // 4. Update Macros
            const ratios = getRatiosByType(effectiveType);

            const pCals = targetCalories * ratios.p;
            const fCals = targetCalories * ratios.f;
            const cCals = targetCalories * ratios.c;

            const pGrams = Math.round(pCals / 4);
            const fGrams = Math.round(fCals / 9);
            const cGrams = Math.round(cCals / 4);

            display.macros.protein.val.textContent = pGrams;
            display.macros.protein.cal.textContent = Math.round(pCals);
            display.macros.protein.bar.style.width = `${ratios.p * 100}%`;

            display.macros.carbs.val.textContent = cGrams;
            display.macros.carbs.cal.textContent = Math.round(cCals);
            display.macros.carbs.bar.style.width = `${ratios.c * 100}%`;

            display.macros.fats.val.textContent = fGrams;
            display.macros.fats.cal.textContent = Math.round(fCals);
            display.macros.fats.bar.style.width = `${ratios.f * 100}%`;

            // 5. Update Projection
            calculateProjection(data, tmb, targetCalories);

            // Hide skeleton loaders after data is populated
            hideSkeletons();
        }, 500); // 500ms delay for smooth loading effect
    }

    function calculateProjection(data, tmb, targetCal) {
        const currentWeight = data.peso;
        const targetWeight = parseFloat(inputs.pesoObjetivo.value);
        const projectionCard = document.getElementById('projection-card');
        const alertBox = document.getElementById('proj-alert');
        const contentBox = document.querySelector('.projection-content');

        const projWeight = document.getElementById('proj-weight');
        const projWeeks = document.getElementById('proj-weeks');
        const projDate = document.getElementById('proj-date');

        if (!targetWeight || targetWeight === currentWeight) {
            projectionCard.style.display = 'none';
            return;
        }

        projectionCard.style.display = 'flex';

        const tdee = tmb * data.actividad;
        const dailyDiff = targetCal - tdee;
        const weightDiff = targetWeight - currentWeight;

        // 1kg of fat ~ 7700 kcal
        const totalCaloriesNeeded = weightDiff * 7700;

        // Logic Check
        const isTryingToLose = weightDiff < 0;
        const isTryingToGain = weightDiff > 0;
        const isDeficit = dailyDiff < -50;
        const isSurplus = dailyDiff > 50;

        let isValidStrategy = false;

        // If Custom, we allow any combo but can warn
        if (isTryingToLose && isDeficit) isValidStrategy = true;
        if (isTryingToGain && isSurplus) isValidStrategy = true;

        if (!isValidStrategy) {
            contentBox.style.display = 'none';
            alertBox.style.display = 'flex';
            if (Math.abs(dailyDiff) <= 50) {
                alertBox.querySelector('span').textContent = "Estás en Mantenimiento. Cambia tu objetivo a Déficit o Superávit para ver el progreso.";
            } else if (isTryingToLose && isSurplus) {
                alertBox.querySelector('span').textContent = "Quieres bajar de peso pero estás en Superávit. Reduce tus calorías.";
            } else {
                alertBox.querySelector('span').textContent = "Tu estrategia nutricional contradice tu meta de peso.";
            }
            return;
        }

        // Strategy Valid
        contentBox.style.display = 'flex';
        alertBox.style.display = 'none';

        // Calculate Time
        const daysToGoal = totalCaloriesNeeded / dailyDiff;
        const weeksToGoal = Math.abs(daysToGoal / 7);
        const weeklyRate = Math.abs((dailyDiff * 7) / 7700); // kg per week

        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + Math.abs(daysToGoal));

        projWeight.textContent = `${targetWeight} kg`;

        let weeksText = "";
        if (weeksToGoal < 1) {
            weeksText = "menos de 1 semana";
        } else {
            weeksText = `${weeksToGoal.toFixed(1)} semanas`;
        }

        // Add Rate Context
        projWeeks.innerHTML = `${weeksText} <span style="font-size:0.6em; opacity:0.8; display:block; margin-top:4px; font-weight:400; color:var(--text-muted);">(Ritmo: ${weeklyRate.toFixed(2)} kg/semana)</span>`;

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        projDate.textContent = `Fecha estimada: ${futureDate.toLocaleDateString('es-ES', options)}`;
    }

    function animateValue(element, value) {
        if (!value) return;
        const target = Math.round(value);
        element.textContent = target.toLocaleString('en-US');
    }

    // === THEME HANDLING ===
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    function initTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            document.body.classList.add('light-theme');
            inputs.themeToggle.checked = false;
        } else {
            document.body.classList.remove('light-theme');
            inputs.themeToggle.checked = true;
        }
    }

    // === EVENT LISTENERS ===

    // Goal change listener
    inputs.objetivo.addEventListener('change', handleGoalChange);
    // Custom calorie input listener
    inputs.caloriasCustom.addEventListener('input', updateUI);

    Object.values(inputs).forEach(input => {
        if (input && (input.tagName === 'SELECT' || input.type === 'number' || input.type === 'text')) {
            if (input !== inputs.objetivo && input !== inputs.caloriasCustom) {
                input.addEventListener('input', updateUI);
                input.addEventListener('change', updateUI);
            }
        }
    });

    buttons.reset.addEventListener('click', () => {
        document.getElementById('calculator-form').reset();
        inputs.customGroup.style.display = 'none';
        display.tmb.textContent = '--';
        display.get.textContent = '--';
        display.calories.textContent = '--';
        display.macros.protein.bar.style.width = '0%';
        display.macros.carbs.bar.style.width = '0%';
        display.macros.fats.bar.style.width = '0%';
        document.getElementById('projection-card').style.display = 'none';
        document.getElementById('proj-alert').style.display = 'none';
    });

    buttons.calculate.addEventListener('click', () => {
        updateUI();
        if (window.innerWidth < 900) {
            document.getElementById('results-dashboard').scrollIntoView({ behavior: 'smooth' });
        }
    });

    inputs.themeToggle.addEventListener('change', toggleTheme);
    initTheme();

    // === 3D BODY COMPOSITION LOGIC ===
    let scene, camera, renderer, bodyGroup;
    let isRotating = true;
    const canvas = document.getElementById('body3d-canvas');
    const container = document.getElementById('body3d-canvas-wrapper');

    function init3D() {
        if (!canvas) return;

        // Scene setup
        scene = new THREE.Scene();
        scene.background = null;

        camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 1.2, 5.5);

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7.5);
        scene.add(mainLight);

        const rimLight = new THREE.PointLight(0xd4af37, 1); // Premium Gold Rim Light
        rimLight.position.set(-5, 5, -5);
        scene.add(rimLight);

        const blueFill = new THREE.PointLight(0x3b82f6, 0.4);
        blueFill.position.set(5, -2, 2);
        scene.add(blueFill);

        // Platform / Base
        const platformGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.1, 64);
        const platformMat = new THREE.MeshPhongMaterial({
            color: 0x1e293b,
            transparent: true,
            opacity: 0.5,
            shininess: 100
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.y = -1.55;
        scene.add(platform);

        // Grid on platform for depth
        const grid = new THREE.GridHelper(3, 20, 0xd4af37, 0x334155);
        grid.position.y = -1.5;
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        scene.add(grid);

        // Body Group
        bodyGroup = new THREE.Group();
        bodyGroup.position.y = -0.5;
        scene.add(bodyGroup);

        createBody(15);
        animate3D();

        // Controls
        let isDragging = false;
        let previousMouseX = 0;

        canvas.addEventListener('mousedown', () => {
            isDragging = true;
            isRotating = false;
            document.getElementById('rotate-toggle').classList.remove('active');
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMouseX;
                bodyGroup.rotation.y += deltaX * 0.01;
            }
            previousMouseX = e.clientX;
        });

        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        document.getElementById('rotate-toggle').addEventListener('click', function () {
            isRotating = !isRotating;
            this.classList.toggle('active', isRotating);
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            bodyGroup.rotation.y = 0;
            camera.position.set(0, 1.2, 5.5);
        });

        document.getElementById('rotate-toggle').classList.add('active');
    }

    function createBody(fatPercent) {
        while (bodyGroup.children.length > 0) {
            bodyGroup.remove(bodyGroup.children[0]);
        }

        const fatRatio = fatPercent / 100;

        // Organic Materials
        const muscleMat = new THREE.MeshPhongMaterial({
            color: 0x3b82f6,
            shininess: 60,
            specular: 0x60a5fa
        });
        const fatMat = new THREE.MeshPhongMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.35 + (fatRatio * 0.45),
            shininess: 20
        });

        // HEAD (Better sphere)
        const headGeo = new THREE.SphereGeometry(0.22, 32, 32);
        const head = new THREE.Mesh(headGeo, muscleMat);
        head.position.y = 2.0;
        bodyGroup.add(head);

        const headFat = new THREE.Mesh(headGeo, fatMat);
        headFat.position.y = 2.0;
        headFat.scale.set(1.1, 1.05, 1.1);
        bodyGroup.add(headFat);

        // NECK
        const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 16);
        const neck = new THREE.Mesh(neckGeo, muscleMat);
        neck.position.y = 1.8;
        bodyGroup.add(neck);

        // TORSO (Tapered for anatomy)
        // Upper Torso (Shoulders)
        const upperTorsoGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.5, 32);
        const upperTorso = new THREE.Mesh(upperTorsoGeo, muscleMat);
        upperTorso.position.y = 1.5;
        bodyGroup.add(upperTorso);

        const upperTorsoFat = new THREE.Mesh(upperTorsoGeo, fatMat);
        upperTorsoFat.position.y = 1.5;
        const chestFatScale = 1.05 + (fatRatio * 0.3);
        upperTorsoFat.scale.set(chestFatScale, 1.02, chestFatScale);
        bodyGroup.add(upperTorsoFat);

        // Lower Torso (Abdomen - Area where most fat accumulates)
        const lowerTorsoGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.5, 32);
        const lowerTorso = new THREE.Mesh(lowerTorsoGeo, muscleMat);
        lowerTorso.position.y = 1.0;
        bodyGroup.add(lowerTorso);

        const lowerTorsoFat = new THREE.Mesh(lowerTorsoGeo, fatMat);
        lowerTorsoFat.position.y = 1.0;
        const bellyFatScale = 1.0 + (fatRatio * 1.2);
        lowerTorsoFat.scale.set(bellyFatScale, 1.1, bellyFatScale);
        bodyGroup.add(lowerTorsoFat);

        // HIPS
        const hipsGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.4, 32);
        const hips = new THREE.Mesh(hipsGeo, muscleMat);
        hips.position.y = 0.6;
        bodyGroup.add(hips);

        const hipsFat = new THREE.Mesh(hipsGeo, fatMat);
        hipsFat.position.y = 0.6;
        const hipsFatScale = 1.0 + (fatRatio * 0.9);
        hipsFat.scale.set(hipsFatScale, 1.05, hipsFatScale);
        bodyGroup.add(hipsFat);

        // ARMS (Tapered)
        const armGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.75, 16);

        function addArm(xSide) {
            const armGroup = new THREE.Group();
            const muscle = new THREE.Mesh(armGeo, muscleMat);
            muscle.position.y = -0.37;
            armGroup.add(muscle);

            const fat = new THREE.Mesh(armGeo, fatMat);
            fat.position.y = -0.37;
            const armFatScale = 1.1 + (fatRatio * 0.4);
            fat.scale.set(armFatScale, 1.0, armFatScale);
            armGroup.add(fat);

            armGroup.position.set(xSide * 0.55, 1.65, 0);
            armGroup.rotation.z = xSide * -0.15;
            bodyGroup.add(armGroup);
        }
        addArm(1);  // Left
        addArm(-1); // Right

        // LEGS (Tapered & Anatomical)
        const legGeo = new THREE.CylinderGeometry(0.16, 0.09, 1.2, 16);

        function addLeg(xSide) {
            const legGroup = new THREE.Group();
            const muscle = new THREE.Mesh(legGeo, muscleMat);
            muscle.position.y = -0.6;
            legGroup.add(muscle);

            const fat = new THREE.Mesh(legGeo, fatMat);
            fat.position.y = -0.6;
            const legFatScale = 1.05 + (fatRatio * 0.5);
            fat.scale.set(legFatScale, 1.0, legFatScale);
            legGroup.add(fat);

            legGroup.position.set(xSide * 0.18, 0.5, 0);
            bodyGroup.add(legGroup);
        }
        addLeg(1);
        addLeg(-1);
    }

    function animate3D() {
        requestAnimationFrame(animate3D);
        if (isRotating) {
            bodyGroup.rotation.y += 0.008;
        }
        renderer.render(scene, camera);
    }

    function update3DData(data) {
        let fatPercent = data.grasa;

        if (!fatPercent || isNaN(fatPercent)) {
            const imc = data.peso / ((data.altura / 100) * (data.altura / 100));
            const sexVal = data.sexo === 'masculino' ? 1 : 0;
            fatPercent = (1.20 * imc) + (0.23 * data.edad) - (10.8 * sexVal) - 5.4;
            fatPercent = Math.max(5, Math.min(50, fatPercent));
        }

        const fatKg = (data.peso * (fatPercent / 100)).toFixed(1);
        const leanKg = (data.peso - fatKg).toFixed(1);

        document.getElementById('fat-mass-percentage').textContent = Math.round(fatPercent);
        document.getElementById('lean-mass-percentage').textContent = 100 - Math.round(fatPercent);
        document.getElementById('fat-mass-kg').textContent = `${fatKg} kg`;
        document.getElementById('lean-mass-kg').textContent = `${leanKg} kg`;

        createBody(fatPercent);
    }

    init3D();

    const originalUpdateUI = updateUI;
    updateUI = function () {
        originalUpdateUI();
        setTimeout(() => {
            const data = {
                sexo: inputs.sexo.value,
                edad: parseFloat(inputs.edad.value) || 25,
                peso: parseFloat(inputs.peso.value),
                altura: parseFloat(inputs.altura.value),
                grasa: parseFloat(inputs.grasa.value)
            };
            if (data.peso && data.altura) {
                update3DData(data);
            }
        }, 600);
    };
});
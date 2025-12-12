document.addEventListener('DOMContentLoaded', () => {

    // --- State & Config ---
    const appState = {
        currency: 'USD',
        theme: 'cyberpunk',
        currencySymbol: '$'
    };

    // --- Inputs References (Late binding for some) ---
    const inputs = {
        initial: document.getElementById('initial-investment'),
        monthly: document.getElementById('monthly-contribution'),
        years: document.getElementById('years'),
        strategy: document.getElementById('strategy'),
        customRate: document.getElementById('custom-rate'),
        yearsDisplay: document.getElementById('years-display'),
        inflation: document.getElementById('inflation-toggle'),
        tax: document.getElementById('tax-toggle'),
        compare: document.getElementById('compare-toggle'),
        frequency: document.getElementById('contribution-frequency'),
        timing: document.getElementById('contribution-timing'),
        aiMode: document.getElementById('ai-mode-toggle'),
        contributionLabel: document.getElementById('contribution-label'),
        taxRate: document.getElementById('tax-rate'),
        taxRateContainer: document.getElementById('tax-rate-container'),
        aiDescription: document.getElementById('ai-description'),
        // New Inputs
        currencySelector: document.getElementById('currency-selector'),
        themeSelector: document.getElementById('theme-selector'),
        aiModelSelector: document.getElementById('ai-model-selector'),
        aiModelContainer: document.getElementById('ai-model-container')
    };

    const outputs = {
        totalContributed: document.getElementById('total-contributed'),
        finalValue: document.getElementById('final-value'),
        totalInterest: document.getElementById('total-interest'),
        taxCard: document.getElementById('tax-card'),
        estimatedTax: document.getElementById('estimated-tax')
    };

    // --- Helper: URL State Management (Deep Links) ---
    const updateURL = () => {
        const params = new URLSearchParams();
        params.set('initial', inputs.initial.value.replace(/,/g, ''));
        params.set('monthly', inputs.monthly.value.replace(/,/g, ''));
        params.set('years', inputs.years.value);
        params.set('strategy', inputs.strategy.value);
        params.set('currency', appState.currency);
        params.set('theme', appState.theme);
        params.set('ai', inputs.aiMode.checked);

        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    };

    const loadFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('initial')) inputs.initial.value = parseFloat(params.get('initial')).toLocaleString('en-US');
        if (params.has('monthly')) inputs.monthly.value = parseFloat(params.get('monthly')).toLocaleString('en-US');
        if (params.has('years')) {
            inputs.years.value = params.get('years');
            inputs.yearsDisplay.innerText = `${inputs.years.value} Años`;
        }
        if (params.has('currency')) {
            appState.currency = params.get('currency');
            inputs.currencySelector.value = appState.currency;
            updateCurrencySymbol();
        }
        if (params.has('theme')) {
            setTheme(params.get('theme'));
            inputs.themeSelector.value = params.get('theme');
        }
        if (params.has('ai')) inputs.aiMode.checked = params.get('ai') === 'true';
        if (params.has('strategy')) {
            const strat = params.get('strategy');
            // Trigger click on card
            document.querySelector(`.strategy-card[data-value="${strat}"]`)?.click();
        }
    };

    // --- Helper: Currency ---
    const updateCurrencySymbol = () => {
        appState.currencySymbol = appState.currency === 'USD' ? '$' : (appState.currency === 'EUR' ? '€' : 'Mex$');
        document.querySelectorAll('.currency-prefix').forEach(el => el.innerText = appState.currencySymbol);
    };

    const formatCurrencyValue = (num) => {
        return new Intl.NumberFormat(appState.currency === 'USD' ? 'en-US' : 'es-ES', {
            style: 'currency',
            currency: appState.currency,
            maximumFractionDigits: 0
        }).format(num);
    };

    // --- Helper: Themes ---
    const setTheme = (themeName) => {
        document.documentElement.setAttribute('data-theme', themeName);
        appState.theme = themeName;
    };

    // --- Custom Dropdown Handler ---
    const initCustomDropdowns = () => {
        const dropdowns = document.querySelectorAll('.custom-dropdown');

        dropdowns.forEach(dropdown => {
            const selected = dropdown.querySelector('.custom-dropdown-selected');
            const optionsContainer = dropdown.querySelector('.custom-dropdown-options');
            const options = dropdown.querySelectorAll('.custom-option');
            const hiddenSelect = dropdown.querySelector('select');
            const dropdownType = selected.getAttribute('data-dropdown');

            // Toggle dropdown
            selected.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other dropdowns
                dropdowns.forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
                dropdown.classList.toggle('active');
            });

            // Select option
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    const text = option.textContent;

                    // Update display
                    dropdown.querySelector('.dropdown-text').textContent = text;

                    // Update hidden select
                    hiddenSelect.value = value;

                    // Update selected class
                    options.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');

                    // Trigger change event on hidden select
                    const event = new Event('change', { bubbles: true });
                    hiddenSelect.dispatchEvent(event);

                    // Close dropdown
                    dropdown.classList.remove('active');
                });
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            dropdowns.forEach(d => d.classList.remove('active'));
        });
    };


    // --- Helper: Currency Formatting ---
    const formatCurrencyInput = (input) => {
        let value = input.value.replace(/,/g, '');
        let number = parseFloat(value);
        if (!isNaN(number)) {
            input.value = number.toLocaleString('en-US');
        }
    };

    const cleanCurrencyInput = (input) => {
        input.value = input.value.replace(/,/g, '');
    };

    const parseRawValue = (val) => {
        if (!val) return 0;
        if (typeof val !== 'string') return parseFloat(val) || 0;
        return parseFloat(val.replace(/,/g, '')) || 0;
    };

    // --- Risk Quiz Logic ---
    const optionBtns = document.querySelectorAll('.option-btn');
    const riskResult = document.querySelector('.risk-result');
    const riskType = document.getElementById('risk-type');
    const riskDesc = document.getElementById('risk-description');

    optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Visual selection
            optionBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Logic
            const score = parseInt(btn.dataset.score);
            riskResult.classList.remove('hidden');

            if (score <= 1) {
                riskType.innerText = "Conservador";
                riskType.style.color = "#4ade80"; // Green
                riskDesc.innerText = "Priorizas la seguridad de tu capital sobre las grandes ganancias. Te recomendamos ETFs diversificados (S&P 500) o Bonos.";
            } else if (score === 5) {
                riskType.innerText = "Moderado";
                riskType.style.color = "#fbbf24"; // Yellow
                riskDesc.innerText = "Buscas equilibrio. Una mezcla de Tech ETFs (QQQ) y mercado general es ideal para ti.";
            } else {
                riskType.innerText = "Agresivo";
                riskType.style.color = "#f472b6"; // Pink
                riskDesc.innerText = "Buscas maximizar retornos y toleras la volatilidad. Acciones individuales de IA y ETFs sectoriales son tu terreno.";
            }
        });
    });

    // --- Strategy Card Logic (New) ---
    const strategyCards = document.querySelectorAll('.strategy-card');
    const strategySelect = document.getElementById('strategy');

    strategyCards.forEach(card => {
        card.addEventListener('click', () => {
            // Visual Update
            strategyCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // Sync with Hidden Select
            strategySelect.value = card.dataset.value;

            // Show/Hide Custom Input
            const customInput = document.getElementById('custom-rate-container');
            if (card.dataset.value === 'custom') {
                customInput.classList.remove('hidden');
            } else {
                customInput.classList.add('hidden');
            }

            // Trigger Update
            updateSimulation();
        });
    });

    // Custom Rate Input Listener
    document.getElementById('custom-rate').addEventListener('input', updateSimulation);



    // --- Simulator Logic ---
    const ctx = document.getElementById('growthChart').getContext('2d');
    const donutCtx = document.getElementById('distributionChart').getContext('2d');
    let growthChart;
    let distributionChart;

    // Removed duplicated inputs/outputs declarations

    // Update Years Display
    inputs.years.addEventListener('input', (e) => {
        inputs.yearsDisplay.innerText = `${e.target.value} Años`;
        updateSimulation();
    });

    inputs.strategy.addEventListener('change', updateSimulation);
    inputs.inflation.addEventListener('change', updateSimulation);
    inputs.tax.addEventListener('change', () => {
        toggleTaxInput();
        updateSimulation();
    });
    inputs.taxRate.addEventListener('input', updateSimulation);
    inputs.compare.addEventListener('change', updateSimulation);
    inputs.frequency.addEventListener('change', (e) => {
        updateContributionLabel();
        updateSimulation();
    });
    inputs.timing.addEventListener('change', updateSimulation);
    inputs.timing.addEventListener('change', updateSimulation);
    inputs.aiMode.addEventListener('change', () => {
        toggleAiContainer();
        updateSimulation();
    });

    // AI Model Radio Buttons Handler
    const aiModelRadios = document.querySelectorAll('input[name="ai-model"]');
    aiModelRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Update hidden select
            inputs.aiModelSelector.value = e.target.value;

            // Update visual selection
            document.querySelectorAll('.ai-model-option').forEach(opt => opt.classList.remove('selected'));
            e.target.closest('.ai-model-option').classList.add('selected');

            // Trigger simulation update
            updateSimulation();
        });
    });

    inputs.aiModelSelector.addEventListener('change', updateSimulation);
    inputs.currencySelector.addEventListener('change', (e) => {
        appState.currency = e.target.value;
        updateCurrencySymbol();
        updateSimulation();
        updateURL();
    });
    inputs.themeSelector.addEventListener('change', (e) => {
        setTheme(e.target.value);
        updateURL();
    });

    // Global listener for URL updates on any change
    // We add a debounce to not spam history
    let timeout;
    const triggerUpdateURL = () => {
        clearTimeout(timeout);
        timeout = setTimeout(updateURL, 500);
    };

    // Attach to everything
    Object.values(inputs).forEach(el => {
        if (el && el.addEventListener) el.addEventListener('change', triggerUpdateURL);
        if (el && el.addEventListener) el.addEventListener('input', triggerUpdateURL);
    });

    document.getElementById('calculate-btn').addEventListener('click', updateSimulation);

    // --- Currency Inputs Listeners ---
    const currencyInputs = [inputs.initial, inputs.monthly];
    currencyInputs.forEach(input => {
        // Initial format
        formatCurrencyInput(input);

        input.addEventListener('focus', () => cleanCurrencyInput(input));
        input.addEventListener('blur', () => {
            formatCurrencyInput(input);
            updateSimulation(); // Update on blur
        });
        // Also update on enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') input.blur();
        });
    });


    // Initial Run & Load
    initCustomDropdowns(); // Initialize custom dropdowns
    loadFromURL(); // Load params first
    updateCurrencySymbol(); // Set initial symbol
    updateContributionLabel();
    updateSimulation();

    function updateContributionLabel() {
        const freq = parseInt(inputs.frequency.value);
        let label = "Mensual";
        switch (freq) {
            case 12: label = "Aportación Mensual"; break;
            case 26: label = "Aportación Quincenal"; break;
            case 52: label = "Aportación Semanal"; break;
            case 1: label = "Aportación Anual"; break;
        }
        inputs.contributionLabel.innerText = label;
    }



    function toggleTaxInput() {
        if (inputs.tax.checked) {
            inputs.taxRateContainer.classList.remove('hidden');
        } else {
            inputs.taxRateContainer.classList.add('hidden');
        }
    }

    function toggleAiContainer() {
        if (inputs.aiMode.checked) {
            inputs.aiModelContainer.classList.remove('hidden');
        } else {
            inputs.aiModelContainer.classList.add('hidden');
        }
    }

    // --- Monte Carlo Engine ---
    function calculatePaths(initial, contribution, years, rate, frequency, volatility, iterations = 10000) {
        const totalEvents = years * frequency;
        const freqRate = rate / frequency;
        const drift = freqRate - 0.5 * (volatility * volatility) / frequency; // Geometric Brownian Motion Drift
        const volStep = volatility / Math.sqrt(frequency);
        const timing = inputs.timing.value;
        const inflationAdjusted = inputs.inflation.checked;

        // Storage for percentiles
        // We need an array of arrays: checks[yearIndex][iterationIndex] -> balance
        // Actually we only need checks at annual intervals for the chart
        const annualChecks = Array.from({ length: years + 1 }, () => []);

        // Initial Balance for all
        for (let j = 0; j < iterations; j++) annualChecks[0].push(initial);

        // Run Sim
        for (let i = 0; i < iterations; i++) {
            let balance = initial;
            let currentYear = 0;

            for (let step = 1; step <= totalEvents; step++) {
                // Random Shock
                const shock = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3; // Approx Gaussian
                const periodicRate = drift + volStep * shock;

                if (timing === 'begin') {
                    balance = (balance + contribution) * (1 + periodicRate);
                } else {
                    balance = balance * (1 + periodicRate) + contribution;
                }

                // Inflation Adjustment (simplified: deflate balance at end of year)
                // Or better: Just use Real Rate in drift?
                // Let's keep it simple: Real Rate passed in 'rate' param is better.
                // If inflation toggle is on, earlier we adjusted 'rate'.

                // Store Annual checkpoint
                if (step % frequency === 0) {
                    currentYear++;
                    annualChecks[currentYear].push(balance);
                }
            }
        }

        // Calculate Percentiles per Year
        const p10 = []; // Worst 10%
        const p50 = []; // Median
        const p90 = []; // Best 10%

        annualChecks.forEach(yearlyBalances => {
            yearlyBalances.sort((a, b) => a - b);
            p10.push(yearlyBalances[Math.floor(iterations * 0.10)]);
            p50.push(yearlyBalances[Math.floor(iterations * 0.50)]);
            p90.push(yearlyBalances[Math.floor(iterations * 0.90)]);
        });

        // Calculate average invested (deterministic)
        const totalInvested = initial + (contribution * totalEvents);

        return { p10, p50, p90, totalInvested, finalMedian: p50[p50.length - 1] };
    }

    function calculateSimpleGrowth(initial, contribution, years, rate, frequency, timing) {
        let balance = initial;
        let invested = initial;
        const totalEvents = years * frequency;
        const freqRate = rate / frequency;
        const dataPoints = [initial];

        for (let i = 1; i <= totalEvents; i++) {
            if (timing === 'begin') {
                balance = (balance + contribution) * (1 + freqRate);
            } else {
                balance = balance * (1 + freqRate) + contribution;
            }
            invested += contribution;
            if (i % frequency === 0) dataPoints.push(balance);
        }
        return { dataPoints, finalBalance: balance, totalInvested: invested };
    }

    function updateSimulation() {
        let initial = parseRawValue(inputs.initial.value);
        let contributionAmount = parseRawValue(inputs.monthly.value);
        const years = parseInt(inputs.years.value) || 10;
        const strategy = inputs.strategy.value;
        const useInflation = inputs.inflation.checked;
        const frequency = parseInt(inputs.frequency.value);
        const aiMode = inputs.aiMode.checked;
        const timing = inputs.timing.value;



        // Configuration
        let annualRate = 0.10;
        let volatility = 0.15;

        switch (strategy) {
            case 'safe': annualRate = 0.10; volatility = 0.05; break;
            case 'moderate': annualRate = 0.15; volatility = 0.15; break;
            case 'aggressive': annualRate = 0.25; volatility = 0.25; break;
            case 'custom':
                annualRate = (parseFloat(inputs.customRate.value) || 0) / 100;
                // Volatility proportional to rate (similar ratio as aggressive: 0.25/0.25 = 1.0)
                // Using a more conservative ratio of 0.67 (like moderate: 0.15/0.15 = 1.0)
                volatility = annualRate * 0.67;
                break;
        }

        // Inflation adjustment to Rate
        if (useInflation) {
            // Fisher Equation: (1+Real) = (1+Nominal)/(1+Inf)
            annualRate = (1 + annualRate) / 1.03 - 1; // Assuming 3% inflation
        }

        const aiModel = inputs.aiModelSelector.value;
        const volPercent = (volatility * 100).toFixed(0);

        if (aiMode) {
            if (aiModel === 'monte-carlo') {
                inputs.aiDescription.innerHTML = `<strong>Monte Carlo Real (10,000 Sims)</strong><br>Simulando 10,000 escenarios posibles con volatilidad del ${volPercent}%. Mostrando rango probable (P10 - P90).`;
            } else {
                inputs.aiDescription.innerHTML = `<strong>Bandas Simples (+/- %)</strong><br>Simula escenarios optimistas (+${volPercent}%) y pesimistas (-${volPercent}%) basados en volatilidad.`;
            }
        } else {
            inputs.aiDescription.innerText = "Simulación determinista. Activa AI Mode para ver riesgos.";
        }

        let mainData, p10Data, p90Data, finalVal, investedVal;

        if (aiMode) {
            if (aiModel === 'monte-carlo') {
                // Run Monte Carlo
                const sim = calculatePaths(initial, contributionAmount, years, annualRate, frequency, volatility, 10000);
                mainData = sim.p50; // Median line
                p10Data = sim.p10; // p10 is array
                p90Data = sim.p90; // p90 is array
                finalVal = sim.finalMedian;
                investedVal = sim.totalInvested;
            } else {
                // Run Simple Bands
                // Optimization: just calc simple growth with adjusted rates
                const simMain = calculateSimpleGrowth(initial, contributionAmount, years, annualRate, frequency, timing);
                const simOpt = calculateSimpleGrowth(initial, contributionAmount, years, annualRate + volatility, frequency, timing);
                const simPess = calculateSimpleGrowth(initial, contributionAmount, years, annualRate - volatility, frequency, timing);

                mainData = simMain.dataPoints;
                p10Data = simPess.dataPoints; // Reuse variables: p10Data will act as Pessimistic line data
                p90Data = simOpt.dataPoints;  // Reuse variables: p90Data will act as Optimistic line data
                finalVal = simMain.finalBalance;
                investedVal = simMain.totalInvested;
            }
        } else {
            // Simple deterministic
            const sim = calculateSimpleGrowth(initial, contributionAmount, years, annualRate, frequency, timing);
            mainData = sim.dataPoints;
            p10Data = null;
            p90Data = null;
            finalVal = sim.finalBalance;
            investedVal = sim.totalInvested;
        }

        // Comparison (S&P 500 Legacy)
        let compareData = null;
        if (inputs.compare.checked) {
            let spRate = 0.10;
            if (useInflation) spRate = (1.10 / 1.03) - 1;
            const spSim = calculateSimpleGrowth(initial, contributionAmount, years, spRate, frequency, timing);
            compareData = spSim.dataPoints;
        }

        // Tax Logic
        const finalInterest = finalVal - investedVal;
        let taxAmount = 0;
        let displayVal = finalVal;
        if (inputs.tax.checked) {
            const taxRate = (parseFloat(inputs.taxRate.value) || 0) / 100;
            taxAmount = Math.max(0, finalInterest * taxRate);
            displayVal -= taxAmount;
            outputs.taxCard.style.display = 'block';
            outputs.estimatedTax.innerText = formatCurrency(taxAmount);
        } else {
            outputs.taxCard.style.display = 'none';
        }

        // Update Text
        outputs.totalContributed.innerText = formatCurrency(investedVal);
        outputs.finalValue.innerText = formatCurrency(displayVal);
        outputs.totalInterest.innerText = formatCurrency(finalInterest - taxAmount);

        // Render Scale
        const labels = Array.from({ length: years + 1 }, (_, i) => `Año ${i}`);
        renderChart(labels, mainData, compareData, p90Data, p10Data, strategy); // Note param order
        renderDonut(investedVal, finalInterest - taxAmount, taxAmount);
    }

    function formatCurrency(num) {
        return formatCurrencyValue(num);
    }

    // Updated Render Chart for Cone
    function renderChart(labels, mainData, compareData, p90Data, p10Data, strategy) {
        let color = '#00c6ff';
        if (strategy === 'moderate') color = '#7928ca';
        if (strategy === 'aggressive') color = '#ff0080';
        if (strategy === 'custom') color = '#10b981';

        if (growthChart) growthChart.destroy();

        const datasets = [];

        const aiModel = inputs.aiModelSelector.value;
        const aiMode = inputs.aiMode.checked;
        const isMonteCarlo = aiMode && aiModel === 'monte-carlo';

        // 1. Optimistic (P90)
        if (p90Data) {
            datasets.push({
                label: 'Optimista',
                data: p90Data,
                borderColor: '#10b981', // Green
                borderDash: [5, 5],
                borderWidth: 1, // Thin line for Monte Carlo
                backgroundColor: isMonteCarlo ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                pointRadius: 0,
                fill: isMonteCarlo ? 2 : false, // Fill to dataset index 2 (Pessimistic)
                tension: 0.4,
                order: 2
            });
        }

        // 2. Media (Median) - Main Projection
        datasets.push({
            label: 'Media',
            data: mainData,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            order: 1
        });

        // 3. Pessimistic (P10)
        if (p10Data) {
            datasets.push({
                label: 'Pesimista',
                data: p10Data,
                borderColor: '#ef4444', // Red
                borderDash: [5, 5],
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                tension: 0.4,
                order: 3
            });
        }

        // 4. Comparison (S&P 500)
        if (compareData) {
            datasets.push({
                label: 'S&P 500',
                data: compareData,
                borderColor: '#ffffff',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                order: 0 // Draw on very top
            });
        }

        growthChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white',
                            generateLabels: (chart) => {
                                const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                const order = ['Optimista', 'Media', 'Pesimista', 'S&P 500'];
                                return original.sort((a, b) => {
                                    let idxA = order.indexOf(a.text);
                                    let idxB = order.indexOf(b.text);
                                    // Handle unknown items (push to end)
                                    if (idxA === -1) idxA = 99;
                                    if (idxB === -1) idxB = 99;
                                    return idxA - idxB;
                                });
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        itemSort: function (a, b, data) {
                            const order = ['Optimista', 'Media', 'Pesimista', 'S&P 500'];
                            const labelA = data.datasets[a.datasetIndex].label;
                            const labelB = data.datasets[b.datasetIndex].label;
                            let idxA = order.indexOf(labelA);
                            let idxB = order.indexOf(labelB);

                            // Handle items not in the list (push to bottom)
                            if (idxA === -1) idxA = 99;
                            if (idxB === -1) idxB = 99;

                            return idxA - idxB;
                        }
                    }
                },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#b3b3b3' } },
                    x: { grid: { display: false }, ticks: { color: '#b3b3b3' } }
                }
            }
        });
    }

    function renderDonut(invested, interest, tax) {
        if (distributionChart) distributionChart.destroy();

        let data = [invested, interest];
        let bgColors = ['rgba(255, 255, 255, 0.2)', '#00c6ff'];
        let labels = ['Inversión', 'Ganancia Neta'];

        if (tax > 0) {
            data.push(tax);
            bgColors.push('#ef4444');
            labels.push('Impuestos');
        }

        distributionChart = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let val = formatCurrency(context.raw);
                                return `${context.label}: ${val}`;
                            }
                        }
                    }
                }
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {

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
        aiDescription: document.getElementById('ai-description')
    };

    const outputs = {
        totalContributed: document.getElementById('total-contributed'),
        finalValue: document.getElementById('final-value'),
        totalInterest: document.getElementById('total-interest'),
        taxCard: document.getElementById('tax-card'),
        estimatedTax: document.getElementById('estimated-tax')
    };

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
    inputs.aiMode.addEventListener('change', updateSimulation);
    inputs.timing.addEventListener('change', updateSimulation);
    inputs.aiMode.addEventListener('change', updateSimulation);
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

    // Initial Run
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

    function calculateGrowth(initial, contribution, years, rate, frequency = 12, inflationAdjusted = false, volatility = 0, timing = 'end') {
        let currentBalance = initial;
        let totalInvested = initial;
        let effectiveRate = rate;

        // Adjust rate for volatility if provided (simple randomization for demo)
        // We will change the rate slightly each "year" to simulate noise if volatility > 0

        const dataPoints = [initial];
        const periods = years; // We draw 1 point per year for the line chart (simplification)

        // For precise calculation, we need to loop per contribution period
        // But for the chart data, we just want annual checkpoints.

        // Inner function to calc future value with periodic contributions
        // FV = P(1+r/n)^(nt) + PMT * ...
        // Let's do a loop for total periods to be accurate with compounding

        let freqRate = rate / frequency;

        // If inflation adjusted, we adjust the *annual* rate first, then divide?
        // Approx: Real Rate = (1+r)/(1+i) - 1. 
        if (inflationAdjusted) {
            const realAnnual = (1 + rate) / (1.025) - 1;
            freqRate = realAnnual / frequency;
        }

        let balance = initial;
        let invested = initial;

        // Loop by total contribution events
        const totalEvents = years * frequency;
        const eventsPerYear = frequency;

        let currentYear = 0;

        // To plotting annual points, we need to capture balance at event k = 1*freq, 2*freq...

        for (let i = 1; i <= totalEvents; i++) {
            // Apply Volatility to rate per step (Monte Carlo 'light')
            // Only if AI mode is on (volatility > 0)
            let stepRate = freqRate;
            if (volatility > 0) {
                // Random drift +/- volatility scaled to period
                const drift = (Math.random() - 0.5) * 2 * (volatility / Math.sqrt(frequency));
                stepRate += drift;
            }

            if (timing === 'begin') {
                // Annuity Due: Invest first, then grow
                balance = (balance + contribution) * (1 + stepRate);
            } else {
                // Ordinary Annuity: Grow first, then invest at end
                balance = balance * (1 + stepRate) + contribution;
            }
            invested += contribution;

            // Checkpoint for Chart (End of Year)
            if (i % eventsPerYear === 0) {
                dataPoints.push(balance);
                currentYear++;
            }
        }

        return { dataPoints, finalBalance: balance, totalInvested: invested };
    }

    function updateSimulation() {
        // Validation ensuring numbers with safe parsing for commas
        let initial = parseRawValue(inputs.initial.value);
        if (initial < 0) { initial = 0; inputs.initial.value = 0; }

        let contributionAmount = parseRawValue(inputs.monthly.value);
        if (contributionAmount < 0) { contributionAmount = 0; inputs.monthly.value = 0; }

        const years = parseInt(inputs.years.value) || 10;
        const strategy = inputs.strategy.value;
        const useInflation = inputs.inflation.checked;
        const useTax = inputs.tax.checked;
        const doCompare = inputs.compare.checked;
        const frequency = parseInt(inputs.frequency.value);
        const aiMode = inputs.aiMode.checked;
        const timing = inputs.timing.value;

        let annualRate;
        // Volatility Factors (Standard Deviation approx)
        let volFactor = 0;

        switch (strategy) {
            case 'safe':
                annualRate = 0.10;
                volFactor = 0.05;
                break;
            case 'moderate':
                annualRate = 0.15;
                volFactor = 0.15;
                break;
            case 'aggressive':
                annualRate = 0.25;
                volFactor = 0.25;
                break;
            case 'custom':
                let customVal = parseFloat(inputs.customRate.value) || 0;
                annualRate = customVal / 100;
                volFactor = 0.10; // Default vol for custom
                break;
        }

        // Update AI Description
        const volPercent = (volFactor * 100).toFixed(0);
        inputs.aiDescription.innerText = `Simula escenarios optimistas (+${volPercent}%) y pesimistas (-${volPercent}%) basados en volatilidad.`;

        // Calculate Main Strategy (Central Path)
        const mainResult = calculateGrowth(initial, contributionAmount, years, annualRate, frequency, useInflation, 0, timing);

        // AI Scenarios
        let optimisticResult = null;
        let pessimisticResult = null;

        if (aiMode) {
            // Optimistic: +Volatility Bias
            // We can simulate this by just adding some flat Bonus to rate or running the random loop lucky
            // For deterministic visual "Upper/Lower bounds", let's just shift rate
            optimisticResult = calculateGrowth(initial, contributionAmount, years, annualRate + volFactor, frequency, useInflation, 0, timing);
            pessimisticResult = calculateGrowth(initial, contributionAmount, years, annualRate - volFactor, frequency, useInflation, 0, timing);
        }

        // Comparison Result
        let compareResult = null;
        if (doCompare) {
            compareResult = calculateGrowth(initial, contributionAmount, years, 0.10, frequency, useInflation, 0, timing);
        }

        // Tax Logic
        let finalDisplayValue = mainResult.finalBalance;
        let finalInterest = mainResult.finalBalance - mainResult.totalInvested;
        let taxAmount = 0;

        if (useTax) {
            const taxRatePercent = parseFloat(inputs.taxRate.value) || 19;
            const taxRate = taxRatePercent / 100;
            taxAmount = Math.max(0, finalInterest * taxRate);
            finalDisplayValue -= taxAmount;

            // Show Card
            outputs.taxCard.style.display = 'block';
            outputs.estimatedTax.innerText = formatCurrency(taxAmount);
        } else {
            outputs.taxCard.style.display = 'none';
        }

        // Update Text
        outputs.totalContributed.innerText = formatCurrency(mainResult.totalInvested);
        outputs.finalValue.innerText = formatCurrency(finalDisplayValue);
        outputs.totalInterest.innerText = formatCurrency(finalInterest - taxAmount); // Net Interest

        // Update Charts
        const labels = Array.from({ length: years + 1 }, (_, i) => `Año ${i}`);

        renderChart(labels, mainResult.dataPoints, compareResult ? compareResult.dataPoints : null, optimisticResult, pessimisticResult, strategy);
        renderDonut(mainResult.totalInvested, finalInterest - taxAmount, taxAmount);
    }

    function formatCurrency(num) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
    }

    function renderChart(labels, mainData, compareData, optData, pessData, strategy) {
        let color = '#00c6ff';
        if (strategy === 'moderate') color = '#7928ca';
        if (strategy === 'aggressive') color = '#ff0080';
        if (strategy === 'custom') color = '#10b981';

        if (growthChart) {
            growthChart.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)'); // Fade out faster

        const datasets = [];

        // 1. Optimistic Line (Top of Legend)
        if (optData) {
            datasets.push({
                label: 'Optimista (AI)',
                data: optData.dataPoints,
                borderColor: '#10b981',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                order: 0 // Draw Priority
            });
        }

        // 2. Main Line (Tu Portafolio)
        datasets.push({
            label: 'Tu Portafolio',
            data: mainData,
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            order: 1
        });

        // 3. Pessimistic Line
        if (pessData) {
            datasets.push({
                label: 'Pesimista (AI)',
                data: pessData.dataPoints,
                borderColor: '#ef4444',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                order: 2
            });
        }

        // Comparison (Bottom of Legend)
        if (compareData) {
            datasets.push({
                label: 'S&P 500',
                data: compareData,
                borderColor: '#ffffff',
                borderDash: [5, 5],
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                order: 3
            });
        }

        growthChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'white' } },
                    tooltip: { mode: 'index', intersect: false },
                    annotation: {
                        annotations: {
                            // Example First Million Line (requires plugin, maybe not loaded. If not loaded, this is ignored)
                            millionLine: {
                                type: 'line',
                                yMin: 1000000,
                                yMax: 1000000,
                                borderColor: 'gold',
                                borderWidth: 2,
                                borderDash: [10, 5],
                                label: { content: '🏆 $1M', enabled: true, position: 'end' }
                            }
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

document.addEventListener('DOMContentLoaded', () => {

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

            // Trigger Update
            updateSimulation();
        });
    });



    // --- Simulator Logic ---
    const ctx = document.getElementById('growthChart').getContext('2d');
    let growthChart;

    const inputs = {
        initial: document.getElementById('initial-investment'),
        monthly: document.getElementById('monthly-contribution'),
        years: document.getElementById('years'),
        strategy: document.getElementById('strategy'),
        yearsDisplay: document.getElementById('years-display'),
        inflation: document.getElementById('inflation-toggle'),
        tax: document.getElementById('tax-toggle'),
        compare: document.getElementById('compare-toggle')
    };

    const outputs = {
        totalContributed: document.getElementById('total-contributed'),
        finalValue: document.getElementById('final-value'),
        totalInterest: document.getElementById('total-interest')
    };

    // Update Years Display
    inputs.years.addEventListener('input', (e) => {
        inputs.yearsDisplay.innerText = `${e.target.value} Años`;
        updateSimulation();
    });

    inputs.strategy.addEventListener('change', updateSimulation);
    inputs.inflation.addEventListener('change', updateSimulation);
    inputs.tax.addEventListener('change', updateSimulation);
    inputs.compare.addEventListener('change', updateSimulation);
    document.getElementById('calculate-btn').addEventListener('click', updateSimulation);

    // Initial Run
    updateSimulation();

    function calculateGrowth(initial, monthly, years, rate, inflationAdjusted = false) {
        let currentBalance = initial;
        let totalInvested = initial;
        let effectiveRate = rate;

        if (inflationAdjusted) {
            // Real Rate formula: (1 + nominal) / (1 + inflation) - 1
            // Assuming 2.5% inflation
            effectiveRate = (1 + rate) / (1.025) - 1;
        }

        const dataPoints = [initial];

        for (let i = 1; i <= years; i++) {
            // Add monthly contributions
            // We approximate monthly growth by doing (monthly * 12) added to pool, then growing whole pool
            // A precise monthly calc loop is better, but this year-by-year loop is fine for visual approx
            currentBalance = (currentBalance + (monthly * 12)) * (1 + effectiveRate);
            totalInvested += (monthly * 12);
            dataPoints.push(currentBalance);
        }

        return { dataPoints, finalBalance: currentBalance, totalInvested };
    }

    function updateSimulation() {
        // Validation: Ensure no negative numbers
        let initial = parseFloat(inputs.initial.value) || 0;
        if (initial < 0) { initial = 0; inputs.initial.value = 0; }

        let monthly = parseFloat(inputs.monthly.value) || 0;
        if (monthly < 0) { monthly = 0; inputs.monthly.value = 0; }

        const years = parseInt(inputs.years.value) || 10;
        const strategy = inputs.strategy.value;
        const useInflation = inputs.inflation.checked;
        const useTax = inputs.tax.checked;
        const doCompare = inputs.compare.checked;

        let annualRate;
        switch (strategy) {
            case 'safe': annualRate = 0.10; break;
            case 'moderate': annualRate = 0.15; break;
            case 'aggressive': annualRate = 0.25; break;
        }

        // Calculate Main Strategy
        const mainResult = calculateGrowth(initial, monthly, years, annualRate, useInflation);

        // Calculate Comparison (S&P 500 ~ 10%) if enabled
        let compareResult = null;
        if (doCompare) {
            // If main strategy IS safe (S&P500), compare with "Inflation Safe" Cash? Or just Nasdaq?
            // Let's hardcode Comparison to always be S&P 500 Historical (10%)
            compareResult = calculateGrowth(initial, monthly, years, 0.10, useInflation);
        }

        // Apply Tax Logic (Only affects final visual number, usually not the chart growth curve itself)
        // However, for visualization, it's confusing to show Pre-Tax chart and Post-Tax numbers.
        // We will Apply Tax to the "Final Value" text ONLY, as taxes are paid on exit.

        let finalDisplayValue = mainResult.finalBalance;
        let finalInterest = mainResult.finalBalance - mainResult.totalInvested;

        if (useTax) {
            // Capital Gains Tax ~19%
            const taxRate = 0.19;
            const taxAmount = Math.max(0, finalInterest * taxRate);
            finalDisplayValue -= taxAmount;
            finalInterest -= taxAmount;
            // Note: Chart remains pre-tax growth accumulation
        }

        // Update UI Text
        outputs.totalContributed.innerText = formatCurrency(mainResult.totalInvested);
        outputs.finalValue.innerText = formatCurrency(finalDisplayValue);
        outputs.totalInterest.innerText = formatCurrency(finalInterest);

        // Labels
        const labels = Array.from({ length: years + 1 }, (_, i) => `Año ${i}`);

        // Update Chart
        renderChart(labels, mainResult.dataPoints, compareResult ? compareResult.dataPoints : null, strategy);
    }

    function formatCurrency(num) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
    }

    function renderChart(labels, mainData, compareData, strategy) {
        let color = '#00c6ff'; // Default blue
        if (strategy === 'moderate') color = '#7928ca';
        if (strategy === 'aggressive') color = '#ff0080';

        if (growthChart) {
            growthChart.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        const datasets = [{
            label: 'Tu Portafolio',
            data: mainData,
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }];

        if (compareData) {
            datasets.push({
                label: 'S&P 500 (Referencia)',
                data: compareData,
                borderColor: '#ffffff',
                borderDash: [5, 5], // Dashed line
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0
            });
        }

        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#b3b3b3' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#b3b3b3' }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
});

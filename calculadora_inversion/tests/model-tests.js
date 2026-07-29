"use strict";

const assert = require("assert");
const core = require("../script.js");

function baseRaw(overrides = {}) {
    return {
        strategy: "sp500",
        model: "monte-carlo",
        initial: 1_000,
        periodicContribution: 200,
        years: 10,
        frequency: 12,
        timing: "begin",
        customRate: 6,
        customVolatility: 18,
        annualFee: 0.20,
        showReal: false,
        inflationRate: 2,
        indexContributions: false,
        taxEnabled: false,
        taxModel: "spain",
        customTaxRate: 19,
        seed: 20260729,
        sensitivityLow: 5.2,
        sensitivityCentral: 6.7,
        sensitivityHigh: 8.5,
        compare: false,
        ...overrides
    };
}

function approximately(actual, expected, tolerance = 1e-8) {
    assert(Math.abs(actual - expected) <= tolerance, `${actual} no coincide con ${expected}`);
}

// Escala española del ahorro.
[
    [6_000, 1_140],
    [50_000, 10_380],
    [200_000, 44_880],
    [300_000, 71_880],
    [400_000, 101_880]
].forEach(([gain, expected]) => approximately(core.calculateSpanishSavingsTax(gain), expected));

// Conteo exacto de aportaciones.
let plan = core.createContributionPlan({
    initial: 1_000,
    periodicContribution: 200,
    years: 10,
    frequency: 12,
    timing: "begin",
    inflationRate: 0,
    indexContributions: false,
    showReal: false
});
assert.strictEqual(plan.contributionCount, 120);
assert.strictEqual(plan.totalNominal, 25_000);
assert.strictEqual([...plan.amounts].filter(Boolean).length, 120);

plan = core.createContributionPlan({
    initial: 1_000,
    periodicContribution: 20,
    years: 10,
    frequency: 52,
    timing: "end",
    inflationRate: 0,
    indexContributions: false,
    showReal: false
});
assert.strictEqual(plan.contributionCount, 520);
assert.strictEqual(plan.totalNominal, 11_400);
assert.strictEqual([...plan.amounts].filter(Boolean).length, 520);

// Un 10% con volatilidad y costes cero debe producir exactamente un 10%.
const deterministicConfig = core.buildSimulationConfig(baseRaw({
    strategy: "custom",
    model: "monte-carlo",
    initial: 1_000,
    periodicContribution: 0,
    years: 1,
    customRate: 10,
    customVolatility: 0,
    annualFee: 0
}));
approximately(core.simulate(deterministicConfig).result.finalValue, 1_100, 1e-6);

// Todos los modelos deben ser finitos y reproducibles con la misma semilla.
["monte-carlo", "bootstrap", "sensitivity"].forEach((model) => {
    const config = core.buildSimulationConfig(baseRaw({ model }));
    const first = core.simulate(config);
    const second = core.simulate(config);
    assert(Number.isFinite(first.result.finalValue));
    assert.strictEqual(first.result.finalValue, second.result.finalValue);
    assert.strictEqual(first.plan.contributionCount, 120);
});

// El bootstrap Nasdaq debe usar el periodo declarado.
const nasdaq = core.simulate(core.buildSimulationConfig(baseRaw({
    strategy: "nasdaq",
    model: "bootstrap"
})));
assert.strictEqual(nasdaq.result.historicalPeriod, "2016-07–2026-06");

// El historial Nasdaq embebido reproduce aproximadamente el CAGR oficial del tramo.
const nasdaqStats = core.historicalStatistics(core.HISTORICAL_RETURNS.nasdaq.returns);
assert(nasdaqStats.cagr > 0.22 && nasdaqStats.cagr < 0.224);

console.log("✓ Escala fiscal española");
console.log("✓ Aportaciones mensuales, quincenales, semanales y anuales");
console.log("✓ Capitalización anual exacta");
console.log("✓ Monte Carlo, bootstrap y sensibilidad reproducibles");
console.log("✓ Series históricas embebidas verificadas");
// El CAGR geométrico mediano debe fijar P50; aumentar la volatilidad solo amplía P10–P90.
const geometricRaw = baseRaw({
    strategy: "custom",
    model: "monte-carlo",
    initial: 100_000,
    periodicContribution: 0,
    years: 22,
    customRate: 5.2,
    annualFee: 0,
    seed: 20260729
});
const zeroVolatility = core.simulate(core.buildSimulationConfig({ ...geometricRaw, customVolatility: 0 })).result;
const highVolatility = core.simulate(core.buildSimulationConfig({ ...geometricRaw, customVolatility: 30 })).result;
const expectedMedian = 100_000 * Math.pow(1.052, 22);
approximately(zeroVolatility.finalValue, expectedMedian, 1e-4);
assert(Math.abs(highVolatility.finalValue / expectedMedian - 1) < 0.03);
assert(highVolatility.finalLow < zeroVolatility.finalLow);
assert(highVolatility.finalHigh > zeroVolatility.finalHigh);

// Comparación conjunta Nasdaq/S&P: reproducible, correlacionada y con estadística de superación.
const jointPrimaryConfig = core.buildSimulationConfig(baseRaw({
    strategy: "nasdaq",
    model: "monte-carlo",
    initial: 100_000,
    periodicContribution: 0,
    years: 10,
    compare: true
}));
const jointBenchmarkConfig = {
    ...jointPrimaryConfig,
    strategy: "sp500",
    medianCagr: core.PRESETS.sp500.medianCagr,
    volatility: core.PRESETS.sp500.volatility,
    compare: false
};
const jointFirst = core.simulateJointComparison(jointPrimaryConfig, jointBenchmarkConfig);
const jointSecond = core.simulateJointComparison(jointPrimaryConfig, jointBenchmarkConfig);
assert.strictEqual(jointFirst.result.finalValue, jointSecond.result.finalValue);
assert.strictEqual(jointFirst.benchmarkResult.finalValue, jointSecond.benchmarkResult.finalValue);
assert(jointFirst.comparison.correlation > -1 && jointFirst.comparison.correlation < 1);
assert(jointFirst.comparison.probabilityPrimaryOutperforms >= 0 && jointFirst.comparison.probabilityPrimaryOutperforms <= 1);
assert.strictEqual(jointFirst.comparison.mode, "joint-correlated-monte-carlo");

// Bootstrap conjunto: mismo periodo y mismos bloques para ambos índices.
const alignedPrimaryConfig = core.buildSimulationConfig(baseRaw({
    strategy: "nasdaq",
    model: "bootstrap",
    initial: 100_000,
    periodicContribution: 0,
    years: 10,
    compare: true
}));
const alignedBenchmarkConfig = {
    ...alignedPrimaryConfig,
    strategy: "sp500",
    medianCagr: core.PRESETS.sp500.medianCagr,
    volatility: core.PRESETS.sp500.volatility,
    compare: false
};
const aligned = core.simulateJointComparison(alignedPrimaryConfig, alignedBenchmarkConfig);
assert.strictEqual(aligned.result.historicalPeriod, "2008–2025");
assert.strictEqual(aligned.benchmarkResult.historicalPeriod, "2008–2025");
assert.strictEqual(aligned.comparison.mode, "joint-aligned-bootstrap");
assert.strictEqual(core.ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.primaryReturns.length, core.ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.benchmarkReturns.length);
assert.strictEqual(core.ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.primaryReturns.length, 18);
assert.strictEqual(core.ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.blockYears, 2);
assert(core.ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.annualCorrelation > 0.90);
assert.strictEqual(core.ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.monteCarloCorrelation, 0.93);

// La extrapolación de una fuente de 10 años debe producir una advertencia.
const longHorizonWarnings = core.buildModelWarnings(core.buildSimulationConfig(baseRaw({ years: 22 })));
assert(longHorizonWarnings.some((warning) => warning.includes("extrapolación")));


// Presets prospectivos: no confundir CAGR histórico del Nasdaq con expectativa central.
assert.strictEqual(core.PRESETS.sp500.medianCagr, 0.067);
assert.strictEqual(core.PRESETS.nasdaq.medianCagr, 0.085);
assert.strictEqual(core.PRESETS.nasdaq.sensitivity.high, 0.148);

console.log("✓ CAGR geométrico mediano independiente de la volatilidad");
console.log("✓ Comparación conjunta Nasdaq/S&P correlacionada");
console.log("✓ Bootstrap comparativo con años y bloques alineados");
console.log("✓ Advertencia al extrapolar previsiones de 10 años");
console.log("✓ Presets prospectivos institucionales separados del historial");
console.log("Todas las pruebas han pasado.");

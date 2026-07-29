"use strict";

/**
 * FutureWealth — motor educativo de simulación financiera.
 *
 * Principios del modelo:
 * - El CAGR geométrico mediano y la volatilidad son hipótesis independientes.
 * - El Monte Carlo usa movimiento browniano geométrico y normal estándar.
 * - El bootstrap individual reordena bloques de 12 meses; la comparación usa bloques anuales alineados.
 * - La inflación deflacta los resultados; no se resta al CAGR.
 * - Las aportaciones se ubican exactamente en una cuadrícula de 52 semanas.
 * - La fiscalidad es una estimación de liquidación total al cierre de cada año.
 */

const ITERATIONS = 10_000;
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const MODEL_VERSION = "2026-07-29-cagr3";

const PRESETS = Object.freeze({
    balanced: Object.freeze({
        name: "Diversificada 40/60",
        shortName: "40/60",
        medianCagr: 0.048,
        volatility: 0.085,
        sensitivity: Object.freeze({ low: 0.015, central: 0.048, high: 0.07 }),
        historicalKey: null,
        forecastHorizonYears: 10,
        description: "Cartera ilustrativa con 40% de renta variable estadounidense y 60% de bonos soberanos. Reduce el riesgo frente a una cartera 100% acciones, pero puede registrar pérdidas.",
        source: "Hipótesis combinada: 40% de la previsión central de acciones de EE. UU. y 60% de la rentabilidad del Treasury a 10 años; volatilidad ilustrativa de cartera.",
        historicalNote: "No hay bootstrap porque esta versión no incorpora una serie histórica conjunta de acciones y bonos con rebalanceo."
    }),
    sp500: Object.freeze({
        name: "Renta variable EE. UU.",
        shortName: "S&P 500",
        medianCagr: 0.067,
        volatility: 0.1536,
        sensitivity: Object.freeze({ low: 0.052, central: 0.067, high: 0.085 }),
        historicalKey: "sp500",
        forecastHorizonYears: 10,
        description: "Exposición 100% a grandes compañías estadounidenses. El preset utiliza una hipótesis prospectiva institucional, no el 10% histórico como promesa.",
        source: "CAGR geométrico mediano central: 6,7%, referencia 2026 de J.P. Morgan para renta variable estadounidense de gran capitalización. Rango de sensibilidad: 5,2% de Vanguard a 8,5% del escenario base de BlackRock. Volatilidad: 15,36% anualizada a 10 años de S&P DJI.",
        historicalNote: "Bootstrap individual disponible con una aproximación mensual de rentabilidad total basada en precios y dividendos de Robert Shiller, 1926–junio de 2023."
    }),
    nasdaq: Object.freeze({
        name: "Tecnología concentrada",
        shortName: "Nasdaq-100",
        medianCagr: 0.085,
        volatility: 0.2263,
        sensitivity: Object.freeze({ low: 0.067, central: 0.085, high: 0.148 }),
        historicalKey: "nasdaq",
        forecastHorizonYears: 10,
        description: "Índice concentrado en grandes compañías no financieras y con fuerte peso tecnológico. El 8,5% es una hipótesis central prospectiva ilustrativa; no se confunde con el 14,25% histórico desde 1985.",
        source: "CAGR geométrico mediano central: 8,5%, usando como proxy el escenario base a 10 años de BlackRock para grandes compañías estadounidenses. Escenario bajo: 6,7% de J.P. Morgan; escenario alto de IA: 14,8% de BlackRock, tratado como escenario y no como consenso. Volatilidad oficial Nasdaq-100 TR a 10 años: 22,63%.",
        historicalNote: "Bootstrap individual disponible con 120 rentabilidades mensuales oficiales, julio de 2016–junio de 2026. Para comparar con el S&P 500 se usan años naturales alineados 2008–2025."
    }),
    custom: Object.freeze({
        name: "Personalizada",
        shortName: "Personalizada",
        medianCagr: 0.06,
        volatility: 0.18,
        sensitivity: Object.freeze({ low: 0.02, central: 0.06, high: 0.10 }),
        historicalKey: null,
        forecastHorizonYears: null,
        description: "Hipótesis definidas por el usuario. El CAGR geométrico mediano y la volatilidad se introducen de forma independiente.",
        source: "Sin fuente automática: documenta externamente el benchmark, periodo, dividendos, divisa y metodología de tus hipótesis.",
        historicalNote: "No hay bootstrap hasta que se aporte una serie mensual concreta."
    })
});

const HISTORICAL_RETURNS = Object.freeze({
    sp500: Object.freeze({
        label: "S&P 500 aproximado Total Return",
        start: "1926-01",
        end: "2023-06",
        blockMonths: 12,
        returns: Object.freeze([0.005632,-0.063783,-0.023497,0.011596,0.052228,0.046604,0.043978,0.019484,-0.0183,0.017425,0.027104,-0.002368,0.023777,0.019705,0.028819,0.038724,0.017063,0.026286,0.057289,0.060667,-0.011626,0.026595,0.027208,0.007716,-0.008256,0.057496,0.066652,0.034378,-0.045625,0.010939,0.03594,0.07377,0.023605,0.070846,0.006975,0.076962,0.008146,0.020542,-0.002982,0.017998,0.022051,0.092033,0.059603,0.04247,-0.103222,-0.261879,0.043772,0.018266,0.066374,0.041224,0.06688,-0.056513,-0.097692,-0.017597,-0.008956,0.003437,-0.133709,-0.067991,-0.061873,0.035497,0.081317,0.02374,-0.09086,-0.09167,-0.026867,0.038493,-0.024928,-0.143765,-0.127594,0.020433,-0.181104,-0.008755,-0.000736,0.011138,-0.232513,-0.113499,-0.124319,0.061378,0.513085,0.103364,-0.132432,-0.003667,-0.026714,0.045638,-0.112717,0.003267,0.11236,0.293118,0.17578,0.084577,-0.046453,-0.004881,-0.093809,0.027967,0.023177,0.060856,0.077496,-0.047979,0.020199,-0.098259,0.017032,-0.043546,-0.03514,-0.020078,0.01209,0.032115,0.010598,0.00405,-0.026188,-0.059298,0.079337,0.082627,0.041709,0.055995,0.071049,0.024333,0.029931,0.097176,0.003004,0.058282,0.06038,0.02417,0.004243,-0.050105,0.045836,0.062457,0.023083,0.014545,0.055694,0.031199,-0.013825,0.034633,0.033068,0.002347,-0.056108,-0.040711,-0.033231,0.063814,0.014249,-0.137744,-0.140919,-0.082587,-0.010119,0.032315,-0.018076,-0.060236,-0.03454,0.015448,0.029225,0.204647,0.010394,-0.041024,0.115816,0.004339,-0.025822,-0.011601,-0.004556,0.002688,-0.122388,0.040987,0.021742,0.028434,-0.010603,0.11063,0.013965,-0.013953,-0.0196,-0.00146,-0.002258,-0.001432,0.014243,-0.133365,-0.080892,0.038751,0.026554,0.047631,0.01466,0.028503,-0.035899,0.007228,-0.057214,0.011796,-0.025433,-0.015848,0.041092,0.057149,0.000785,0.008652,-0.034315,-0.040805,-0.058787,0.026097,-0.024854,-0.047688,-0.034637,0.018601,0.057377,0.043684,0.000321,0.016492,0.079589,0.021459,0.010472,0.065039,0.064338,0.040147,0.037865,0.043633,0.021797,0.024747,-0.045367,0.025554,-0.004981,-0.042041,0.017726,0.036682,-0.002414,0.032427,-0.013062,0.022054,0.051446,0.030211,-0.010534,-0.01223,0.028836,-0.00284,0.026001,0.033863,0.037353,0.003168,0.029014,0.041608,0.021874,-0.016935,0.007085,0.071814,0.045139,0.036061,0.020246,0.043021,0.005889,-0.026748,0.067693,0.00518,-0.003387,-0.02546,-0.01622,-0.144209,-0.018684,-9.4e-05,0.03398,0.009216,0.042717,-0.036709,-0.032908,-0.013546,0.039284,0.066992,-0.015536,-0.021615,0.03036,-0.00721,-0.011133,-0.008631,-0.044467,0.019208,0.081876,0.053301,0.045872,-0.019537,-0.024851,-0.006744,0.03199,-0.050906,-0.001472,0.016385,-0.033185,0.015008,0.00421,-0.001754,-0.049053,0.062674,0.041742,0.018749,0.031597,0.019649,0.032588,0.02635,0.025276,0.0138,0.03391,0.039191,0.021692,-0.067043,0.066584,0.041282,0.047417,0.003956,0.002143,0.080197,0.043153,-0.011061,0.019315,0.006336,-0.0114,0.023614,0.049602,0.031309,0.000154,-0.022665,0.035997,0.03835,-0.013309,0.007509,0.002065,0.004634,0.032483,0.033668,0.008805,-0.011087,-0.016153,0.036629,0.045046,0.009889,-0.007735,0.009571,-0.044718,0.010039,-0.031065,0.019137,0.008989,-0.041069,0.035203,0.027117,0.018401,0.030261,0.026785,0.025846,0.044484,0.044205,0.012211,0.044592,0.023961,0.027416,0.027168,0.043082,0.049591,0.021701,0.037063,-0.004349,0.03809,-0.00078,0.061458,0.076476,-0.002961,0.048197,-0.047236,0.070675,0.012384,-0.023823,0.009551,0.072117,0.014869,-0.028344,-0.002578,0.057513,-0.002824,-0.030865,-0.009595,-0.007185,0.018029,-0.018632,-0.039964,0.016199,0.02644,0.041602,0.019542,0.023239,-0.052034,-0.037376,-0.058947,-0.017984,0.003201,0.023273,0.007005,0.024176,0.008938,0.035552,0.027326,0.030708,0.040543,0.029437,0.043601,0.033273,0.021635,0.042557,-0.01264,0.028072,0.019374,0.017664,-0.006053,0.042285,-0.003176,-0.037023,0.001777,0.006701,0.034641,-0.014806,-0.03604,-0.010727,0.015848,-0.00624,0.039886,-0.021961,0.014909,-0.027208,-0.01674,0.035409,0.026906,0.054264,0.043737,0.033966,0.02919,0.012634,-0.010802,-0.000271,0.038398,-0.005409,0.013455,0.047745,0.011654,-0.034864,0.019103,0.003418,-0.029442,-0.071843,-0.114119,0.027184,0.03024,-0.005924,-0.028539,0.072033,0.046261,0.041476,0.015964,-0.001075,0.049803,0.022716,0.002186,-0.012215,0.030315,0.02894,0.005026,-0.003039,0.02396,0.033321,0.014817,0.020728,0.016949,0.012221,-0.003489,0.039631,-0.012237,0.019675,0.019722,0.009389,-0.014884,0.028224,0.009767,0.003372,0.015596,0.017345,-0.045055,0.001045,0.021202,0.035977,0.024987,0.010778,-0.002098,0.019823,-0.004286,-0.038605,0.033225,-0.050061,-0.005579,0.000203,-0.057675,-0.032228,-0.005651,0.053153,0.007151,0.041313,0.03731,0.026347,0.019925,0.020577,-0.009918,0.01993,0.018522,0.016545,0.000974,-0.028817,0.031117,-0.000166,-0.042561,-0.015583,0.07663,0.025589,0.029418,0.0005,-0.019328,0.035088,0.027183,0.017868,0.012864,-0.039844,-0.002377,-0.01913,0.022751,0.035143,-0.049705,-0.042048,-0.00283,0.006291,0.013467,0.009978,-0.050272,-0.005887,-0.031958,0.020126,-0.027474,-0.111987,-0.002695,0.005229,0.032561,0.063217,0.024878,0.002051,0.071567,0.041098,0.041502,0.02831,0.036736,-0.011081,-0.015961,-0.004632,-0.015174,0.024861,-0.018642,-0.043721,0.07163,0.044225,0.02087,0.026196,0.012589,-0.007759,0.005161,-0.005036,0.037839,-0.012102,0.004192,0.05256,0.023132,0.009898,-0.033247,-0.013449,-0.016321,-0.025685,-0.019885,0.012116,-0.016341,0.019966,0.042382,-0.068501,-0.068023,0.017022,-0.024711,0.045764,-0.048149,-0.027039,0.004591,-0.113441,-0.037616,-0.100103,0.023773,0.037438,-0.060914,0.086357,0.108102,0.049761,0.014884,0.067139,0.028959,0.00432,-0.069963,-0.008527,0.049703,0.020408,-0.011806,0.095456,0.041784,0.008027,0.010974,-0.003814,0.009025,0.026678,-0.005582,0.024403,-0.031029,-0.003612,0.03792,-0.005335,-0.023649,-0.000503,-0.01189,0.000693,0.009045,0.012864,-0.020747,-0.011714,-0.02193,0.009862,-0.000751,-0.033865,-0.00968,0.002697,0.048334,0.055076,0.006767,-0.000592,0.073313,0.004026,-0.027722,-0.054363,0.019243,0.041891,-0.010533,0.023448,0.024348,-0.018892,0.024215,0.014255,0.050189,0.015448,-0.033489,-0.003187,0.044077,0.033163,0.043996,-0.087742,-0.011583,0.050399,0.068663,0.049726,0.035077,0.028387,0.033267,0.046166,-0.012429,0.000125,-0.030677,0.041459,0.012961,-0.01615,0.008599,-0.020135,0.008054,-0.082999,0.017298,0.030463,0.011819,-0.048021,-0.019118,-0.027424,0.054716,0.005718,-0.052685,0.002449,0.00795,0.120974,0.088819,0.045003,0.013559,0.039266,0.021308,0.038664,0.041979,0.044245,0.01754,0.007091,-0.024062,0.033149,0.006494,-0.011399,-0.001266,0.015775,-0.051107,0.004439,0.005095,-0.002503,-0.01846,-0.009072,0.092078,0.014082,-0.004099,0.012884,-0.007051,0.046998,0.057895,-0.004763,0.01026,0.027369,0.025122,0.022487,-0.018439,-0.018835,0.014965,0.064214,0.052954,0.007533,0.056988,0.061843,0.027424,0.004928,0.031342,-0.018024,0.022824,-0.024548,-0.000893,0.035335,0.017095,0.06674,0.064625,0.04377,-0.008547,0.001746,0.045002,0.031234,0.064553,-0.030292,-0.118526,-0.123019,-0.01333,0.042482,0.033301,0.032336,-0.008831,-0.021853,0.060012,-0.003046,-0.017161,0.019296,0.038044,-0.020175,0.023293,0.035146,0.033023,-0.001584,0.03567,0.041182,0.033973,0.028015,0.046939,0.004599,0.002879,-0.018105,0.027401,-0.022093,-0.02525,0.027094,0.001989,0.038538,0.031725,0.001713,-0.078599,-0.043399,-0.023132,0.029862,0.045886,-0.006847,0.116069,0.030445,0.022593,-0.001787,0.003472,0.007814,0.026799,-0.003022,0.001811,0.000152,0.009346,0.073589,-0.006,-0.010116,0.002643,0.020684,-0.013291,0.019126,0.009422,0.003789,-0.011823,0.027568,0.032713,0.001433,0.017249,0.021508,-0.013415,0.00725,0.008654,0.00061,0.017625,0.01355,0.012423,7.9e-05,0.008875,0.017367,-0.000749,-0.014231,-0.033456,0.010591,0.011089,-0.005183,0.030826,0.008178,-0.004423,-0.003684,-0.010244,0.024514,0.038191,0.02558,0.032168,0.033488,0.031793,0.035487,0.005142,0.037187,0.009136,0.023594,0.033901,0.00164,0.059058,-0.001994,0.001978,0.023556,0.012793,-0.034749,0.030774,0.020254,0.041205,0.05053,0.011991,0.032581,0.043617,-0.006231,-0.034049,0.092182,0.053372,0.057365,0.003483,0.011925,0.016459,-0.011515,0.026351,0.002375,0.064026,0.053132,0.034065,-0.002211,0.001172,0.044682,-0.069705,-0.04898,0.012911,0.109745,0.041042,0.050483,-0.000662,0.029241,0.0425,-0.000988,-0.006118,0.045228,-0.03774,-0.005976,-0.012724,0.071061,0.028088,-0.001188,-0.024779,0.039411,0.014245,-0.028389,0.031634,0.008497,0.009391,-0.010803,-0.052144,-0.007727,-0.033202,0.004544,-0.021369,-0.090805,0.00448,0.068787,-0.023893,-0.026601,-0.020457,-0.112472,0.03184,0.050531,0.01466,-0.002977,-0.033528,0.049452,-0.035137,-0.028196,-0.059202,-0.107592,0.011381,-0.047585,-0.013662,0.066265,-0.010342,-0.002221,-0.064144,0.013084,0.052857,0.053121,0.05704,0.005971,-0.001651,0.031624,0.0203,0.012127,0.030659,0.049366,0.010882,-0.015637,0.009696,-0.025628,0.028591,-0.022374,-0.013862,0.027841,0.001033,0.047746,0.027281,-0.013474,0.016831,-0.002538,-0.024073,0.013375,0.021823,0.01809,0.003112,0.002809,-0.026225,0.039633,0.021458,0.01468,-0.000154,0.014874,0.007997,-0.007852,-0.027044,0.007215,0.022932,0.025326,0.036176,0.020032,0.021498,0.00694,0.015972,-0.024727,0.041816,0.03393,0.003462,0.005761,-0.041996,0.030763,0.02993,-0.04805,0.012396,-0.066341,-0.015628,-0.026255,0.042447,0.025634,-0.042458,-0.060782,0.021108,-0.048472,-0.201946,-0.086067,-0.003527,-0.010991,-0.067061,-0.056913,0.123156,0.066544,0.028637,0.012726,0.081157,0.036457,0.023991,0.020904,0.022221,0.013557,-0.028997,0.059417,0.040883,-0.058821,-0.035432,-0.001583,0.008644,0.033719,0.045784,0.024918,0.037146,0.034638,0.031524,-0.01111,0.022229,0.006611,-0.036607,0.031035,-0.103989,-0.007873,0.030219,0.0177,0.015576,0.047846,0.041646,0.028857,-0.000363,-0.03089,-0.011504,0.029238,0.033903,0.030237,-0.002139,-0.028343,0.021788,0.042704,0.023346,0.02724,0.014559,0.045763,-0.011158,0.032564,0.002544,0.011943,0.021185,0.038609,0.015226,0.009697,-0.001281,0.027242,0.002034,0.015337,0.03198,0.014974,-0.004254,0.017796,-0.026453,0.05707,0.006352,-0.011082,0.028293,0.000572,0.008797,0.009801,-0.004343,-0.000786,-0.024234,-0.04506,0.043184,0.029337,-0.011018,-0.06419,-0.005492,0.063634,0.028321,-0.003036,0.010673,0.032982,0.012,-0.004379,-0.005051,0.01202,0.039468,0.014385,0.025773,0.017501,-0.00153,0.016934,0.017774,0.00989,0.002489,0.016543,0.027356,0.015904,0.028843,0.04863,-0.028856,0.000657,-0.01663,0.019627,0.02114,0.015821,0.024521,0.016811,-0.038476,-0.020747,-0.055611,0.017369,0.058302,0.019492,0.037243,-0.015307,0.014059,0.038284,-0.031334,0.030863,0.000108,0.044346,0.024702,0.033476,0.001232,-0.189166,0.043187,0.058875,0.065084,0.034757,0.058928,-0.006277,0.017255,0.039537,0.042596,0.027948,0.024911,0.008209,0.060217,0.007604,0.018106,0.030691,0.02186,-0.000836,0.004529,0.047455,0.002661,-0.02051,-0.029016,-0.008916,0.001196,-0.078714,-0.03368,0.004656,0.064483,-0.072765,-0.0309,0.052863,0.00012,0.013774,0.031479,-0.025845,0.039966,0.00738,0.049425])
    }),
    nasdaq: Object.freeze({
        label: "Nasdaq-100 Total Return",
        start: "2016-07",
        end: "2026-06",
        blockMonths: 12,
        returns: Object.freeze([0.0713,0.0108,0.0224,-0.0149,0.0043,0.0115,0.0525,0.0437,0.0205,0.0276,0.0388,-0.024,0.0417,0.0203,-0.0012,0.0455,0.0206,0.0052,0.087,-0.0122,-0.0394,0.0041,0.0568,0.0109,0.0276,0.06,-0.0029,-0.0862,-0.0009,-0.0883,0.0916,0.0294,0.0403,0.055,-0.0825,0.0769,0.0236,-0.0186,0.0083,0.0437,0.041,0.0399,0.0301,-0.0578,-0.0757,0.1523,0.0631,0.0637,0.0741,0.1116,-0.0567,-0.0316,0.111,0.0511,0.0032,-0.0004,0.0147,0.0592,-0.0117,0.064,0.0282,0.0425,-0.0569,0.0794,0.0188,0.0119,-0.0849,-0.0454,0.0428,-0.1334,-0.0153,-0.0894,0.126,-0.0511,-0.1055,0.0401,0.0562,-0.0901,0.1067,-0.0037,0.0954,0.0052,0.0773,0.0655,0.0384,-0.015,-0.0502,-0.0204,0.1082,0.0556,0.0189,0.0541,0.0123,-0.0443,0.0639,0.0627,-0.0159,0.0118,0.0257,-0.0082,0.0531,0.0046,0.0225,-0.0269,-0.0761,0.0155,0.0913,0.0634,0.0241,0.0092,0.0547,0.0481,-0.0157,-0.0067,0.0123,-0.0226,-0.0481,0.1566,0.1058,-0.0012])
    })
});


function pearsonCorrelation(first, second) {
    if (!first || !second || first.length !== second.length || first.length < 2) {
        throw new Error("Las series deben tener la misma longitud para calcular su correlación.");
    }
    const length = first.length;
    const meanFirst = first.reduce((sum, value) => sum + value, 0) / length;
    const meanSecond = second.reduce((sum, value) => sum + value, 0) / length;
    let covariance = 0;
    let varianceFirst = 0;
    let varianceSecond = 0;
    for (let index = 0; index < length; index++) {
        const firstDeviation = first[index] - meanFirst;
        const secondDeviation = second[index] - meanSecond;
        covariance += firstDeviation * secondDeviation;
        varianceFirst += firstDeviation ** 2;
        varianceSecond += secondDeviation ** 2;
    }
    if (varianceFirst === 0 || varianceSecond === 0) return 0;
    return Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceFirst * varianceSecond)));
}

function buildAlignedNasdaqSp500History() {
    /*
     * Años naturales Total Return alineados 2008–2025.
     * Nasdaq-100: cifras de Nasdaq Global Indexes.
     * S&P 500: cifras de S&P Dow Jones Indices.
     * Se muestrean los mismos bloques consecutivos de dos años para ambos índices.
     */
    const nasdaq = Object.freeze([
        -0.4170, 0.5468, 0.2014, 0.0366, 0.1835, 0.3692,
        0.1940, 0.0975, 0.0727, 0.3299, 0.0004, 0.3946,
        0.4888, 0.2751, -0.3238, 0.5513, 0.2588, 0.2102
    ]);
    const sp500 = Object.freeze([
        -0.3700, 0.2646, 0.1506, 0.0211, 0.1600, 0.3239,
        0.1369, 0.0138, 0.1196, 0.2183, -0.0438, 0.3149,
        0.1840, 0.2871, -0.1811, 0.2629, 0.2502, 0.1788
    ]);
    return Object.freeze({
        label: "Nasdaq-100 TR y S&P 500 TR · años naturales alineados",
        start: "2008",
        end: "2025",
        blockYears: 2,
        primaryKey: "nasdaq",
        benchmarkKey: "sp500",
        primaryReturns: nasdaq,
        benchmarkReturns: sp500,
        annualCorrelation: pearsonCorrelation(nasdaq, sp500),
        monteCarloCorrelation: 0.93,
        monteCarloCorrelationPeriod: "31/12/2007–30/06/2026"
    });
}

const ALIGNED_HISTORICAL_RETURNS = Object.freeze({
    nasdaqSp500: buildAlignedNasdaqSp500History()
});

const MODEL_TEXT = Object.freeze({
    "monte-carlo": "Genera 10.000 trayectorias semanales lognormales. El CAGR geométrico mediano fija el centro P50 y la volatilidad ensancha P10–P90 sin volver a reducir ese centro.",
    bootstrap: "Sin comparación, reordena bloques mensuales de 12 meses. Al comparar Nasdaq-100 y S&P 500 usa los mismos bloques consecutivos de dos años Total Return entre 2008 y 2025.",
    sensitivity: "Capitaliza tres CAGR constantes definidos por el usuario. No genera probabilidades y sus líneas no son percentiles."
});

const RISK_QUESTIONS = Object.freeze([
    Object.freeze({
        question: "¿Cuándo podrías necesitar una parte importante de este dinero?",
        help: "Un horizonte corto reduce la capacidad de recuperarse de una caída.",
        dimension: "capacity",
        options: Object.freeze([
            ["En menos de 2 años", 0],
            ["Entre 2 y 5 años", 1],
            ["Entre 5 y 10 años", 3],
            ["Dentro de más de 10 años", 4]
        ])
    }),
    Object.freeze({
        question: "¿Cuántos meses de gastos cubre tu fondo de emergencia?",
        help: "La inversión no debería sustituir el colchón para imprevistos.",
        dimension: "capacity",
        options: Object.freeze([
            ["Menos de 1 mes", 0],
            ["Entre 1 y 3 meses", 1],
            ["Entre 3 y 6 meses", 3],
            ["Más de 6 meses", 4]
        ])
    }),
    Object.freeze({
        question: "¿Cómo de estables son tus ingresos y obligaciones?",
        help: "Una caída es más difícil de soportar cuando el flujo de caja es incierto.",
        dimension: "capacity",
        options: Object.freeze([
            ["Muy inestables o con deudas exigentes", 0],
            ["Algo inestables", 1],
            ["Bastante estables", 3],
            ["Muy estables y con amplio margen", 4]
        ])
    }),
    Object.freeze({
        question: "Tu cartera cae un 25% y no ha cambiado tu horizonte. ¿Qué harías?",
        help: "Responde pensando en una caída real de varios miles de euros, no solo en un porcentaje abstracto.",
        dimension: "tolerance",
        options: Object.freeze([
            ["Vendería toda o casi toda", 0],
            ["Reduciría una parte", 1],
            ["Mantendría el plan", 3],
            ["Mantendría y aportaría más", 4]
        ])
    }),
    Object.freeze({
        question: "¿Qué caída temporal máxima crees que podrías soportar sin abandonar el plan?",
        help: "La renta variable puede sufrir pérdidas profundas y prolongadas.",
        dimension: "tolerance",
        options: Object.freeze([
            ["Menos del 10%", 0],
            ["Entre el 10% y el 20%", 1],
            ["Entre el 20% y el 35%", 3],
            ["Más del 35%", 4]
        ])
    }),
    Object.freeze({
        question: "¿Qué experiencia práctica tienes invirtiendo?",
        help: "Haber vivido una crisis suele aportar más información que conocer solo periodos alcistas.",
        dimension: "knowledge",
        options: Object.freeze([
            ["Ninguna", 0],
            ["Ahorro o fondos muy simples", 1],
            ["ETFs o acciones durante varios años", 3],
            ["He atravesado caídas fuertes sin improvisar", 4]
        ])
    }),
    Object.freeze({
        question: "¿Qué parte de este capital podrías perder sin afectar necesidades esenciales?",
        help: "La capacidad financiera para asumir pérdidas es distinta de la valentía emocional.",
        dimension: "capacity",
        options: Object.freeze([
            ["Prácticamente ninguna", 0],
            ["Una parte pequeña", 1],
            ["Una parte relevante", 3],
            ["Todo el capital invertido, aunque sería indeseable", 4]
        ])
    }),
    Object.freeze({
        question: "¿Cuál describe mejor tu prioridad principal?",
        help: "Más rentabilidad potencial suele exigir aceptar más incertidumbre y peores años.",
        dimension: "tolerance",
        options: Object.freeze([
            ["Evitar pérdidas aunque apenas crezca", 0],
            ["Reducir oscilaciones", 1],
            ["Crecer a largo plazo aceptando caídas", 3],
            ["Maximizar crecimiento aceptando gran volatilidad", 4]
        ])
    })
]);

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function safeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function mulberry32(seed) {
    let state = seed >>> 0;
    return function random() {
        state += 0x6D2B79F5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function createNormalGenerator(random) {
    let spare = null;
    return function randomNormal() {
        if (spare !== null) {
            const value = spare;
            spare = null;
            return value;
        }

        let u1 = 0;
        let u2 = 0;
        while (u1 <= Number.EPSILON) u1 = random();
        while (u2 <= Number.EPSILON) u2 = random();

        const magnitude = Math.sqrt(-2 * Math.log(u1));
        const angle = 2 * Math.PI * u2;
        spare = magnitude * Math.sin(angle);
        return magnitude * Math.cos(angle);
    };
}

function percentile(values, probability) {
    if (!values || values.length === 0) return NaN;
    const sorted = Array.from(values).sort((a, b) => a - b);
    const position = (sorted.length - 1) * probability;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    const weight = position - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function parseLocaleNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;

    let cleaned = value.trim().replace(/[\s\u00A0€$]/g, "");
    if (!cleaned) return 0;

    const commaIndex = cleaned.lastIndexOf(",");
    const dotIndex = cleaned.lastIndexOf(".");

    if (commaIndex !== -1 && dotIndex !== -1) {
        const decimalSeparator = commaIndex > dotIndex ? "," : ".";
        const thousandsSeparator = decimalSeparator === "," ? "." : ",";
        cleaned = cleaned.split(thousandsSeparator).join("");
        cleaned = cleaned.replace(decimalSeparator, ".");
    } else if (commaIndex !== -1) {
        const decimals = cleaned.length - commaIndex - 1;
        cleaned = decimals > 0 && decimals <= 2
            ? cleaned.replace(/\./g, "").replace(",", ".")
            : cleaned.replace(/,/g, "");
    } else if (dotIndex !== -1) {
        const decimals = cleaned.length - dotIndex - 1;
        const dotCount = (cleaned.match(/\./g) || []).length;
        if (dotCount > 1 || decimals === 3) cleaned = cleaned.replace(/\./g, "");
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatEditableNumber(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 0,
        maximumFractionDigits
    }).format(value);
}

function formatPercent(value, digits = 1) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("es-ES", {
        style: "percent",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(value);
}

function calculateSpanishSavingsTax(gain) {
    if (!Number.isFinite(gain) || gain <= 0) return 0;

    const brackets = [
        { upper: 6_000, rate: 0.19 },
        { upper: 50_000, rate: 0.21 },
        { upper: 200_000, rate: 0.23 },
        { upper: 300_000, rate: 0.27 },
        { upper: Infinity, rate: 0.30 }
    ];

    let tax = 0;
    let lower = 0;
    for (const bracket of brackets) {
        const taxable = Math.max(0, Math.min(gain, bracket.upper) - lower);
        tax += taxable * bracket.rate;
        if (gain <= bracket.upper) break;
        lower = bracket.upper;
    }
    return tax;
}

function estimateTax(grossBalance, nominalCostBasis, taxConfig) {
    if (!taxConfig.enabled) return 0;
    const gain = Math.max(0, grossBalance - nominalCostBasis);
    if (taxConfig.model === "spain") return calculateSpanishSavingsTax(gain);
    return gain * clamp(taxConfig.customRate, 0, 1);
}

function createContributionPlan({
    initial,
    periodicContribution,
    years,
    frequency,
    timing,
    inflationRate,
    indexContributions,
    showReal
}) {
    const totalWeeks = years * WEEKS_PER_YEAR;
    const amounts = new Float64Array(totalWeeks);
    const safeFrequency = [1, 12, 26, 52].includes(frequency) ? frequency : 12;

    for (let year = 0; year < years; year++) {
        const annualMultiplier = indexContributions ? Math.pow(1 + inflationRate, year) : 1;
        const amount = periodicContribution * annualMultiplier;

        for (let period = 0; period < safeFrequency; period++) {
            const localStart = Math.floor(period * WEEKS_PER_YEAR / safeFrequency);
            const nextStart = Math.floor((period + 1) * WEEKS_PER_YEAR / safeFrequency);
            const localWeek = timing === "end"
                ? Math.max(localStart, nextStart - 1)
                : localStart;
            amounts[year * WEEKS_PER_YEAR + localWeek] += amount;
        }
    }

    const cumulativeNominalByYear = new Float64Array(years + 1);
    const cumulativeDisplayByYear = new Float64Array(years + 1);
    cumulativeNominalByYear[0] = initial;
    cumulativeDisplayByYear[0] = initial;

    let nominal = initial;
    let display = initial;
    for (let week = 0; week < totalWeeks; week++) {
        const contribution = amounts[week];
        nominal += contribution;
        const elapsedYears = timing === "begin"
            ? week / WEEKS_PER_YEAR
            : (week + 1) / WEEKS_PER_YEAR;
        display += showReal
            ? contribution / Math.pow(1 + inflationRate, elapsedYears)
            : contribution;

        if ((week + 1) % WEEKS_PER_YEAR === 0) {
            const year = (week + 1) / WEEKS_PER_YEAR;
            cumulativeNominalByYear[year] = nominal;
            cumulativeDisplayByYear[year] = display;
        }
    }

    return Object.freeze({
        amounts,
        cumulativeNominalByYear,
        cumulativeDisplayByYear,
        totalNominal: cumulativeNominalByYear[years],
        totalDisplay: cumulativeDisplayByYear[years],
        contributionCount: safeFrequency * years
    });
}

function convertSnapshot(grossBalance, year, plan, config) {
    const nominalBasis = plan.cumulativeNominalByYear[year];
    const taxNominal = estimateTax(grossBalance, nominalBasis, config.tax);
    const deflator = config.showReal ? Math.pow(1 + config.inflationRate, year) : 1;
    return {
        grossDisplay: grossBalance / deflator,
        taxDisplay: taxNominal / deflator,
        netDisplay: (grossBalance - taxNominal) / deflator
    };
}

function summarizeProbabilistic(checkpoints, finalTaxes, totalContributedDisplay) {
    const p10 = [];
    const p50 = [];
    const p90 = [];

    for (const values of checkpoints) {
        p10.push(percentile(values, 0.10));
        p50.push(percentile(values, 0.50));
        p90.push(percentile(values, 0.90));
    }

    const finalValues = checkpoints[checkpoints.length - 1];
    let belowContributions = 0;
    for (const value of finalValues) {
        if (value < totalContributedDisplay) belowContributions++;
    }

    return {
        type: "probabilistic",
        p10,
        p50,
        p90,
        finalValue: p50[p50.length - 1],
        finalLow: p10[p10.length - 1],
        finalHigh: p90[p90.length - 1],
        medianTax: percentile(finalTaxes, 0.50),
        probabilityBelowContributions: belowContributions / finalValues.length
    };
}

function simulateParametric(config, plan) {
    const checkpoints = Array.from(
        { length: config.years + 1 },
        () => new Float64Array(config.iterations)
    );
    const finalTaxes = new Float64Array(config.iterations);
    const random = mulberry32(config.seed);
    const normal = createNormalGenerator(random);

    const dt = 1 / WEEKS_PER_YEAR;
    const annualMedianFactor = (1 + config.medianCagr) * (1 - config.annualFee);
    if (!(annualMedianFactor > 0)) {
        throw new Error("La combinación de CAGR mediano y costes produce un factor anual no válido.");
    }
    // El input ya es geométrico y mediano. No se resta sigma²/2 otra vez.
    const medianDriftStep = Math.log(annualMedianFactor) * dt;
    const volatilityStep = config.volatility * Math.sqrt(dt);

    for (let simulation = 0; simulation < config.iterations; simulation++) {
        let balance = config.initial;
        checkpoints[0][simulation] = balance;

        for (let week = 0; week < config.years * WEEKS_PER_YEAR; week++) {
            const contribution = plan.amounts[week];
            if (config.timing === "begin") balance += contribution;

            balance *= Math.exp(medianDriftStep + volatilityStep * normal());

            if (config.timing === "end") balance += contribution;

            if ((week + 1) % WEEKS_PER_YEAR === 0) {
                const year = (week + 1) / WEEKS_PER_YEAR;
                const snapshot = convertSnapshot(balance, year, plan, config);
                checkpoints[year][simulation] = snapshot.netDisplay;
                if (year === config.years) finalTaxes[simulation] = snapshot.taxDisplay;
            }
        }
    }

    const result = summarizeProbabilistic(checkpoints, finalTaxes, plan.totalDisplay);
    result.returnInterpretation = "median-geometric-cagr";
    return result;
}

function summarizeOutperformance(primaryFinalValues, benchmarkFinalValues, correlation, mode) {
    const differences = new Float64Array(primaryFinalValues.length);
    let wins = 0;
    for (let index = 0; index < primaryFinalValues.length; index++) {
        const difference = primaryFinalValues[index] - benchmarkFinalValues[index];
        differences[index] = difference;
        if (difference > 0) wins++;
    }
    return {
        mode,
        correlation,
        probabilityPrimaryOutperforms: wins / primaryFinalValues.length,
        differenceP10: percentile(differences, 0.10),
        differenceP50: percentile(differences, 0.50),
        differenceP90: percentile(differences, 0.90)
    };
}

function simulateJointParametric(config, benchmarkConfig, plan, correlation) {
    const primaryCheckpoints = Array.from({ length: config.years + 1 }, () => new Float64Array(config.iterations));
    const benchmarkCheckpoints = Array.from({ length: config.years + 1 }, () => new Float64Array(config.iterations));
    const primaryTaxes = new Float64Array(config.iterations);
    const benchmarkTaxes = new Float64Array(config.iterations);
    const random = mulberry32(config.seed);
    const normal = createNormalGenerator(random);
    const boundedCorrelation = Math.max(-0.999999, Math.min(0.999999, correlation));
    const independentWeight = Math.sqrt(1 - boundedCorrelation ** 2);
    const dt = 1 / WEEKS_PER_YEAR;

    const primaryMedianFactor = (1 + config.medianCagr) * (1 - config.annualFee);
    const benchmarkMedianFactor = (1 + benchmarkConfig.medianCagr) * (1 - benchmarkConfig.annualFee);
    if (!(primaryMedianFactor > 0) || !(benchmarkMedianFactor > 0)) {
        throw new Error("La combinación de CAGR mediano y costes no es válida para la comparación.");
    }
    const primaryDrift = Math.log(primaryMedianFactor) * dt;
    const benchmarkDrift = Math.log(benchmarkMedianFactor) * dt;
    const primaryVolatilityStep = config.volatility * Math.sqrt(dt);
    const benchmarkVolatilityStep = benchmarkConfig.volatility * Math.sqrt(dt);

    for (let simulation = 0; simulation < config.iterations; simulation++) {
        let primaryBalance = config.initial;
        let benchmarkBalance = benchmarkConfig.initial;
        primaryCheckpoints[0][simulation] = primaryBalance;
        benchmarkCheckpoints[0][simulation] = benchmarkBalance;

        for (let week = 0; week < config.years * WEEKS_PER_YEAR; week++) {
            const contribution = plan.amounts[week];
            if (config.timing === "begin") {
                primaryBalance += contribution;
                benchmarkBalance += contribution;
            }

            const primaryShock = normal();
            const benchmarkShock = boundedCorrelation * primaryShock + independentWeight * normal();
            primaryBalance *= Math.exp(primaryDrift + primaryVolatilityStep * primaryShock);
            benchmarkBalance *= Math.exp(benchmarkDrift + benchmarkVolatilityStep * benchmarkShock);

            if (config.timing === "end") {
                primaryBalance += contribution;
                benchmarkBalance += contribution;
            }

            if ((week + 1) % WEEKS_PER_YEAR === 0) {
                const year = (week + 1) / WEEKS_PER_YEAR;
                const primarySnapshot = convertSnapshot(primaryBalance, year, plan, config);
                const benchmarkSnapshot = convertSnapshot(benchmarkBalance, year, plan, benchmarkConfig);
                primaryCheckpoints[year][simulation] = primarySnapshot.netDisplay;
                benchmarkCheckpoints[year][simulation] = benchmarkSnapshot.netDisplay;
                if (year === config.years) {
                    primaryTaxes[simulation] = primarySnapshot.taxDisplay;
                    benchmarkTaxes[simulation] = benchmarkSnapshot.taxDisplay;
                }
            }
        }
    }

    const primary = summarizeProbabilistic(primaryCheckpoints, primaryTaxes, plan.totalDisplay);
    const benchmark = summarizeProbabilistic(benchmarkCheckpoints, benchmarkTaxes, plan.totalDisplay);
    const comparison = summarizeOutperformance(
        primaryCheckpoints[config.years],
        benchmarkCheckpoints[config.years],
        boundedCorrelation,
        "joint-correlated-monte-carlo"
    );
    primary.returnInterpretation = "median-geometric-cagr";
    benchmark.returnInterpretation = "median-geometric-cagr";
    primary.comparison = comparison;
    benchmark.comparison = comparison;
    return { primary, benchmark, comparison };
}

function buildMonthGeometry() {
    const monthForWeek = new Uint8Array(WEEKS_PER_YEAR);
    const weeksPerMonth = new Uint8Array(MONTHS_PER_YEAR);
    for (let week = 0; week < WEEKS_PER_YEAR; week++) {
        const month = Math.min(MONTHS_PER_YEAR - 1, Math.floor(week * MONTHS_PER_YEAR / WEEKS_PER_YEAR));
        monthForWeek[week] = month;
        weeksPerMonth[month]++;
    }
    return Object.freeze({ monthForWeek, weeksPerMonth });
}

const MONTH_GEOMETRY = buildMonthGeometry();

function sampleMonthlyBlockPath(data, totalMonths, random, blockMonths = 12) {
    if (!Array.isArray(data) || data.length < blockMonths) {
        throw new Error("No hay suficientes datos históricos para el bootstrap seleccionado.");
    }

    const sampled = new Float64Array(totalMonths);
    const maximumStart = data.length - blockMonths;
    let destination = 0;
    while (destination < totalMonths) {
        const start = Math.floor(random() * (maximumStart + 1));
        const count = Math.min(blockMonths, totalMonths - destination);
        for (let offset = 0; offset < count; offset++) {
            sampled[destination + offset] = data[start + offset];
        }
        destination += count;
    }
    return sampled;
}

function sampleAlignedAnnualBlockPaths(primaryData, benchmarkData, totalYears, random, blockYears = 2) {
    if (!primaryData || !benchmarkData || primaryData.length !== benchmarkData.length || primaryData.length < blockYears) {
        throw new Error("Las series históricas anuales alineadas no son válidas.");
    }
    const primary = new Float64Array(totalYears);
    const benchmark = new Float64Array(totalYears);
    const maximumStart = primaryData.length - blockYears;
    let destination = 0;
    while (destination < totalYears) {
        const start = Math.floor(random() * (maximumStart + 1));
        const count = Math.min(blockYears, totalYears - destination);
        for (let offset = 0; offset < count; offset++) {
            primary[destination + offset] = primaryData[start + offset];
            benchmark[destination + offset] = benchmarkData[start + offset];
        }
        destination += count;
    }
    return { primary, benchmark };
}

function simulateBootstrap(config, plan, historicalSeries) {
    if (!historicalSeries) throw new Error("La estrategia seleccionada no dispone de serie histórica.");

    const checkpoints = Array.from(
        { length: config.years + 1 },
        () => new Float64Array(config.iterations)
    );
    const finalTaxes = new Float64Array(config.iterations);
    const random = mulberry32(config.seed);
    const monthlyFeeFactor = Math.pow(1 - config.annualFee, 1 / MONTHS_PER_YEAR);
    const totalMonths = config.years * MONTHS_PER_YEAR;

    for (let simulation = 0; simulation < config.iterations; simulation++) {
        const sampledMonths = sampleMonthlyBlockPath(
            historicalSeries.returns,
            totalMonths,
            random,
            historicalSeries.blockMonths
        );
        let balance = config.initial;
        checkpoints[0][simulation] = balance;

        for (let week = 0; week < config.years * WEEKS_PER_YEAR; week++) {
            const contribution = plan.amounts[week];
            if (config.timing === "begin") balance += contribution;

            const localWeek = week % WEEKS_PER_YEAR;
            const year = Math.floor(week / WEEKS_PER_YEAR);
            const month = MONTH_GEOMETRY.monthForWeek[localWeek];
            const monthlyReturn = sampledMonths[year * MONTHS_PER_YEAR + month];
            const monthlyFactor = Math.max(Number.EPSILON, (1 + monthlyReturn) * monthlyFeeFactor);
            const weeklyFactor = Math.pow(monthlyFactor, 1 / MONTH_GEOMETRY.weeksPerMonth[month]);
            balance *= weeklyFactor;

            if (config.timing === "end") balance += contribution;

            if ((week + 1) % WEEKS_PER_YEAR === 0) {
                const checkpointYear = (week + 1) / WEEKS_PER_YEAR;
                const snapshot = convertSnapshot(balance, checkpointYear, plan, config);
                checkpoints[checkpointYear][simulation] = snapshot.netDisplay;
                if (checkpointYear === config.years) finalTaxes[simulation] = snapshot.taxDisplay;
            }
        }
    }

    const result = summarizeProbabilistic(checkpoints, finalTaxes, plan.totalDisplay);
    result.historicalLabel = historicalSeries.label;
    result.historicalPeriod = `${historicalSeries.start}–${historicalSeries.end}`;
    return result;
}

function simulateJointBootstrap(config, benchmarkConfig, plan, alignedSeries) {
    if (!alignedSeries) throw new Error("No existe un historial común alineado para esta comparación.");
    const primaryCheckpoints = Array.from({ length: config.years + 1 }, () => new Float64Array(config.iterations));
    const benchmarkCheckpoints = Array.from({ length: config.years + 1 }, () => new Float64Array(config.iterations));
    const primaryTaxes = new Float64Array(config.iterations);
    const benchmarkTaxes = new Float64Array(config.iterations);
    const random = mulberry32(config.seed);

    for (let simulation = 0; simulation < config.iterations; simulation++) {
        const sampled = sampleAlignedAnnualBlockPaths(
            alignedSeries.primaryReturns,
            alignedSeries.benchmarkReturns,
            config.years,
            random,
            alignedSeries.blockYears
        );
        let primaryBalance = config.initial;
        let benchmarkBalance = benchmarkConfig.initial;
        primaryCheckpoints[0][simulation] = primaryBalance;
        benchmarkCheckpoints[0][simulation] = benchmarkBalance;

        for (let week = 0; week < config.years * WEEKS_PER_YEAR; week++) {
            const yearIndex = Math.floor(week / WEEKS_PER_YEAR);
            const contribution = plan.amounts[week];
            if (config.timing === "begin") {
                primaryBalance += contribution;
                benchmarkBalance += contribution;
            }

            const primaryAnnualFactor = Math.max(Number.EPSILON, (1 + sampled.primary[yearIndex]) * (1 - config.annualFee));
            const benchmarkAnnualFactor = Math.max(Number.EPSILON, (1 + sampled.benchmark[yearIndex]) * (1 - benchmarkConfig.annualFee));
            primaryBalance *= Math.pow(primaryAnnualFactor, 1 / WEEKS_PER_YEAR);
            benchmarkBalance *= Math.pow(benchmarkAnnualFactor, 1 / WEEKS_PER_YEAR);

            if (config.timing === "end") {
                primaryBalance += contribution;
                benchmarkBalance += contribution;
            }
            if ((week + 1) % WEEKS_PER_YEAR === 0) {
                const checkpointYear = (week + 1) / WEEKS_PER_YEAR;
                const primarySnapshot = convertSnapshot(primaryBalance, checkpointYear, plan, config);
                const benchmarkSnapshot = convertSnapshot(benchmarkBalance, checkpointYear, plan, benchmarkConfig);
                primaryCheckpoints[checkpointYear][simulation] = primarySnapshot.netDisplay;
                benchmarkCheckpoints[checkpointYear][simulation] = benchmarkSnapshot.netDisplay;
                if (checkpointYear === config.years) {
                    primaryTaxes[simulation] = primarySnapshot.taxDisplay;
                    benchmarkTaxes[simulation] = benchmarkSnapshot.taxDisplay;
                }
            }
        }
    }

    const primary = summarizeProbabilistic(primaryCheckpoints, primaryTaxes, plan.totalDisplay);
    const benchmark = summarizeProbabilistic(benchmarkCheckpoints, benchmarkTaxes, plan.totalDisplay);
    primary.historicalLabel = alignedSeries.label;
    benchmark.historicalLabel = alignedSeries.label;
    primary.historicalPeriod = `${alignedSeries.start}–${alignedSeries.end}`;
    benchmark.historicalPeriod = `${alignedSeries.start}–${alignedSeries.end}`;
    primary.alignedHistoricalComparison = true;
    benchmark.alignedHistoricalComparison = true;
    primary.historicalPeriodsPerYear = 1;
    benchmark.historicalPeriodsPerYear = 1;
    const comparison = summarizeOutperformance(
        primaryCheckpoints[config.years],
        benchmarkCheckpoints[config.years],
        alignedSeries.annualCorrelation,
        "joint-aligned-bootstrap"
    );
    primary.comparison = comparison;
    benchmark.comparison = comparison;
    return { primary, benchmark, comparison };
}

function simulateJointComparison(config, benchmarkConfig) {
    const plan = createContributionPlan({
        initial: config.initial,
        periodicContribution: config.periodicContribution,
        years: config.years,
        frequency: config.frequency,
        timing: config.timing,
        inflationRate: config.inflationRate,
        indexContributions: config.indexContributions,
        showReal: config.showReal
    });
    if (config.strategy !== "nasdaq") {
        throw new Error("La comparación probabilística conjunta está calibrada específicamente para Nasdaq-100 frente a S&P 500.");
    }
    let joint;
    if (config.model === "monte-carlo") {
        joint = simulateJointParametric(config, benchmarkConfig, plan, ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.monteCarloCorrelation);
    } else if (config.model === "bootstrap") {
        joint = simulateJointBootstrap(config, benchmarkConfig, plan, ALIGNED_HISTORICAL_RETURNS.nasdaqSp500);
    } else {
        throw new Error("La comparación conjunta solo aplica a los modelos probabilísticos.");
    }
    return { result: joint.primary, benchmarkResult: joint.benchmark, comparison: joint.comparison, plan };
}

function simulateDeterministicPath(config, plan, annualReturn) {
    const data = new Array(config.years + 1).fill(0);
    const taxes = new Array(config.years + 1).fill(0);
    let balance = config.initial;
    data[0] = balance;

    const annualFactor = (1 + annualReturn) * (1 - config.annualFee);
    if (!(annualFactor > 0)) throw new Error("Uno de los escenarios produce un factor anual no válido.");
    const weeklyFactor = Math.pow(annualFactor, 1 / WEEKS_PER_YEAR);

    for (let week = 0; week < config.years * WEEKS_PER_YEAR; week++) {
        const contribution = plan.amounts[week];
        if (config.timing === "begin") balance += contribution;
        balance *= weeklyFactor;
        if (config.timing === "end") balance += contribution;

        if ((week + 1) % WEEKS_PER_YEAR === 0) {
            const year = (week + 1) / WEEKS_PER_YEAR;
            const snapshot = convertSnapshot(balance, year, plan, config);
            data[year] = snapshot.netDisplay;
            taxes[year] = snapshot.taxDisplay;
        }
    }

    return { data, taxes };
}

function simulateSensitivity(config, plan, rates) {
    const low = simulateDeterministicPath(config, plan, rates.low);
    const central = simulateDeterministicPath(config, plan, rates.central);
    const high = simulateDeterministicPath(config, plan, rates.high);

    return {
        type: "sensitivity",
        low: low.data,
        central: central.data,
        high: high.data,
        finalValue: central.data[central.data.length - 1],
        finalLow: low.data[low.data.length - 1],
        finalHigh: high.data[high.data.length - 1],
        medianTax: central.taxes[central.taxes.length - 1],
        probabilityBelowContributions: null
    };
}

function historicalStatistics(returns, periodsPerYear = MONTHS_PER_YEAR) {
    if (!returns || returns.length < 2 || !(periodsPerYear > 0)) return null;
    const arithmeticPeriod = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variancePeriod = returns.reduce((sum, value) => sum + (value - arithmeticPeriod) ** 2, 0) / (returns.length - 1);
    const cumulative = returns.reduce((factor, value) => factor * (1 + value), 1);
    return {
        annualizedArithmetic: arithmeticPeriod * periodsPerYear,
        annualizedVolatility: Math.sqrt(variancePeriod * periodsPerYear),
        cagr: Math.pow(cumulative, periodsPerYear / returns.length) - 1
    };
}

function buildSimulationConfig(raw) {
    const preset = PRESETS[raw.strategy] || PRESETS.sp500;
    const medianCagr = raw.strategy === "custom" ? raw.customRate / 100 : preset.medianCagr;
    const volatility = raw.strategy === "custom" ? raw.customVolatility / 100 : preset.volatility;

    return {
        initial: raw.initial,
        periodicContribution: raw.periodicContribution,
        years: raw.years,
        frequency: raw.frequency,
        timing: raw.timing,
        strategy: raw.strategy,
        model: raw.model,
        medianCagr,
        volatility,
        annualFee: raw.annualFee / 100,
        showReal: raw.showReal,
        inflationRate: raw.inflationRate / 100,
        indexContributions: raw.indexContributions,
        tax: {
            enabled: raw.taxEnabled,
            model: raw.taxModel,
            customRate: raw.customTaxRate / 100
        },
        seed: raw.seed >>> 0,
        iterations: ITERATIONS,
        sensitivity: {
            low: raw.sensitivityLow / 100,
            central: raw.sensitivityCentral / 100,
            high: raw.sensitivityHigh / 100
        },
        compare: raw.compare,
        forecastHorizonYears: preset.forecastHorizonYears
    };
}

function validateConfig(config, currency) {
    const errors = [];
    if (!Number.isFinite(config.initial) || config.initial < 0) errors.push("La inversión inicial no puede ser negativa.");
    if (!Number.isFinite(config.periodicContribution) || config.periodicContribution < 0) errors.push("La aportación no puede ser negativa.");
    if (!Number.isInteger(config.years) || config.years < 1 || config.years > 50) errors.push("El horizonte debe estar entre 1 y 50 años.");
    if (![1, 12, 26, 52].includes(config.frequency)) errors.push("La frecuencia de aportación no es válida.");
    if (config.medianCagr <= -1 || config.medianCagr > 3) errors.push("El CAGR geométrico mediano debe ser superior a -100% y razonable para el modelo.");
    if (config.volatility < 0 || config.volatility > 2) errors.push("La volatilidad no es válida.");
    if (config.annualFee < 0 || config.annualFee >= 1) errors.push("El coste anual debe estar entre 0% y menos de 100%.");
    if (config.inflationRate < 0 || config.inflationRate > 1) errors.push("La inflación debe estar entre 0% y 100%.");
    if (config.seed < 1) errors.push("La semilla debe ser un entero positivo.");
    if (config.model === "bootstrap" && !PRESETS[config.strategy].historicalKey) {
        errors.push("La estrategia seleccionada no tiene una serie histórica compatible para bootstrap.");
    }
    if (config.model === "sensitivity") {
        const { low, central, high } = config.sensitivity;
        if (!(low <= central && central <= high)) errors.push("Los escenarios deben ordenarse: bajo ≤ central ≤ alto.");
        if (low <= -1 || central <= -1 || high <= -1) errors.push("Ningún escenario puede ser igual o inferior a -100%.");
    }
    if (config.tax.enabled && config.tax.model === "spain" && currency !== "EUR") {
        errors.push("La escala fiscal española está expresada en euros. Selecciona EUR o usa un tipo efectivo personalizado.");
    }
    return errors;
}

function buildModelWarnings(config) {
    const warnings = [];
    if (config.strategy === "custom" && config.medianCagr > 0.12) {
        warnings.push("El CAGR geométrico mediano personalizado supera el 12% anual: trátalo como una hipótesis extrema, no como escenario central objetivo.");
    }
    if (config.model === "monte-carlo" && config.medianCagr > 0.03 && config.volatility < 0.05) {
        warnings.push("Un CAGR mediano elevado con volatilidad inferior al 5% suele ser incoherente para renta variable.");
    }
    if (config.model === "bootstrap" && config.strategy === "nasdaq") {
        warnings.push("El historial Nasdaq disponible cubre solo julio de 2016–junio de 2026 y está muy condicionado por un ciclo tecnológico favorable.");
    }
    if (config.annualFee > 0.03) {
        warnings.push("Un coste anual superior al 3% erosiona fuertemente el resultado y es inusual para un índice líquido.");
    }
    if (config.indexContributions && !config.showReal) {
        warnings.push("Las aportaciones aumentan con la inflación, pero estás mostrando valores nominales; el total aportado crecerá cada año.");
    }
    if (config.model === "monte-carlo" && config.forecastHorizonYears && config.years > config.forecastHorizonYears) {
        warnings.push(`La fuente prospectiva cubre ${config.forecastHorizonYears} años. Mantener el mismo CAGR mediano hasta ${config.years} años es una extrapolación ilustrativa, no una previsión publicada para todo el horizonte.`);
    }
    if (config.compare && config.strategy === "nasdaq" && config.model === "monte-carlo") {
        warnings.push(`Nasdaq-100 y S&P 500 se simulan conjuntamente con correlación ${ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.monteCarloCorrelation.toFixed(2).replace(".", ",")} de retornos diarios publicada por Nasdaq para ${ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.monteCarloCorrelationPeriod}.`);
    }
    if (config.compare && config.strategy === "nasdaq" && config.model === "bootstrap") {
        warnings.push(`La comparación histórica usa años naturales Total Return alineados ${ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.start}–${ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.end} y los mismos bloques consecutivos de ${ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.blockYears} años para ambos índices.`);
    }
    if (config.compare && config.strategy !== "nasdaq" && config.strategy !== "sp500" && config.model !== "sensitivity") {
        warnings.push("La comparación probabilística conjunta y correlacionada solo está calibrada para Nasdaq-100 frente a S&P 500; esta estrategia se compara mediante simulaciones separadas.");
    }
    return warnings;
}

function simulate(config) {
    const plan = createContributionPlan({
        initial: config.initial,
        periodicContribution: config.periodicContribution,
        years: config.years,
        frequency: config.frequency,
        timing: config.timing,
        inflationRate: config.inflationRate,
        indexContributions: config.indexContributions,
        showReal: config.showReal
    });

    let result;
    if (config.model === "monte-carlo") {
        result = simulateParametric(config, plan);
    } else if (config.model === "bootstrap") {
        const key = PRESETS[config.strategy].historicalKey;
        result = simulateBootstrap(config, plan, HISTORICAL_RETURNS[key]);
    } else {
        result = simulateSensitivity(config, plan, config.sensitivity);
    }

    return { result, plan };
}

function initApplication() {
    const $ = (id) => document.getElementById(id);
    const inputs = {
        currency: $("currency-selector"),
        theme: $("theme-selector"),
        strategy: $("strategy"),
        customRate: $("custom-rate"),
        customVolatility: $("custom-volatility"),
        initial: $("initial-investment"),
        periodicContribution: $("periodic-contribution"),
        frequency: $("contribution-frequency"),
        timing: $("contribution-timing"),
        years: $("years"),
        annualFee: $("annual-fee"),
        seed: $("simulation-seed"),
        showReal: $("inflation-toggle"),
        inflationRate: $("inflation-rate"),
        contributionGrowth: $("contribution-growth"),
        taxEnabled: $("tax-toggle"),
        taxModel: $("tax-model"),
        customTaxRate: $("custom-tax-rate"),
        compare: $("compare-toggle"),
        sensitivityLow: $("sensitivity-low"),
        sensitivityCentral: $("sensitivity-central"),
        sensitivityHigh: $("sensitivity-high")
    };

    const outputs = {
        strategyReturn: $("strategy-return-display"),
        strategyVol: $("strategy-vol-display"),
        strategyDescription: $("strategy-description"),
        strategySource: $("strategy-source"),
        modelDescription: $("model-description"),
        alert: $("simulation-alert"),
        yearsDisplay: $("years-display"),
        chartTitle: $("chart-title"),
        chartUnit: $("chart-unit-badge"),
        chartLoading: $("chart-loading"),
        chartExplanation: $("chart-explanation"),
        methodSummary: $("live-method-summary"),
        totalContributedLabel: $("total-contributed-label"),
        totalContributed: $("total-contributed"),
        totalContributedHelp: $("total-contributed-help"),
        finalValueLabel: $("final-value-label"),
        finalValue: $("final-value"),
        finalValueHelp: $("final-value-help"),
        rangeLabel: $("range-label"),
        probableRange: $("probable-range"),
        rangeHelp: $("range-help"),
        totalInterest: $("total-interest"),
        lossProbability: $("loss-probability"),
        lossProbabilityHelp: $("loss-probability-help"),
        estimatedTax: $("estimated-tax"),
        donutTitle: $("donut-title"),
        donutLegend: $("donut-legend"),
        interpretation: $("interpretation-text"),
        taxWarning: $("tax-warning")
    };

    const state = {
        currency: "EUR",
        theme: "cyberpunk",
        growthChart: null,
        donutChart: null,
        simulationTimeout: null,
        quizIndex: 0,
        quizAnswers: new Array(RISK_QUESTIONS.length).fill(null)
    };

    const chartContext = $("growthChart").getContext("2d");
    const donutContext = $("distributionChart").getContext("2d");

    function formatCurrency(value, compact = false) {
        const options = {
            style: "currency",
            currency: state.currency,
            maximumFractionDigits: 0
        };
        if (compact && Math.abs(value) >= 100_000) {
            options.notation = "compact";
            options.compactDisplay = "short";
        }
        return new Intl.NumberFormat("es-ES", options).format(Number.isFinite(value) ? value : 0);
    }

    function setAlert(message = "", type = "warning") {
        outputs.alert.textContent = message;
        outputs.alert.classList.toggle("hidden", !message);
        outputs.alert.classList.toggle("warning", type === "warning");
    }

    function setLoading(isLoading, model) {
        outputs.chartLoading.classList.toggle("hidden", !isLoading);
        const message = outputs.chartLoading.querySelector("strong");
        message.textContent = model === "sensitivity"
            ? "Calculando escenarios…"
            : "Calculando 10.000 trayectorias…";
        $("calculate-btn").disabled = isLoading;
    }

    function syncCustomDropdown(select) {
        const wrapper = select.closest(".custom-dropdown");
        if (!wrapper) return;
        const option = wrapper.querySelector(`.custom-option[data-value="${CSS.escape(select.value)}"]`);
        if (!option) return;
        wrapper.querySelector(".dropdown-text").textContent = option.textContent.trim();
        wrapper.querySelectorAll(".custom-option").forEach((item) => {
            const selected = item === option;
            item.classList.toggle("selected", selected);
            item.setAttribute("aria-selected", String(selected));
        });
    }

    function initCustomDropdowns() {
        document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
            const trigger = dropdown.querySelector(".custom-dropdown-selected");
            const select = dropdown.querySelector("select");
            trigger.addEventListener("click", (event) => {
                event.stopPropagation();
                document.querySelectorAll(".custom-dropdown.active").forEach((other) => {
                    if (other !== dropdown) other.classList.remove("active");
                });
                dropdown.classList.toggle("active");
                trigger.setAttribute("aria-expanded", String(dropdown.classList.contains("active")));
            });
            dropdown.querySelectorAll(".custom-option").forEach((option) => {
                option.addEventListener("click", () => {
                    select.value = option.dataset.value;
                    syncCustomDropdown(select);
                    dropdown.classList.remove("active");
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                });
            });
        });
        document.addEventListener("click", () => {
            document.querySelectorAll(".custom-dropdown.active").forEach((dropdown) => dropdown.classList.remove("active"));
        });
    }

    function updateCurrency() {
        state.currency = inputs.currency.value === "USD" ? "USD" : "EUR";
        document.querySelectorAll(".currency-prefix").forEach((element) => {
            element.textContent = state.currency === "EUR" ? "€" : "$";
        });
        updateTaxAvailability();
    }

    function updateTheme() {
        state.theme = inputs.theme.value === "oled" ? "oled" : "cyberpunk";
        document.documentElement.dataset.theme = state.theme;
    }

    function currentPreset() {
        return PRESETS[inputs.strategy.value] || PRESETS.sp500;
    }

    function updateStrategyUI({ resetSensitivity = false } = {}) {
        const strategy = inputs.strategy.value;
        const preset = currentPreset();
        document.querySelectorAll(".strategy-card").forEach((card) => {
            const selected = card.dataset.value === strategy;
            card.classList.toggle("selected", selected);
            card.setAttribute("aria-checked", String(selected));
        });

        $("custom-assumptions").classList.toggle("hidden", strategy !== "custom");
        const rate = strategy === "custom" ? safeNumber(inputs.customRate.value, 6) / 100 : preset.medianCagr;
        const volatility = strategy === "custom" ? safeNumber(inputs.customVolatility.value, 18) / 100 : preset.volatility;
        outputs.strategyReturn.textContent = formatPercent(rate, 1);
        outputs.strategyVol.textContent = formatPercent(volatility, volatility < 0.1 ? 1 : 2);
        outputs.strategyDescription.textContent = preset.description;
        outputs.strategySource.textContent = `${preset.source} ${preset.historicalNote}`;

        if (resetSensitivity) {
            inputs.sensitivityLow.value = String(preset.sensitivity.low * 100);
            inputs.sensitivityCentral.value = String(preset.sensitivity.central * 100);
            inputs.sensitivityHigh.value = String(preset.sensitivity.high * 100);
        }

        const bootstrapInput = document.querySelector('input[name="model"][value="bootstrap"]');
        const bootstrapLabel = bootstrapInput.closest(".model-option");
        const hasHistory = Boolean(preset.historicalKey);
        bootstrapInput.disabled = !hasHistory;
        bootstrapLabel.classList.toggle("disabled", !hasHistory);
        bootstrapLabel.title = hasHistory ? "" : preset.historicalNote;
        if (!hasHistory && bootstrapInput.checked) {
            document.querySelector('input[name="model"][value="monte-carlo"]').checked = true;
        }

        const compareRow = inputs.compare.closest(".toggle-row");
        const isBenchmark = strategy === "sp500";
        if (isBenchmark) inputs.compare.checked = false;
        inputs.compare.disabled = isBenchmark;
        compareRow.classList.toggle("disabled", isBenchmark);
        compareRow.title = isBenchmark ? "La estrategia seleccionada ya es el S&P 500." : "";

        updateModelUI();
    }

    function selectedModel() {
        return document.querySelector('input[name="model"]:checked')?.value || "monte-carlo";
    }

    function updateModelUI() {
        const model = selectedModel();
        document.querySelectorAll(".model-option").forEach((label) => {
            label.classList.toggle("selected", label.querySelector("input").checked);
        });
        $("sensitivity-inputs").classList.toggle("hidden", model !== "sensitivity");
        outputs.modelDescription.textContent = model === "bootstrap"
            ? `${MODEL_TEXT[model]} ${currentPreset().historicalNote}`
            : MODEL_TEXT[model];
    }

    function updateAdvancedUI() {
        $("inflation-options").classList.toggle("hidden", !inputs.showReal.checked);
        $("tax-options").classList.toggle("hidden", !inputs.taxEnabled.checked);
        $("custom-tax-rate-group").classList.toggle("hidden", inputs.taxModel.value !== "custom");
        updateTaxAvailability();
    }

    function updateTaxAvailability() {
        const incompatible = inputs.taxEnabled.checked && inputs.taxModel.value === "spain" && state.currency !== "EUR";
        outputs.taxWarning.classList.toggle("hidden", !incompatible);
        outputs.taxWarning.textContent = incompatible
            ? "Los tramos españoles están denominados en euros. Selecciona EUR o cambia a tipo efectivo personalizado."
            : "";
    }

    function updateContributionLabel() {
        const labels = { 1: "Aportación anual", 12: "Aportación mensual", 26: "Aportación quincenal", 52: "Aportación semanal" };
        $("contribution-label").textContent = labels[Number(inputs.frequency.value)] || "Aportación periódica";
    }

    function updateYearsUI() {
        const years = Number(inputs.years.value);
        outputs.yearsDisplay.textContent = `${years} ${years === 1 ? "año" : "años"}`;
        const minimum = Number(inputs.years.min);
        const maximum = Number(inputs.years.max);
        const progress = ((years - minimum) / (maximum - minimum)) * 100;
        inputs.years.style.setProperty("--range-progress", `${progress}%`);
    }

    function readRawConfig() {
        return {
            currency: state.currency,
            strategy: inputs.strategy.value,
            model: selectedModel(),
            initial: parseLocaleNumber(inputs.initial.value),
            periodicContribution: parseLocaleNumber(inputs.periodicContribution.value),
            frequency: Number(inputs.frequency.value),
            timing: inputs.timing.value,
            years: Number(inputs.years.value),
            customRate: safeNumber(inputs.customRate.value, 6),
            customVolatility: safeNumber(inputs.customVolatility.value, 18),
            annualFee: safeNumber(inputs.annualFee.value, 0.2),
            seed: Math.trunc(safeNumber(inputs.seed.value, 20260729)),
            showReal: inputs.showReal.checked,
            inflationRate: safeNumber(inputs.inflationRate.value, 2),
            indexContributions: inputs.contributionGrowth.value === "inflation",
            taxEnabled: inputs.taxEnabled.checked,
            taxModel: inputs.taxModel.value,
            customTaxRate: safeNumber(inputs.customTaxRate.value, 19),
            compare: inputs.compare.checked,
            sensitivityLow: safeNumber(inputs.sensitivityLow.value, 2),
            sensitivityCentral: safeNumber(inputs.sensitivityCentral.value, 5.2),
            sensitivityHigh: safeNumber(inputs.sensitivityHigh.value, 8)
        };
    }

    function normalizeMoneyInputs() {
        [inputs.initial, inputs.periodicContribution].forEach((input) => {
            input.value = formatEditableNumber(parseLocaleNumber(input.value), 2);
        });
    }

    function buildBenchmarkConfig(config) {
        const benchmark = {
            ...config,
            strategy: "sp500",
            medianCagr: PRESETS.sp500.medianCagr,
            volatility: PRESETS.sp500.volatility,
            forecastHorizonYears: PRESETS.sp500.forecastHorizonYears,
            seed: (config.seed ^ 0x9E3779B9) >>> 0,
            compare: false,
            sensitivity: { ...PRESETS.sp500.sensitivity }
        };
        return benchmark;
    }

    function renderGrowthChart(config, result, plan, benchmarkResult) {
        if (typeof Chart === "undefined") throw new Error("Chart.js no se ha cargado. Revisa la conexión o el CDN.");
        if (state.growthChart) state.growthChart.destroy();

        const labels = Array.from({ length: config.years + 1 }, (_, year) => `Año ${year}`);
        const datasets = [];
        const probabilistic = result.type === "probabilistic";

        if (probabilistic) {
            datasets.push({
                label: "P90",
                data: result.p90,
                borderColor: "#34d399",
                backgroundColor: "rgba(148, 163, 184, 0.12)",
                borderDash: [6, 6],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: "+2",
                tension: 0.25,
                order: 3
            });
            datasets.push({
                label: "Mediana P50",
                data: result.p50,
                borderColor: "#38bdf8",
                backgroundColor: "#38bdf8",
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.25,
                order: 1
            });
            datasets.push({
                label: "P10",
                data: result.p10,
                borderColor: "#fb7185",
                borderDash: [6, 6],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                tension: 0.25,
                order: 3
            });
        } else {
            datasets.push({
                label: "Escenario alto",
                data: result.high,
                borderColor: "#34d399",
                borderDash: [6, 6],
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25
            });
            datasets.push({
                label: "Escenario central",
                data: result.central,
                borderColor: "#38bdf8",
                backgroundColor: "#38bdf8",
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.25
            });
            datasets.push({
                label: "Escenario bajo",
                data: result.low,
                borderColor: "#fb7185",
                borderDash: [6, 6],
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25
            });
        }

        datasets.push({
            label: "Capital aportado",
            data: Array.from(plan.cumulativeDisplayByYear),
            borderColor: "rgba(255, 255, 255, 0.58)",
            borderDash: [3, 5],
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0,
            order: 5
        });

        if (benchmarkResult) {
            datasets.push({
                label: benchmarkResult.comparison ? "S&P 500 P50 · comparación conjunta" : "S&P 500 P50 · simulación separada",
                data: benchmarkResult.type === "probabilistic" ? benchmarkResult.p50 : benchmarkResult.central,
                borderColor: "#fbbf24",
                borderDash: [10, 5],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.25,
                order: 0
            });
        }

        state.growthChart = new Chart(chartContext, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                animation: { duration: 350 },
                plugins: {
                    legend: {
                        labels: {
                            color: "#e5e7eb",
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 18
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: "#94a3b8", maxTicksLimit: 11 },
                        grid: { color: "rgba(148, 163, 184, 0.08)" }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#94a3b8",
                            callback(value) { return formatCurrency(value, true); }
                        },
                        grid: { color: "rgba(148, 163, 184, 0.10)" }
                    }
                }
            }
        });
    }

    function renderDonut(result, plan) {
        if (state.donutChart) state.donutChart.destroy();
        const finalValue = result.finalValue;
        const tax = Math.max(0, result.medianTax);
        const contributed = plan.totalDisplay;
        const gain = finalValue - contributed;
        let labels;
        let values;

        if (gain >= 0) {
            labels = ["Capital aportado", "Ganancia neta", "Impuestos estimados"];
            values = [contributed, gain, tax];
            outputs.donutTitle.textContent = tax > 0
                ? "Valor bruto: aportaciones, ganancia neta e impuestos"
                : "Aportaciones y ganancia neta";
        } else {
            labels = ["Valor final neto", "Pérdida frente a lo aportado", "Impuestos estimados"];
            values = [Math.max(0, finalValue), Math.abs(gain), tax];
            outputs.donutTitle.textContent = "Valor final y pérdida estimada";
        }

        state.donutChart = new Chart(donutContext, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: ["#38bdf8", gain >= 0 ? "#34d399" : "#fb7185", "#fbbf24"],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(context) { return `${context.label}: ${formatCurrency(context.parsed)}`; }
                        }
                    }
                }
            }
        });

        outputs.donutLegend.innerHTML = labels.map((label, index) => `
            <div class="donut-legend-item">
                <span class="donut-legend-dot donut-legend-dot-${index}"></span>
                <span>${label}</span>
                <strong>${formatCurrency(values[index])}</strong>
            </div>
        `).join("");
    }

    function renderSummary(config, result, plan) {
        const probabilistic = result.type === "probabilistic";
        outputs.totalContributedLabel.textContent = config.showReal ? "Total aportado · poder adquisitivo actual" : "Total aportado";
        outputs.totalContributed.textContent = formatCurrency(plan.totalDisplay);
        outputs.totalContributedHelp.textContent = config.showReal
            ? "Valor actual del capital inicial y de cada aportación"
            : `${plan.contributionCount} aportaciones más el capital inicial`;

        outputs.finalValueLabel.textContent = probabilistic ? "Mediana final · P50" : "Escenario central final";
        outputs.finalValue.textContent = formatCurrency(result.finalValue);
        outputs.finalValueHelp.textContent = probabilistic
            ? "50% de resultados por encima y 50% por debajo"
            : "CAGR central constante, sin probabilidad asociada";

        outputs.rangeLabel.textContent = probabilistic ? "Intervalo P10–P90" : "Escenario bajo–alto";
        outputs.probableRange.textContent = `${formatCurrency(result.finalLow)} – ${formatCurrency(result.finalHigh)}`;
        outputs.rangeHelp.textContent = probabilistic
            ? "Contiene el 80% de los resultados generados por el modelo"
            : "Análisis de sensibilidad; no es un intervalo probabilístico";

        outputs.totalInterest.textContent = formatCurrency(result.finalValue - plan.totalDisplay);
        outputs.totalInterest.classList.toggle("negative-value", result.finalValue < plan.totalDisplay);

        outputs.lossProbability.textContent = probabilistic
            ? formatPercent(result.probabilityBelowContributions, 1)
            : "No aplica";
        outputs.lossProbabilityHelp.textContent = probabilistic
            ? "Resultado final neto inferior al capital aportado"
            : "Los tres escenarios no constituyen una distribución";

        outputs.estimatedTax.textContent = config.tax.enabled ? formatCurrency(result.medianTax) : "No incluidos";
        $("tax-card").classList.toggle("muted-card", !config.tax.enabled);
    }

    function renderMethodSummary(config, plan, result) {
        const preset = PRESETS[config.strategy];
        const frequencyText = { 1: "Anual", 12: "Mensual", 26: "Quincenal", 52: "Semanal" }[config.frequency];
        const modelText = {
            "monte-carlo": "Monte Carlo prospectivo",
            bootstrap: "Bootstrap histórico por bloques",
            sensitivity: "Análisis de sensibilidad"
        }[config.model];
        const taxText = !config.tax.enabled
            ? "No incluidos"
            : config.tax.model === "spain"
                ? "España · venta total final"
                : `Tipo efectivo ${formatPercent(config.tax.customRate, 1)}`;

        const entries = [
            ["Estrategia", preset.name],
            ["Modelo", modelText],
            ["Horizonte", `${config.years} ${config.years === 1 ? "año" : "años"}`],
            ["Aportaciones", `${frequencyText} · ${config.timing === "begin" ? "inicio" : "final"}`],
            ["CAGR mediano", config.model === "sensitivity" ? `${formatPercent(config.sensitivity.low, 1)} / ${formatPercent(config.sensitivity.central, 1)} / ${formatPercent(config.sensitivity.high, 1)}` : formatPercent(config.medianCagr, 1)],
            ["Volatilidad", config.model === "monte-carlo" ? formatPercent(config.volatility, 2) : "No parametrizada"],
            ["Coste anual", formatPercent(config.annualFee, 2)],
            ["Inflación", config.showReal ? `${formatPercent(config.inflationRate, 1)} · poder adquisitivo actual` : "Valores nominales"],
            ["Impuestos", taxText],
            ["Capital aportado", formatCurrency(plan.totalDisplay)],
            ["Semilla", config.model === "sensitivity" ? "No utilizada" : String(config.seed)],
            ["Versión", MODEL_VERSION]
        ];
        if (config.model === "monte-carlo" && config.forecastHorizonYears && config.years > config.forecastHorizonYears) {
            entries.splice(3, 0, ["Extrapolación", `Fuente ${config.forecastHorizonYears} años · extendida a ${config.years}`]);
        }
        if (result.comparison) {
            entries.splice(3, 0,
                ["Comparación", result.comparison.mode === "joint-aligned-bootstrap" ? "Bootstrap conjunto alineado" : "Monte Carlo conjunto correlacionado"],
                ["Correlación", result.comparison.correlation.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
                ["Prob. superar S&P", formatPercent(result.comparison.probabilityPrimaryOutperforms, 1)],
                ["Diferencia P50", formatCurrency(result.comparison.differenceP50)]
            );
        }

        if (result.historicalPeriod) {
            const aligned = result.alignedHistoricalComparison;
            const returns = aligned
                ? ALIGNED_HISTORICAL_RETURNS.nasdaqSp500.primaryReturns
                : HISTORICAL_RETURNS[PRESETS[config.strategy].historicalKey].returns;
            const periodsPerYear = aligned ? 1 : MONTHS_PER_YEAR;
            const stats = historicalStatistics(returns, periodsPerYear);
            entries.splice(3, 0,
                ["Historial", result.historicalPeriod],
                ["CAGR del tramo", formatPercent(stats.cagr, 2)],
                [aligned ? "Volatilidad anual del tramo" : "Volatilidad mensual anualizada", formatPercent(stats.annualizedVolatility, 2)]
            );
        }

        outputs.methodSummary.innerHTML = entries.map(([label, value]) => `
            <div><span>${label}</span><strong>${value}</strong></div>
        `).join("");
    }

    function updateNarrative(config, result) {
        const modelTitles = {
            "monte-carlo": "Monte Carlo prospectivo",
            bootstrap: "Bootstrap histórico por bloques",
            sensitivity: "Análisis de sensibilidad"
        };
        outputs.chartTitle.textContent = modelTitles[config.model];
        outputs.chartUnit.textContent = config.showReal ? "Poder adquisitivo actual" : "Valores nominales";

        if (result.type === "probabilistic") {
            outputs.chartExplanation.innerHTML = `
                <strong>Lectura:</strong> P10, P50 y P90 son percentiles de las ${ITERATIONS.toLocaleString("es-ES")} trayectorias.
                P10 no es el peor caso y P90 no es el mejor; queda un 10% de resultados por debajo y otro 10% por encima.
            `;
            const comparisonText = result.comparison
                ? ` En esta ejecución conjunta, la estrategia supera al S&P 500 en ${formatPercent(result.comparison.probabilityPrimaryOutperforms, 1)} de las trayectorias; la correlación utilizada es ${result.comparison.correlation.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
                : "";
            outputs.interpretation.textContent = (config.model === "bootstrap"
                ? "El bootstrap conserva bloques históricos reales, pero una crisis futura puede no parecerse a ninguna del historial y el periodo disponible condiciona mucho el resultado."
                : "El Monte Carlo centra P50 en el CAGR geométrico mediano y usa la volatilidad para ampliar la dispersión. No reproduce por completo colas extremas, cambios de régimen ni volatilidad agrupada.") + comparisonText;
        } else {
            outputs.chartExplanation.innerHTML = `
                <strong>Lectura:</strong> las tres líneas capitalizan CAGR constantes. Sirven para sensibilidad, no para afirmar que exista una probabilidad concreta de alcanzar cada resultado.
            `;
            outputs.interpretation.textContent = "Cambiar unas décimas de CAGR durante décadas altera mucho el resultado. Los escenarios son hipótesis y no sustituyen una distribución de rendimientos.";
        }
    }

    function updateURL(raw) {
        const parameters = new URLSearchParams({
            initial: String(raw.initial),
            contribution: String(raw.periodicContribution),
            years: String(raw.years),
            frequency: String(raw.frequency),
            timing: raw.timing,
            strategy: raw.strategy,
            model: raw.model,
            currency: state.currency,
            theme: state.theme,
            fee: String(raw.annualFee),
            seed: String(raw.seed),
            real: String(raw.showReal),
            inflation: String(raw.inflationRate),
            contributionGrowth: raw.indexContributions ? "inflation" : "fixed",
            tax: String(raw.taxEnabled),
            taxModel: raw.taxModel,
            compare: String(raw.compare)
        });
        history.replaceState({}, "", `${location.pathname}?${parameters.toString()}${location.hash}`);
    }

    function loadURLState() {
        const p = new URLSearchParams(location.search);
        const set = (key, input) => { if (p.has(key)) input.value = p.get(key); };
        set("initial", inputs.initial);
        set("contribution", inputs.periodicContribution);
        set("years", inputs.years);
        set("frequency", inputs.frequency);
        set("timing", inputs.timing);
        set("strategy", inputs.strategy);
        set("currency", inputs.currency);
        set("theme", inputs.theme);
        set("fee", inputs.annualFee);
        set("seed", inputs.seed);
        set("inflation", inputs.inflationRate);
        set("contributionGrowth", inputs.contributionGrowth);
        set("taxModel", inputs.taxModel);
        if (p.has("real")) inputs.showReal.checked = p.get("real") === "true";
        if (p.has("tax")) inputs.taxEnabled.checked = p.get("tax") === "true";
        if (p.has("compare")) inputs.compare.checked = p.get("compare") === "true";
        if (p.has("model")) {
            const model = document.querySelector(`input[name="model"][value="${CSS.escape(p.get("model"))}"]`);
            if (model) model.checked = true;
        }
        normalizeMoneyInputs();
        syncCustomDropdown(inputs.currency);
        syncCustomDropdown(inputs.theme);
    }

    function executeSimulation({ immediate = false } = {}) {
        window.clearTimeout(state.simulationTimeout);
        const run = () => {
            setAlert();
            normalizeMoneyInputs();
            const raw = readRawConfig();
            const config = buildSimulationConfig(raw);
            const errors = validateConfig(config, state.currency);
            if (errors.length) {
                setLoading(false, config.model);
                setAlert(errors.join(" "));
                return;
            }
            const warnings = buildModelWarnings(config);
            if (warnings.length) setAlert(warnings.join(" "));

            setLoading(true, config.model);
            window.setTimeout(() => {
                try {
                    let result;
                    let plan;
                    let benchmarkResult = null;
                    const jointNasdaqComparison = config.compare && config.strategy === "nasdaq" && ["monte-carlo", "bootstrap"].includes(config.model);
                    if (jointNasdaqComparison) {
                        const benchmarkConfig = buildBenchmarkConfig(config);
                        const joint = simulateJointComparison(config, benchmarkConfig);
                        result = joint.result;
                        plan = joint.plan;
                        benchmarkResult = joint.benchmarkResult;
                    } else {
                        ({ result, plan } = simulate(config));
                        if (config.compare && config.strategy !== "sp500") {
                            const benchmarkConfig = buildBenchmarkConfig(config);
                            benchmarkResult = simulate(benchmarkConfig).result;
                        }
                    }
                    renderGrowthChart(config, result, plan, benchmarkResult);
                    renderSummary(config, result, plan);
                    renderDonut(result, plan);
                    renderMethodSummary(config, plan, result);
                    updateNarrative(config, result);
                    updateURL(raw);
                } catch (error) {
                    console.error(error);
                    setAlert(error instanceof Error ? error.message : "No se pudo completar la simulación.");
                } finally {
                    setLoading(false, config.model);
                }
            }, 20);
        };

        if (immediate) run();
        else state.simulationTimeout = window.setTimeout(run, 280);
    }

    function renderRiskQuestion() {
        const question = RISK_QUESTIONS[state.quizIndex];
        const progress = ((state.quizIndex + 1) / RISK_QUESTIONS.length) * 100;
        $("quiz-progress-text").textContent = `Pregunta ${state.quizIndex + 1} de ${RISK_QUESTIONS.length}`;
        $("quiz-progress-percent").textContent = `${Math.round(progress)}%`;
        $("quiz-progress-bar").style.width = `${progress}%`;
        $("quiz-question").textContent = question.question;
        $("quiz-help").textContent = question.help;
        $("quiz-back").disabled = state.quizIndex === 0;

        const selectedIndex = state.quizAnswers[state.quizIndex]?.optionIndex;
        $("quiz-options").innerHTML = question.options.map(([text], index) => `
            <button class="quiz-option${selectedIndex === index ? " selected" : ""}" type="button" data-option-index="${index}">
                <span class="quiz-option-index">${String.fromCharCode(65 + index)}</span>
                <span>${text}</span>
            </button>
        `).join("");

        $("quiz-options").querySelectorAll(".quiz-option").forEach((button) => {
            button.addEventListener("click", () => {
                const optionIndex = Number(button.dataset.optionIndex);
                const [text, score] = question.options[optionIndex];
                state.quizAnswers[state.quizIndex] = { dimension: question.dimension, score, text, optionIndex };
                if (state.quizIndex < RISK_QUESTIONS.length - 1) {
                    state.quizIndex++;
                    renderRiskQuestion();
                } else {
                    renderRiskResult();
                }
            });
        });
    }

    function riskLevel(score) {
        if (score < 35) return "Baja";
        if (score < 65) return "Media";
        return "Alta";
    }

    function renderRiskResult() {
        const dimensions = { tolerance: [], capacity: [], knowledge: [] };
        state.quizAnswers.forEach((answer) => dimensions[answer.dimension].push(answer.score));
        const normalized = {};
        Object.entries(dimensions).forEach(([dimension, scores]) => {
            const maximum = scores.length * 4;
            normalized[dimension] = maximum > 0
                ? scores.reduce((sum, value) => sum + value, 0) / maximum * 100
                : 0;
        });

        const average = (normalized.tolerance + normalized.capacity + normalized.knowledge) / 3;
        let type;
        let description;
        if (normalized.capacity < 35 || normalized.tolerance < 30) {
            type = "Cauteloso";
            description = "La prioridad debería ser liquidez, estabilidad y evitar asumir un riesgo que tu situación o tu reacción ante caídas no permiten sostener. Una cartera 100% acciones puede no ser coherente con estas respuestas.";
        } else if (Math.min(normalized.capacity, normalized.tolerance) < 55 || average < 55) {
            type = "Equilibrado";
            description = "Podrías tolerar una combinación diversificada de activos, siempre que mantengas un colchón suficiente y no necesites el capital a corto plazo. La concentración tecnológica exige una capacidad mayor.";
        } else if (average < 75) {
            type = "Crecimiento";
            description = "Tu horizonte y respuestas permiten considerar una exposición elevada a renta variable, pero las pérdidas temporales pueden ser profundas. Diversificación y disciplina siguen siendo esenciales.";
        } else {
            type = "Agresivo";
            description = "Declaras alta tolerancia y capacidad, aunque eso no convierte una cartera concentrada en adecuada automáticamente. Debes comprobar patrimonio total, objetivos, experiencia y consecuencias de una pérdida severa.";
        }

        $("risk-type").textContent = type;
        $("risk-description").textContent = description;
        $("risk-tolerance").textContent = `${riskLevel(normalized.tolerance)} · ${Math.round(normalized.tolerance)}/100`;
        $("risk-capacity").textContent = `${riskLevel(normalized.capacity)} · ${Math.round(normalized.capacity)}/100`;
        $("risk-knowledge").textContent = `${riskLevel(normalized.knowledge)} · ${Math.round(normalized.knowledge)}/100`;
        $("quiz-question-view").classList.add("hidden");
        $("risk-result").classList.remove("hidden");
    }

    function resetRiskQuiz() {
        state.quizIndex = 0;
        state.quizAnswers.fill(null);
        $("risk-result").classList.add("hidden");
        $("quiz-question-view").classList.remove("hidden");
        renderRiskQuestion();
    }

    initCustomDropdowns();
    loadURLState();
    updateCurrency();
    updateTheme();
    updateContributionLabel();
    updateYearsUI();
    updateAdvancedUI();
    updateStrategyUI();
    renderRiskQuestion();

    document.querySelectorAll(".strategy-card").forEach((card) => {
        card.addEventListener("click", () => {
            inputs.strategy.value = card.dataset.value;
            updateStrategyUI({ resetSensitivity: true });
            executeSimulation();
        });
    });

    document.querySelectorAll('input[name="model"]').forEach((input) => {
        input.addEventListener("change", () => {
            updateModelUI();
            executeSimulation();
        });
    });

    inputs.customRate.addEventListener("input", () => {
        updateStrategyUI();
        if (inputs.strategy.value === "custom") {
            inputs.sensitivityCentral.value = inputs.customRate.value;
        }
        executeSimulation();
    });
    inputs.customVolatility.addEventListener("input", () => {
        updateStrategyUI();
        executeSimulation();
    });
    inputs.currency.addEventListener("change", () => {
        updateCurrency();
        executeSimulation();
    });
    inputs.theme.addEventListener("change", updateTheme);
    inputs.frequency.addEventListener("change", () => {
        updateContributionLabel();
        executeSimulation();
    });
    inputs.years.addEventListener("input", () => {
        updateYearsUI();
        executeSimulation();
    });
    inputs.showReal.addEventListener("change", () => {
        updateAdvancedUI();
        executeSimulation();
    });
    inputs.taxEnabled.addEventListener("change", () => {
        updateAdvancedUI();
        executeSimulation();
    });
    inputs.taxModel.addEventListener("change", () => {
        updateAdvancedUI();
        executeSimulation();
    });
    inputs.compare.addEventListener("change", () => executeSimulation());
    inputs.contributionGrowth.addEventListener("change", () => executeSimulation());
    inputs.timing.addEventListener("change", () => executeSimulation());

    [
        inputs.initial,
        inputs.periodicContribution,
        inputs.annualFee,
        inputs.seed,
        inputs.inflationRate,
        inputs.customTaxRate,
        inputs.sensitivityLow,
        inputs.sensitivityCentral,
        inputs.sensitivityHigh
    ].forEach((input) => {
        input.addEventListener("input", () => executeSimulation());
    });

    [inputs.initial, inputs.periodicContribution].forEach((input) => {
        input.addEventListener("focus", () => {
            input.value = String(parseLocaleNumber(input.value));
            input.select();
        });
        input.addEventListener("blur", () => {
            input.value = formatEditableNumber(parseLocaleNumber(input.value), 2);
        });
    });

    $("randomize-seed").addEventListener("click", () => {
        const seed = crypto?.getRandomValues
            ? crypto.getRandomValues(new Uint32Array(1))[0] || 1
            : Math.floor(Math.random() * 4_294_967_294) + 1;
        inputs.seed.value = String(seed);
        executeSimulation({ immediate: true });
    });
    $("calculate-btn").addEventListener("click", () => executeSimulation({ immediate: true }));
    $("quiz-back").addEventListener("click", () => {
        if (state.quizIndex > 0) {
            state.quizIndex--;
            renderRiskQuestion();
        }
    });
    $("quiz-reset").addEventListener("click", resetRiskQuiz);
    $("quiz-restart-result").addEventListener("click", resetRiskQuiz);

    executeSimulation({ immediate: true });
}

const exportedCore = {
    PRESETS,
    HISTORICAL_RETURNS,
    ALIGNED_HISTORICAL_RETURNS,
    calculateSpanishSavingsTax,
    createContributionPlan,
    createNormalGenerator,
    historicalStatistics,
    mulberry32,
    parseLocaleNumber,
    percentile,
    pearsonCorrelation,
    simulate,
    simulateBootstrap,
    simulateJointBootstrap,
    simulateJointComparison,
    simulateJointParametric,
    simulateParametric,
    simulateSensitivity,
    buildSimulationConfig,
    buildModelWarnings,
    validateConfig
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = exportedCore;
}

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initApplication);
}

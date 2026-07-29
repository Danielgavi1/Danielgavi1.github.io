# FutureWealth — CAGR mediano y comparación correlacionada

Versión revisada del simulador educativo de inversión. Separa claramente:

1. **Monte Carlo prospectivo**: 10.000 trayectorias semanales mediante movimiento browniano geométrico.
2. **Bootstrap histórico**: bloques históricos reales; cuando se comparan Nasdaq-100 y S&P 500 se usan años Total Return alineados.
3. **Análisis de sensibilidad**: tres CAGR constantes sin atribuirles probabilidades.

## Cambios principales

- Los presets se interpretan como **CAGR geométrico mediano**.
- La volatilidad es independiente: ensancha P10–P90, pero no vuelve a reducir P50.
- Nasdaq-100 y S&P 500 se simulan conjuntamente con choques correlacionados.
- La correlación paramétrica utilizada es 0,93, publicada por Nasdaq para retornos diarios entre 31/12/2007 y 30/06/2026.
- La comparación por bootstrap usa retornos Total Return anuales alineados de 2008 a 2025 y los mismos bloques consecutivos de dos años.
- La aplicación calcula la probabilidad de que Nasdaq termine por encima del S&P 500 y la distribución de la diferencia final.
- Las previsiones institucionales de 10 años generan una advertencia cuando se extrapolan a horizontes superiores.
- Rentabilidad y volatilidad siguen siendo editables por separado en la estrategia personalizada.

## Parámetros prospectivos predeterminados

| Estrategia | CAGR geométrico mediano | Volatilidad | Interpretación |
|---|---:|---:|---|
| Diversificada 40/60 | 4,8% | 8,5% | Hipótesis ilustrativa |
| S&P 500 | 6,7% | 15,36% | J.P. Morgan LTCMA 2026 para US large cap |
| Nasdaq-100 | 8,5% | 22,63% | Proxy del escenario base de BlackRock para US large cap |
| Personalizada | Editable | Editable | Hipótesis del usuario |

Para Nasdaq-100, el análisis de sensibilidad usa:

- Bajo: 6,7%.
- Central: 8,5%.
- Alto/IA: 14,8%.

El 14,8% procede del escenario de auge de productividad por IA de BlackRock para grandes compañías estadounidenses. **No se presenta como consenso ni como previsión específica del Nasdaq-100.**

## Por qué no se usa 13%–15% como previsión central automática

Nasdaq informa de un CAGR histórico aproximado del 14,25% desde 1985 y de un 16,7% anualizado entre finales de 2007 y junio de 2026. Son resultados históricos, no expectativas futuras. El crecimiento de beneficios por acción tampoco equivale automáticamente a la rentabilidad del accionista porque influyen dividendos, recompras, dilución y cambios de valoración.

La aplicación muestra estas cifras como contexto histórico y escenarios optimistas, pero mantiene separado el preset prospectivo.

## Historial incorporado

- S&P 500 aproximado Total Return mensual: enero de 1926–junio de 2023, basado en precios y dividendos de Robert Shiller.
- Nasdaq-100 Total Return mensual: julio de 2016–junio de 2026.
- Comparación Nasdaq/S&P alineada: años naturales Total Return 2008–2025.

En la comparación histórica se seleccionan los mismos bloques consecutivos de dos años para ambos índices. Esto conserva el emparejamiento temporal y evita comparar periodos distintos.

## Publicación

Copia `index.html`, `script.js`, `styles.css` y `favicon.svg` a la raíz del repositorio de GitHub Pages.

## Pruebas

```bash
node tests/model-tests.js
```

Las pruebas verifican fiscalidad, aportaciones, capitalización, reproducibilidad, CAGR mediano independiente de la volatilidad, correlación conjunta, bootstrap alineado y advertencia de extrapolación.

## Limitaciones

La aplicación es educativa. El Monte Carlo paramétrico sigue usando choques normales y una correlación constante; no reproduce colas gruesas, correlaciones cambiantes, volatilidad agrupada ni cambios de régimen. El bootstrap comparativo dispone de 18 años naturales, una muestra limitada y favorable para tecnología. No se modelan tipos de cambio, tributación periódica de dividendos, compensación de minusvalías, spreads, deslizamiento, quiebras ni cambios regulatorios.

## Ajustes responsive móviles

- La barra de navegación cubre ahora todo el ancho visual en móvil, incluso en navegadores que reservan espacio para la barra de desplazamiento.
- Los selectores de moneda y tema se adaptan a anchos estrechos sin desbordarse.
- Las tres tarjetas visuales de la portada dejan de usar posicionamiento absoluto en móvil y se muestran como una lista compacta, sin solapamientos ni grandes espacios vacíos.
- Estos cambios se aplican únicamente a pantallas de 760 px o menos; la composición de escritorio no se modifica.

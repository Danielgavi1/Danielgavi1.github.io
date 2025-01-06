document.addEventListener("DOMContentLoaded", () => {
    const premiosContainer = document.body;

    // Simulación de premios comprados (puede venir de una API o localStorage)
    const premiosComprados = JSON.parse(localStorage.getItem("premios")) || [];

    // Función para contar cuántas veces se ha comprado cada premio
    function contarPremios() {
        const contador = {};

        premiosComprados.forEach(premio => {
            if (contador[premio]) {
                contador[premio] += 1;
            } else {
                contador[premio] = 1;
            }
        });

        return contador;
    }

    // Renderiza los premios comprados
    function mostrarPremios() {
        premiosContainer.innerHTML = "<h1>Premios Comprados</h1>";

        if (premiosComprados.length === 0) {
            premiosContainer.innerHTML += "<p>No has comprado premios todavía.</p>";
            return;
        }

        const lista = document.createElement("ul");
        const contadorPremios = contarPremios();

        // Mostrar los premios con su cantidad
        for (const premio in contadorPremios) {
            const item = document.createElement("li");
            item.textContent = `${premio}: ${contadorPremios[premio]} veces`;
            lista.appendChild(item);
        }

        premiosContainer.appendChild(lista);
    }

    mostrarPremios();
});

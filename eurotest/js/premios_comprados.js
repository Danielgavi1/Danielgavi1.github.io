document.addEventListener("DOMContentLoaded", () => {
    const premiosContainer = document.body;

    // Simulación de premios comprados (puede venir de una API o localStorage)
    const premiosComprados = JSON.parse(localStorage.getItem("premios")) || [];

    // Renderiza los premios comprados
    function mostrarPremios() {
        premiosContainer.innerHTML = "<h1>Premios Comprados</h1>";
        
        if (premiosComprados.length === 0) {
            premiosContainer.innerHTML += "<p>No has comprado premios todavía.</p>";
            return;
        }

        const lista = document.createElement("ul");
        
        premiosComprados.forEach(premio => {
            const item = document.createElement("li");
            item.textContent = premio;
            lista.appendChild(item);
        });

        premiosContainer.appendChild(lista);
    }

    mostrarPremios();
});
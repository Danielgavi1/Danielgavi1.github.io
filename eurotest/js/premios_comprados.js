document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("comprados-container");
    const emptyState = document.getElementById("empty-state");
    const premios = JSON.parse(localStorage.getItem("premios")) || [];

    if (premios.length === 0) {
        if (emptyState) emptyState.style.display = "block";
    } else {
        // Aggregate items
        const counts = {};
        premios.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });

        Object.keys(counts).forEach((premio) => {
            const quantity = counts[premio];
            const item = document.createElement("div");
            item.className = "closet-item unlocked";
            item.innerHTML = `
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #FCE7F3; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(233, 30, 99, 0.2);">
                    <i class="fas fa-check" style="color: var(--vs-pink); font-size: 1.2rem;"></i>
                </div>
                <div style="flex-grow: 1; display: flex; flex-direction: column;">
                    <span style="color: var(--vs-black); font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px;">${premio}</span>
                    <span style="font-size: 0.65rem; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Verified Acquisition</span>
                </div>
                <div style="background: var(--vs-pink); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: 'Montserrat'; font-size: 0.8rem; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                    x${quantity}
                </div>
            `;
            container.appendChild(item);
        });
    }
});

function borrarHistorial() {
    // Custom confirmation using the shared modal would be better, but standard confirm is faster for this edge case
    // Trying to use shared modal if available, but it requires callback logic which shared.js simplified version doesnt support yet.
    if (confirm("¿Seguro que quieres borrar el historial?")) {
        localStorage.removeItem("premios");
        location.reload();
    }
}

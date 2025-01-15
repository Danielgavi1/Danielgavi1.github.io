document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".product-card");  // Aquí corregido para usar 'product-card'

    // Obtener ahorros del localStorage o inicializar
    let savings = parseInt(localStorage.getItem("savings")) || 0;
    console.log("Ahorros iniciales:", savings);

    cards.forEach(card => {
        const addButton = card.querySelector(".increment");
        const subtractButton = card.querySelector(".decrement");
        const buyButton = card.querySelector(".buy");
        const quantitySpan = card.querySelector(".quantity");
        const price = parseInt(card.dataset.price);
        const premioNombre = card.querySelector("h2").textContent;

        let quantity = 0;

        // Incrementar cantidad
        addButton.addEventListener("click", () => {
            quantity++;
            quantitySpan.textContent = quantity;
        });

        // Decrementar cantidad
        subtractButton.addEventListener("click", () => {
            if (quantity > 0) {
                quantity--;
                quantitySpan.textContent = quantity;
            }
        });

        // Comprar
        buyButton.addEventListener("click", () => {
            const totalCost = quantity * price;
            if (savings >= totalCost && quantity > 0) {
                savings -= totalCost;
                localStorage.setItem("savings", savings);
                
                // Llamar a la función para registrar premios
                registrarPremios(premioNombre, quantity);

                alert(`Has comprado ${quantity} x ${premioNombre}. Ahorros restantes: ${savings} €`);
                quantity = 0;
                quantitySpan.textContent = quantity;
            } else if (quantity === 0) {
                alert("Por favor selecciona al menos un artículo.");
            } else {
                alert("No tienes suficientes ahorros para esta compra.");
            }
        });
    });

    // Función para registrar premios en localStorage
    function registrarPremios(premio, cantidad) {
        let premios = JSON.parse(localStorage.getItem("premios")) || [];
        
        // Agregar el premio con la cantidad
        for (let i = 0; i < cantidad; i++) {
            premios.push(premio);
        }
        
        // Guardar en localStorage
        localStorage.setItem("premios", JSON.stringify(premios));
    }
});
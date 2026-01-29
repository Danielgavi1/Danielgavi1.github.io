document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".store-item");
    const savingsDisplay = document.getElementById('savings-display');
    const savings = parseInt(localStorage.getItem("savings")) || 0;

    if (savingsDisplay) savingsDisplay.textContent = savings;

    cards.forEach(card => {
        const addButton = card.querySelector(".increment");
        const subtractButton = card.querySelector(".decrement");
        const buyButton = card.querySelector(".store-btn");
        const quantitySpan = card.querySelector(".quantity");

        if (!addButton || !buyButton) return;

        const price = parseInt(card.dataset.price);
        const premioNombre = card.querySelector(".item-name").textContent;

        let quantity = 0;
        updateUI();

        addButton.addEventListener("click", () => { quantity++; updateUI(); });
        subtractButton.addEventListener("click", () => { if (quantity > 0) quantity--; updateUI(); });

        function updateUI() {
            if (quantitySpan) quantitySpan.textContent = quantity;

            if (quantity > 0) {
                buyButton.textContent = `ADD (${quantity * price})`;
                buyButton.classList.add('active');
            } else {
                buyButton.textContent = "ADD TO BAG";
                buyButton.classList.remove('active');
            }
        }

        buyButton.addEventListener("click", () => {
            if (quantity === 0) return;

            const totalCost = quantity * price;
            let currentSavings = parseInt(localStorage.getItem("savings")) || 0;

            if (currentSavings >= totalCost) {
                currentSavings -= totalCost;
                localStorage.setItem("savings", currentSavings);

                let premios = JSON.parse(localStorage.getItem("premios")) || [];
                for (let i = 0; i < quantity; i++) premios.push(premioNombre);
                localStorage.setItem("premios", JSON.stringify(premios));

                showModal('ADDED TO BAG', `You have acquired ${quantity} x ${premioNombre}.`);

                if (savingsDisplay) savingsDisplay.textContent = currentSavings;
                quantity = 0;
                updateUI();
            } else {
                showModal('ACCESS DENIED', 'Insufficient credits for this luxury item.');
            }
        });
    });
});
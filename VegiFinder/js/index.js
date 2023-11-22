function searchProducts() {
    const searchTerm = document.getElementById('search-input').value;

    // Crear botones para cada página web
    const websites = [
        { name: 'OpenFoodFacts', url: `https://es.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerm}&search_simple=1&action=process` },
        { name: 'Producto Vegano', url: `https://www.productovegano.net/?s=${searchTerm}` },
        { name: 'Vegano por Accidente Spain', url: `https://www.veganoporaccidentespain.com/?s=${searchTerm}` },
        { name: 'SuperVeggie', url: `https://superveggie.es/?s=${searchTerm}` }
    ];

    displayResults(websites);
}

function displayResults(websites) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores

    websites.forEach(website => {
        const button = document.createElement('button');
        button.textContent = `Ver en ${website.name}`;
        button.className = 'btn btn-secondary mr-2';
        button.addEventListener('click', function() {
            window.open(website.url, '_blank');
        });

        resultsContainer.appendChild(button);
    });
}
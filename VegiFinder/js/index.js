document.getElementById('search-button').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        // Si la tecla presionada es Enter, ejecutar la búsqueda
        searchProducts();
    }
});

function searchProducts() {
    const searchTerm = document.getElementById('search-button').value;

    // Crear botones para cada página web
    const websites = [
        { name: 'OpenFoodFacts', url: `https://es.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerm}&search_simple=1&action=process`, image: './img/openfoodfacts.png' },
        { name: 'Producto Vegano', url: `https://www.productovegano.net/?s=${searchTerm}`, image: './img/productovegano.png' },
        { name: 'Vegano por Accidente Spain', url: `https://www.veganoporaccidentespain.com/?s=${searchTerm}`, image: './img/veganoporaccidente.png' },
        { name: 'SuperVeggie', url: `https://superveggie.es/?s=${searchTerm}`, image: './img/superveggie.png' }
    ];

    displayResults(websites);
}

function displayResults(websites) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores

    document.getElementById("search-results").style.visibility = "visible";

    websites.forEach(website => {
        const button = document.createElement('button');
        button.innerHTML = `
            <img src="${website.image}" alt="${website.name}" class="site-image">
            Ver en ${website.name}`;
        button.className = 'btn btn-secondary mr-2 result-button'; // Agrega la clase 'result-button'
        button.addEventListener('click', function () {
            window.open(website.url, '_blank');
            button.classList.add('clicked'); // Agrega la clase 'clicked' al botón después de hacer clic
        });

        resultsContainer.appendChild(button);
    });
}

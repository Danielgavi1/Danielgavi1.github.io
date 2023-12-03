document.getElementById('search-button').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchProducts();
    }
});

function searchProducts(newWebsites) {
    const searchTerm = document.getElementById('search-button').value;
    // Crear botones para cada página web
    const websites = [
        { name: 'OpenFoodFacts', url: `https://es.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerm}&search_simple=1&action=process`, image: './img/openfoodfacts.png' },
        { name: 'Producto Vegano', url: `https://www.productovegano.net/?s=${searchTerm}`, image: './img/productovegano.png' },
        { name: 'Vegano por Accidente Spain', url: `https://www.veganoporaccidentespain.com/?s=${searchTerm}`, image: './img/veganoporaccidente.png' },
        { name: 'SuperVeggie', url: `https://superveggie.es/?s=${searchTerm}`, image: './img/superveggie.png' }
    ];

    let allWebsites;

    if (newWebsites !== null) {
        // Fusionar sitios web nuevos y existentes
        allWebsites = websites.concat(newWebsites);
    } else {
        // Si no hay sitios web nuevos, utilice solo los existentes
        allWebsites = websites;
    }

    // Añadir la clase 'fade-in' al elemento #search-results
    document.getElementById('search-results').classList.add('fade-in');
    document.getElementById('no_encontraste_producto').classList.add('fade-in');

    displayResults(allWebsites);
}

function addvino() {
    const searchTerm = document.getElementById('search-button').value;
    const barnivore = [
        { name: 'Barnivore',
          url: `https://www.barnivore.com/search?keyword=${searchTerm}`,
          image: './img/barnivore.webp' }
    ];

    // Realizar búsqueda con el nuevo objeto
    searchProducts(barnivore);
}

function displayResults(websites) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores

    resultsContainer.style.visibility = "visible";
    document.getElementById("no_encontraste_producto").style.visibility = "visible";

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
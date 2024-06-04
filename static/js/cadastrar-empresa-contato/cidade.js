// Evento de clique fora da lista de sugestões para escondê-la
document.addEventListener('click', function (event) {
    var suggestionsList = document.getElementById('suggestionsCidade');
    if (!event.target.closest('#inputCidadeRevenda')) {
        suggestionsList.style.display = 'none';
    }
});

// Evento de clique em um item da lista de sugestões para preencher o campo de entrada e esconder a lista
document.getElementById('suggestionsCidade').addEventListener('click', function (event) {

    var inputNome = document.getElementById('inputCidadeRevenda');

    if (event.target.tagName === 'LI') {
        var nome = event.target.textContent;
        var id = event.target.dataset.id;
        document.getElementById('inputCidadeRevenda').value = nome;
        inputNome.setAttribute('data-id', id);
        document.getElementById('suggestionsCidade').style.display = 'none';
    }

});

var timeoutId;

// Evento de entrada para chamar a API enquanto o usuário digita
document.getElementById('inputCidadeRevenda').addEventListener('input', function () {
    cidade = document.getElementById('inputCidadeRevenda').value;
    var suggestionsList = document.getElementById('suggestionsCidade');
    suggestionsList.innerHTML = '';

    // Limpa o timeout anterior, se existir
    clearTimeout(timeoutId);

    // Define um novo timeout para chamar a função buscarCidades depois de 500 milissegundos (0.5 segundos)
    timeoutId = setTimeout(function () {
        buscarCidades(cidade);
    }, 500);
});

function buscarCidades(cidade) {
    const apiUrl = 'https://public-api2.ploomes.com/Cities?$expand=Country,State&$filter=contains(Name,\'' + cidade + '\')';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl);
    xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            // Manipular os dados recebidos da API aqui
            console.log(data);
            showSuggestions_cidades(data.value);
        } else {
            console.error('Erro ao chamar a API:', xhr.statusText);
        }
    };
    xhr.onerror = function () {
        console.error('Erro ao chamar a API.');
    };
    xhr.send();
}

// Função para mostrar sugestões ao digitar
function showSuggestions_cidades(suggestions) {
    var input = document.getElementById('inputCidadeRevenda').value.toLowerCase();
    var suggestionsList = document.getElementById('suggestionsCidade');

    if (!input) {
        
    } else {
        // Se for a primeira página de resultados, limpa a lista de sugestões
        if (currentPage === 0) {
            suggestionsList.innerHTML = '';
        }

        // Preenche a lista de sugestões com os itens retornados pela API
        suggestions.forEach(function (item) {
            var li = document.createElement('li');
            li.textContent = item.Name; // Supondo que o nome esteja na propriedade "Name"
            li.setAttribute('data-id', item.Id);
            suggestionsList.appendChild(li);
        });

        // Mostra a lista de sugestões
        suggestionsList.style.display = 'block';

    }

}
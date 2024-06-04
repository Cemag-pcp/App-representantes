// Evento de clique fora da lista de sugestões para escondê-la
document.addEventListener('click', function (event) {
    var suggestionsList = document.getElementById('suggestionsResponsavel');
    if (!event.target.closest('#inputResponsavelRevenda')) {
        suggestionsList.style.display = 'none';
    }
});

// Evento de clique em um item da lista de sugestões para preencher o campo de entrada e esconder a lista
document.getElementById('suggestionsResponsavel').addEventListener('click', function (event) {

    var inputNome = document.getElementById('inputResponsavelRevenda');

    if (event.target.tagName === 'LI') {
        var nome = event.target.textContent;
        var id = event.target.dataset.id;
        document.getElementById('inputResponsavelRevenda').value = nome;
        inputNome.setAttribute('data-id', id);
        document.getElementById('suggestionsResponsavel').style.display = 'none';
    }

});

var timeoutId;

// Evento de entrada para chamar a API enquanto o usuário digita
document.getElementById('inputResponsavelRevenda').addEventListener('input', function () {
    var responsavel = document.getElementById('inputResponsavelRevenda').value;
    var suggestionsList = document.getElementById('suggestionsResponsavel');
    suggestionsList.innerHTML = '';

    // Limpa o timeout anterior, se existir
    clearTimeout(timeoutId);

    // Define um novo timeout para chamar a função buscarResponsavel depois de 500 milissegundos (0.5 segundos)
    timeoutId = setTimeout(function () {
        buscarResponsavel(responsavel);
    }, 500);
});

function buscarResponsavel(responsavel) {
    const apiUrl = 'https://public-api2.ploomes.com/Users?$filter=contains(Name,\'' + responsavel + '\')';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl);
    xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            // Manipular os dados recebidos da API aqui
            console.log(data);
            showSuggestions_responsaveis(data.value);
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
function showSuggestions_responsaveis(suggestions) {
    var input = document.getElementById('inputResponsavelRevenda').value.toLowerCase();
    var suggestionsList = document.getElementById('suggestionsResponsavel');

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
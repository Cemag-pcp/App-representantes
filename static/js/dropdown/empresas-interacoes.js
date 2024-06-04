// Evento de clique fora da lista de sugestões para escondê-la
document.addEventListener('click', function (event) {
    document.getElementById('suggestionsPecasInteracao2').innerHTML = ''
    var suggestionsList = document.getElementById('suggestionsPecasInteracao2');
    if (!event.target.closest('#empresaCadastradaInteracao2')) {
        suggestionsList.style.display = 'none';
    }
});

// Evento de clique em um item da lista de sugestões para preencher o campo de entrada e esconder a lista
document.getElementById('suggestionsPecasInteracao2').addEventListener('click', function (event) {
    document.getElementById('suggestionsPecasInteracao2').innerHTML = ''

    var inputNome = document.getElementById('empresaCadastradaInteracao2');

    if (event.target.tagName === 'LI') {
        var nome = event.target.textContent;
        var id = event.target.dataset.id;
        document.getElementById('empresaCadastradaInteracao2').value = nome;
        inputNome.setAttribute('data-id', id);
        buscarContatos(id);
        document.getElementById('suggestionsPecasInteracao2').style.display = 'none';
    }

});


// Função para limpar o campo de entrada e esconder a lista de sugestões
function clearInput_() {
    document.getElementById('suggestionsPecasInteracao2').innerHTML = ''
    document.getElementById('empresaCadastradaInteracao2').value = '';
    document.getElementById('suggestionsPecasInteracao2').style.display = 'none';
}

// Variável para armazenar os dados brutos do backend
var suggestionsDataPecaModal = [];

// Evento de entrada para chamar a API enquanto o usuário digita
document.getElementById('empresaCadastradaInteracao2').addEventListener('input', function () {
    document.getElementById('suggestionsPecasInteracao2').innerHTML = ''
    var suggestionsList = document.getElementById('suggestionsPecasInteracao2');
    var currentPage = 0;
    suggestionsList.innerHTML = '';

    callApi();

});

// Variáveis globais para controle de paginação
// var currentPage = 0;
// var rowsPerPage = 5; // Número de resultados por página

// Função para chamar a API
function callApi() {
    document.getElementById('suggestionsPecasInteracao2').innerHTML = ''
    var idRepresentante = document.getElementById('idLogin').innerHTML;

    var input = document.getElementById('empresaCadastradaInteracao2').value.toLowerCase();
    var skip = currentPage * rowsPerPage; // Calcula o valor de skip baseado na página atual
    var url = 'https://public-api2.ploomes.com/Contacts?$top=100 ' + '&$select=Name,Id&$filter=contains(Name,\'' + input + '\') and OwnerId+eq+'+ idRepresentante;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            // Manipular os dados recebidos da API aqui
            
            showSuggestions(data.value);
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
function showSuggestions(suggestions) {
    document.getElementById('suggestionsPecasInteracao2').innerHTML = ''
    var input = document.getElementById('empresaCadastradaInteracao2').value.toLowerCase();
    var suggestionsList = document.getElementById('suggestionsPecasInteracao2');

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

// Evento de rolagem para chamar a próxima página da API
function onScroll() {
    // Seleciona o elemento de lista de sugestões
    const suggestionsList = document.getElementById('suggestionsPecasInteracao2');

    // Verifica se o usuário está próximo ao final da lista
    if (suggestionsList.scrollTop + suggestionsList.clientHeight >= suggestionsList.scrollHeight - 1) {
        // Incrementa a página atual
        currentPage++;

        // Chama a API para carregar mais resultados
        callApi();
    }
}
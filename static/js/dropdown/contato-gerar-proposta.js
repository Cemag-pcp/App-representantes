// Evento de clique fora da lista de sugestões para escondê-la
document.addEventListener('click', function (event) {
    var suggestionsList = document.getElementById('suggestionsPecas');
    if (!event.target.closest('#nomeGerarProposta')) {
        suggestionsList.style.display = 'none';
    }
});

// Evento de clique em um item da lista de sugestões para preencher o campo de entrada e esconder a lista
document.getElementById('suggestionsPecas').addEventListener('click', function (event) {

    var inputNome = document.getElementById('nomeGerarProposta');

    if (event.target.tagName === 'LI') {
        var nome = event.target.textContent;
        var id = event.target.dataset.id;
        document.getElementById('nomeGerarProposta').value = nome;
        inputNome.setAttribute('data-id', id);
        document.getElementById('suggestionsPecas').style.display = 'none';
    }

});

// Evento de clique no campo de contato
document.getElementById('contatoGerarProposta').addEventListener('click', function (event) {

    var inputNome = document.getElementById('nomeGerarProposta');
    var dataIdValue = inputNome.dataset.id;

    console.log(dataIdValue);

    event.stopPropagation(); // Impede a propagação do evento para não ser capturado pelo document click

    buscarContatos(dataIdValue)
        .then(contatos => {
            // Aqui você pode usar os contatos recebidos
            showSuggestions_contatos(contatos.value);
        })
        .catch(error => {
            // Manipule qualquer erro que possa ocorrer durante a busca de contatos
            console.error('Erro ao buscar contatos:', error);
        });

});

// Função para limpar o campo de entrada e esconder a lista de sugestões
function clearInput_() {
    document.getElementById('nomeGerarProposta').value = '';
    document.getElementById('suggestionsPecas').style.display = 'none';
}

// Variável para armazenar os dados brutos do backend
var suggestionsDataPecaModal = [];

// Evento de entrada para chamar a API enquanto o usuário digita
document.getElementById('nomeGerarProposta').addEventListener('input', function () {
    var suggestionsList = document.getElementById('suggestionsPecas');
    var currentPage = 0;
    suggestionsList.innerHTML = '';

    callApi(currentPage,rowsPerPage);

});

// Variáveis globais para controle de paginação
var currentPage = 0;
var rowsPerPage = 5; // Número de resultados por página

// Função para chamar a API
function callApi(currentPage,rowsPerPage) {
    var idRepresentante = document.getElementById('idLogin').innerHTML;

    var input = document.getElementById('nomeGerarProposta').value.toLowerCase();
    var skip = currentPage * rowsPerPage; // Calcula o valor de skip baseado na página atual
    var url = 'https://public-api2.ploomes.com/Contacts?$top=' + rowsPerPage + '&$select=Name,Id&$filter=contains(Name,\'' + input + '\') and OwnerId+eq+'+ idRepresentante +'&$skip=' + skip;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            // Manipular os dados recebidos da API aqui
            console.log(data);
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
    var input = document.getElementById('nomeGerarProposta').value.toLowerCase();
    var suggestionsList = document.getElementById('suggestionsPecas');

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
    const suggestionsList = document.getElementById('suggestionsPecas');

    // Verifica se o usuário está próximo ao final da lista
    if (suggestionsList.scrollTop + suggestionsList.clientHeight >= suggestionsList.scrollHeight - 1) {
        // Incrementa a página atual
        currentPage++;

        // Chama a API para carregar mais resultados
        callApi(currentPage,rowsPerPage);
    }
}

// Adiciona o evento de rolagem ao elemento de lista de sugestões
document.getElementById('suggestionsPecas').addEventListener('scroll', onScroll);
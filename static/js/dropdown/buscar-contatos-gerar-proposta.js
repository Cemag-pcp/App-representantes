async function buscarContatos(revenda) {
    
    var idLogin = parseFloat(document.getElementById('idLogin').innerHTML)

    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';

    var filter = `CompanyId+eq+${revenda}`;

    var apiUrl = `https://public-api2.ploomes.com/Contacts?$top=100&$select=Name,Id&$filter=${filter} and TypeId+eq+2 and OwnerId+eq+${idLogin}`;

    console.log(apiUrl);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Key': apiKey
            }
        });
        // Verifica se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error('Erro ao buscar contatos: ' + response.statusText);
        }
        return await response.json();
    } catch (error) {
        // Captura e registra erros
        console.error('Erro ao buscar contatos:', error);
        throw error; // Rejeita a promessa com o erro capturado
    }
}

function showSuggestions_contatos(suggestions) {
    var suggestionsList = document.getElementById('suggestionsContatos');

    // Limpa a lista de sugestões
    suggestionsList.innerHTML = '';

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

// Evento de clique fora da lista de sugestões para escondê-la
document.addEventListener('click', function (event) {
    var suggestionsList = document.getElementById('suggestionsContatos');
    if (!event.target.closest('#contatoGerarProposta')) {
        suggestionsList.style.display = 'none';
    }
});

// Evento de clique em um item da lista de sugestões para preencher o campo de entrada e esconder a lista
document.getElementById('suggestionsContatos').addEventListener('click', function (event) {

    var inputNome = document.getElementById('contatoGerarProposta');
    
    if (event.target.tagName === 'LI') {
        var nome = event.target.textContent;
        var id = event.target.dataset.id;
        document.getElementById('contatoGerarProposta').value = nome;
        inputNome.setAttribute('data-id',id);
        document.getElementById('suggestionsContatos').style.display = 'none';
    }
});
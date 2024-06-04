var inputFormaPagamento = document.getElementById('inputFormaPagamento');
var inputCliente = document.getElementById('nomeGerarProposta');
var suggestionsList = document.getElementById('suggestionsFormaPagamento');

inputFormaPagamento.addEventListener('click', function(){
    
    if (inputFormaPagamento.value.trim() === '') {
        var idCliente = inputCliente.dataset.id;
        getFormasPagamento(idCliente);
    }

});

inputFormaPagamento.addEventListener('focus', function(){
    var idCliente = inputCliente.dataset.id;
    getFormasPagamento(idCliente);
});

function getFormasPagamento(idCliente) {
    var url = '/atualizar-cliente?nameCliente='+idCliente;

    console.log(url);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);

            console.log(data.condicoes)

            suggestionsList.innerHTML = '';

            var suggestions = data.condicoes;

            suggestions.forEach(function (item) {
                var li = document.createElement('li');
                li.textContent = item; // Supondo que o nome esteja na propriedade "Name"
                // li.setAttribute('data-id', item.Id);
                suggestionsList.appendChild(li);
            });

            suggestionsList.style.display = 'block';

        } else {
            console.error('Erro ao chamar a API:', xhr.statusText);
        }
    };
    xhr.onerror = function() {
        console.error('Erro ao chamar a API.');
    };
    xhr.send();
};

// Evento de clique fora da lista de sugestões para escondê-la
document.addEventListener('click', function (event) {
    // var suggestionsList = document.getElementById('suggestionsFormaPagamento');
    if (!event.target.closest('#inputFormaPagamento')) {
        suggestionsList.style.display = 'none';
    }
});

document.addEventListener('input', function(event) {
    if (event.target.id === 'inputFormaPagamento') {
        var input = event.target.value.toLowerCase();

        // Resgata todos os itens da lista de sugestões
        var items = suggestionsList.getElementsByTagName('li');

        // Oculta todos os itens da lista
        Array.from(items).forEach(function(item) {
            item.style.display = 'none';
        });

        // Filtra os itens da lista com base no texto de entrada
        Array.from(items).forEach(function(item) {
            if (item.textContent.toLowerCase().includes(input)) {
                item.style.display = 'block';
            }
        });
    }
});

// Evento de clique em um item da lista de sugestões para preencher o campo de entrada e esconder a lista
suggestionsList.addEventListener('click', function (event) {

    if (event.target.tagName === 'LI') {
        var nome = event.target.textContent;
        // var id = event.target.dataset.id;
        inputFormaPagamento.value = nome;
        // inputCliente.setAttribute('data-id', id);
        suggestionsList.style.display = 'none';
    }

});
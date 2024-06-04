// Coletar itens para carrinho de compra

document.addEventListener('click', function (event) {
    // Verifica se o clique foi no botão "botao_enviar_carrinho"
    if (event.target.classList.contains('botao-enviar-carrinho')) {
        // Obtém a linha pai (tr) do botão clicado
        var row = event.target.closest('tr');
        // Obtém as células (td) da linha
        var cells = row.querySelectorAll('td');
        // Acessa o conteúdo das colunas 1 e 2
        var codigo = cells[1].textContent;

        var celCor = row.querySelector('td[data-label="Cor"]');
        var corSelecionada = celCor.querySelector('select').value;

        var celPreco = row.querySelector('td[data-label="Preço"]');
        var precoSelecionada = celPreco.querySelector('select').value;

        // Acessa os valores dos inputs nas colunas 5 e 6
        var celDesconto = row.querySelector('td[data-label="% de Desconto"]');
        var inputDesconto = celDesconto.querySelector('input').value;

        var celPrecoDesconto = row.querySelector('td[data-label="Preço Final"]');
        var inputPrecoDesconto = celPrecoDesconto.querySelector('input').value;

        var precoFinal = inputPrecoDesconto;

        if (inputPrecoDesconto === '') {
            precoFinal = precoSelecionada;
        };

        var data = {
            codigo: codigo,
            cor: corSelecionada,
            precoFinal: precoFinal,
            precoInicial:precoSelecionada,
        };

        guardarCarrinho(data);

    }
    
});

function guardarCarrinho(data) {
    
    showSpinner();

    // Configurações da requisição
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    // URL para enviar a requisição POST
    var url = '/car';

    // Envia a requisição POST usando fetch()
    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar a requisição POST');
            }
            exibirMensagem('sucesso', 'Item adicionado no carrinho.');
            hideSpinner();
            return response.json(); // Se desejar, você pode tratar a resposta aqui
        })
        .then(data => {
            console.log('Requisição POST enviada com sucesso:', data);
            exibirMensagem('sucesso', 'Item adicionado no carrinho.');
            hideSpinner();
        })
        .catch(error => {
            console.error('Erro ao enviar a requisição POST:', error);
            exibirMensagem('aviso', 'Erro! Tente novamente.');
            hideSpinner();
        });

}
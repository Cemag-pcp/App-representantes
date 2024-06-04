var btnConfirmar = document.getElementById('confirmarGerarProposta');
var btnConfirmar_2 = document.getElementById('confirmarGerarProposta_2');
var idCliente = document.getElementById('nomeGerarProposta');
var idContato = document.getElementById('contatoGerarProposta');
var formaPagamentoText = document.getElementById('inputFormaPagamento');
var responsavel = document.getElementById('responsavelGerarProposta');

// Função para lidar com o clique nos botões
function handleClick() {
    // Seu código aqui para lidar com o clique nos botões
    var observacao = document.getElementById('observacaoGerarProposta').value;

    var listaProdutos = []; // Inicializa uma lista vazia para armazenar os produtos

    var elementosProdutoInput = document.querySelectorAll('[id="produtoInput"]');

    // Itera sobre os elementos encontrados
    elementosProdutoInput.forEach(function (elemento) {
        // Obtém os valores dos outros campos relacionados ao produto
        var quantidade = elemento.closest('.row').querySelector('[id="quantidadeItens"]').value;
        var cor = elemento.closest('.row').querySelector('[id="selectCor"]').value;
        var preco = elemento.closest('.row').querySelector('[id="precoUnitItem"]').value;
        var precoInicial = elemento.closest('.row').querySelector('[id="precoInicial"]').value;

        // Cria um objeto representando o produto atual e o adiciona à lista
        var produto = {
            produto: elemento.value,
            quantidade: quantidade,
            cor: cor,
            preco: preco,
            precoInicial: precoInicial
        };

        listaProdutos.push(produto); // Adiciona o produto à lista de produtos
    });

    var data = {
        'nomeCliente': idCliente.value,
        'idCliente': idCliente.dataset.id,
        'idContato': idContato.dataset.id,
        'formaPagamento': formaPagamentoText.value,
        'listaProdutos': listaProdutos,
        'observacao': observacao
    }

    gerarProposta(data);
}

// Adiciona o evento de clique aos botões
btnConfirmar.addEventListener('click', handleClick);
btnConfirmar_2.addEventListener('click', handleClick);

function gerarProposta(data) {
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
    var url = '/receber-dados';

    // Envia a requisição POST usando fetch()
    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar a requisição POST');
            }
            exibirMensagem('sucesso', 'Proposta aberta com sucesso.');
            hideSpinner();
            return response.json(); // Se desejar, você pode tratar a resposta aqui
        })
        .then(data => {
            console.log('Requisição POST enviada com sucesso:', data);
            exibirMensagem('sucesso', 'Proposta aberta com sucesso.');
            hideSpinner();
        })
        .catch(error => {
            console.error('Erro ao enviar a requisição POST:', error);
            exibirMensagem('aviso', 'Erro! Tente novamente.');
            hideSpinner();
        });
};

function copiarItensETotalParaAreaDeTransferencia() {
    // Obtenha todos os itens da lista
    const listItems = document.querySelectorAll('.listCard li');

    // Construa uma string com o conteúdo dos itens
    let itensTexto = '';
    listItems.forEach(listItem => {
        const descricao = listItem.getAttribute('data-description');
        const corElement = listItem.querySelector('.cor');
        const cor = corElement.value;
        const nomeCarreta = listItem.querySelector('.nomeCarreta').textContent;
        const preco = listItem.querySelector('.quanti').textContent;
        const quantidade = listItem.querySelector('.numeros').textContent;
        const descricaoCarreta = listItem.querySelector('.descCarreta').textContent;

        // Construa a string para cada item
        itensTexto += `${nomeCarreta} - ${descricaoCarreta}\nCor: ${cor}\nPreço: ${preco}\nQuantidade: ${quantidade}\n\n`;
    });

    // Obtenha o valor do elemento HTML que contém o total
    const total = document.querySelector('.total').textContent;

    // Adicione o total à string de itens
    itensTexto += `Total: ${total}\n`;

    // Crie um elemento de área de transferência temporário para copiar o texto
    const tempInput = document.createElement('textarea');
    tempInput.style = 'position: absolute; left: -1000px; top: -1000px';
    tempInput.value = itensTexto;
    document.body.appendChild(tempInput);

    // Seleciona o texto dentro do elemento de área de transferência
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); // Para dispositivos móveis

    // Executa o comando de cópia para copiar o texto selecionado
    document.execCommand('copy');

    // Remove o elemento de área de transferência temporário
    document.body.removeChild(tempInput);

    alert('Itens copiados para a área de transferência!\n');

}

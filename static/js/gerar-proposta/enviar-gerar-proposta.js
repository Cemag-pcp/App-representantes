var btnConfirmar = document.getElementById('confirmarGerarProposta');
var btnConfirmar_2 = document.getElementById('confirmarGerarProposta_2');
var idCliente = document.getElementById('nomeGerarProposta');
var idContato = document.getElementById('contatoGerarProposta');
var formaPagamentoText = document.getElementById('inputFormaPagamento');
var responsavel = document.getElementById('responsavelGerarProposta');

// Função para lidar com o clique nos botões
function handleClick() {
    // Seu código aqui para lidar com o clique nos botões
    let observacao;

    if (document.getElementById('observacaoGerarProposta').value === '') {
        observacao = document.getElementById('observacaoGerarPropostaConsulta').value;
    } else {
        observacao = document.getElementById('observacaoGerarProposta').value;
    }

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
        'nomeContato':idContato.value,
        'formaPagamento': formaPagamentoText.value,
        'listaProdutos': listaProdutos,
        'observacao': observacao
    }

    copiarItensETotalParaAreaDeTransferencia();

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
            exibirMensagem('sucesso', 'Proposta aberta com sucesso. Itens copiados para área de transferência.');
            hideSpinner();
            return response.json(); // Se desejar, você pode tratar a resposta aqui
        })
        .then(data => {
            console.log('Requisição POST enviada com sucesso:', data);
            exibirMensagem('sucesso', 'Proposta aberta com sucesso. Itens copiados para área de transferência.');
            hideSpinner();
            
        })
        .catch(error => {
            console.error('Erro ao enviar a requisição POST:', error);
            exibirMensagem('aviso', 'Erro! Tente novamente.');
            hideSpinner();
        });
};

function copiarItensETotalParaAreaDeTransferencia() {
    var modalBody = document.getElementById('modal-body-carrinho');
    var rows = modalBody.querySelectorAll('.row.mb-4');
    var textToCopy = '';
    var total = 0;

    rows.forEach(function(row) {
        var produto = row.querySelector('#produtoInput').value;
        var descricao = row.querySelector('#descricao-carreta').value;
        var cor = row.querySelector('#selectCor').value;
        var quantidade = row.querySelector('.quantidadeItens').value;
        var precoUnit = row.querySelector('.precoUnitItem').value;

        
        var subtotal = quantidade * precoUnit;
        total += subtotal;

        var subtotal_formatado = subtotal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        var precoUnit = parseFloat(row.querySelector('.precoUnitItem').value); // Certifique-se de que é um número

        var precoUnitFormatado = precoUnit.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
        });

        textToCopy += `Produto: ${produto}\nDescrição: ${descricao}\nCor: ${cor}\nQuantidade: ${quantidade}\nPreço unitário: ${precoUnitFormatado}\nSubtotal: ${subtotal_formatado}\n\n`;
    });

    var totalFormatado = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    textToCopy += `Total: ${totalFormatado}`;

    // navigator.clipboard.writeText(textToCopy).catch(function(err) {
    //     console.error('Erro ao copiar para a área de transferência: ', err);
    // });
}
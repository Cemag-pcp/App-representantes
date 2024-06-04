var btAbrirCarrinho = document.getElementById('abrirCarrinho');
var modalBody = document.getElementById('modal-body-carrinho');
var totalCarrinho = document.getElementById('valorTotalCarrinho');
var precos = document.querySelectorAll('#precoUnitItem');
var quantidades = document.querySelectorAll('#quantidadeItens');
var quantidadeInput = document.getElementById('quantidadeItens');
var btContinuarCarrinho = document.getElementById('continuarConfirmacaoConsulta');
var modalBodyContinuar = document.getElementById('modal-body-continuar');

function getCarrinho() {

    showSpinner();

    var url = '/buscar-carrinho';

    console.log(url);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);

            if (data.data.length === 0) {
                modalBody.innerHTML = '<p>Adicione itens para continuar.</p>';
                btContinuarCarrinho.style.display = 'none';
                return;
            };

            for (var i = 0; i < data.data.length; i++) {
                var item = data.data[i];

                preencherModalProduto(item[0], item[1], item[2], item[6], item[3], item[5], item[7]);
            }

            preencherTotal();
            acaoBotaoExcluir();

        } else {
            console.error('Erro ao chamar a API:', xhr.statusText);
        }

        hideSpinner();
    };
    xhr.onerror = function () {
        console.error('Erro ao chamar a API.');
        hideSpinner();
    };
    xhr.send();
};

btAbrirCarrinho.addEventListener('click', function () {

    modalBody.innerHTML = '';
    getCarrinho();
    btContinuarCarrinho.style.display = 'block';

    btContinuarCarrinho.addEventListener('click', function(){
        contiuarCarrinho();
    });

});

// Função para preencher o modal com os dados fornecidos
function preencherModalProduto(id, produto, cor, quantidade, preco, precoInicial, desconto) {

    // Cria um novo elemento de div para representar uma linha no modal
    var rowDiv = document.createElement('div');
    rowDiv.classList.add('row', 'mb-4');

    var colDivId = document.createElement('div');
    colDivId.classList.add('col-md-1');

    var idInput = document.createElement('input');
    idInput.setAttribute('id', 'idInput');
    idInput.setAttribute('type', 'text');
    idInput.setAttribute('class', 'form-control');
    idInput.setAttribute('value', id);
    idInput.style.display = 'none';

    // Adiciona os elementos à coluna de produto
    colDivId.appendChild(idInput);

    var colDivDesconto = document.createElement('div');
    colDivDesconto.classList.add('col-md-1');

    var descontoElement = document.createElement('input');
    descontoElement.setAttribute('id', 'desconto');
    descontoElement.setAttribute('type', 'text');
    descontoElement.setAttribute('class', 'form-control');
    descontoElement.setAttribute('value', desconto);
    descontoElement.style.display = 'none';

    // Adiciona os elementos à coluna de produto
    colDivDesconto.appendChild(descontoElement);

    // Adiciona os elementos de input e labels para cada campo do produto
    var colDivProduto = document.createElement('div');
    colDivProduto.classList.add('col-md-4');

    var produtoLabel = document.createElement('label');
    produtoLabel.setAttribute('for', 'produtoInput');
    produtoLabel.textContent = 'Produto';
    var produtoInput = document.createElement('input');
    produtoInput.setAttribute('id', 'produtoInput');
    produtoInput.setAttribute('type', 'text');
    produtoInput.setAttribute('class', 'form-control');
    produtoInput.setAttribute('value', produto);
    produtoInput.setAttribute('disabled', true);

    // Adiciona os elementos à coluna de produto
    colDivProduto.appendChild(produtoLabel);
    colDivProduto.appendChild(produtoInput);

    // Cria a coluna para a cor do produto
    var colDivCor = document.createElement('div');
    colDivCor.classList.add('col-md-2');

    var corLabel = document.createElement('label');
    corLabel.setAttribute('for', 'selectCor');
    corLabel.textContent = 'Cor';
    var selectCor = document.createElement('select');
    selectCor.setAttribute('id', 'selectCor');
    selectCor.setAttribute('class', 'form-control');

    // Adiciona as opções de cor ao select
    var cores = ["Laranja", "Verde", "Vermelha", "Azul", "Amarela"];
    cores.forEach(function (corOption) {
        var option = document.createElement('option');
        option.setAttribute('value', corOption);
        option.textContent = corOption;
        // Marca a opção selecionada
        if (corOption === cor) {
            option.setAttribute('selected', true);
        }
        selectCor.appendChild(option);
    });

    // Adiciona os elementos à coluna de cor
    colDivCor.appendChild(corLabel);
    colDivCor.appendChild(selectCor);

    // Cria a coluna para a quantidade do produto
    var colDivQuantidade = document.createElement('div');
    colDivQuantidade.classList.add('col-md-2');

    var quantidadeLabel = document.createElement('label');
    quantidadeLabel.setAttribute('for', 'quantidadeItens');
    quantidadeLabel.textContent = 'Quantidade';
    var quantidadeInput = document.createElement('input');
    quantidadeInput.setAttribute('id', 'quantidadeItens');
    quantidadeInput.setAttribute('type', 'text');
    quantidadeInput.setAttribute('class', 'quantidadeItens form-control');
    quantidadeInput.setAttribute('value', quantidade);

    // Adiciona os elementos à coluna de quantidade
    colDivQuantidade.appendChild(quantidadeLabel);
    colDivQuantidade.appendChild(quantidadeInput);

    // Cria a coluna para o preço do produto
    var colDivPreco = document.createElement('div');
    colDivPreco.classList.add('col-md-3');

    var precoLabel = document.createElement('label');
    precoLabel.setAttribute('for', 'precoUnitItem');
    precoLabel.textContent = 'Preço unit.';
    var precoInput = document.createElement('input');
    precoInput.setAttribute('id', 'precoUnitItem');
    precoInput.setAttribute('type', 'text');
    precoInput.setAttribute('class', 'precoUnitItem form-control');
    precoInput.setAttribute('value', preco);

    // Adiciona os elementos à coluna de preço
    colDivPreco.appendChild(precoLabel);
    colDivPreco.appendChild(precoInput);

    // Cria a coluna para o preço inicial do produto
    var colDivPrecoInicial = document.createElement('div');
    colDivPrecoInicial.classList.add('col-md-3');

    var precoInicialInput = document.createElement('input');
    precoInicialInput.setAttribute('id', 'precoInicial');
    precoInicialInput.setAttribute('type', 'text');
    precoInicialInput.setAttribute('class', 'precoInicial form-control');
    precoInicialInput.setAttribute('value', precoInicial);
    precoInicialInput.style.display = 'none';

    // Adiciona os elementos à coluna de preço inicial
    colDivPrecoInicial.appendChild(precoInicialInput);

    // Botão de excluir
    var colDivBt = document.createElement('div');
    colDivBt.classList.add('col-md-1');
    colDivBt.style.alignSelf = 'flex-end';
    
    var excluirButton = document.createElement('button');
    excluirButton.setAttribute('class', 'btn btn-light button-excluir-item');
    excluirButton.setAttribute('id', id);

    // Adicione o ícone de lixeira usando a classe do Font Awesome
    excluirButton.innerHTML = '<i class="fas fa-trash-alt"></i>';

    colDivBt.appendChild(excluirButton);

    // Adiciona as colunas à linha
    rowDiv.appendChild(colDivProduto);
    rowDiv.appendChild(colDivCor);
    rowDiv.appendChild(colDivQuantidade);
    rowDiv.appendChild(colDivPreco);
    rowDiv.appendChild(colDivBt);
    rowDiv.appendChild(colDivId);
    rowDiv.appendChild(colDivPrecoInicial);
    rowDiv.appendChild(colDivDesconto);

    // Adiciona a linha preenchida ao modal
    modalBody.appendChild(rowDiv);
};

function preencherTotal() {
    var total = 0;

    // Seleciona todos os elementos com a classe 'precoUnitItem' e 'quantidadeItens'
    var precos = document.querySelectorAll('.precoUnitItem');
    var quantidades = document.querySelectorAll('.quantidadeItens');

    // Itera sobre cada par de elementos (preço e quantidade) e calcula o total
    for (var i = 0; i < precos.length; i++) {
        var preco = parseFloat(precos[i].value);
        var quantidade = parseFloat(quantidades[i].value);

        if (!isNaN(preco) && !isNaN(quantidade)) {
            total += preco * quantidade;
        }
    }
    
    total = parseFloat(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    totalCarrinho.value = total;
};

// Adicione um event listener para chamar a função preencherTotal quando um dos inputs for alterado
document.addEventListener('input', function (event) {
    var target = event.target;
    if (target.classList.contains('precoUnitItem') || target.classList.contains('quantidadeItens')) {
        preencherTotal();
    }
});

function acaoBotaoExcluir() {
    // Abra o modal aqui

    // Selecione todos os botões de excluir dentro do modal
    var botoesExcluir = document.querySelectorAll('.button-excluir-item');

    // Itere sobre cada botão de excluir
    botoesExcluir.forEach(function (botaoExcluir) {
        // Adicione um event listener para o clique no botão de excluir
        botaoExcluir.addEventListener('click', function (event) {
            // Obtenha o ID do botão de excluir clicado
            var idBotaoExcluir = event.currentTarget.id;
            excluirItemCarrinho(idBotaoExcluir);

        });
    });
}

function excluirItemCarrinho(idItem) {

    showSpinner();

    var data = {
        'id': idItem,
    };

    // Configurar as opções da requisição
    var options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data) // Converta os dados para JSON
    };

    // Realizar a requisição POST
    fetch('/remove-carrinho', options)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Erro ao enviar requisição: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(function (data) {
            // Manipule a resposta aqui, se necessário
            hideSpinner();
            exibirMensagem('sucesso', 'Item excluido com sucesso.');
            
            modalBody.innerHTML = '';

            getCarrinho();
        })
        .catch(function (error) {
            // Caso ocorra algum erro durante a requisição
            console.error('Erro durante a requisição:', error);
            hideSpinner();
            exibirMensagem('aviso', 'Erro! Tente novamente.');
        });

};

function contiuarCarrinho() {

    var valorTotal = document.getElementById('valorTotalCarrinho').value;
    // var nomeCliente = document.getElementById('nomeGerarProposta').value;
    // var nomeContato = document.getElementById('contatoGerarProposta').value;
    // var formaPagamento = document.getElementById('inputFormaPagamento').value;

    // Seleciona todos os elementos com a classe "row" dentro do modal-body
    var rows = modalBody.querySelectorAll('.row');

    // Limpa o conteúdo do modalBodyContinuar antes de preencher com novos dados
    modalBodyContinuar.innerHTML = '';

    // Cria um novo elemento div para representar a linha no modalBodyContinuar
    var newRow = document.createElement('div');
    newRow.classList.add('row');
    newRow.classList.add('mb-4');

    // Preenche o novo elemento div com as informações do item
    // newRow.innerHTML = `
    //     <div class="col-md-4"><strong>Nome:</strong> ${nomeCliente}</div>
    //     <div class="col-md-4"><strong>Nome:</strong> ${nomeContato}</div>
    //     <div class="col-md-4"><strong>Forma de pagamento:</strong> ${formaPagamento}</div>
    // `;

    // Adiciona a nova linha ao modalBodyContinuar
    // modalBodyContinuar.appendChild(newRow);

    // Itera sobre cada linha
    rows.forEach(function(row, index) {
        // Seleciona os elementos de interesse dentro da linha atual
        var produto = row.querySelector('#produtoInput').value;
        var cor = row.querySelector('#selectCor').value;
        var quantidade = row.querySelector('#quantidadeItens').value;
        var preco = row.querySelector('#precoUnitItem').value;
        var precoInicial = row.querySelector('#precoInicial').value;

        // Cria um novo elemento div para representar a linha no modalBodyContinuar
        var newRow = document.createElement('div');
        newRow.classList.add('row');
        newRow.classList.add('mb-4');

        // Preenche o novo elemento div com as informações do item
        newRow.innerHTML = `
            <div class="col-md-6" id="produto-${index}"><strong>Produto:</strong> ${produto}</div>
            <div class="col-md-2" id="cor-${index}"><strong>Cor:</strong> ${cor}</div>
            <div class="col-md-2" id="quantidade-${index}"><strong>Quantidade:</strong> ${quantidade}</div>
            <div class="col-md-2" id="preco-${index}"><strong>Preço:</strong> ${preco}</div>
            <div style="display:none" class="col-md-2" id="precoInicial-${index}"><strong>Preço:</strong> ${precoInicial}</div>
         
        `;

        // Adiciona a nova linha ao modalBodyContinuar
        modalBodyContinuar.appendChild(newRow);
    });

    // Cria um novo elemento div para representar a linha no modalBodyContinuar
    var newRow = document.createElement('div');
    newRow.classList.add('row');
    newRow.classList.add('mb-4');

    // Preenche o novo elemento div com as informações do item
    newRow.innerHTML = `
        <div class="col-md-12">
        <label for="observacaoGerarProposta">Obs:</label>
        <textarea class="form-control" name="observacaoGerarProposta" id="observacaoGerarProposta" cols="30" rows="3"></textarea>
        </div>
    `;

    modalBodyContinuar.appendChild(newRow);

    // Cria um novo elemento div para representar a linha no modalBodyContinuar
    var newRow = document.createElement('div');
    newRow.classList.add('row');
    newRow.classList.add('mb-4');

    // Preenche o novo elemento div com as informações do item
    
    valorTotal = parseFloat(valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    newRow.innerHTML = `
        <div class="col-md-12"><strong>Total:</strong> ${valorTotal}</div>
    `;

    // Adiciona a nova linha ao modalBodyContinuar
    modalBodyContinuar.appendChild(newRow);

}
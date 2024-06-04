// reabrir proposta
function reabrirProposta(dealId){

    urlApi = 'https://public-api2.ploomes.com/Deals('+ dealId +')/Reopen?$expand=Stages'

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-key': '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3' // Substitua por sua chave de usuário
        },
        body: body
    };

    fetch(urlApi, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }
            return response.json(); // Converter a resposta em JSON
        })
        .then(data => {
            // Sucesso na atualização da negociação
            console.log('Proposta reberta com sucesso', data);
        })
        .catch(error => {
            // Lidar com erros
            console.error('Erro ao atualizar a negociação:', error);
            exibirMensagem('aviso','Atualize a página e tente novamente');
        });
    
};

// recuperar itens da proposta e salvar no carrinho
function buscarItens(IdQuote) {
    var urlApi = 'https://public-api2.ploomes.com/Quotes@Products?$filter=QuoteId eq ' + IdQuote + '&$expand=Product($expand=OtherProperties)';

    var arrayDados = [];

    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'user-key': '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3' // Substitua por sua chave de usuário
        },
    };

    fetch(urlApi, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }
            return response.json(); // Converter a resposta em JSON
        })
        .then(data => {
            console.log(data.value);
            data.value.forEach(item => {

                const nameCarreta = item.Product.Code;
                const unitPrice = item.UnitPrice;
                const quantity = item.Quantity;
                const desconto = item.Discount;
                let cor = '';

                item.Product.OtherProperties.forEach(property => {
                    if (property.FieldKey === "product_42EC7CDC-0E97-435F-A787-F8FB40D109A1") {
                        cor = property.ObjectValueName;
                    }
                    
                });

                arrayDados.push({
                    codigo: nameCarreta,
                    cor: cor,
                    quantidade: quantity,
                    precoFinal: unitPrice,
                    precoInicial: unitPrice, // Assumindo que o precoInicial é o mesmo que precoFinal, ajuste conforme necessário
                    desconto: desconto
                });

            });

            // Chamar a função recuperarCarrinho com os dados coletados
            recuperarCarrinho(arrayDados);
        })
        .catch(error => {
            // Lidar com erros
            console.error('Erro ao buscar os itens:', error);
        });
}

function recuperarCarrinho(arrayDados) {
    const url = '/car-revisar'; // URL para a rota no backend
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(arrayDados)
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar a solicitação: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Resposta do servidor:', data);
        })
        .catch(error => {
            console.error('Erro durante a solicitação:', error);
        });
}

function recuperarProdutos(quoteId,dealId) {
    
    showSpinner();

    var buttonGanhar = document.querySelector('[data-button-id="' + quoteId + '"]');

    buttonGanhar.disabled = true;

    var data = {
        'dealId':dealId,
        'idUltimaProposta':quoteId,
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
    fetch('/ganhar', options)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Erro ao enviar requisição: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(function(data) {
            // Manipule a resposta aqui, se necessário
            applyFilters();
            hideSpinner();
            exibirMensagem('sucesso','Proposta ganha com sucesso.');
            buttonGanhar.disabled = false;
        })
        .catch(function(error) {
            // Caso ocorra algum erro durante a requisição
            console.error('Erro durante a requisição:', error);
            hideSpinner();
            exibirMensagem('aviso','Erro! Tente novamente.');
            buttonGanhar.disabled = false;
        });
};
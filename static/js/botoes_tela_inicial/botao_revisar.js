function confirmarRevisao(lista_product) {

    let products = [];

    lista_product.slice(1).forEach((product_id, i) => {

        let product_json = {
            'Quantity': parseInt(product_id["quantidade"]), //ok
            'UnitPrice': parseFloat(product_id["preco"]), //ok
            'Total': parseFloat(product_id["preco"]) * parseInt(product_id["quantidade"]), //ok
            'ProductId': product_id["produto"], //ok
            'Ordination': i,
            'OtherProperties': [
                {
                    'FieldKey': "quote_product_76A1F57A-B40F-4C4E-B412-44361EB118D8",  // Cor 
                    'IntegerValue': product_id["cor"] //ok
                },
                {
                    'FieldKey': "quote_product_E426CC8C-54CB-4B9C-8E4D-93634CF93455", // valor unit. c/ desconto
                    'DecimalValue': parseFloat(product_id["preco"]) //ok
                },
                {
                    'FieldKey': "quote_product_4D6B83EE-8481-46B2-A147-1836B287E14C",  // prazo dias
                    'StringValue': "45;" //ok
                },
                {
                    'FieldKey': "quote_product_7FD5E293-CBB5-43C8-8ABF-B9611317DF75", // % de desconto no produto
                    'DecimalValue': product_id["desconto"] !== "null" ? parseFloat(product_id["desconto"]) : null
                },
                {
                    'FieldKey': "quote_product_A0AED1F2-458F-47D3-BA29-C235BDFC5D55", // Total sem desconto
                    'DecimalValue': parseFloat(product_id["preco"]) * parseInt(product_id["quantidade"]) //ok
                },
            ]
        };
        products.push(product_json);
    });

    var outrasInformacoes = lista_product.slice(0,1)[0];

    var json_data = {
        "Id": parseInt(outrasInformacoes.IdQuote), //ok
        // "DealId": outrasInformacoes['DealId'], //ok
        "PersonId": parseInt(outrasInformacoes.PersonId), //ok
        "TemplateId": 196596,
        "Amount": parseFloat(outrasInformacoes.valorTotal), //ok
        // "Discount": discount, //ok
        "InstallmentsAmountFieldKey": "quote_amount",
        "Notes": outrasInformacoes.obs, //ok
        "Sections": [
            {
                "Code": 0,
                "Total": parseFloat(outrasInformacoes.valorTotal), //ok
                "OtherProperties": [
                    {
                        "FieldKey": "quote_section_8136D2B9-1496-4C52-AB70-09B23A519286",  // Prazo conjunto
                        "StringValue": "045;"
                    },
                    {
                        "FieldKey": "quote_section_0F38DF78-FE65-471C-A391-9E8759470D4E",  // Total
                        "DecimalValue": parseFloat(outrasInformacoes.valorTotal) //ok
                    },
                    {
                        "FieldKey": "quote_section_0E7B5C7B-AD6B-480F-B55E-7F7ABEC4B08C", // Total sem desconto
                        "DecimalValue": parseFloat(outrasInformacoes.valorTotal) //ok
                    },
                    {
                        "FieldKey": "quote_section_64320D57-6350-44AB-B849-6A6110354C79",  // Total de itens
                        "IntegerValue": parseInt(outrasInformacoes.totalQuantidade) //ok
                    }
                ],
                "Products": products //ok
            }
        ],
        "OtherProperties": [
            {
                "FieldKey": "quote_0FB9F0CB-2619-44C5-92BD-1A2D2D818BFE",  // Forma de pagamento
                "IntegerValue": outrasInformacoes.inputFormaPagamento.Id //ok
            },
            {
                "FieldKey": "quote_DE50A0F4-1FBE-46AA-9B5D-E182533E4B4A",  // Texto simples
                "StringValue": outrasInformacoes.inputFormaPagamentoTexto //ok
            },
            {
                "FieldKey": "quote_E85539A9-D0D3-488E-86C5-66A49EAF5F3A",  // Condições de pagamento
                "IntegerValue": outrasInformacoes.idCondicaoPagamento.Id //ok
            },
            {
                "FieldKey": "quote_F879E39D-E6B9-4026-8B4E-5AD2540463A3",  // Tipo de frete
                "IntegerValue": 22886508
            },
            {
                "FieldKey": "quote_6D0FC2AB-6CCC-4A65-93DD-44BF06A45ABE",  // Validade
                "IntegerValue": 18826538
            },
            {
                "FieldKey": "quote_520B942C-F3FD-4C6F-B183-C2E8C3EB6A33",  // Prazo de entrega
                "IntegerValue": 45
            },
            {
                "FieldKey": "quote_82F9DE57-6E06-402A-A444-47F350284117", // Atualizar dados
                "BoolValue": true
            },
            {
                "FieldKey": "quote_16CDE30A-C6F1-4998-8B73-661CF89160B8", // Permissão - Condicões de pagamento
                "StringValue": "Permitido"
            }
        ]
    }

    salvarRevisao(json_data,outrasInformacoes.IdQuote);

}

document.getElementById('confirmarGerarProposta_revisar').addEventListener('click', function() {
    var nomeGerarProposta = document.getElementById('nomeGerarProposta').dataset.id;
    var contatoGerarProposta = document.getElementById('contatoGerarProposta').dataset.id;
    var inputFormaPagamento = document.getElementById('inputFormaPagamento').value;
    var observacaoGerarProposta = document.getElementById('observacaoGerarPropostaConsulta').value;
    var elementosProdutoInput = document.querySelectorAll('[id="produtoInput"]');
    var quoteId = document.getElementById('quoteId').value;
    var valorTotalCarrinho = document.getElementById('valorTotalCarrinho').value;

    var listaProdutos = [];

    var totalQuantidade = 0; // Inicializa a variável totalQuantidade

    // Crie um array para armazenar todas as chamadas assíncronas
    var promises = [];

    // Itera sobre os elementos encontrados
    elementosProdutoInput.forEach(function(elemento) {
        // Obtém os valores dos outros campos relacionados ao produto
        var quantidade = elemento.closest('.row').querySelector('[id="quantidadeItens"]').value;
        var cor = elemento.closest('.row').querySelector('[id="selectCor"]').value;
        var preco = elemento.closest('.row').querySelector('[id="precoUnitItem"]').value;
        var desconto = elemento.closest('.row').querySelector('[id="desconto"]').value;
        
        totalQuantidade += parseInt(quantidade, 10);

        // Adicione a chamada assíncrona ao array de promessas
        promises.push(new Promise(async (resolve, reject) => {
            try {
                // Obter o ID do produto de forma assíncrona
                var idProduto = await idProdutos(elemento.value);
                // Obter o ID da cor de forma assíncrona
                var idCor = await idCores(cor);

                // Cria um objeto representando o produto atual e o adiciona à lista
                var produto = {
                    produto: idProduto,
                    quantidade: quantidade,
                    cor: idCor,
                    preco: preco,
                    desconto: desconto
                };

                resolve(produto); // Resolva a promessa com o produto
            } catch (error) {
                reject(error);
            }
        }));
    });

    // Aguarde que todas as promessas sejam resolvidas
    Promise.all(promises).then(async (produtos) => {
        // Obter os valores de forma de pagamento e condição de pagamento de forma assíncrona
        var formaPagamentoId = await idFormaPagamento(inputFormaPagamento);
        var condicaoPagamentoId = await idCondicaoPagamento(inputFormaPagamento);

        // Cria o objeto inicial com as informações gerais e `totalQuantidade`
        var dadosIniciais = {
            'IdQuote': quoteId,
            'ContactId': nomeGerarProposta,
            'PersonId': contatoGerarProposta,
            'inputFormaPagamento': formaPagamentoId,
            'inputFormaPagamentoTexto': inputFormaPagamento,
            'idCondicaoPagamento': condicaoPagamentoId,
            'obs': observacaoGerarProposta,
            'valorTotal': parseFloat(valorTotalCarrinho.replace(/[^\d,]/g, '').replace(',', '.')),
            'totalQuantidade': totalQuantidade
        };

        // Adicione o objeto inicial no índice 0
        listaProdutos.push(dadosIniciais);
        // Adicione todos os produtos resolvidos à lista de produtos
        listaProdutos.push(...produtos);

        // Chame a função de confirmação com a lista de produtos completa
        confirmarRevisao(listaProdutos);
    }).catch((error) => {
        console.error('Erro ao obter dados assíncronos:', error);
    });
});

function idProdutos(carreta) {
    return new Promise((resolve, reject) => {
        const apiUrl = 'https://public-api2.ploomes.com/Products?$top=1&$filter=Code+eq+\'' + carreta + '\'&$select=Id';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);
        xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

        xhr.onload = function () {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                // Manipular os dados recebidos da API aqui
                resolve(data.value[0].Id); // Alterado para data.value[0].Id para acessar o Id corretamente
            } else {
                console.error('Erro ao chamar a API:', xhr.statusText);
                reject(xhr.statusText);
            }
        };
        xhr.onerror = function () {
            console.error('Erro ao chamar a API.');
            reject('Erro ao chamar a API.');
        };
        xhr.send();
    });
};

function idCores(cor) {
    return new Promise((resolve, reject) => {
        const apiUrl = 'https://public-api2.ploomes.com/Fields@OptionsTables@Options?$select=Id&$filter=TableId+eq+36909 and Name+eq+\'' + cor + '\'';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);
        xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

        xhr.onload = function () {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                // Manipular os dados recebidos da API aqui
                resolve(data.value[0].Id); // Alterado para data.value[0].Id para acessar o Id corretamente
            } else {
                console.error('Erro ao chamar a API:', xhr.statusText);
                reject(xhr.statusText);
            }
        };
        xhr.onerror = function () {
            console.error('Erro ao chamar a API.');
            reject('Erro ao chamar a API.');
        };
        xhr.send();
    });
};

function idFormaPagamento(formaPagamento) {
    return new Promise((resolve, reject) => {
        const apiUrl = 'https://public-api2.ploomes.com/Fields@OptionsTables@Options?$select=Id&$filter=TableId+eq+31965 and Name+eq+\'' + formaPagamento + '\'';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);
        xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

        xhr.onload = function () {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                // Manipular os dados recebidos da API aqui
                resolve(data.value[0]);
            } else {
                console.error('Erro ao chamar a API:', xhr.statusText);
                reject(xhr.statusText);
            }
        };
        xhr.onerror = function () {
            console.error('Erro ao chamar a API.');
            reject('Erro ao chamar a API.');
        };
        xhr.send();
    });
};

function idCondicaoPagamento(formaPagamento) {
    return new Promise((resolve, reject) => {
        const apiUrl = 'https://public-api2.ploomes.com/Fields@OptionsTables@Options?$select=Id&$filter=TableId+eq+32062 and Name+eq+\'' + formaPagamento + '\'';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);
        xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

        xhr.onload = function () {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                // Manipular os dados recebidos da API aqui
                resolve(data.value[0]);
            } else {
                console.error('Erro ao chamar a API:', xhr.statusText);
                reject(xhr.statusText);
            }
        };
        xhr.onerror = function () {
            console.error('Erro ao chamar a API.');
            reject('Erro ao chamar a API.');
        };
        xhr.send();
    });
};

function salvarRevisao(data,IdQuote) {

    showSpinner();

    // Configurar as opções da requisição
    var options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Key': '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3'
        },
        body: JSON.stringify(data) // Converta os dados para JSON
    };

    // Realizar a requisição POST
    fetch('https://api2.ploomes.com/Quotes('+IdQuote+')/Review', options)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Erro ao enviar requisição: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(function (data) {
            // Manipule a resposta aqui, se necessário
            hideSpinner();
            exibirMensagem('sucesso', 'Revisão feita com sucesso.');
            reenviarEmail();
            window.location.href = '/';
            
        })
        .catch(function (error) {
            // Caso ocorra algum erro durante a requisição
            hideSpinner();
            exibirMensagem('aviso', 'Erro! Tente novamente.');
        });
    
};

function reenviarEmail() {

    var dealId = document.getElementById('dealId').value;
    nomeCliente = document.getElementById('nomeGerarProposta').value;

    var data = {
        'dealId':dealId,
        'nomeCliente':nomeCliente,
    }

    // Configurações da requisição
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    // URL para enviar a requisição POST
    var url = '/reenviarEmail';

    // Envia a requisição POST usando fetch()
    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar a requisição POST');
            }
            return response.json(); // Se desejar, você pode tratar a resposta aqui
        })
        .then(data => {
            console.log('Requisição POST enviada com sucesso:', data);
        })
        .catch(error => {
            console.error('Erro ao enviar a requisição POST:', error);
        });
};
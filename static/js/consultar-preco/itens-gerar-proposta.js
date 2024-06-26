function getPrecosGerarProposta() {

    showSpinner();

    var listaPrecoCliente = document.getElementById('revisarProposta').value;

    // Dados a serem enviados como parâmetros de consulta

    // Construção da URL com os parâmetros de consulta
    var url = new URL('/precos-consulta', window.location.origin); // URL base
    
    if (listaPrecoCliente){
        url.searchParams.append('listaPrecoCliente', listaPrecoCliente);
    }

    // Object.keys(queryParams).forEach(key => url.searchParams.append(key, queryParams[key])); // Adiciona os parâmetros de consulta à URL

    // Configuração da solicitação
    var options = {
        method: 'GET', // Método GET
        headers: {
            'Content-Type': 'application/json' // Especifica o tipo de conteúdo esperado na resposta
        }
    };

    // Envio da solicitação
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar a solicitação: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(data => {
            construirTabelaGerarProposta(data.data, data.representante);

            arrayListaPreco = [[listaPrecoCliente]];

            popularSelect('idDescricao', extrairValoresUnicos(data.data, 8));
            popularSelect('idModelo', extrairValoresUnicos(data.data, 11));
            popularSelect('idEixo', extrairValoresUnicos(data.data, 7));
            popularSelect('idMolaFreio', extrairValoresUnicos(data.data, 5));
            popularSelect('idTamanho', extrairValoresUnicos(data.data, 1));
            popularSelect('idRodado', extrairValoresUnicos(data.data, 4));
            popularSelect('idPneu', extrairValoresUnicos(data.data, 10));
            popularSelect('idOpcionais', extrairValoresUnicos(data.data, 14));
            
            if (listaPrecoCliente){ 
                popularSelect('idListasPreco', extrairValoresUnicos(arrayListaPreco, 0));
            } else {
                popularSelect('idListasPreco', extrairValoresUnicos(data.data, 21));
            }
            
            hideSpinner();
        })
        .catch(error => {
            console.error('Erro durante a solicitação:', error);
            hideSpinner();
        });
};

function construirTabelaGerarProposta(data, representante) {

    var tbody = document.getElementById('bodyTabelaGerarProposta');

    // Limpa o corpo da tabela antes de adicionar os novos dados
    tbody.innerHTML = '';

    data.forEach(function (row) {
        var variavel1 = row[24];

        var favoritoCheckbox = '';
        if (variavel1 === 'on') {
            favoritoCheckbox = `
                <input class="btn btn-secondary btn-sm favorito-btn" type="checkbox" name="favorito" id="favorito" data-row-id="${row[0]}" checked> 
                <span class="slider round"></span>
            `;
        } else {
            favoritoCheckbox = ` 
                <input class="btn btn-secondary btn-sm favorito-btn" type="checkbox" name="favorito" id="favorito" data-row-id="${row[0]}"> 
                <span class="slider round"></span>
            `;
        }

        var tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-title="Modelo" data-label="Modelo">${row[11]}</td>
            <td data-title="Código" data-label="Código" id="codigo">${row[0]}</td>
            <td data-title="Descrição" data-label="Descrição" class="descricao-dropdown">${row[13]}</td>
            <td data-title="Cor" data-label="Cor">
                <select id="cor" class="form-control">
                    <option value="Laranja" selected>Laranja</option>
                    <option value="Verde">Verde</option>
                    <option value="Vermelha">Vermelha</option>
                    <option value="Azul">Azul</option>
                    <option value="Amarela">Amarela</option>
                </select>
            </td>
            <td data-title="Preço tab." data-label="Preço" style="white-space: nowrap;">
                <select id="preco" class="form-control">
                    <option value="${row[20]}" selected>${row[20]}</option>
                    ${representante != 'Lucas Gallo' && representante != 'Renato Rodi' ?
                (row[22] !== '' ? `<option value="${row[22]}">Promo: ${row[22]}</option>` : '') +
                (row[23] !== '' ? `<option value="${row[23]}">Promo c/Frete: ${row[23]}</option>` : '')
                : ''}
                </select>
            </td>
            <td data-title="% Desc." data-label="% de Desconto">
                <input class="row-data form-control" id="desconto" name="desconto" placeholder="%" oninput="updatePriceDesconto(event);">
            </td>
            <td data-title="Preço final" data-label="Preço Final">
                <input class="row-data form-control" id="precoFinal" name="preco" placeholder="Preço c/ desc." oninput="updatePrice(event);">
            </td>
            <td data-title="Fav." data-label="Favorito">
                <div class="toggle" id="maquina-parada-toggle">
                    <label class="switch2">
                        ${favoritoCheckbox}
                    </label>
                </div>
            </td>
            <td data-title="Selec." data-label="Selecionar">
                <button class="botao-enviar-carrinho btn btn-primary btn-sm" id="botão_enviar_carrinho">Enviar</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

};

function extrairValoresUnicos(data, coluna) {
    let valoresUnicos = new Set();
    data.forEach(row => {
        valoresUnicos.add(row[coluna]);
    });
    return Array.from(valoresUnicos);
}

function popularSelect(id, dados, valorSelecionado) {
    
    let select = document.getElementById(id);

    // Limpar o select
    select.innerHTML = "";

    // Adicionar uma opção em branco
    let optionEmBranco = document.createElement("option");
    optionEmBranco.text = "Todos";
    optionEmBranco.value = "";
    select.appendChild(optionEmBranco);

    // Adicionar as opções fornecidas nos dados
    dados.forEach(valor => {
        let option = document.createElement("option");
        option.text = valor;
        option.value = valor;

        // Se o valor atual for igual ao valor selecionado, marque-o como selecionado
        if (valor === valorSelecionado) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}

function atualizarTabelaFiltro() {

    showSpinner();

    var listaPrecoCliente = document.getElementById('revisarProposta').value;
    
    var listas;

    if (listaPrecoCliente){
        var listas = listaPrecoCliente;
    } else {
        var listas = document.getElementById('idListasPreco').value;
    }

    var categoria = document.getElementById('idDescricao').value;
    var modelo = document.getElementById('idModelo').value;
    var eixo = document.getElementById('idEixo').value;
    var molaFreio = document.getElementById('idMolaFreio').value;
    var tamanho = document.getElementById('idTamanho').value;
    var rodado = document.getElementById('idRodado').value;
    var pneu = document.getElementById('idPneu').value;
    var opcionais = document.getElementById('idOpcionais').value;

    // Dados a serem enviados como parâmetros de consulta
    var queryParams = {
        categoria: categoria,
        modelo: modelo,
        eixo: eixo,
        molaFreio: molaFreio,
        tamanho: tamanho,
        rodado: rodado,
        pneu: pneu,
        opcionais: opcionais,
        listas: listas,

    };

    // Construção da URL com os parâmetros de consulta
    var url = new URL('/atualizar-dados-sem-cliente', window.location.origin); // URL base
    Object.keys(queryParams).forEach(key => url.searchParams.append(key, queryParams[key])); // Adiciona os parâmetros de consulta à URL

    // Configuração da solicitação
    var options = {
        method: 'GET', // Método GET
        headers: {
            'Content-Type': 'application/json' // Especifica o tipo de conteúdo esperado na resposta
        }
    };

    // Envio da solicitação
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar a solicitação: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(data => {
            construirTabelaGerarProposta(data.data, data.representante);

            popularSelect('idDescricao', extrairValoresUnicos(data.data, 8), categoria);
            popularSelect('idModelo', extrairValoresUnicos(data.data, 11), modelo);
            popularSelect('idEixo', extrairValoresUnicos(data.data, 7), eixo);
            popularSelect('idMolaFreio', extrairValoresUnicos(data.data, 5), molaFreio);
            popularSelect('idTamanho', extrairValoresUnicos(data.data, 1), tamanho);
            popularSelect('idRodado', extrairValoresUnicos(data.data, 4), rodado);
            popularSelect('idPneu', extrairValoresUnicos(data.data, 10), pneu);
            popularSelect('idOpcionais', extrairValoresUnicos(data.data, 14), opcionais);
            popularSelect('idListasPreco', extrairValoresUnicos(data.data, 21), listas);

            hideSpinner();
        })
        .catch(error => {
            console.error('Erro durante a solicitação:', error);
            hideSpinner();
        });
};

function limparSelect() {
    let selectDescricao = document.getElementById("idDescricao");
    selectDescricao.selectedIndex = -1; // Define o índice selecionado como -1 para deselecionar todas as opções
}

document.getElementById('idDescricao').addEventListener("change", atualizarTabelaFiltro);
document.getElementById('idModelo').addEventListener("change",   atualizarTabelaFiltro);
document.getElementById('idEixo').addEventListener("change", atualizarTabelaFiltro);
document.getElementById('idMolaFreio').addEventListener("change", atualizarTabelaFiltro);
document.getElementById('idTamanho').addEventListener("change", atualizarTabelaFiltro);
document.getElementById('idRodado').addEventListener("change", atualizarTabelaFiltro);
document.getElementById('idPneu').addEventListener("change", atualizarTabelaFiltro);
document.getElementById('idOpcionais').addEventListener("change", atualizarTabelaFiltro);
document.getElementById('idListasPreco').addEventListener("change", atualizarTabelaFiltro);

// Função para tratar caso o usuario altere o campo de desconto
function updatePriceDesconto(event) {
    const descontoInput = event.target;
    const row = descontoInput.closest('tr');
    const selectPreco = row.querySelector('#preco');
    const precoSelecionadoTexto = selectPreco.value;
    const precoSelecionadoNumerico = parseFloat(precoSelecionadoTexto.replace(/[^\d,]/g, '').replace(',', '.'));
    const desconto = parseFloat(descontoInput.value);
    const precoFinalInput = row.querySelector('#precoFinal');

    if (!isNaN(desconto) && !isNaN(precoSelecionadoNumerico)) {
        const precoComDesconto = precoSelecionadoNumerico - (precoSelecionadoNumerico * (desconto / 100));
        const precoComDescontoFormatado = precoComDesconto.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        precoFinalInput.value = precoComDescontoFormatado;
    }
}

// Função para tratar caso o usuario altere o campo de preco com desconto
function updatePrice(event) {
    const descontoInput = event.target;
    const row = descontoInput.closest('tr');
    const selectPreco = row.querySelector('#preco');
    const precoSelecionadoTexto = selectPreco.value;
    const precoSelecionadoNumerico = parseFloat(precoSelecionadoTexto.replace(/[^\d,]/g, '').replace(',', '.'));
    const precoComDesconto = row.querySelector('#precoFinal').value;

    if (precoComDesconto === '') {
        row.querySelector('#desconto').value = '';
        return;
    }

    const precoComDescontoNumerico = parseFloat(precoComDesconto.replace(/[^\d,]/g, '').replace(',', '.'));

    if (!isNaN(precoComDescontoNumerico)) {
        const desconto = ((precoSelecionadoNumerico - precoComDescontoNumerico) / precoSelecionadoNumerico) * 100;
        const descontoFormatado = desconto.toFixed(2); // Arredonda para 2 casas decimais
        row.querySelector('#desconto').value = descontoFormatado;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    getPrecosGerarProposta();
});
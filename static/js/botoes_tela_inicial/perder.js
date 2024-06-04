async function perderNegocio(dealId) {

    try {
        var motivos = await fetchApiMotivos();

        // Seleciona o elemento select
        var selectMotivos = document.getElementById('idOpcoesMotivoPerda');

        // Limpa o select de opções existentes
        selectMotivos.innerHTML = '';

        // Adiciona opções para cada motivo
        motivos.value.forEach((element, index) => {
            var option = document.createElement('option');
            option.value = element.Id;
            option.textContent = element.Name;
            selectMotivos.appendChild(option);

            // Se for a primeira opção, marque como selecionada
            if (index === 0) {
                option.selected = true;
            }
        });

    } catch (error) {
        console.error('Erro ao buscar motivos:', error);
    }

    var buttonSalvarPerda = document.getElementById('salvarMotivoPerda');
    buttonSalvarPerda.setAttribute('data-deal-id',dealId);

}

function salvarNegocioPerdido(dealId) {

    var selectIdMotivoPerda = document.getElementById('idOpcoesMotivoPerda').value;
    var infoAdicional = document.getElementById('idMaisDetalhes').value;

    showSpinner();  

    var data = {
        'dealId':dealId,
        'selectMotivoId':selectIdMotivoPerda,
        'informacoesAdicionais': infoAdicional
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
    fetch('/perda', options)
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

            exibirMensagem('sucesso','Proposta perdida com sucesso.');
        })
        .catch(function(error) {
            // Caso ocorra algum erro durante a requisição
            console.error('Erro durante a requisição:', error);
            hideSpinner();
            exibirMensagem('aviso','Erro! Tente novamente.');
        });
};

document.addEventListener('DOMContentLoaded', function() {
    // Seleciona o botão pelo seu ID
    var button = document.getElementById('salvarMotivoPerda');

    // Adiciona um ouvinte de eventos de clique ao botão
    button.addEventListener('click', function() {
        // Obtém o valor do atributo data-deal-id do botão clicado
        var dataDealId = this.getAttribute('data-deal-id');
        console.log('O valor do data-deal-id é:', dataDealId);
        salvarNegocioPerdido(dataDealId);
    });
});

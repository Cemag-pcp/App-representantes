// Enviar post para /ganhar

function ganharNegocio(quoteId,dealId) {
    
    showSpinner();

    // Recuperar dado
    const dealIdLocal = localStorage.getItem('dealId');

    if (dealIdLocal == dealId){
        exibirMensagem('aviso','Erro! Proposta já ganha.');
        hideSpinner();
        window.location.reload();
        return;
    }
    // Armazenar dealId
    localStorage.setItem('dealId', dealId);


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
            // Remover dado caso der certo
            if (dealIdLocal){
                localStorage.removeItem('dealId');
            }
            
        })
        .catch(function(error) {
            // Caso ocorra algum erro durante a requisição
            console.error('Erro durante a requisição:', error);
            hideSpinner();
            exibirMensagem('aviso','Erro! Tente novamente.');
            buttonGanhar.disabled = false;
            // Remover dado caso der errado também
            if (dealIdLocal){
                localStorage.removeItem('dealId');
            }
        });
};
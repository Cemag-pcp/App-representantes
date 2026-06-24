// Enviar post para /ganhar

function ganharNegocio(quoteId,dealId) {
    
    showSpinner();

    // Recuperar dado
    const dealIdLocal = localStorage.getItem('dealId');

    if (dealIdLocal == dealId){
        // Trava de uma tentativa anterior que não foi limpa corretamente: libera e tenta de novo
        localStorage.removeItem('dealId');
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
            // A trava do localStorage é só para esta tentativa: sempre remover ao final
            localStorage.removeItem('dealId');

            if (data && data.erro) {
                hideSpinner();
                exibirMensagem('aviso', data.erro);
                buttonGanhar.disabled = false;
                return;
            }

            // Esconde os botões de Ganhar/Perder na hora, sem depender do
            // refetch da API externa (que pode demorar a refletir o ganho)
            const row = buttonGanhar.closest('tr');
            buttonGanhar.style.display = 'none';
            if (row) {
                const botaoPerderRow = row.querySelector('[data-target="#modalPerderNegocio"]');
                if (botaoPerderRow) {
                    botaoPerderRow.style.display = 'none';
                }
            }

            hideSpinner();
            exibirMensagem('sucesso','Proposta ganha com sucesso.');
        })
        .catch(function(error) {
            // Caso ocorra algum erro durante a requisição
            console.error('Erro durante a requisição:', error);
            localStorage.removeItem('dealId');
            hideSpinner();
            exibirMensagem('aviso','Erro! Tente novamente.');
            buttonGanhar.disabled = false;
        });
};
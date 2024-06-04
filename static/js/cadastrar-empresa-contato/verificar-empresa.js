var nomeEmpresa = document.getElementById('inputNomeRevenda');
var verificacaoNomeEmpresa = document.getElementById('verificacaoNomeEmpresa');
var cnpjEmpresa = document.getElementById('inputCnpjRevenda');
var verificacaoCnpj = document.getElementById('verificacaoCnpj');

async function verificarNomeEmpresa(nomeEmpresa) {
    const apiUrl = 'https://public-api2.ploomes.com/Contacts?$expand=Company($select=Id,Name)&$skip=0&$top=5&$filter=TypeId eq 1 and Name eq \'' + nomeEmpresa + '\'&$select=Id,Name,CNPJ&$orderby=Name&$count=true';

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'user-key': '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar dados da API: ' + response.statusText);
        }

        const data = await response.json();

        // Retorne os dados da resposta da API para que possam ser usados externamente
        return data;
    } catch (error) {
        console.error('Erro na solicitação:', error);
        throw error; // Propagar o erro para o código que chamou a função
    }
}

// Adicione um evento de escuta para o evento 'input' no campo de entrada
nomeEmpresa.addEventListener('input', async function() {
    // Obtém o valor digitado pelo usuário no campo de entrada
    const nomeDigitado = nomeEmpresa.value.trim();

    // Verifica se o nome da empresa não está vazio
    if (nomeDigitado !== '') {
        try {
            // Chama a função verificarNomeEmpresa para verificar se o nome da empresa existe
            const nomeExiste = await verificarNomeEmpresa(nomeDigitado);
            
            // Exibe uma mensagem para o usuário com base no resultado da verificação
            if (nomeExiste['@odata.count'] === 1) {
                verificacaoNomeEmpresa.style.display = 'block';
            } else {
                verificacaoNomeEmpresa.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao verificar o nome da empresa:', error);
        }
    } else {
        // Se o campo estiver vazio, exibe uma mensagem para o usuário
        console.log('Por favor, digite o nome da empresa.');
    }
});

cnpjEmpresa.addEventListener('input', async function() {
    // Obtém o valor digitado pelo usuário no campo de entrada
    const cnpjDigitado = cnpjEmpresa.value.trim();
    
    const validadorCnpj = validarCNPJ(cnpjDigitado);
    if (validadorCnpj){
        verificacaoCnpj.style.display = 'none';
    } else {
        // Se o campo estiver vazio, exibe uma mensagem para o usuário
        verificacaoCnpj.style.display = 'block';
    }
});

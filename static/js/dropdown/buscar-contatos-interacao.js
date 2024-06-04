async function buscarContatos(revenda) {
    var idLogin = parseFloat(document.getElementById('idLogin').innerHTML);
    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';
    var filter = `CompanyId+eq+${revenda}`;
    var apiUrl = `https://public-api2.ploomes.com/Contacts?$top=100&$select=Name,Id&$filter=${filter} and TypeId+eq+2 and OwnerId+eq+${idLogin}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Key': apiKey
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar contatos: ' + response.statusText);
        }
        const result = await response.json();
        console.log('Contatos recebidos:', result); // Log dos resultados no console
        popularContatos(result.value); // Chama a função para popular o select

        return result;
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        throw error;
    }
}

function popularContatos(contatos) {
    var selectElement = document.getElementById('contatoGerarProposta');
    selectElement.innerHTML = ''; // Limpa as opções existentes

    // Adiciona a opção padrão
    var defaultOption = document.createElement('option');
    defaultOption.text = '';
    defaultOption.value = '';
    selectElement.add(defaultOption);

    // Adiciona as novas opções
    contatos.forEach(function (contato) {
        var option = document.createElement('option');
        option.text = contato.Name;
        option.value = contato.Id;
        selectElement.add(option);
    });
}

// Exemplo de chamada da função buscarContatos
document.getElementById('empresaCadastradaInteracao2').addEventListener('change', function () {
    var revenda = this.value; // Obtém o valor da revenda selecionada

    buscarContatos(revenda)
        .then(contatos => {
            // A função popularContatos já é chamada dentro de buscarContatos, então não é necessário fazer nada aqui
        })
        .catch(error => {
            console.error('Erro ao buscar contatos:', error);
        });
});

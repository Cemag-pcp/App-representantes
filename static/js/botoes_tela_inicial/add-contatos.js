// Função assíncrona para lidar com a chamada para a API e processar os dados
async function buttonAddContatos(contactName, contactId, quoteId) {
    
    // console.log(contactName,contactId,quoteId);

    // Atualiza o título do modal
    document.getElementById('labelTitleModalAddContato').innerHTML = 'Inserir contato para ' + contactName;
    document.getElementById('idInserirContato').value = '';

    // Adiciona eventos aos elementos
    document.getElementById('idInserirContato').addEventListener('click', showList);
    document.getElementById('idInserirContato').addEventListener('input', filterList);
    document.getElementById('idInserirContato').addEventListener('blur', validateInput);
    document.addEventListener('click', hideList);

    // Adiciona evento a cada item da lista para permitir a seleção
    document.getElementById('contatoList').addEventListener('click', selectItem);
    
    const ul = document.querySelector('.modal-body ul');
    ul.innerHTML = '';

    // Cria a URL da API
    const apiUrl = `https://public-api2.ploomes.com/Contacts?$expand=Company($select=Id,Name)&$skip=0&$top=20&$filter=TypeId+eq+2+and+(CompanyId+eq+${contactId}+or+Companies/any(c:+c/CompanyId+eq+${contactId}))&$select=Id,Name,TypeId,CurrencyId,Register,CPF,CNPJ,Owner,Email,LegalName,IdentityDocument&$orderby=Name&preload=true`;

    // Chama a função fetchData para obter os dados da API
    const data = await fetchData(apiUrl);

    // Verifica se data.value existe e é um array antes de iterar
    if (data && Array.isArray(data.value)) {
        popularListaOpcoesContatos(ul,data);
    } else {
        console.error('Os dados retornados não contêm a propriedade "value" ou ela não é um array.');
    }
}

// Função assíncrona para fazer a chamada para a API
async function fetchData(apiUrl) {
    try {
        // Faça a requisição para a API usando a função fetch
        const response = await fetch(apiUrl, {
            method: 'GET', // Método da requisição
            headers: {
                'user-key': '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3',
                'Content-Type': 'application/json'
            }
        });

        // Verifique se a resposta é OK (status 200)
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        // Converta a resposta para JSON
        const data = await response.json();

        // Retorna os dados para o chamador
        return data;

    } catch (error) {
        // Trate possíveis erros
        console.error('Erro ao chamar a API:', error);
    }
}

function guardarContato() {
    const idContato = Number(document.getElementById('idInserirContato').getAttribute('data-id-contato'));
    const idDeal = Number(document.getElementById('idInserirContato').getAttribute('data-id'));

    console.log('ID do Contato:', idContato);
    console.log('ID do Deal:', idDeal);

    if (idContato && idDeal) { // Se o contato e o deal foram preenchidos
        const urlApi = `https://api2.ploomes.com/Deals(${idDeal})`;

        const body = JSON.stringify({
            PersonId: idContato // Verifique se apenas 'PersonId' é necessário
        });

        const options = {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'user-key': '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3' // Chave sensível, use com cuidado
            },
            body: body
        };

        console.log('Corpo da requisição:', body);

        fetch(urlApi, options)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error(`Erro na requisição: ${response.status} - ${text}`);
                        throw new Error(`Erro na requisição: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Contato atualizado com sucesso:', data);
                applyFilters();
                exibirMensagem('sucesso', 'Contato salvo');
            })
            .catch(error => {
                console.error('Erro ao atualizar a negociação:', error);
                exibirMensagem('aviso', 'Atualize a página e tente novamente');
            });
    } else {
        exibirMensagem('aviso', 'Escolha uma opção dentro da lista');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('salvarContato').addEventListener('click', guardarContato);
});
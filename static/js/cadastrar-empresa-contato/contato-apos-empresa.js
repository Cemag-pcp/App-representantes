var empresaCadastrada = document.getElementById('inputNomeRevenda')
var buttonContinuarCriarContato = document.getElementById('continuarCriarContatoAposEmpresa')
var titleModalCadastrar = document.getElementById('title-modal-cadastrar-contato');
var btSalvarCadastroContato_1 = document.getElementById('salvarCadastroContato_1');
var idLogin = document.getElementById('idLogin').value;
var empresaCadastradaContato = document.getElementById('empresaCadastrada');

buttonContinuarCriarContato.addEventListener('click', function () {

    var cnpj = document.getElementById('inputCnpjRevenda').value;
    var telefoneEmpresa = document.getElementById('telefoneEmpresa').value;

    titleModalCadastrar.innerHTML = 'Cadastrar contato para: ' + empresaCadastrada.value;
    empresaCadastradaContato.value = empresaCadastrada.value;
    empresaCadastradaContato.disabled = true;

    criarEmpresa(empresaCadastrada.value, cnpj, telefoneEmpresa);

});

function idCompania(nome) {

    const apiUrl = 'https://public-api2.ploomes.com/Contacts?$expand=Company($select=Id,Name)&$skip=0&$top=1&$filter=TypeId eq 1 and Name eq \'' + nome + '\'&$select=Id,Name,CNPJ&$orderby=Name&$count=true';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl);
    xhr.setRequestHeader('User-Key', '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3');

    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            // Manipular os dados recebidos da API aqui
            btSalvarCadastroContato_1.setAttribute('data-id', data.value[0].Id)
        } else {
            console.error('Erro ao chamar a API:', xhr.statusText);
        }
    };
    xhr.onerror = function () {
        console.error('Erro ao chamar a API.');
    };
    xhr.send();

};

// Criar empresa
function criarEmpresa(nomeEmpresa, CNPJ, telefone) {

    showSpinner();

    var idCidade = document.getElementById('inputCidadeRevenda').dataset.id;
    var typePhone = document.getElementById('typePhone1').value;

    var data = {

        "Name": nomeEmpresa,
        "TypeId": 1,
        "Register": CNPJ,
        "StatusId": 103544,
        "OwnerId": idLogin,
        "CityId": idCidade,
        "Phones": [
            {
                "PhoneNumber": telefone,
                "TypeId": typePhone,
                "CountryId": 76
            }
        ]

    };

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
    fetch('https://api2.ploomes.com/Contacts?$select=Id', options)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Erro ao enviar requisição: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(function (data) {
            // Manipule a resposta aqui, se necessário
            hideSpinner();
            criarNegocioEmpresa(data.value[0].Id)
            exibirMensagem('sucesso', 'Empresa criada com sucesso');
        })
        .catch(function (error) {
            // Caso ocorra algum erro durante a requisição
            hideSpinner();
            exibirMensagem('aviso', 'Erro! Tente novamente.');
        });
};

// Criar negocio para empresa
function criarNegocioEmpresa(ContactId) {

    var empresaCadastrada = document.getElementById('empresaCadastrada');
    empresaCadastrada.setAttribute('data-id',ContactId);

    showSpinner();

    var idLogin = document.getElementById('idLogin').value;

    var data = {
        "ContactId": ContactId,
        "OwnerId": idLogin,
        "StageId":174788,
        // "PersonId": personId,
    };

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
    fetch('https://api2.ploomes.com/Deals', options)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Erro ao enviar requisição: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(function (data) {
            hideSpinner();
            exibirMensagem('sucesso', 'Empresa criada com sucesso.');
        })
        .catch(function (error) {
            hideSpinner();
            exibirMensagem('aviso', 'Erro! Tente novamente.');
        });


};

document.addEventListener('DOMContentLoaded', (event) => {
    const inputNomeRevenda = document.getElementById('inputNomeRevenda');
    const telefoneEmpresa = document.getElementById('telefoneEmpresa');
    const inputCnpjRevenda = document.getElementById('inputCnpjRevenda');
    const inputCidadeRevenda = document.getElementById('inputCidadeRevenda');
    const continuarButton = document.getElementById('continuarCriarContatoAposEmpresa');

    function checkInputs() {
        if (
            inputNomeRevenda.value.trim() !== '' &&
            telefoneEmpresa.value.trim() !== '' &&
            inputCnpjRevenda.value.trim() !== '' &&
            inputCidadeRevenda.value.trim() !== '' &&
            validarCNPJ(inputCnpjRevenda.value)
        ) {
            continuarButton.disabled = false;
        } else {
            continuarButton.disabled = true;
        }
    }

    inputNomeRevenda.addEventListener('input', checkInputs);
    telefoneEmpresa.addEventListener('input', checkInputs);
    inputCnpjRevenda.addEventListener('input', checkInputs);
    inputCidadeRevenda.addEventListener('input', checkInputs);
});
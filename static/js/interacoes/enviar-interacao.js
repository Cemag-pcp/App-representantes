var btnSalvarInteracao = document.getElementById('enviarInteracao');
var idLogin = parseFloat(document.getElementById('idLogin').innerHTML);

btnSalvarInteracao.addEventListener('click', function () {
    var idEmpresa = document.getElementById('empresaCadastradaInteracao2').dataset.id;
    var nomeEmpresa = document.getElementById('empresaCadastradaInteracao2').value;
    var registro = document.getElementById('idRegistroTextArea').value;
    var data_opcional = document.getElementById('dataInteracao').value;
    var nomeContato = document.getElementById('contatoGerarProposta').value;

    if (!idEmpresa || !registro) {
        exibirMensagem('aviso', 'Preencha todos os campos obrigatórios.');
        return;
    }

    salvarInteracao(idEmpresa, registro, data_opcional, nomeContato);
});

function salvarInteracao(idEmpresa, registro, data_opcional, nomeContato) {
    showSpinner();

    // Inicializa o objeto data
    var data = {
        "ContactId": parseInt(idEmpresa),
        "Content": registro,
        "OtherProperties": [{
            "FieldKey": "interaction_record_EF9D0AE3-2A8E-44C1-AB6E-910795489B79",
            "IntegerValue": parseInt(idLogin),
            "FieldKey":"interaction_record_contacts",
            "IntegerValue":parseInt(nomeContato),
        }]
    };

    // Adiciona 'Contact' se nomeContato estiver definido
    // if (nomeContato) {
    //     data.Contact = { "Id": parseInt(nomeContato) };
    // }

    // Adiciona 'Date' se data_opcional estiver definida
    if (data_opcional) {
        data.Date = formatDateToISO(data_opcional);
    }

    // "Contact": {
    //     "Id": 21043119,
    //     "Name": "empresa - teste - app",
    //     "TypeId": 1,
    //     "AvatarUrl": null
    // },

    console.log(data);

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
    fetch('https://api2.ploomes.com/InteractionRecords', options)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Erro ao enviar requisição: ' + response.status);
            }
            return response.json(); // Se a resposta estiver em JSON, você pode acessá-la aqui
        })
        .then(function (data) {
            // Manipule a resposta aqui, se necessário
            hideSpinner();
            exibirMensagem('sucesso', 'Interação feita com sucesso.');
            document.getElementById('idRegistroTextArea').value = '';
            document.getElementById('dataInteracao').value = '';
            document.getElementById('contatoGerarProposta').value = '';
            document.getElementById('empresaCadastradaInteracao2').value = '';
        })
        .catch(function (error) {
            // Caso ocorra algum erro durante a requisição
            hideSpinner();
            exibirMensagem('aviso', 'Erro! Tente novamente.');
        });
}

// Função para formatar a data no formato "YYYY-MM-DDT00:00:00-03:00"
function formatDateToISO(dateStr) {
    // Cria uma data no fuso horário UTC
    console.log(dateStr);

    let date = new Date(`${dateStr}T03:00:00Z`);
    
    if (isNaN(date.getTime())) {
        throw new Error("Data inválida fornecida");
    }
    
    // Ajusta o fuso horário para -03:00
    let offset = -3; // Fuso horário -03:00
    date.setHours(date.getUTCHours() + offset);

    // Formata a data no formato "YYYY-MM-DDT00:00:00-03:00"
    let year = date.getUTCFullYear();
    let month = String(date.getUTCMonth() + 1).padStart(2, '0');
    let day = String(date.getUTCDate()).padStart(2, '0');
    let hours = String(date.getUTCHours()).padStart(2, '0');
    let minutes = '00';
    let seconds = '00';
    let offsetSign = offset < 0 ? '-' : '+';
    let offsetHours = String(Math.abs(offset)).padStart(2, '0');
    let offsetMinutes = '00';

    let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
    
    console.log(formattedDate)

    return formattedDate;
}
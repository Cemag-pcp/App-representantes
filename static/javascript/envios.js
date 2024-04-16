   // Modal de cadastro de cliente

function enviarInteracao() {
    $("#loading-overlay").show();
    const nome_empresa = $('#empresa_registrar').val();
    const registro = $('#campo-texto').val();
    const dataRegistro = $('#campo-data').val();
    const contatoRegistro = $('#campo-texto-1').val();
    const responsavelRegistro = $('#responsavel_interacao').val();

    const dados = {
       nome_empresa: nome_empresa || null,
       registro: registro || null,
       dataRegistro: dataRegistro || [],
       contatoRegistro: contatoRegistro || [],
       responsavelRegistro: responsavelRegistro || []
    };

    $.ajax({
       url: '/cadastrar-interacao',
       type: 'POST',
       contentType: 'application/json',
       data: JSON.stringify({
          nome_empresa: nome_empresa,
          registro: registro,
          dataRegistro: dataRegistro,
          contatoRegistro: contatoRegistro,
          responsavelRegistro: responsavelRegistro
       }),
       success: function (response) {
          location.reload();
       },
       error: function (error) {
          console.log(error);
          $("#loading-overlay").hide();
          alert("Erro ao enviar a informação para o servidor, verifique se o contato ou a empresa foi selecionada corretamente")
       }
    });
 }

 
function enviarDeals(cardElement) {
    $("#loading-overlay").show();

    const idDeals = cardElement.find('.id-deals').val();
    const nomeEmpresa = cardElement.find('.nome-empresa').val();
    const campoInput = cardElement.find('.campo_input').val();

    console.log(idDeals, nomeEmpresa, campoInput);

    const dados = {
       idDeals: idDeals || null,
       nomeEmpresa: nomeEmpresa || null,
       campoInput: campoInput || null
    };

    $.ajax({
       url: '/atualizar-contato',
       type: 'POST',
       contentType: 'application/json',
       data: JSON.stringify({
          idDeals: idDeals,
          nomeEmpresa: nomeEmpresa,
          campoInput: campoInput
       }),
       success: function (response) {
          if (response == "Erro") {
             alert("Erro ao enviar a informação para o servidor, verifique se o contato foi selecionada corretamente");
             $("#loading-overlay").hide();
          } else {
             location.reload();
          }
       },
       error: function (error) {
          $("#loading-overlay").hide();
          alert("Erro ao enviar a informação para o servidor, verifique se o contato foi selecionada corretamente");
       }
    });
 }

function enviarCadastroEmpresa(condicao) {
    if (condicao == "Não") {
       $("#loading-overlay").show();
    }
    const nome = $('#nomeInput').val();
    const cnpj = $('#cnpjInput').val();
    const telefone = $('#telefoneInput').val();
    const tipoTelefone = $('#tipoTelefone').val();
    const cidade = $('#cidadeInput').val();
    const responsavel = $('#responsavelInput').val();

    $.ajax({
       url: '/cadastrar-empresa',
       type: 'POST',
       contentType: 'application/json',
       data: JSON.stringify({
          nome: nome,
          cnpj: cnpj,
          telefone: telefone,
          tipoTelefone: tipoTelefone,
          cidade: cidade,
          responsavel: responsavel,
          condicao: condicao
       }),
       success: function (response) {
          console.log("Sucesso")
          $('#cadastrar-contato-nao').prop('disabled', true);
          if (condicao == "Não") {
             window.location.reload();
          }
       },
       error: function (error) {
          console.log(error);
       }
    });
}

function enviarCadastroContato(condicao) {
    $("#loading-overlay").show();
    const nomeContato = $('#nomeInputContato').val();
    const telefoneContato = $('#telefoneInputContato').val();
    const empresaInputContato = $('#empresasAdicionadas').val();
    const cidadeContato = $('#cidadeInputContato').val();
    const responsavelContato = $('#responsavelInputContato').val();
    const tipoTelefoneContato = $('#tipoTelefoneContato').val();

    $.ajax({
       url: '/cadastrar-contato',
       type: 'POST',
       contentType: 'application/json',
       data: JSON.stringify({
          nomeContato: nomeContato,
          telefoneContato: telefoneContato,
          empresaInputContato: empresaInputContato,
          cidadeContato: cidadeContato,
          responsavelContato: responsavelContato,
          tipoTelefoneContato: tipoTelefoneContato,
          condicao: condicao
       }),
       success: function (response) {
          window.location.reload();
          alert('Contato Cadastrado com Sucesso');

          setTimeout(function () {
             $("#loading-overlay").show();
          }, 5000); // 5000 milissegundos (5 segundos)
       },
       error: function (error) {
          console.log(error);
       }
    });
 }

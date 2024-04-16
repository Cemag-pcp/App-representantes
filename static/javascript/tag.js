var tagValue; // Declare a variável tagValue aqui

function justTag(tag) {
    tagValue = tag; // Atribua o valor da tag à variável tagValue
}

function updateTag() {

    var equipamento = document.getElementById('tag_equipamento').value;
    var localizacao = document.getElementById('tag_localizacao').value;
    var tagSerie = document.getElementById('serie').value;

    console.log(localizacao.toUpperCase())

    // Personalize a lógica de acordo com suas necessidades
    var tag = '';

  if (tagSerie == ''){
      if (equipamento) {
          tag += equipamento.substring(0, 3).toUpperCase();
      }
  }
  else{
    tag += tagSerie.toUpperCase();
  }
  if (localizacao) {
    if (localizacao.toUpperCase() === 'QUALIDADE') {
        tag += '-CQ';
    } else {
        tag += '-' + localizacao.substring(0, 2).toUpperCase();
    }
  }
  document.getElementById('tag').value = tag;
}

function atualizarTag(tagEquipamentoId, tagUnidadeId, tagNominalId) {

  $("#loading-overlay").show();
  var tag_equipamento = $('#' + tagEquipamentoId).val();

  $('#' + tagUnidadeId).empty();
  $('#' + tagNominalId).empty();

  // Adicionar a opção "Todos" com valor vazio
  $('#' + tagUnidadeId).append($('<option selected disabled hidden>', {
      value: '',
      text: 'Selecionar'
  }));
  $('#' + tagNominalId).append($('<option selected disabled hidden>', {
      value: '',
      text: 'Selecionar'
  }));

  $.ajax({
      url: '/atualizando_equip',
      method: 'POST',
      data: {
          tag_equipamento: tag_equipamento
      },
      success: function (response) {
          var unidades = response.unidades;
          var faixa_nominal = response.faixa_nominal;

          // Atualize o campo de seleção de Unidade
          var selectUnidade = $('#' + tagUnidadeId);
          $.each(unidades, function (index, unidade) {
              selectUnidade.append($('<option>', {
                  value: unidade,
                  text: unidade
              }));
          });

          // Atualize o campo de seleção de Faixa Nominal
          var selectFaixaNominal = $('#' + tagNominalId);
          $.each(faixa_nominal, function (index, fn) {
              selectFaixaNominal.append($('<option>', {
                  value: fn,
                  text: fn
              }));
          });

          $("#loading-overlay").hide(); // Oculta o overlay após atualizar os dados
      },
      error: function (error) {
          console.log(error);
          $("#loading-overlay").hide(); // Oculta o overlay após atualizar os dados
      }
  });
}

function modalTag() {
    
    $('#cadastroModal').modal('show');
}

function modalEquipamentoETag(){
    $('#cadastroEquipamentoModal').modal('show')
}

function modalRecebimento(element) {

    const row = element.closest('tr');

    // Obter os valores das células na linha
    const cells = row.getElementsByTagName('td');
    const tag = cells[0].textContent;
    const equip = cells[1].textContent;
    const unidade = cells[6].textContent;
    const localizacao = cells[3].textContent;
    const responsavel = cells[2].textContent;
    const tipoControle = cells[7].textContent;
    const ult_calibracao = cells[4].textContent;
    const periodicidade = cells[8].textContent;
    const metodo = cells[9].textContent;
    const faixaNominal = cells[10].textContent;

    $('#recebimentoModal').modal('show');

    $('#recebimentoModal .modal-header h5').text("Recebimento - " + tag);

    // Defina os valores dos campos de entrada no modal
    $('#editar_nome').val(equip);
    $('#editar_matricula').val(faixaNominal);
    $('#editar_unidade').val(unidade);
    $('#editar_localizacao').val(localizacao);
    $('#editar_responsavel').val(responsavel);
    $('#editar_controle').val(tipoControle);
    $('#editar_periodicidade').val(periodicidade);
    $('#editar_status').val("Em Uso");
    $('#editar_metodo').val(metodo);

    var dataDeHoje = new Date();

    // Extraindo os componentes da data
    var dia = String(dataDeHoje.getDate()).padStart(2, '0'); // Adiciona zero à esquerda, se necessário
    var mes = String(dataDeHoje.getMonth() + 1).padStart(2, '0'); // Adiciona zero à esquerda, se necessário
    var ano = dataDeHoje.getFullYear();

    // Formatando a data como string (por exemplo, "DD/MM/AAAA")
    var dataFormatada = ano + '-' + mes + '-' + dia;

    console.log(dataFormatada); 
    $('#editar_ult_calibracao').val(dataFormatada);
}

function modalTimeline(tag) {

    $("#loading-overlay").show();

    $("#modalTimeline .modal-header h5").text(tag)
        
    $.ajax({
        url: '/modal-historico',
        type: 'POST',  // Alterado para POST
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({ 'tag': tag }),  // Enviando um objeto JSON
        success: function(response) {
            // Limpar conteúdo atual da lista
            $('#listaHistorico').empty();
        
            $('#modalTimeline').modal('show');

            $("#loading-overlay").hide();
        
            // Loop pelos dados e gerar elementos da lista
            for (var i = 0; i < response.length; i++) {
                var item = response[i];
                var status = item[5] > item[6] ? "Reprovado" : "Aprovado";
        
                // Criar elemento da lista e definir atributos de dados
                var listItem = $('<a>', {
                    class: 'list-group-item list-group-item-action modal-edit',
                    'aria-current': 'true',
                    'data-index': i, // Armazenar o índice do item como um atributo de dados
                    'data-item': JSON.stringify(item) // Armazenar todo o item como um atributo de dados
                });

                listItem.css('cursor','pointer');
        
                var content = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${status}</h5>
                        <div class="d-flex flex-column align-items-end">
                            <small>Erro Total : ${item[5]}</small>
                            <small>Tolerância Admissivel : ${item[6]}</small>
                            <small>Exec.: ${i}</small>
                            ${item[4] == '' ? `<small style="color:red">Sem URL do certificado</small>`:`<small style="color:green">Certificado disponível</small>`}
                        </div>
                    </div>
                    <p class="mb-1" style="font-size: small;"><strong>Data Chegada:</strong> ${formatarDataBrSemHora(item[3])}</p>
                `;
        
                listItem.html(content);
        
                $('#listaHistorico').append(listItem);
            }
        
            // Definir evento de clique para os elementos da lista
            $(".modal-edit").on('click', function() {
                var dataItemString = $(this).data('item');
        
                // Exemplo de utilização dos dados do item
                $('#id_registro').val(dataItemString[0]);
                $('#data_chegada_timeline').val(formatarDataBrSemHora(dataItemString[3]));
                $('#tendencia_timeline').val(dataItemString[1]);
                $('#incerteza_timeline').val(dataItemString[2]);
                $('#url_timeline').val(dataItemString[4]);
        
                // Esconder o modal de timeline e mostrar o modal de edição
                $("#modalEditarTimeline .modal-header h5").text(tag)
                $('#modalEditarTimeline').modal('show');
            }); 

        },
        error: function(error) {
            $("#loading-overlay").hide();
            alert('Ocorreu um erro ');
            console.log(error);
        }
    });
}

function modalEnvioModal(){
    $('#envioModal').modal('show');
}

function modalConfiguracao(element){

    const row = element.closest('tr');

    // Obter os valores das células na linha
    const cells = row.getElementsByTagName('td');
    const tag = cells[0].textContent;
    const equip = cells[1].textContent;
    const unidade = cells[7].textContent;
    const localizacao = cells[3].textContent;
    const responsavel = cells[2].textContent;
    const tipoControle = cells[8].textContent;
    const ult_calibracao = cells[4].textContent;
    const periodicidade = cells[9].textContent;
    const metodo = cells[10].textContent;
    const faixaNominal = cells[11].textContent;

    $('#configModal').modal('show');

    $('#configModal .modal-header h5').text("Config - " + tag);

    // Defina os valores dos campos de entrada no modal
    $('#tag_config').val(tag);
    $('#config_editar_equip').val(equip);
    $('#config_editar_faixa').val(faixaNominal);
    $('#config_editar_unidade').val(unidade);
    $('#config_editar_localizacao').val(localizacao);
    $('#config_editar_responsavel').val(responsavel);
    $('#config_editar_controle').val(tipoControle);
    $('#config_editar_periodicidade').val(periodicidade);
    $('#config_editar_status').val("Uso");
    $('#config_editar_metodo').val(metodo);
    $('#config_editar_ult_calibracao').val(ult_calibracao)
}

function modalConfiguracaoRelacao(element){

    const row = element.closest('tr');

    // Obter os valores das células na linha
    const cells = row.getElementsByTagName('td');
    const equipamento = cells[0].textContent;
    const faixaNominal = cells[1].textContent;
    const unidade = cells[2].textContent;
    const grandeza = cells[3].textContent;
    const faixaCalibracao = cells[4].textContent;
    const fabricante = cells[5].textContent;
    const id = cells[6].textContent;

    $('#configRelacaoModal').modal('show');

    // Defina os valores dos campos de entrada no modal
    $('#equipamento_editar_relacao').val(equipamento);
    $('#fabricante_editar_relacao').val(fabricante);
    $('#grandeza_editar_relacao').val(grandeza);
    $('#unidade_editar_relacao').val(unidade);
    $('#faixa_editar_relacao').val(faixaNominal);
    $('#faixa_calibracao_editar_relacao').val(faixaCalibracao);
    $('#id_editar_relacao').val(id);
}

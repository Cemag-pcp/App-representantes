function modalExcluir(tag){

    $('#modalExcluir .modal-body').text('Tem certeza que deseja excluir a Tag - ' + tag + '?')

    $('#modalExcluir').modal('show');

    $('#btnExcluir').on('click',function(){

        $("#loading-overlay").show();

        $.ajax({
            url: '/excluir-tag',
            type: "POST",
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({ 'tag':tag }),
            success: function(response) {
                console.log(response)
                $("#loading-overlay").hide(); // Oculta o overlay após atualizar os dados
                window.location.reload();
            },
            error: function(error) {
                console.log(error)
              $("#loading-overlay").hide(); // Oculta o overlay após atualizar os dados
            }
        });
    })
}

$('#editar_timeline').on('click',function() {

    $("#loading-overlay").show();

    var url = $('#url_timeline').val();
    var id_registro = $('#id_registro').val();
    
    $.ajax({
        url: '/alterar-historico',
        type: 'POST',  // Alterado para POST
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({ 'id': id_registro,'url':url}),  // Enviando um objeto JSON
        success: function(response) {
            $('#modalEditarTimeline').modal('hide');
            $('#modalTimeline').modal('hide');

            $("#loading-overlay").hide(); // Oculta o overlay após atualizar os dados
        },
        error: function(error) {
          console.log(error);
          $("#loading-overlay").hide(); // Oculta o overlay após atualizar os dados
        }
    })
});

$(document).ready(function () {
    $("#enviar_calibracao").on('click',function () {
        $("#loading-overlay").show();

        // Obtém os valores de editar_emt, editar_ema, editar_data_calib como você já fez
        var editar_fornecedor = $('#editar_fornecedor').val();
        var editar_data_envio = $('#editar_data_envio').val();

        if (editar_fornecedor === "" || editar_data_envio === "") {
            // Exibe um alerta
            alert("Por favor, preencha todos os campos.");

            // Oculta a sobreposição de carregamento e não envia a solicitação
            $("#loading-overlay").hide();

            return;
        } else {
            // Se todos os campos estiverem preenchidos, continue com a solicitação AJAX
            var data = {
                tagValue: tagValue,
                editar_fornecedor: editar_fornecedor,
                editar_data_envio: editar_data_envio,
            };

            // Faça a solicitação AJAX com os dados
            $.ajax({
                url: '/modal_data_envio',
                method: 'POST',
                data: data,
                success: function (response) {
                    // Lide com a resposta do servidor, se necessário
                    console.log("Resposta do servidor:", response);
                    window.location.reload();
                },
                error: function (error) {
                    console.error("Erro na solicitação AJAX:", error);
                    $("#loading-overlay").hide();
                }
            });
        }
    });
});

// BOTÃO RECEBIMENTO
$("#ganhar").on("click",function () {
    $("#loading-overlay").show();
    let tagValue = $('#recebimentoModal .modal-header h5').text().split(" - ");
    tagValue = tagValue[1]

    if (tagValue !== undefined) {
        // Obtém os valores de editar_emt, editar_ema, editar_data_calib como você já fez
        var editar_emt = $('#editar_emt').val();
        var editar_ema = $('#editar_ema').val();
        var editar_data_calib = $('#editar_ult_calibracao').val();
        var editar_url = $('#editar_url').val();
        var erro_total = $('#erro_total').val();

        if (editar_emt === "" || editar_ema === "" || editar_data_calib === "") {
            // Exibe um alerta
            alert("Por favor, preencha todos os campos.");

            // Oculta a sobreposição de carregamento e não envia a solicitação
            $("#loading-overlay").hide();
            return;
        } else {
            // Se todos os campos estiverem preenchidos, continue com a solicitação AJAX
            var data = {
                tagValue: tagValue,
                editar_emt: editar_emt,
                editar_ema: editar_ema,
                editar_data_calib: editar_data_calib,
                editar_url: editar_url,
                erro_total: erro_total
            };
        }
        // Faça a solicitação AJAX com os dados
        $.ajax({
            url: '/recebimento',
            method: 'POST',
            data: data,
            success: function (response) {
                // Lide com a resposta do servidor, se necessário
                console.log("Resposta do servidor:", response);
                window.location.reload();
            },
            error: function (error) {
                console.error("Erro na solicitação AJAX:", error);
                $("#loading-overlay").hide();
            }
        });
    } else {
        console.log("tagValue não está definida.");
    }
});


$("#cadastrarBtn").on('click', function() {
 
    this.disabled = true;
    $("#loading-overlay").show();
    var tag = $('#tag').val();
    var tag_equipamento = $('#tag_equipamento').val();
    var tag_controle = $('#tag_controle').val();
    var tag_metodo = $('#tag_metodo').val();
    var tag_unidade = $('#tag_unidade').val();
    var tag_responsavel = $('#tag_responsavel').val();
    var tag_data = $('#tag_data').val();
    var tag_periodicidade = $('#tag_periodicidade').val();
    var tag_nominal = $('#tag_nominal').val();
    var tag_localizacao = $('#tag_localizacao').val();
    var tag_status = $('#tag_status').val();
    var tolerancia_admissivel = $('#tag_tolerancia_admissivel').val();

    console.log(tag_responsavel,tag_periodicidade,)
    // Verifica se algum campo está vazio
    if (tag === '' || tag_equipamento === '' || tag_controle === null || tag_metodo === null || 
    tag_responsavel === '' || tag_data === '' || tag_periodicidade === '' || 
    tag_localizacao === null || tag_status === null || tolerancia_admissivel === '') {
        // Se algum campo estiver vazio, exibe uma mensagem de erro e interrompe o processo
        exibirMensagem('aviso','Por favor, preencha todos os campos.')
        $("#loading-overlay").hide();
        this.disabled = false;
        return;
    }
    console.log('Passou')

    $.ajax({
        url: '/cadastrar_tag',
        method: 'POST',
        data: {
          tag: tag,
          tag_equipamento: tag_equipamento,
          tag_controle: tag_controle,
          tag_metodo: tag_metodo,
          tag_unidade:tag_unidade,
          tag_responsavel: tag_responsavel,
          tag_data: tag_data,
          tag_periodicidade: tag_periodicidade,
          tag_nominal:tag_nominal,
          tag_localizacao:tag_localizacao,
          tag_status:tag_status,
          tolerancia_admissivel:tolerancia_admissivel
          // inclua outros dropdowns aqui
        },
        success: function(response) {

          window.location.reload();
          // faça o processamento necessário para atualizar o DataFrame na página
        },
        error: function(error) {
          console.log(error);
          $("#loading-overlay").hide(); // Oculta o overlay após atualizar os dados
          window.location.reload();
        }
    });
});

$('#config_envio').on('click',function () {

    $("#loading-overlay").show();
    
    let tag_config = $('#tag_config').val();
    let faixa_nominal_config = $('#config_editar_faixa').val();
    let unidade_config = $('#config_editar_unidade').val();
    let responsavel_config = $('#config_editar_responsavel').val();
    let controle_config = $('#config_editar_controle').val();
    let metodo_config = $('#config_editar_metodo').val();
    let periodicidade_config = $('#config_editar_periodicidade').val();
    let status_config = $('#config_editar_status').val();

    $.ajax({
        url:'/alterar-tag',
        type:'POST',
        dataType:'json',
        contentType:'application/json',
        data: JSON.stringify({'tag_config':tag_config,'faixa_nominal':faixa_nominal_config,'unidade_config':unidade_config,'responsavel_config':responsavel_config,
    'controle_config':controle_config,'metodo_config':metodo_config,'periodicidade_config':periodicidade_config,'status_config':status_config}),
        success: function(response) {
            console.log(response)
            window.location.reload();
        }, error: function(error) {
            $("#loading-overlay").hide();
        }
    })
})

$('#enviar_email').on('click',function () {

    $("#loading-overlay").show();
    
    $.ajax({
        url:'/enviando_email',
        type:'POST',
        dataType:'json',
        contentType:'application/json',
        success: function(response) {
            alert(response)
            $("#loading-overlay").hide();
        }, error: function(error) {
            alert(error)
            $("#loading-overlay").hide();
        }
    })
})

$('#envio_editar_relacao').on('click',function(){

    $("#loading-overlay").show();

    let equip_relacao = $('#equipamento_editar_relacao').val();
    let fabricante_relacao = $('#fabricante_editar_relacao').val();
    let grandeza_relacao = $('#grandeza_editar_relacao').val();
    let unidade_relacao = $('#unidade_editar_relacao').val();
    let nominal_relacao = $('#faixa_editar_relacao').val();
    let calibracao_relacao = $('#faixa_calibracao_editar_relacao').val();
    let id_relacao = $('#id_editar_relacao').val();

    $.ajax({
        url: "/editar-equipamento",
        type: "POST",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({'id_relacao':id_relacao,'equip_relacao':equip_relacao,'fabricante_relacao':fabricante_relacao,'grandeza_relacao':grandeza_relacao,
    'unidade_relacao':unidade_relacao,'nominal_relacao':nominal_relacao,'calibracao_relacao':calibracao_relacao}),
        success: function (response) {
            window.location.reload()
            $("#loading-overlay").hide();
        }, error: function(error) {
            console.error(error)
            $("#loading-overlay").hide();
        }
    })
})

$('#envio_cadastro_equipamento').on('click',function(){

    this.disabled = true;
    let equip_relacao = $('#cadastro_equipamento').val();
    let fabricante_relacao = $('#cadastro_fabricante').val();
    let grandeza_relacao = $('#cadastro_grandeza').val();
    let unidade_relacao = $('#cadastro_unidade').val();
    let nominal_relacao = $('#cadastro_nominal').val();
    let calibracao_relacao = $('#cadastro_faixa_calibracao').val();

    $("#loading-overlay").show();

    if (equip_relacao === '' || fabricante_relacao === '' || grandeza_relacao === null || unidade_relacao === '' || 
    nominal_relacao === '' || calibracao_relacao === '') {
        // Se algum campo estiver vazio, exibe uma mensagem de erro e interrompe o processo
        exibirMensagem('aviso','Por favor, preencha todos os campos.')
        $("#loading-overlay").hide();
        this.disabled = false;
        return;
    }

    $.ajax({
        url: "/cadastrar-equipamento",
        type: "POST",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({'equip_relacao':equip_relacao,'fabricante_relacao':fabricante_relacao,'grandeza_relacao':grandeza_relacao,
    'unidade_relacao':unidade_relacao,'nominal_relacao':nominal_relacao,'calibracao_relacao':calibracao_relacao}),
        success: function (response) {
            window.location.reload()
            $("#loading-overlay").hide();
        }, error: function(error) {
            console.error(error)
            $("#loading-overlay").hide();
        }
    })
})
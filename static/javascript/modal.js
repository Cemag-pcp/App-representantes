function showModalGanhar(dealId) {
    // Defina o conteúdo do modal para a ação "Ganhar" com base no dealId
    var modalBody = document.getElementById("modalGanhar").querySelector(".modal-body");

    // Fechar o modal ao clicar no botão de fechar
    $('#modalGanhar').on('click', '.close', function () {
       $('#modalGanhar').modal('hide');
    });

    // Send a GET request to the backend
    $.ajax({
       url: '/escolherProposta',
       type: 'GET',
       data: {
          dealId: dealId,
       },
       success: function (response) {
          // Preencher a modal com os dados recebidos
          var modalBody = $('.modal-body'); // Selecione o elemento com a classe modal-body
          modalBody.empty(); // Limpe o conteúdo existente

          // Título do modal
          modalBody.append('<div class="modal-header"><h5 class="modal-title" id="modalGanharLabel">Ganhar proposta</h5><button type="button" class="close" aria-label="Fechar"><span aria-hidden="true">&times;</span></button></div>');

          $.each(response, function (index, item) {

             var formattedAmount = 'R$ ' + parseFloat(item.Amount).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
             });

             // Crie um card para cada item
             var card = $('<div class="card1">');
             var cardBody = $('<div class="card-body1">');

             // Formatando data
             var dataString = item.Date;
             var dataFormatada = moment(dataString).format('DD/MM/YYYY HH:mm:ss');

             // Adicione o conteúdo do card
             cardBody.append('<h5 class="card-title1">' + formattedAmount + '</h5>');
             cardBody.append('<a href="' + item.DocumentUrl + '" class="card-link" target="_blank">Link para PDF</a><br>');
             cardBody.append('<a>' + dataFormatada + '</a><br>');

             // Adicione um botão de confirmar ao card
             var confirmButton = $('<button class="btn btn-info btn-sm ganhar">Confirmar</button>');

             // Adicione um evento de clique para os botões de confirmar
             confirmButton.on('click', function () {
                confirmButton.prop('disabled', true);
                $("#loading-overlay").show();

                var id = item.Id; // Obtenha o ID do item
                // Envie as informações da linha para o backend por meio de uma solicitação AJAX
                $.ajax({
                   url: '/ganhar',
                   type: 'POST',
                   contentType: 'application/json',
                   data: JSON.stringify({
                      dealId: dealId,
                      id: id,
                   }),
                   success: function (response) {
                      window.location.reload();

                      // Após a ação bem-sucedida
                      $('#success-message').html('Proposta ganha com sucesso.').show();

                      // Defina um temporizador para ocultar a mensagem após 5 segundos
                      setTimeout(function () {
                         $('#success-message').hide();
                      }, 5000); // 5000 milissegundos (5 segundos)

                      $("#loading-overlay").hide();
                   },
                   error: function (error) {
                      console.log(error);
                   }
                });
             });

             cardBody.append(confirmButton);
             card.append(cardBody);

             // Adicione o card à modal
             modalBody.append(card);
          });

          $("#loading-overlay").hide();
       },
       error: function (error) {
          console.log(error);
       }
    });

    // Abra o modal
    $('#modalGanhar').modal('show');
 }


 
 function showModalPerder(dealId, nomeCliente) {
    $("#loading-overlay").show();
    // Defina o conteúdo do modal para a ação "Perder" com base no dealId
    var modalBody = $('.modal-body-perder'); // Selecione o elemento com a classe modal-body
    modalBody.empty(); // Limpe o conteúdo existente
    modalBody.innerHTML = "Você está prestes a perder o negócio " + dealId;
    $(".modal-title").text("Perder proposta");

    // Crie um elemento select para os motivos de perda
    var label_select = $('<label>Selecione o motivo da perda</label>');
    var select = $('<select class="form-control" id="motivosPerda" name="motivosPerda" required>');

    // Adicione uma opção padrão (por exemplo, "Selecione um motivo")
    var defaultOption = $(`<option value="" selected hidden disabled>Selecione um motivo</option>`);
    select.append(defaultOption);

    var textarea = $('<div style="margin-top:15px" id="campo_observacao_perda"><label>Coloque uma breve descrição sobre o motivo da perda(Opcional)</label><textarea id="text-descricao-perda" class="form-control" placeholder="Digite aqui..."></textarea></div>');

    // Fechar o modal ao clicar no botão de fechar
    $('#modalPerder').on('click', '.close', function () {
       $('#modalPerder').modal('hide');
    });

    // Send a GET request to the backend
    $.ajax({
       url: '/motivosPerda',
       type: 'GET',
       success: function (response) {

          // Preencher o select com os motivos de perda recebidos
          $.each(response, function (index, item) {
             var option = $('<option value="' + item.Id + '">' + item.Name + '</option>');
             console.log(option);
             select.append(option);
          });

          // Adicione o select ao modalBody
          modalBody.append(label_select, select, textarea);

          // Adicione um botão "Perder"
          var button = $('<button class="btn btn-primary" style="margin-top: 10px;">Perder</button>');

          // Adicione um evento de clique ao botão
          button.on('click', function () {
             var selectedMotivoId = $('#motivosPerda').val();
             var textareaDescricao = $('#text-descricao-perda').val();

             // Verifique se a opção selecionada é "Selecione um motivo"
             if (selectedMotivoId === '') {
                // Mostre uma mensagem de erro para selecionar um motivo válido
                alert("Por favor, selecione um motivo válido.");
                return; // Impede o envio
             }

             $.ajax({
                url: '/perda',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                   selectedMotivoId: selectedMotivoId,
                   dealId: dealId,
                   nomeCliente: nomeCliente,
                   textareaDescricao: textareaDescricao
                }),
                success: function (response) {
                   window.location.reload();

                   $("#loading-overlay").hide();

                   // Após a ação bem-sucedida
                   $('#success-message').html('Proposta perdida com sucesso.').show();

                   // Defina um temporizador para ocultar a mensagem após 5 segundos
                   setTimeout(function () {
                      $('#success-message').hide();
                   }, 5000); // 5000 milissegundos (5 segundos)

                },
                error: function (error) {
                   console.log(error);
                }
             });



             // Fechar o modal quando o botão for clicado
             $('#modalPerder').modal('hide');
          });

          // Adicione o botão ao modalBody
          modalBody.append(button);

          modalBody.on('change', '#motivosPerda', function () {
             $('#text-descricao-perda').val('');
          });

          // Abra o modal após preencher o conteúdo
          $('#modalPerder').modal('show');
          $("#loading-overlay").hide();
       }
    });
 }

 function showModalRevisar(dealId) {
    // Defina o conteúdo do modal para a ação "Ganhar" com base no dealId
    $("#loading-overlay").hide();
    $('#modalPedidos').modal('hide');

    var modalBody = document.getElementById("modalGanhar").querySelector(".modal-body");

    // Fechar o modal ao clicar no botão de fechar
    $('#modalGanhar').on('click', '.close', function () {
       $('#modalGanhar').modal('hide');
    });

    // Send a GET request to the backend
    $.ajax({
       url: '/escolherProposta',
       type: 'GET',
       data: {
          dealId: dealId,
       },
       success: function (response) {
          // Preencher a modal com os dados recebidos
          var modalBody = $('#modalGanhar .modal-body'); // Selecione o elemento com a classe modal-body
          modalBody.empty(); // Limpe o conteúdo existente

          // Título do modal
          modalBody.append('<div class="modal-header"><h5 class="modal-title" id="modalGanharLabel">Revisar proposta</h5><button type="button" class="close" aria-label="Fechar"><span aria-hidden="true">&times;</span></button></div>');

          $.each(response, function (index, item) {

             var formattedAmount = 'R$ ' + parseFloat(item.Amount).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
             });

             // Crie um card para cada item
             var card = $('<div class="card1">');
             var cardBody = $('<div class="card-body1">');

             // Formatando data
             var dataString = item.Date;
             var dataFormatada = moment(dataString).format('DD/MM/YYYY HH:mm:ss');
             var quote_id = item.Id;
             var DealId = dealId;

             // Adicione o conteúdo do card
             cardBody.append('<h5 class="card-title1">' + formattedAmount + '</h5>');
             cardBody.append('<a href="' + item.DocumentUrl + '" class="card-link" target="_blank">Link para PDF</a><br>');
             cardBody.append('<a>' + dataFormatada + '</a><br>');

             // Adicione um botão de confirmar ao card
             // var confirmButton = $('<button class="btn btn-info btn-sm ganhar">Confirmar</button>');

             // cardBody.append(confirmButton);

             // cardBody.append('<form id="revisar" action="/consulta" method="POST"><input type="hidden" name="valor" value="' + quote_id + '"><button value="teste">Revisar</button></form>');
             cardBody.append('<form id="revisar" action="/consulta" method="POST"><input type="hidden" name="valor" value="' + quote_id + '"><input type="hidden" name="dealId" value="' + DealId + '"><button type="submit">Revisar</button></form>');

             card.append(cardBody);

             // Adicione o card à modal
             modalBody.append(card);
          });

          $("#loading-overlay").hide();
       },
       error: function (error) {
        $("#loading-overlay").hide();   
          console.log(error);
       }
    });

    // Abra o modal
    $('#modalGanhar').modal('show');
 }

 function showModalEscolhaClienteOuContato(event) {
    event.preventDefault(); // Prevenir o envio do formulário padrão

    // Defina o conteúdo do modal para a ação "Cadastrar Cliente"
    var modalBody = document.getElementById("modalGanhar").querySelector(".modal-body");
    modalBody.innerHTML = ''; // Limpar o conteúdo atual do modal

    // Aqui, você pode criar e adicionar o formulário ao modal
    var form_cadastrar_cliente = $('<div class="cadastrar-cliente">');
    var title = $('<div class="modal-header"><h5 class="modal-title" id="modalGanharLabel">Cadastro</h5><button type="button" class="close" aria-label="Fechar"><span aria-hidden="true">&times;</span></button></div>');
    var div = $('<div style="display:flex;justify-content:space-around;margin-top:20px;">')
    var botaoModalCliente = $('<button id="cadastrar-empresa" class="btn btn-info btn-sm" style="color: #fff; padding: 15px; font-weight: bold; font-size: 20px;">Empresa</button>');
    var botaoModalContato = $('<button id="cadastrar-contato" class="btn btn-info btn-sm" style="color: #fff; padding: 15px; font-weight: bold; font-size: 20px;">Contato</button>');

    div.append(botaoModalCliente, botaoModalContato)

    form_cadastrar_cliente.append(title, div);

    modalBody.appendChild(form_cadastrar_cliente[0]);

    // Abra o modal
    $('#modalGanhar').modal('show');
 }

 function showModalContinuarAoContato() {

    // Defina o conteúdo do modal para a ação "Cadastrar Cliente"
    var modalBody = document.getElementById("modalSimNao")?.querySelector(".modal-body");

    // Verifique se modalBody é nulo antes de continuar
    if (!modalBody) {
       console.error("Elemento modalBody não encontrado.");
       return;
    }

    // var modalBody = document.getElementById("modalSimNao").querySelector(".modal-body");
    modalBody.innerHTML = ''; // Limpar o conteúdo atual do modal

    // Aqui, você pode criar e adicionar o formulário ao modal
    var form_cadastrar_cliente = $('<div class="cadastrar-cliente">');
    var title = $('<div class="modal-header"><h5 class="modal-title" id="modalGanharLabel">Deseja cadastrar o contato agora?</h5><button type="button" class="close" aria-label="Fechar"><span aria-hidden="true">&times;</span></button></div>');
    var div = $('<div style="display:flex;justify-content:space-around;margin-top:20px;">')
    var botaoModalNao = $('<button id="cadastrar-contato-nao" class="btn btn-info btn-sm" style="color: #fff; padding: 15px; font-weight: bold; font-size: 20px;">Não</button>');
    var botaoModalSim = $('<button id="cadastrar-contato-sim" class="btn btn-info btn-sm" style="color: #fff; padding: 15px; font-weight: bold; font-size: 20px;">Sim</button>');

    div.append(botaoModalNao, botaoModalSim)

    form_cadastrar_cliente.append(title, div);

    modalBody.appendChild(form_cadastrar_cliente[0]);

    // Abra o modal
    $('#modalSimNao').modal('show');

    // Fechar o modal ao clicar no botão de fechar
    $('#modalSimNao').on('click', '.close', function () {
       $('#modalSimNao').modal('hide');
    });

 }

 
 function showModalInteracaoDepreciado(event) {
    event.preventDefault();
    // Defina o conteúdo do modal para a ação "Cadastrar Cliente"
    var modalBody = document.getElementById("modalInteracao").querySelector(".modal-body");
    console.log(modalBody)
    modalBody.innerHTML = ''; // Limpar o conteúdo atual do modal

    // Aqui, você pode criar e adicionar o formulário ao modal
    var form_cadastrar_cliente = $('<div class="cadastrar-cliente-interação">');
    var title = $('<div class="modal-header"><h5 class="modal-title" id="modalGanharLabel">Escolha a empresa que deseja registrar</h5><button type="button" class="close" aria-label="Fechar"><span aria-hidden="true">&times;</span></button></div>');
    var empresa_registrar = $('<label>Empresa: </label><input type="text" class="form-control" id="empresa_registrar" placeholder="Empresa" required>');
    empresa_registrar.attr('autocomplete', 'off');
    var EmpresaSugestoes = $('<div class="suggestions" id="suggestionsEmpresasRegistrar"></div>')
    var todos_os_campos = $('<div style="display:none"></div>')
    var div = $('<div style="display:flex;flex-direction:column;margin-top:20px;gap: 3px;">')
    var textarea = $('<label>Registro: </label><textarea id="campo-texto" class="form-control" placeholder="Digite aqui..."></textarea>');
    var div_mais_campos = $('<div style="display: flex;justify-content: flex-end;align-items: center;color:gray; gap: 5px; margin-top: 10px;">')
    // Adicione esta linha ao criar o ícone
    var arrowIcon = $('<i style="cursor:pointer" id="arrow" class="fa-solid fa-angle-down"></i>');

    // Adicione um manipulador de eventos de clique ao ícone
    arrowIcon.on('click', function () {
       // Alterne entre as classes ao clicar
       $(this).toggleClass('fa-angle-down fa-angle-up');

       // Verifique se o ícone está para baixo ou para cima
       if ($(this).hasClass('fa-angle-down')) {
          // Se estiver para baixo, esconda os campos
          inputDate.hide();
          contato_interacao.hide();
          responsavel_interacao.hide();
       } else {
          // Se estiver para cima, mostre os campos
          inputDate.show();
          contato_interacao.show();
          responsavel_interacao.show();
       }
    });

    // Substitua a linha original que cria o ícone pela linha modificada
    var label_mais_campos = $('<label>Campos não obrigatório</label>');
    var inputDate = $('<label>Data: </label><input id="campo-data" type="date" class="form-control" style="min-height: 40px;">');
    inputDate.css('display', 'none');
    var contato_interacao = $('<label>Contatos: </label><input id="campo-texto-1" type="text" class="form-control">');
    contato_interacao.attr('autocomplete', 'off');
    contato_interacao.css('display', 'none');
    var contato_interacao_Sugestoes = $('<div class="suggestions" id="suggestions_contato_interacao"></div>');
    var responsavel_interacao = $('<label>Responsável: </label><input type="text" class="form-control" id="responsavel_interacao" value="{{ nomeRepresentante }}" placeholder="Responsável">');
    responsavel_interacao.attr('autocomplete', 'off');
    responsavel_interacao.css('display', 'none');
    var responsavel_interacao_Sugestoes = $('<div class="suggestions" id="suggestionsResponsaveisInteracao"></div>')
    var valorFixoResponsavel = $('<input type="hidden" id="representante-name-contato" value="{{ nomeRepresentante }}">').val()
    var button_salvar = $('<button type="submit" class="btn btn-info btn-sm" style="margin-top:25px">Salvar</button>');

    div_mais_campos.append(label_mais_campos, arrowIcon)
    div.append(textarea, div_mais_campos, inputDate)

    empresa_registrar.on('blur', function () {
       // Verifique se o valor do campo empresa_registrar não está vazio
       if ($(this).val().trim() !== '') {
          // Se não estiver vazio, exiba todos_os_campos
          todos_os_campos.css('display', 'block');
          $("#modalInteracao .modal-title").text("Registrar Interação");
       } else {
          // Se estiver vazio, oculte todos_os_campos
          todos_os_campos.css('display', 'none');
          $("#modalInteracao .modal-title").text("Escolha a empresa que deseja registrar");
       }
    });

    var contatos;

    contato_interacao.on('input', function () {
       var inputValue = $(this).val();
       if (inputValue.trim() === '') {
          // Se o valor do input estiver vazio, oculta as sugestões e retorna
          $('#suggestions_contato_interacao').hide();
          return;
       }
       inputNomesContatos(inputValue)
          .then(function (contatosResponse) {
             // Limpe as sugestões anteriores
             $('#suggestions_contato_interacao').empty();

             contatos = contatosResponse;

             contatos.forEach(function (contato) {
                var suggestionItem;

                if (contato.Company) {
                   suggestionItem = $('<div class="suggestion-item">' + contato.Name + '<strong> (' + contato.Company.Name + ')</strong>' + '</div>');
                } else {
                   suggestionItem = $('<div class="suggestion-item">' + contato.Name + '</div>');
                }

                suggestionItem.on('mousedown', function (event) {
                   // Impede que o input perca o foco
                   event.preventDefault();
                   $('#suggestions_contato_interacao').empty();
                   $('#suggestions_contato_interacao').hide();
                   // Preencha o campo nomeInputContato com o valor do contato clicado
                   contato_interacao.val(contato.Name);

                   $(".modal-title").text("Registrar Interação");
                });

                $('#suggestions_contato_interacao').append(suggestionItem);
                $('#suggestions_contato_interacao').show();
             });
          })
          .catch(function (error) {
             console.error(error);
          });
    })
       .on('blur', function () {
          $('#suggestions_contato_interacao').hide();
       });

    buscarProfileId(valorFixoResponsavel)
       .then(profileId => {

          if (profileId === 1) {

             responsavel_interacao.on('input', function () {
                var inputValue = $(this).val();
                if (inputValue.trim() === '') {
                   $('#suggestionsResponsaveisInteracao').hide();
                   return;
                }
                inputResponsaveis(inputValue)
                   .then(function (responsaveis) {
                      // Limpe as sugestões anteriores
                      $('#suggestionsResponsaveisInteracao').empty();

                      // Adicione as novas sugestões
                      responsaveis.forEach(function (responsavel) {
                         var suggestionItem = $('<div class="suggestion-item">' + responsavel.Name + '</div>');
                         suggestionItem.on('mousedown', function (event) {
                            // Impede que o input perca o foco
                            event.preventDefault();
                            // Preencha o campo cidadeInput com a sugestão clicada
                            responsavel_interacao.val(responsavel.Name);
                            // Limpe as sugestões
                            $('#suggestionsResponsaveisInteracao').empty();
                            $('#suggestionsResponsaveisInteracao').hide();
                         });
                         // Adicione a sugestão à lista de sugestões
                         $('#suggestionsResponsaveisInteracao').append(suggestionItem);
                      });

                      $('#suggestionsResponsaveisInteracao').show();
                   })
                   .catch(function (error) {
                      console.error(error);
                   });
             })
                .on('blur', function () {
                   $('#suggestionsResponsaveisInteracao').hide();
                });

          } else {
             // Ocultar o elemento de responsável
             responsavel_interacao.attr("readonly", true);
          }
       });

    var empresas; // Declare a variável fora do escopo da função para que seja acessível em outros lugares

    empresa_registrar.on('input', function () {
       var inputValue = $(this).val().trim();
       if (inputValue === '') {
          $('#suggestionsEmpresasRegistrar').hide();
          todos_os_campos.css('display', 'none');
          $("#modalInteracao .modal-title").text("Escolha a empresa que deseja registrar");
          return;
       }

       inputEmpresas(inputValue)
          .then(function (empresasResponse) {
             // Limpe as sugestões anteriores
             $('#suggestionsEmpresasRegistrar').empty();

             // Adicione as novas sugestões
             empresas = empresasResponse; // Atribua o valor à variável no escopo mais amplo

             empresas.forEach(function (empresa) {
                var suggestionItem = $('<div class="suggestion-item">' + empresa.Name + '</div>');
                suggestionItem.on('mousedown', function (event) {
                   // Impede que o input perca o foco
                   event.preventDefault();

                   var selectedPayment = empresa.Name;

                   // Atualiza apenas o valor do input com o nome da empresa
                   empresa_registrar.val(selectedPayment);

                   $('#suggestionsEmpresasRegistrar').empty().hide();
                   empresa_registrar.blur();
                });

                // Adicione a sugestão à lista de sugestões
                $('#suggestionsEmpresasRegistrar').append(suggestionItem);
             });

             $('#suggestionsEmpresasRegistrar').show();
          })
          .catch(function (error) {
             console.error(error);
          });
    })
       .on('blur', function () {
          $('#suggestionsEmpresasRegistrar').hide();
       });


    button_salvar.on('click', function () {
       if (!empresas) {
          console.error("A lista de empresas não foi carregada corretamente.");
          return;
       }

       // Obtém o valor do campo "empresa_registrar"
       var empresaRegistrarValue = empresa_registrar.val().trim();

       var contatoRegistrarValue = contato_interacao.val().trim();

       // Verifica se o valor de "empresa_registrar" corresponde a algum valor de empresa.name
       var empresaValida = empresas.some(function (empresa) {
          return empresaRegistrarValue === empresa.Name;
       });

       var contatoValido = contatos && contatos.some(function (contato) {
          return contatoRegistrarValue === contato.Name;
       });

       // Obtém o valor do campo de textarea
       var textareaValue = $('#campo-texto').val().trim();

       if (empresaValida && (contatoValido || !contatos)) {
          if (textareaValue === '') {
             alert("Campo de texto vazio. Empresa Validada, mas campo de texto em branco.");
          } else {
             enviarInteracao();
          }
       } else {
          if (textareaValue === '') {
             alert("Empresa ou Contato Não Validado e Campo de texto em branco");
          } else {
             alert("Empresa ou Contato Não Validado");
          }
       }
    });

    // Abra o modal
    $('#modalInteracao').modal('show');

    // Fechar o modal ao clicar no botão de fechar
    $('#modalInteracao').on('click', '.close', function () {
       $('#modalInteracao').modal('hide');
    });

    todos_os_campos.append(div, contato_interacao, contato_interacao_Sugestoes, responsavel_interacao, responsavel_interacao_Sugestoes, button_salvar)
    form_cadastrar_cliente.append(title, empresa_registrar, EmpresaSugestoes, todos_os_campos);

    modalBody.appendChild(form_cadastrar_cliente[0]);

 }

 function showModalCriarEmpresa(event) {
    event.preventDefault(); // Prevenir o envio do formulário padrão

    // Defina o conteúdo do modal para a ação "Cadastrar Cliente"
    var modalBody = document.getElementById("modalGanhar").querySelector(".modal-body");
    modalBody.innerHTML = ''; // Limpar o conteúdo atual do modal

    // Crie o formulário com rótulos acima dos campos de entrada
    var form_cadastrar_empresa = $('<div class="cadastrar-empresa">');
    var title = $('<div class="modal-header"><h5 class="modal-title" id="modalGanharLabel">Cadastrar Empresa</h5><button type="button" class="close" aria-label="Fechar"><span aria-hidden="true">&times;</span></button></div>');

    var botaoVoltar = $('<button id="btnVoltar" style="font-size: 20px; border: 1px solid black; cursor:pointer;"><i class="fa-solid fa-arrow-left" style:"color:black;"></i></button>');
    form_cadastrar_empresa.append(botaoVoltar, title);

    var labelNomeInput = $('<label for="nomeInput" class="form-label">Nome:</label>');
    var nomeInput = $('<input type="text" class="form-control" id="nomeInput" placeholder="Nome">');
    nomeInput.attr('autocomplete', 'off');
    var labelcnpjInput = $('<label for="cnpjInput" class="form-label">CNPJ:</label>');
    var cnpjInput = $('<input type="text" class="form-control" id="cnpjInput" placeholder="CNPJ">');
    cnpjInput.attr('autocomplete', 'off');
    var labelTelefoneInput = $('<label for="telefoneInput" class="form-label">Telefone:</label>');
    var form_row_telefone = $('<div class="form-row">')
    var telefoneInput = $('<input type="tel" class="form-control" id="telefoneInput" placeholder="Telefone">');
    var tipoTelefone = $('<select class="form-control" id="tipoTelefone">');
    telefoneInput.attr('autocomplete', 'off');
    tipoTelefone.css('width', 'auto');
    var labelPagamento = $('<label class="form-label" style="display:none">Pagamento:</label>');
    var form_row = $('<div class="form-row" style="display:none">')

    var pagamentoInput = $('<textarea rows="2" cols="49" class="form-control" id="pagamentoInput">');
    pagamentoInput.attr('autocomplete', 'off');
    pagamentoInput.attr('readonly', true);
    pagamentoInput.css('cursor', 'pointer');
    pagamentoInput.css('width', 'auto');
    pagamentoInput.css('height', '80px');

    var botaoApagarUltimo = $('<button class="btn btn-danger btn-sm">Apagar</button>');
    botaoApagarUltimo.css('height', '42px');
    var pagamentoSugestoes = $('<div class="suggestions" id="suggestionsPagamento" style="display:none"></div>')
    var labelCidadeInput = $('<label class="form-label" for="cidadeInput">Cidade:</label>');
    var cidadeInput = $('<input type="text" class="form-control" id="cidadeInput" placeholder="Cidade">');
    cidadeInput.attr('autocomplete', 'off');
    var cidadeSugestoes = $('<div class="suggestions" id="suggestions"></div>')
    var labelResponsavelInput = $('<label class="form-label" for="responsavelInput">Responsável:</label>');
    var responsavelInput = $('<input type="text" class="form-control" id="responsavelInput" value="{{ nomeRepresentante }}" placeholder="Responsável">');
    responsavelInput.attr('autocomplete', 'off');
    var valorFixoResponsavel = $('<input type="hidden" id="representante-name" value="{{ nomeRepresentante }}">').val()
    var responsavelSugestoes = $('<div class="suggestions" id="suggestionsResponsaveis"></div>');

    form_row.append(pagamentoInput, botaoApagarUltimo)
    form_row_telefone.append(telefoneInput, tipoTelefone)

    telefoneInput.on('input', function () {
       var numeroFormatado = $(this).val().replace(/\D/g, '');

       numeroFormatado = numeroFormatado.substring(0, 11);

       if (numeroFormatado.length === 11) {
          numeroFormatado = '(' + numeroFormatado.substring(0, 2) + ') ' + numeroFormatado.substring(2, 7) + '-' + numeroFormatado.substring(7);
       } else if (numeroFormatado.length === 10) {
          numeroFormatado = '(' + numeroFormatado.substring(0, 2) + ') ' + numeroFormatado.substring(2, 6) + '-' + numeroFormatado.substring(6);
       }
       $(this).val(numeroFormatado);
    });

    nomeInput.on('blur', function () {
       var inputValue = $(this).val().trim();
       nomeInput.css('border', '1px solid #ced4da')

       inputEmpresas(inputValue)
          .then(function (empresas) {
             empresas.forEach(function (empresa) {
                if (inputValue.toLowerCase() === empresa.Name.toLowerCase()) {
                   alert('Empresa com o nome: "' + inputValue + '" já existe dentro do Ploomes, altere o nome da empresa')
                   nomeInput.val('')
                   nomeInput.css('border', '1px solid red')
                }
             });
          })
          .catch(function (error) {
             console.error(error);
          });
    })

    cnpjInput.on('blur', function () {
       var inputValue = $(this).val().trim();
       ValidarCnpj();
       cnpjInput.css('border', '1px solid #ced4da')

       inputEmpresas(inputValue)
          .then(function (empresas) {
             console.log(empresas)
             empresas.forEach(function (empresa) {
                if (inputValue === empresa.CNPJ) {
                   alert('Empresa com o cnpj: "' + inputValue + '" já existe dentro do Ploomes, altere o nome da empresa')
                   cnpjInput.val('')
                   cnpjInput.css('border', '1px solid red')
                }
             });
          })
          .catch(function (error) {
             console.error(error);
          });
    })

    // Adiciona um evento de input ao campo cnpjInput
    cnpjInput.on('input', function () {
       // Obtém o valor atual do campo
       var inputValue = $(this).val();

       // Remove caracteres não numéricos
       var numericValue = inputValue.replace(/\D/g, '');

       // Aplica a formatação desejada (43.974.562/0001-09)
       var formattedValue = numericValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

       // Atualiza o valor do campo com a formatação aplicada
       $(this).val(formattedValue);
    });

    // Adiciona um evento de keydown para limitar a quantidade de dígitos
    cnpjInput.on('keydown', function (e) {
       // Obtém o valor atual do campo
       var inputValue = $(this).val();

       // Limita a quantidade máxima de dígitos permitidos
       if (inputValue.length >= 18 && e.which !== 8) {
          e.preventDefault(); // Impede a entrada de mais caracteres
       }
    });

    var tipo = ["Comercial", "Celular", "Residencial", "Fax", "Outros"]

    for (var i = 0; i < tipo.length; i++) {
       var option = $('<option></option>').attr('value', tipo[i]).text(tipo[i]);
       tipoTelefone.append(option);
    }

    cidadeInput.on('input', function () {
       var inputValue = $(this).val();
       if (inputValue.trim() === '') {
          $('#suggestions').hide();
          return;
       }
       inputCidades(inputValue)
          .then(function (cidades) {
             // Limpe as sugestões anteriores
             $('#suggestions').empty();

             // Adicione as novas sugestões
             cidades.forEach(function (cidade) {
                var suggestionItem = $('<div class="suggestion-item">' + cidade.Name + " - " + cidade.State.Name + '</div>');
                suggestionItem.on('mousedown', function (event) {
                   // Impede que o input perca o foco
                   event.preventDefault();
                   // Preencha o campo cidadeInput com a sugestão clicada
                   cidadeInput.val(cidade.Name);
                   // Limpe as sugestões
                   $('#suggestions').empty();
                   $('#suggestions').hide();
                });
                // Adicione a sugestão à lista de sugestões
                $('#suggestions').append(suggestionItem);
             });

             $('#suggestions').show();
          })
          .catch(function (error) {
             console.error(error);
          });
    })
       .on('blur', function () {
          $('#suggestions').hide();
       });

    buscarProfileId(valorFixoResponsavel)
       .then(profileId => {

          if (profileId === 1) {

             responsavelInput.on('input', function () {
                var inputValue = $(this).val();
                if (inputValue.trim() === '') {
                   $('#suggestionsResponsaveis').hide();
                   return;
                }
                inputResponsaveis(inputValue)
                   .then(function (responsaveis) {
                      // Limpe as sugestões anteriores
                      $('#suggestionsResponsaveis').empty();

                      // Adicione as novas sugestões
                      responsaveis.forEach(function (responsavel) {
                         var suggestionItem = $('<div class="suggestion-item">' + responsavel.Name + '</div>');
                         suggestionItem.on('mousedown', function (event) {
                            // Impede que o input perca o foco
                            event.preventDefault();
                            // Preencha o campo cidadeInput com a sugestão clicada
                            responsavelInput.val(responsavel.Name);
                            // Limpe as sugestões
                            $('#suggestionsResponsaveis').empty();
                            $('#suggestionsResponsaveis').hide();
                         });
                         // Adicione a sugestão à lista de sugestões
                         $('#suggestionsResponsaveis').append(suggestionItem);
                      });

                      $('#suggestionsResponsaveis').show();
                   })
                   .catch(function (error) {
                      console.error(error);
                   });
             })
                .on('blur', function () {
                   $('#suggestionsResponsaveis').hide();
                });

          } else {
             // Ocultar o elemento de responsável
             responsavelInput.attr("readonly", true);
          }
       });
    var selectedPayments = [];

    // Adicione o evento de clique ao botão "Apagar Último"
    botaoApagarUltimo.on('click', function () {
       // Verifique se há pagamentos para apagar
       if (selectedPayments.length > 0) {
          // Remova o último pagamento da lista
          selectedPayments.pop();
          // Atualize o valor do pagamentoInput
          pagamentoInput.val(selectedPayments.join(', '));
       }
    });

    pagamentoInput.on('click', function () {
       var inputValue = $(this).val().trim();
       selectedPayments = inputValue.split(',').map(function (item) {
          return item.trim();
       });

       if (selectedPayments.length > 0 && selectedPayments[0] === '') {
          selectedPayments.shift();
       }
       //VOLTAR
       inputPagamentos(inputValue)
          .then(function (pagamentos) {
             $('#suggestionsPagamento').empty();

             pagamentos.forEach(function (pagamento) {
                var suggestionItem = $('<div class="suggestion-item">' + pagamento.Name + '</div>');

                suggestionItem.on('mousedown', function (event) {
                   event.preventDefault();

                   var selectedPayment = $(this).text().trim();

                   if (!selectedPayments.includes(selectedPayment)) {
                      selectedPayments.push(selectedPayment);
                      pagamentoInput.val(selectedPayments.join(', '));
                   } else {
                      alert("Valor já adicionado")
                   }

                   $('#suggestionsPagamento').empty();
                   $('#suggestionsPagamento').hide();
                });

                $('#suggestionsPagamento').append(suggestionItem);
             });

             $('#suggestionsPagamento').show();

          })
          .catch(function (error) {
             console.error(error);
          });
    })

       .on('blur', function () {
          $('#suggestionsPagamento').hide();
       });

    var botaoEnviar = $('<button id="enviar-cadastro-empresa" class="btn btn-success btn-sm" style="color: #fff; padding: 8px; margin-top:15px; font-weight: bold;">Cadastrar</button>');

    // Adicione as linhas ao formulário
    form_cadastrar_empresa.append(labelNomeInput, nomeInput, labelcnpjInput, cnpjInput, labelTelefoneInput, form_row_telefone, labelPagamento, form_row, pagamentoSugestoes,
       labelCidadeInput, cidadeInput, cidadeSugestoes, labelResponsavelInput, responsavelInput, responsavelSugestoes, botaoEnviar);

    modalBody.appendChild(form_cadastrar_empresa[0]);

    var isEnviando = false;

    $('#modalSimNao').on('click', '#cadastrar-contato-nao', function (event) {
       event.stopPropagation(); // interrompe a propagação do evento
       if (isEnviando) {
          return;
       }
       var condicao = "Não";
       var botaoCadastrar = $('#cadastrar-contato-nao');

       botaoCadastrar.prop('disabled', true);
       enviarCadastroEmpresa(condicao);
       console.log("Enviou")
       $('#modalSimNao').modal('hide');
       $('#modalGanhar').modal('hide');

       isEnviando = true;
    });

    // Associar o evento de clique ao botão "Cadastrar contato"
    $('#modalSimNao').on('click', '#cadastrar-contato-sim', function (event) {
       event.stopPropagation(); // interrompe a propagação do evento
       var condicao = "Sim";
       $('#cadastrar-contato-sim').prop('disabled', true);
       enviarCadastroEmpresa(condicao);
       const empresaCriada = $('#nomeInput').val()
       $('#modalSimNao').modal('hide');
       $('#modalGanhar').show();
       if (empresaCriada) {
          showModalCriarContato(event, empresaCriada);
       }
    });

    botaoEnviar.on('click', function (event) {
       var telefone = $('#telefoneInput').val();
       var cnpj = $('#cnpjInput').val();

       // Expressão regular para verificar se o número de telefone tem 10 ou 11 dígitos
       var regexTelefone = /^(\(\d{2}\)\s?\d{5}-\d{4}|\(\d{2}\)\s?\d{4}-\d{4}|\d{2}\s?\d{5}-\d{4}|\d{2}\s?\d{4}-\d{4})$/;

       // Expressão regular para verificar se o CNPJ tem o formato específico
       var regexCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

       // Envio para o Ploomes
       if ($('#nomeInput').val() !== '' &&
          regexTelefone.test(telefone) &&
          $('#cidadeInput').val() !== '' &&
          $('#responsavelInput').val() !== '' &&
          regexCnpj.test(cnpj)) {

          $('#modalGanhar').hide();
          showModalContinuarAoContato();
       } else {
          if (telefone === '' || !regexTelefone.test(telefone)) {
             alert('Por favor, digite um número de telefone válido (confira se faltou digitar o DDD).');
          } else if (cnpj === '' || !regexCnpj.test(cnpj)) {
             alert('Por favor, digite um CNPJ válido no formato correto (exemplo: 43.974.562/0001-09).');
          } else {
             alert('Por favor, preencha todos os campos.');
          }
       }
    });

    // Abra o modal
    $('#modalGanhar').modal('show');
 }

 function showModalCriarContato(event, parametroOpcional = "") {
    event.preventDefault(); // Prevenir o envio do formulário padrão

    // Defina o conteúdo do modal para a ação "Cadastrar contato"
    var modalBody = document.getElementById("modalGanhar").querySelector(".modal-body");
    modalBody.innerHTML = ''; // Limpar o conteúdo atual do modal

    // Aqui, você pode criar e adicionar o formulário ao modal
    var form_cadastrar_cliente = $('<div class="cadastrar-cliente">');
    var title = $('<div class="modal-header"><h5 class="modal-title" id="modalGanharLabel">Cadastrar contato - Criando novo contato</h5><button type="button" class="close" aria-label="Fechar"><span aria-hidden="true">&times;</span></button></div>');

    var botaoVoltar = $('<button id="btnVoltar" style="font-size: 20px; border: 1px solid black; cursor:pointer;"><i class="fa-solid fa-arrow-left" style:"color:black;"></i></button>');
    form_cadastrar_cliente.append(botaoVoltar, title);

    $(document).on('click', '#botao-modal-interacao', function (event) {
       // Feche o modal atual
       $('#cadastrar-cliente').modal('hide');
    });

    var labelNomeInput = $('<label class="form-label">Nome:</label>');
    var nomeInputContato = $('<input type="text" id="nomeInputContato" class="form-control" placeholder="Nome do cliente">');
    nomeInputContato.attr('autocomplete', 'off');
    var nomeSugestoes = $('<div class="suggestions" id="suggestionsNome"></div>')

    var labelTelefoneInput = $('<label class="form-label">Telefone:</label>');

    var form_row_telefone = $('<div class="form-row">')
    var telefoneInputContato = $('<input type="tel" id="telefoneInputContato" class="form-control" placeholder="Telefone do cliente">');
    telefoneInputContato.attr('autocomplete', 'off');

    var tipoTelefoneContato = $('<select class="form-control" id="tipoTelefoneContato">');
    tipoTelefoneContato.attr('autocomplete', 'off');
    tipoTelefoneContato.css('width', 'auto');

    var form_row_readonly = $('<div class="form-row">')
    var empresasAdicionadasInput = $('<textarea type="text" id="empresasAdicionadas" class="form-control" readonly>')
    var labelEmpresaInput = $('<label class="form-label">Empresas:</label>');
    var form_row = $('<div class="form-row">')
    var empresaInputContato = $('<input type="text" id="empresaInputContato" class="form-control" placeholder="Empresa">');
    empresaInputContato.attr('autocomplete', 'off');
    var EmpresaSugestoes = $('<div class="suggestions" id="suggestionsEmpresas"></div>')
    var addEmpresa = $('<button id="adicionarEmpresa" class="btn btn-success btn-sm">Adicionar</button>')
    var botaoApagarUltimo = $('<button class="btn btn-danger btn-sm">Apagar</button>');
    botaoApagarUltimo.css('height', '42px');

    if (parametroOpcional !== "") {
       console.log("Entrou no IF")
       empresasAdicionadasInput.val(parametroOpcional);
       empresaInputContato.css('display', 'none')
       botaoApagarUltimo.css('display', 'none')
       addEmpresa.css('display', 'none')
       var nomeSugestoes = ''
    } else {
       // pass
    }

    var labelCidadeInput = $('<label class="form-label">Cidade:</label>');
    var cidadeInputContato = $('<input type="text" id="cidadeInputContato" class="form-control" placeholder="Cidade">');
    cidadeInputContato.attr('autocomplete', 'off');
    var cidadeSugestoes = $('<div class="suggestions" id="suggestionsCidadeContato"></div>')

    var labelResponsavelInput = $('<label class="form-label">Responsável:</label>');
    var responsavelInputContato = $('<input type="text" class="form-control" id="responsavelInputContato" value="{{ nomeRepresentante }}" placeholder="Responsável">');
    responsavelInputContato.attr('autocomplete', 'off');
    var responsavelSugestoes = $('<div class="suggestions" id="suggestionsResponsaveisContato"></div>')
    var valorFixoResponsavel = $('<input type="hidden" id="representante-name-contato" value="{{ nomeRepresentante }}">').val()

    form_row_telefone.append(telefoneInputContato, tipoTelefoneContato)
    form_row.append(empresaInputContato, addEmpresa)
    form_row_readonly.append(empresasAdicionadasInput, botaoApagarUltimo)

    telefoneInputContato.on('input', function () {
       var numeroFormatado = $(this).val().replace(/\D/g, '');

       numeroFormatado = numeroFormatado.substring(0, 11);

       if (numeroFormatado.length === 11) {
          numeroFormatado = '(' + numeroFormatado.substring(0, 2) + ') ' + numeroFormatado.substring(2, 7) + '-' + numeroFormatado.substring(7);
       } else if (numeroFormatado.length === 10) {
          numeroFormatado = '(' + numeroFormatado.substring(0, 2) + ') ' + numeroFormatado.substring(2, 6) + '-' + numeroFormatado.substring(6);
       }
       $(this).val(numeroFormatado);
    });

    var empresasAdicionadas = [];

    nomeInputContato.on('input', function () {
       var inputValue = $(this).val();
       if (inputValue.trim() === '') {
          $('#suggestionsNome').hide();
          labelTelefoneInput.css('display', 'flex');
          form_row_telefone.css('display', 'flex');
          labelCidadeInput.css('display', 'flex');
          cidadeInputContato.css('display', 'flex');
          $('#modalGanharLabel').text("Cadastrar contato - Criando novo contato")
          return;
       }

       inputNomesContatos(inputValue)
          .then(function (contatos) {
             // Limpe as sugestões anteriores
             $('#suggestionsNome').empty();
             empresasAdicionadasInput.empty();

             var novoContato = {
                Name: inputValue,
                Company: null // Se não houver uma empresa associada, você pode deixar esse campo como null
             };

             // Adicione o novoContato à lista de contatos
             contatos.push(novoContato);
             contatos.forEach(function (contato) {
                var suggestionItem;

                if (contatos.length === 0 || (contato.Name === inputValue && !('Id' in contato))) {
                   var suggestionItem = $('<div class="suggestion-item"><strong>Novo contato:</strong> ' + inputValue + '</div>');
                   suggestionItem.on('mousedown', function (event) {
                      // Impede que o input perca o foco
                      event.preventDefault();
                      // Preencha o campo nomeInputContato com o valor original
                      nomeInputContato.val(inputValue);
                      // Limpe as sugestões
                      $('#suggestionsNome').empty();
                      $('#suggestionsNome').hide();
                      labelTelefoneInput.css('display', 'flex');
                      form_row_telefone.css('display', 'flex');
                      labelCidadeInput.css('display', 'flex');
                      cidadeInputContato.css('display', 'flex');
                   });
                   if (contato.Name === inputValue) {
                      $('#suggestionsNome').append(suggestionItem);
                      return
                   }
                   $('#suggestionsNome').show();
                } else {
                   if (contato.Company) {
                      suggestionItem = $('<div class="suggestion-item">' + contato.Name + '<strong> (' + contato.Company.Name + ')</strong>' + '</div>');
                   } else {
                      suggestionItem = $('<div class="suggestion-item">' + contato.Name + '</div>');
                   }
                   suggestionItem.on('mousedown', function (event) {
                      // Impede que o input perca o foco
                      event.preventDefault();
                      $('#suggestionsNome').empty();
                      $('#suggestionsNome').hide();
                      // Preencha o campo nomeInputContato com o valor do contato clicado
                      nomeInputContato.val(contato.Name);
                      // Limpe as sugestões
                      $('#modalGanharLabel').text("Cadastrar contato - Utilizando contato já existente");
                      labelTelefoneInput.css('display', 'none');
                      form_row_telefone.css('display', 'none');
                      labelCidadeInput.css('display', 'none');
                      cidadeInputContato.css('display', 'none');
                      cidadeInputContato.val('');
                      telefoneInputContato.val('');
                      tipoTelefoneContato.val('');

                      empresasAdicionadas = [];
                      if (!contato.Company) {

                      } else {
                         empresasAdicionadasInput.val(contato.Company.Name);
                         empresasAdicionadas.push(empresasAdicionadasInput.val());
                      }
                   });
                   $('#suggestionsNome').append(suggestionItem);
                   $('#suggestionsNome').show();
                }
             });
          })
          .catch(function (error) {
             console.error(error);
          });
    })
       .on('blur', function () {
          $('#suggestionsNome').hide();
       });


    var tipoContato = ["Comercial", "Celular", "Residencial", "Fax", "Outros"]

    for (var i = 0; i < tipoContato.length; i++) {
       var option = $('<option></option>').attr('value', tipoContato[i]).text(tipoContato[i]);
       tipoTelefoneContato.append(option);
    }

    cidadeInputContato.on('input', function () {
       var inputValue = $(this).val();
       if (inputValue.trim() === '') {
          $('#suggestionsCidadeContato').hide();
          return;
       }

       inputCidades(inputValue)
          .then(function (cidades) {
             // Limpe as sugestões anteriores
             $('#suggestionsCidadeContato').empty();

             // Adicione as novas sugestões
             cidades.forEach(function (cidade) {
                var suggestionItem = $('<div class="suggestion-item">' + cidade.Name + " - " + cidade.State.Name + '</div>');
                suggestionItem.on('mousedown', function (event) {
                   // Impede que o input perca o foco
                   event.preventDefault();
                   // Preencha o campo cidadeInput com a sugestão clicada
                   cidadeInputContato.val(cidade.Name);
                   // Limpe as sugestões
                   $('#suggestionsCidadeContato').empty();
                   $('#suggestionsCidadeContato').hide();
                });
                // Adicione a sugestão à lista de sugestões
                $('#suggestionsCidadeContato').append(suggestionItem);
             });

             $('#suggestionsCidadeContato').show();
          })
          .catch(function (error) {
             console.error(error);
          });
    })
       .on('blur', function () {
          $('#suggestionsCidadeContato').hide();
       });

    buscarProfileId(valorFixoResponsavel)
       .then(profileId => {

          if (profileId === 1) {

             responsavelInputContato.on('input', function () {
                var inputValue = $(this).val();
                if (inputValue.trim() === '') {
                   $('#suggestionsResponsaveisContato').hide();
                   return;
                }
                inputResponsaveis(inputValue)
                   .then(function (responsaveis) {
                      // Limpe as sugestões anteriores
                      $('#suggestionsResponsaveisContato').empty();

                      // Adicione as novas sugestões
                      responsaveis.forEach(function (responsavel) {
                         var suggestionItem = $('<div class="suggestion-item">' + responsavel.Name + '</div>');
                         suggestionItem.on('mousedown', function (event) {
                            // Impede que o input perca o foco
                            event.preventDefault();
                            // Preencha o campo cidadeInput com a sugestão clicada
                            responsavelInputContato.val(responsavel.Name);
                            // Limpe as sugestões
                            $('#suggestionsResponsaveisContato').empty();
                            $('#suggestionsResponsaveisContato').hide();
                         });
                         // Adicione a sugestão à lista de sugestões
                         $('#suggestionsResponsaveisContato').append(suggestionItem);
                      });

                      $('#suggestionsResponsaveisContato').show();
                   })
                   .catch(function (error) {
                      console.error(error);
                   });
             })
                .on('blur', function () {
                   $('#suggestionsResponsaveisContato').hide();
                });

          } else {
             // Ocultar o elemento de responsável
             responsavelInputContato.attr("readonly", true);
          }
       });

    var selectedPayments = [];

    // Adicione o evento de clique ao botão "Adicionar Empresa"
    addEmpresa.on('click', function () {
       var empresaDigitada = empresaInputContato.val().trim();

       if (empresaDigitada !== '') {
          // Adicione a empresa digitada ao array de empresas adicionadas
          empresasAdicionadas.push(empresaDigitada);

          if (empresasAdicionadasInput.val()) {
             empresasAdicionadasInput.val(empresasAdicionadasInput.val() + ', ' + empresaDigitada);
          } else {
             empresasAdicionadasInput.val(empresasAdicionadas.join(', '));
          }
          // Limpe o campo de entrada para adicionar outras opções
          empresaInputContato.val('');
       }
    });

    botaoApagarUltimo.on('click', function () {
       // Verifique se há empresas para apagar
       if (empresasAdicionadas.length > 0) {
          // Remova a última empresa adicionada do array
          empresasAdicionadas.pop();

          empresasAdicionadasInput.val(empresasAdicionadas.join(', '));
       }
    });

    empresaInputContato.on('input', function () {
       var inputValue = $(this).val().trim();
       selectedPayments = inputValue.split(',').map(function (item) {
          return item.trim();
       });

       if (selectedPayments.length > 0 && selectedPayments[0] === '') {
          selectedPayments.shift();
       }

       if (inputValue.includes(',')) {
          // Limpa o campo de entrada para que a busca por sugestões comece novamente
          empresaInputContato.val('');
       }

       inputEmpresas(inputValue)
          .then(function (empresas) {
             // Limpe as sugestões anteriores
             $('#suggestionsEmpresas').empty();

             // Adicione as novas sugestões
             empresas.forEach(function (empresa) {
                var suggestionItem = $('<div class="suggestion-item">' + empresa.Name + '</div>');
                suggestionItem.on('mousedown', function (event) {
                   // Impede que o input perca o foco
                   event.preventDefault();

                   var selectedPayment = empresa.Name;

                   // Atualiza apenas o valor do input com o nome da empresa
                   empresaInputContato.val(selectedPayment);

                   $('#suggestionsEmpresas').empty();
                   $('#suggestionsEmpresas').hide();
                });
                // Adicione a sugestão à lista de sugestões
                $('#suggestionsEmpresas').append(suggestionItem);
             });

             $('#suggestionsEmpresas').show();
          })
          .catch(function (error) {
             console.error(error);
          });
    })
       .on('blur', function () {
          $('#suggestionsEmpresas').hide();
       });

    var botaoEnviarContato = $('<button id="enviar-cadastro-contato" class="btn btn-success btn-sm" style="color: #fff; padding: 8px; margin-top:15px; font-weight: bold;">Cadastrar</button>');

    form_cadastrar_cliente.append(title, labelNomeInput, nomeInputContato, nomeSugestoes, labelTelefoneInput, form_row_telefone,
       labelEmpresaInput, form_row_readonly, form_row, EmpresaSugestoes, labelCidadeInput, cidadeInputContato, cidadeSugestoes, labelResponsavelInput, responsavelInputContato,
       responsavelSugestoes, botaoEnviarContato);

    modalBody.appendChild(form_cadastrar_cliente[0]);


    // Verificação dos Campos de contato
    botaoEnviarContato.one('click', function () {
       var telefoneContato = $('#telefoneInputContato').val();
       var cidadeContato = $('#cidadeInputContato').val();
       var tipoTelefoneContato = $('#tipoTelefoneContato').val();
       var regexTelefoneContato = /^(\(\d{2}\)\s?\d{5}-\d{4}|\(\d{2}\)\s?\d{4}-\d{4}|\d{2}\s?\d{5}-\d{4}|\d{2}\s?\d{4}-\d{4})$/;
       console.log(!$('#telefoneInputContato').is(':visible'))

       if ($('#nomeInputContato').val() !== '' &&
          $('#responsavelInputContato').val() !== '' &&
          $('#empresasAdicionadas').val() !== '' &&
          (!$('#telefoneInputContato').is(':visible') || (telefoneContato !== '' && regexTelefoneContato.test(telefoneContato))) &&
          (!$('#cidadeInputContato').is(':visible') || cidadeContato !== '')) {
          if ($('#adicionarEmpresa').is(':visible')) {
             var condicao = "Contato"
          } else {
             var condicao = "Negocio"
          }
          $(this).prop('disabled', true);
          enviarCadastroContato(condicao); //POST CONTATO
       } else {
          if ($('#empresasAdicionadas').val() === '') {
             alert('Por favor, adicione a(s) Empresa(s).');
          } else if (cidadeContato === '') {
             alert('Por favor, preencha o campo de cidade');
          } else if ($('#nomeInputContato').val() === '') {
             alert('Por favor, preencha o nome.');
          } else if ($('#responsavelInputContato').val() === '') {
             alert('Por favor, preencha o responsável.');
          } else if ((telefoneContato === '' || !regexTelefoneContato.test(telefoneContato) || tipoTelefoneContato === '')) {
             alert('Por favor, preencha todas as informações do telefone (Coloque o telefone com DDD)')
          }
       }
    });

    // Abra o modal
    $('#modalGanhar').modal('show');
 }

 function showModalPedidos(event) {
    event.preventDefault(); // Prevenir o envio do formulário padrão

    // Abra o modal
    $('#modalPedidos').modal('show');
 }
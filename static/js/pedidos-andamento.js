// Função para preencher a tabela com os dados da API
function preencherTabela(data) {

    // Obtenha o elemento da tabela pelo ID
    const tableBody = document.getElementById('bodyTablePropostaAndamento');

    // Percorra os dados recebidos
    data.value.forEach(deal => {
        // Crie uma nova linha para cada item
        const row = document.createElement('tr');
        let botaoGanhar, botaoPerder, botaoRevisar, botaoEspelhoPedido;

        // Extraia os campos do JSON
        const contactName = deal.ContactName;
        const dealId = deal.DealId;
        const amount = deal.Amount;
        const createDate = new Date(deal.CreateDate).toLocaleDateString('pt-BR');
        const linkAccepted = 'https://documents.ploomes.com/?k='+deal.Key+'&entity=quote'
        const linkPDF = deal.DocumentUrl;
        const contactId = deal.Deal.PersonId;
        const statusId = deal.Deal.StatusId;
        let stringstatusId = statusId;


        if (stringstatusId === 1) {
            stringstatusId = 'Em aberto ⏰'
        } else if (stringstatusId === 2) {
            stringstatusId = 'Ganha ✅'
        } else {
            stringstatusId = 'Perdida ❌'
        };

        const externallyAccepted = deal.ExternallyAccepted;
        let stringexternallyAccepted = externallyAccepted;

        if (stringexternallyAccepted === true) {
            stringexternallyAccepted = 'Aceito ✅';
        } else if (stringexternallyAccepted === false) {
            stringexternallyAccepted = 'Recusado ❌';
        } else {
            stringexternallyAccepted = 'Aguardando ⏰'
        };

        const approvalStatusId = deal.ApprovalStatusId;
        let stringApprovalStatusId = approvalStatusId;

        if (stringApprovalStatusId === 1) {
            stringApprovalStatusId = 'Aguardando ⏰';
        } else if (stringApprovalStatusId === 2) {
            stringApprovalStatusId = 'Aprovado ✅';
        } else {
            stringApprovalStatusId = 'N/A';
        };

        botaoRevisar = document.createElement('a'); // Criar um elemento <a>
        botaoRevisar.textContent = 'Revisar';
        botaoRevisar.classList.add('btn-sm'); // Adiciona a classe "button-success"
        botaoRevisar.style.color = 'black';
        botaoRevisar.style.backgroundColor = 'gray';
        botaoRevisar.style.marginRight = '10px';
        botaoRevisar.setAttribute('data-button-id',deal.Id);
        botaoRevisar.setAttribute('href', '/consulta-preco/' + deal.ContactId + '/' + deal.Id + '/' + deal.Deal.Id);

        botaoRevisar.addEventListener('click', function(){

            buscarItens(deal.Id);

        });

        if (contactId && (approvalStatusId === 2 || !approvalStatusId) && externallyAccepted === true && statusId === 1) {
            
            botaoGanhar = document.createElement('a'); // Criar um elemento <a>
            botaoGanhar.textContent = 'Ganhar';
            botaoGanhar.classList.add('btn-sm'); // Adiciona a classe "button-success"
            botaoGanhar.style.color = 'black';
            botaoGanhar.style.backgroundColor = 'green';
            botaoGanhar.style.marginRight = '10px';
            botaoPerder.style.cursor = 'pointer';
            botaoGanhar.setAttribute('data-button-id',deal.Id);
    
            // Mostrar botão de ganhar
            // botaoGanhar = document.createElement('button');
            // botaoGanhar.textContent = 'Ganhar';
            // botaoGanhar.classList.add('btn-sm', 'btn-success'); // Adiciona a classe "button-success"
            // botaoGanhar.style.marginRight = '10px';
            // botaoGanhar.setAttribute('data-button-id',deal.Id);

            botaoPerder = document.createElement('a'); // Criar um elemento <a>
            botaoPerder.textContent = 'Perder';
            botaoPerder.classList.add('btn-sm'); // Adiciona a classe "button-success"
            botaoPerder.style.color = 'black';
            botaoPerder.style.backgroundColor = 'red';
            botaoPerder.style.marginRight = '10px';
            botaoPerder.style.cursor = 'pointer';
            botaoPerder.setAttribute('data-toggle', 'modal');
            botaoPerder.setAttribute('data-target','#modalPerderNegocio')
            botaoPerder.setAttribute('data-button-id',deal.Deal.Id);

            // Mostrar botão de perder
            // botaoPerder = document.createElement('button');
            // botaoPerder.textContent = 'Perder';
            // botaoPerder.classList.add('btn-sm', 'btn-danger'); // Adiciona a classe "button-danger"
            // botaoPerder.style.marginRight = '10px';
            // botaoPerder.setAttribute('data-toggle', 'modal');
            // botaoPerder.setAttribute('data-target','#modalPerderNegocio')
            // botaoPerder.setAttribute('data-button-id',deal.Deal.Id);

            botaoGanhar.addEventListener('click', function () {
                ganharNegocio(deal.Id, deal.Deal.Id);
            });

            botaoPerder.addEventListener('click', function () {
                perderNegocio(deal.Deal.Id);
            });

        } else if (statusId !== 1){
            
            botaoGanhar = document.createElement('button');
            botaoGanhar.style.display = 'none';

            botaoPerder = document.createElement('button');
            botaoPerder.style.display = 'none';

        } else {
            
            // Mostrar apenas botão de perder
            // botaoPerder = document.createElement('button');
            // botaoPerder.textContent = 'Perder';
            // botaoPerder.classList.add('btn-sm', 'btn-danger'); // Adiciona a classe "button-danger"
            // botaoPerder.style.marginRight = '10px';
            // botaoPerder.setAttribute('data-toggle', 'modal');
            // botaoPerder.setAttribute('data-target','#modalPerderNegocio')
            // botaoPerder.setAttribute('data-button-id',deal.Deal.Id);

            botaoPerder = document.createElement('a'); // Criar um elemento <a>
            botaoPerder.textContent = 'Perder';
            botaoPerder.classList.add('btn-sm'); // Adiciona a classe "button-success"
            botaoPerder.style.color = 'black';
            botaoPerder.style.backgroundColor = 'red';
            botaoPerder.style.marginRight = '10px';
            botaoPerder.style.cursor = 'pointer';
            botaoPerder.setAttribute('data-toggle', 'modal');
            botaoPerder.setAttribute('data-target','#modalPerderNegocio')
            botaoPerder.setAttribute('data-button-id',deal.Deal.Id);

            botaoPerder.addEventListener('click', function () {
                perderNegocio(deal.Deal.Id);
            });
        };

        // Botão de add contatos
        let botaoAdicionarContato;

        if (!contactId) {
            // botaoAdicionarContato = document.createElement('button');
            // botaoAdicionarContato.textContent = '+ Contato'
            // botaoAdicionarContato.classList.add('btn-sm'); // Adiciona a classe "button-danger"
            // botaoAdicionarContato.style.backgroundColor = 'blue';
            // botaoAdicionarContato.id = 'launchModalButton';
            // botaoAdicionarContato.setAttribute('data-toggle', 'modal');
            // botaoAdicionarContato.setAttribute('data-target', '#modalAddContato');

            botaoAdicionarContato = document.createElement('a'); // Criar um elemento <a>
            botaoAdicionarContato.textContent = '+ Contato';
            botaoAdicionarContato.classList.add('btn-sm'); // Adiciona a classe "button-success"
            botaoAdicionarContato.style.color = 'black';
            botaoAdicionarContato.style.backgroundColor = '#6868f1';
            botaoAdicionarContato.style.marginRight = '10px';
            botaoAdicionarContato.id = 'launchModalButton';
            botaoAdicionarContato.setAttribute('data-toggle', 'modal');
            botaoAdicionarContato.setAttribute('data-target', '#modalAddContato');
    

            // Adicionar um evento de clique ao botão "add contatos"
            botaoAdicionarContato.addEventListener('click', function () {
                // Mostrar a variável "contactId" no console ao clicar no botão
                buttonAddContatos(contactName,deal.ContactId,deal.Id);
                let inputContato = document.getElementById('idInserirContato');
                inputContato.setAttribute('data-id',deal.Deal.Id);
                inputContato.setAttribute('data-id-contato','');

            });
        };

        // Concatenate 'ContactName' and 'Id' fields with " - "
        const contactNameId = `${contactName} - ${dealId} - ${deal.Id}`;

        // Crie células (`<td>`) para cada campo e adicione-os à linha
        const statusCell = document.createElement('td');
        statusCell.textContent = stringstatusId;
        statusCell.setAttribute("data-title", 'Status');
        row.appendChild(statusCell);

        const contactCell = document.createElement('td');
        contactCell.textContent = contactNameId;
        contactCell.setAttribute("data-title", 'Revenda');
        row.appendChild(contactCell);

        const amountCell = document.createElement('td');
        amountCell.textContent = parseFloat(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        amountCell.setAttribute("data-title", 'Valor');
        row.appendChild(amountCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = createDate;
        dateCell.setAttribute("data-title", 'Data');
        row.appendChild(dateCell);

        const externallyAcceptedCell = document.createElement('td');
        externallyAcceptedCell.textContent = stringexternallyAccepted;
        externallyAcceptedCell.setAttribute("data-title", 'Aceite');
        row.appendChild(externallyAcceptedCell);

        const approvalStatusIdCell = document.createElement('td');
        approvalStatusIdCell.textContent = stringApprovalStatusId;
        approvalStatusIdCell.setAttribute("data-title", 'Desconto aprov.');
        row.appendChild(approvalStatusIdCell);

        // Célula de links
        const linkCell = document.createElement('td');
        linkCell.setAttribute("data-title", 'Links');

        // Crie os elementos de âncora para linkAccepted e linkPDF
        const linkAcceptedElement = document.createElement('a');
        linkAcceptedElement.href = linkAccepted; // Defina o URL do linkAccepted
        linkAcceptedElement.textContent = 'Aceite'; // Texto que será exibido
        linkAcceptedElement.target = '_blank'; // Abre o link em uma nova aba

        const linkPDFElement = document.createElement('a');
        linkPDFElement.href = linkPDF; // Defina o URL do linkPDF
        linkPDFElement.textContent = 'PDF'; // Texto que será exibido
        linkPDFElement.target = '_blank'; // Abre o link em uma nova aba

        // Crie o botão de copiar para linkAccepted
        const copyButtonAccepted = document.createElement('button');
        copyButtonAccepted.textContent = '📋'; // Ícone de copiar
        copyButtonAccepted.addEventListener('click', function () {
            copyToClipboard(linkAccepted);
        });

        // Crie o botão de copiar para linkPDF
        const copyButtonPDF = document.createElement('button');
        copyButtonPDF.textContent = '📋'; // Ícone de copiar
        copyButtonPDF.addEventListener('click', function () {
            copyToClipboard(linkPDF);
        });

        // Adicione os elementos à célula
        linkCell.appendChild(linkAcceptedElement);
        linkCell.appendChild(copyButtonAccepted);
        linkCell.appendChild(document.createElement('br')); // Adiciona uma quebra de linha entre os links
        linkCell.appendChild(linkPDFElement);
        linkCell.appendChild(copyButtonPDF);

        // Adicione a célula à linha
        row.appendChild(linkCell);

        // Chama a função de estilos CSS para cada botão de copiar
        applyButtonStyles(copyButtonAccepted);
        applyButtonStyles(copyButtonPDF);

        // Botões de ganhar e perder
        // Crie uma nova célula para adicionar os botões
        const botoesCell = document.createElement('td');
        botoesCell.setAttribute("data-title", 'Ações');
        
        botoesCell.appendChild(botaoRevisar);

        if (statusId === 2){

            botaoEspelhoPedido = document.createElement('a'); // Criar um elemento <a>
            botaoEspelhoPedido.textContent = 'Espelho';
            botaoEspelhoPedido.classList.add('btn-sm'); // Adiciona a classe "btn-warning"
            botaoEspelhoPedido.style.color = 'black';
            botaoEspelhoPedido.style.marginRight = '10px';
            botaoEspelhoPedido.style.backgroundColor = 'yellow';
            botaoEspelhoPedido.style.cursor = 'pointer';
            botaoEspelhoPedido.setAttribute('data-button-id', deal.Id);
    
            botaoEspelhoPedido.addEventListener('click', async function() {
                try {
                    // Chamar a função espelhoVenda com await, pois é uma função assíncrona
                    await espelhoVenda(deal.DealId);
                    console.log('Pedido espelhado com sucesso!');
                    // Aqui você pode adicionar qualquer lógica adicional após o sucesso
                } catch (error) {
                    console.error('Erro ao espelhar pedido:', error);
                    // Aqui você pode tratar erros ou feedback ao usuário, se necessário
                }
            });

            botoesCell.appendChild(botaoEspelhoPedido);
    
        };
        
        // Adicione botões à célula
        if (botaoGanhar) {
            botoesCell.appendChild(botaoGanhar);
        }

        botoesCell.appendChild(botaoPerder);

        if (!contactId) {
            botoesCell.appendChild(botaoAdicionarContato);
        };

        // Adicione a célula à linha
        row.appendChild(botoesCell);

        tableBody.appendChild(row);
    });
}

// Função para copiar links ao clipboard
function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.style.position = 'absolute';
    tempInput.style.opacity = '0';
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('Copiado para a área de transferência!');
}

// Função para aplicar estilos CSS personalizados
function applyButtonStyles(button) {
    button.style.backgroundColor = 'transparent'; // Remove cor de fundo
    button.style.border = 'none'; // Remove a borda do botão
    button.style.cursor = 'pointer'; // Define cursor para pointer
    button.style.padding = '0'; // Remove padding
    button.style.outline = 'none'; // Remove o contorno de foco
}

// Função para carregar pedidos de venda
async function espelhoVenda(dealId) {

    const apiUrl = 'https://public-api2.ploomes.com/Orders?$filter=DealId+eq+' + dealId;

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

        if (data.value && data.value.length > 0 && data.value[0].DocumentUrl) {
            const documentUrl = data.value[0].DocumentUrl;
            // Abrir o PDF em uma nova aba
            window.open(documentUrl, '_blank');
        } else {
            throw new Error('URL do documento não encontrado na resposta da API');
        }

        return Promise.resolve(data); // Retorne os dados obtidos, se necessário
    } catch (error) {
        console.error('Erro na solicitação:', error);
        return Promise.reject(error);
    }
}

// Função para carregar uma página de registros
async function loadPage(currentPage, rowsPerPage, apiFilter) {
    
    var idLogin = parseFloat(document.getElementById('idLogin').innerHTML)

    showSpinner();

    // Calcula os valores de `$top` e `$skip` com base na página atual
    const top = rowsPerPage;
    const skip = (currentPage - 1) * rowsPerPage;

    // Cria a URL da API com os parâmetros de paginação e filtros
    const apiUrl = 'https://public-api2.ploomes.com/Quotes?$expand=Installments,Products($select=Id),Approvals($select=Id),ExternalComments($select=Id),Comments($select=Id),Deal&preload=true&$orderby=CreateDate+desc&$top=' + top + '&$skip=' + skip + '&$filter=OwnerId eq ' + idLogin + apiFilter;

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

        // Parseia a resposta para JSON
        const data = await response.json();

        // Chame a função para preencher a tabela com os dados filtrados
        preencherTabela(data);
        
        hideSpinner();

        // Retorne uma promessa resolvida para sinalizar que a função foi concluída com sucesso
        return Promise.resolve();
    } catch (error) {
        console.error('Erro na solicitação:', error);
        hideSpinner();

        // Retorne uma promessa rejeitada para sinalizar que houve um erro
        return Promise.reject(error);
    }
}

// Função para aplicar filtros
function applyFilters() {
    
    // Redefina a página atual para 1
    const tabela = document.getElementById('bodyTablePropostaAndamento');
    tabela.innerHTML = '';

    currentPage = 1;

    // Obtenha os valores dos filtros
    const statusFilter = document.getElementById('statusFilter').value;
    const aceiteExternoFilter = document.getElementById('aceiteExternoFilter').value;
    const aprovacaoDescontoFilter = document.getElementById('aprovacaoDescontoFilter').value;
    const revendaFilter = document.getElementById('revendaFilter').value;
    // const dataFilter = document.getElementById('dataPropostaFilter').value;

    let apiFilter = '';

    if (statusFilter) {
        apiFilter += ` and Deal/StatusId eq ${statusFilter}`;
    }

    if (aceiteExternoFilter) {
        apiFilter += ` and ExternallyAccepted eq ${aceiteExternoFilter}`;
    }

    if (aprovacaoDescontoFilter) {
        apiFilter += ` and ApprovalStatusId eq ${aprovacaoDescontoFilter}`;
    }

    if (revendaFilter) {
        apiFilter += ` and contains(ContactName,'${revendaFilter}')`;
    }

    // Carregue a página com os filtros aplicados
    loadPage(currentPage, rowsPerPage, apiFilter);
}

// Selecione o botão pelo seu ID
const filterButton = document.getElementById('filterTablePropostas');

// Adicione um evento de clique ao botão para chamar a função `applyFilters`
filterButton.addEventListener('click', applyFilters);

// Variáveis para controlar o bloqueio e o temporizador
let isLoading = false;
let loadTimeout;
let currentPage = 1;
let rowsPerPage = 10;

// Função para detectar o evento de rolagem
// Função para detectar o evento de rolagem
function onScroll() {
    // Seleciona o elemento de tabela com rolagem
    const tableContainer = document.querySelector('#cardPropostas');

    // Verifica se o usuário está próximo ao final da tabela
    if (tableContainer.scrollTop + tableContainer.clientHeight >= tableContainer.scrollHeight - 100) {
        // Verifica se não há outra chamada em andamento
        if (!isLoading) {
            // Seta o bloqueio para evitar chamadas simultâneas
            isLoading = true;

            // Obtenha os valores dos filtros
            const statusFilter = document.getElementById('statusFilter').value;
            const aceiteExternoFilter = document.getElementById('aceiteExternoFilter').value;
            const aprovacaoDescontoFilter = document.getElementById('aprovacaoDescontoFilter').value;
            const revendaFilter = document.getElementById('revendaFilter').value

            // Construa o filtro atualizado
            let apiFilter = '';

            // if (statusFilter || aceiteExternoFilter || aprovacaoDescontoFilter || revendaFilter) {
            //     apiFilter += '&$filter=';
            // }

            if (statusFilter) {
                apiFilter += `and Deal/StatusId eq ${statusFilter}`;
            }

            if (aceiteExternoFilter) {
                // if (apiFilter !== '&$filter=') {
                //     apiFilter += ' and ';
                // }
                apiFilter += `and ExternallyAccepted eq ${aceiteExternoFilter}`;
            }

            if (aprovacaoDescontoFilter) {
                // if (apiFilter !== '&$filter=') {
                //     apiFilter += ' and ';
                // }
                apiFilter += `and ApprovalStatusId eq ${aprovacaoDescontoFilter}`;
            }

            // if (revendaFilter) {
            //     if (apiFilter !== '&$filter=') {
            //         apiFilter += ' and ';
            //     }
            //     apiFilter += `ApprovalStatusId eq ${revendaFilter}`;
            // }

            // Define um atraso antes de chamar `loadPage`
            loadTimeout = setTimeout(() => {
                currentPage++;
                loadPage(currentPage, rowsPerPage, apiFilter)
                    .then(() => {
                        // Libera o bloqueio após a conclusão de `loadPage`
                        isLoading = false;
                    })
                    .catch(error => {
                        console.error('Erro ao carregar a página:', error);
                        isLoading = false; // Libera o bloqueio mesmo em caso de erro
                    });
            }, 500); // Atraso de 500 ms (0.5 segundo) antes de chamar `loadPage`
        }
    }
};

// Adiciona o evento de rolagem ao elemento `tableContainer`
const tableContainer = document.querySelector('#cardPropostas');
tableContainer.addEventListener('scroll', onScroll);

showSpinner();
loadPage(1, 10, '');
hideSpinner();
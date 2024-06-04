// Função para popular lista de opções
function popularListaOpcoesContatos(ul,data){
    
    data.value.forEach(contato => {
        
        const li = document.createElement('li');
        li.textContent = contato.Name;
        li.setAttribute('data-id-contato', contato.Id);
        li.setAttribute('data-deal', contato.DealId); 
        
        ul.appendChild(li);

    });
};

// Função para exibir a lista ao clicar no input
function showList() {
    const list = document.getElementById('contatoList');
    list.style.display = 'block';

    const input = document.getElementById('idInserirContato');
    input.removeAttribute('data-id-contato');
};

// Função para esconder a lista ao clicar fora dela
function hideList(event) {
    // Verifique se o evento é um objeto válido antes de acessar suas propriedades
    if (event && event.target) {
        const list = document.getElementById('contatoList');
        const input = document.getElementById('idInserirContato');

        // Verifique se o clique ocorreu dentro do input ou da lista (incluindo os itens da lista)
        const clickedElement = event.target;
        const isClickInsideInput = (clickedElement === input);
        const isClickInsideList = list.contains(clickedElement);

        // Se o clique ocorreu fora do input ou da lista (incluindo os itens da lista), esconda a lista
        if (!isClickInsideInput && !isClickInsideList) {
            list.style.display = 'none';
        }
    }
};

// Função para preencher o input ao selecionar um item da lista
function selectItem(event) {
    const input = document.getElementById('idInserirContato');
    input.value = event.target.textContent;
    input.setAttribute('data-id-contato', event.target.getAttribute('data-id-contato'));
    hideList(); // Esconde a lista após selecionar um item
};

// Função para pesquisar na lista ao digitar algo no input
function filterList() {
    const input = document.getElementById('idInserirContato');
    const filter = input.value.toLowerCase();
    const list = document.getElementById('contatoList');
    const items = list.getElementsByTagName('li');

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.textContent.toLowerCase();

        if (text.includes(filter)) {
            item.style.display = ''; // Exibe o item se corresponder ao filtro
        } else {
            item.style.display = 'none'; // Esconde o item se não corresponder ao filtro
        }
    }
};

// Função para verificar se o valor do input é válido
function validateInput() {
    const input = document.getElementById('idInserirContato');
    const list = document.getElementById('contatoList');
    const items = list.getElementsByTagName('li');
    
    // Verifica se o valor do input corresponde a algum item da lista
    let isValid = false;
    let selectedId = ''; // Variável para armazenar o ID do item selecionado

    for (let i = 0; i < items.length; i++) {
        if (items[i].textContent === input.value) {
            isValid = true;
            selectedId = items[i].getAttribute('data-id-contato'); // Armazena o ID do item selecionado
            break;
        }
    }
    
    // Se o valor não é válido, limpa o input e o atributo data-id
    if (!isValid) {
        input.value = '';
        input.removeAttribute('data-id-contato');
    } else {
        // Se o valor é válido, define o atributo data-id-contato do input com o ID do item selecionado
        input.setAttribute('data-id-contato', selectedId);
    }
};

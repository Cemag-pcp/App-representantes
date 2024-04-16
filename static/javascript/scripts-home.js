var valoresClicados = [];

document.addEventListener('DOMContentLoaded', function () {
 var linhas = document.querySelectorAll('.all_linha');
 
 linhas.forEach(function (linha) {
     linha.addEventListener('click', function () {
         linha.classList.toggle('clicked');

         if (linha.classList.contains('clicked')) {
             var valores = extrairValoresDaLinha(linha);
             valoresClicados.push(valores);
         } else {
             var index = valoresClicados.findIndex(function (item) {
                 return item[0] === linha;
             });

             if (index !== -1) {
                 valoresClicados.splice(index, 1);
             }
         }
     });
 });
 

 function extrairValoresDaLinha(linha) {
     var elementos = linha.getElementsByTagName('td');
     var valores = [];

     for (var i = 1; i <= 3; i++) {
         valores.push(elementos[i].textContent);
     }

     valores.unshift(linha);

     return valores;
 }
});

function changeTab(tabName) {
 // Ocultar todas as tabelas
 var tables = document.querySelectorAll('.card-body');
 tables.forEach(function(table) {
     table.style.display = 'none';
 });

 // Mostrar a tabela correspondente à aba clicada
 document.getElementById(tabName + 'Table').style.display = 'block';

 // Remover a classe "active" de todas as abas
 var tabs = document.querySelectorAll('.nav-link');
 tabs.forEach(function(tab) {
     tab.classList.remove('active');
 });

 // Adicionar a classe "active" à aba clicada
 var clickedTab = document.querySelector('[onclick="changeTab(\'' + tabName + '\')"]');
 clickedTab.classList.add('active');
}

    // Função para calcular e exibir o erro total
function calcularErroTotal() {
    // Obter os valores dos campos editar_emt e editar_ema
    var editar_emt = parseFloat(document.getElementById('editar_emt').value);
    var editar_ema = parseFloat(document.getElementById('editar_ema').value);
    if(editar_ema < 0 && editar_emt > 0){
        editar_ema = -editar_ema
    } else if (editar_emt < 0 && editar_ema > 0){
        editar_emt = -editar_emt
    } 

    // Calcular o erro total (valor absoluto da soma)
    var erro_total = Math.abs(editar_emt + editar_ema);

    // Exibir o resultado no campo erro_total
    document.getElementById('erro_total').value = erro_total.toFixed(2);
}

// Chamar a função calcularErroTotal quando houver alteração nos campos editar_emt e editar_ema
document.getElementById('editar_emt').addEventListener('input', calcularErroTotal);
document.getElementById('editar_ema').addEventListener('input', calcularErroTotal);

function copiarValor() {
    // Seleciona o elemento de input pelo ID
    var campoTexto = document.getElementById("url_timeline");
    
    // Seleciona o valor do campo de texto
    campoTexto.select();
    
    // Copia o texto selecionado para a área de transferência
    document.execCommand("copy");

    exibirMensagem('info', 'Copiado para área de transferência');
    
}

function exibirMensagem(tipo, texto) {
    var mensagemElement = document.getElementById('mensagem');

    // Define o texto da mensagem
    mensagemElement.innerText = texto;

    // Define a classe de estilo com base no tipo
    mensagemElement.className = 'sucesso';
    if (tipo === 'aviso') {
      mensagemElement.className = 'aviso';
    } else if (tipo === 'info'){
        mensagemElement.className = 'info';
    }

    // Exibe a mensagem
    mensagemElement.style.top = '20px'; // Define a posição para exibir a mensagem

    // Aguarda 3 segundos e esconde a mensagem
    setTimeout(function () {
      mensagemElement.style.top = '-204px'; // Define a posição para esconder a mensagem
    }, 3000); // 3000 milissegundos = 3 segundos
}

function formatarDataBrSemHora(dataString) {
    // Cria um objeto Date a partir da string
    var data = new Date(dataString);
    data.setDate(data.getDate() + 1);

    // Obtém os componentes da data
    var dia = data.getDate().toString().padStart(2, '0');
    var mes = (data.getMonth() + 1).toString().padStart(2, '0');
    var ano = data.getFullYear();

    var formatoDesejado = `${dia}/${mes}/${ano}`;

    return formatoDesejado;

}
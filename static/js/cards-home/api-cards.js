// // card pedidos pendentes

// var idLogin = document.getElementById('idLogin').value;

// function getFirstDayOfCurrentMonth() {
//     var date = new Date();
//     date.setDate(1); // Define o dia para o primeiro dia do mês
//     date.setHours(0, 0, 0, 0); // Define a hora para 00:00:00.000
//     return date.toISOString(); // Converte para o formato ISO 8601
// }

// var firstDayOfCurrentMonth = getFirstDayOfCurrentMonth();

// var urlPendentes = `https://public-api2.ploomes.com/Deals?$filter=OwnerId eq ${idLogin} and StatusId eq 1`
// // card ganhas no mes atual
// var urlGanhas = `https://public-api2.ploomes.com/Deals?$filter=OwnerId eq ${idLogin} and StatusId eq 2 and LastUpdateDate ge ${firstDayOfCurrentMonth}`;
// // card perdidas no mes atual
// var urlPerdidas = `https://public-api2.ploomes.com/Deals?$filter=OwnerId eq ${idLogin} and StatusId eq 3 and LastUpdateDate ge ${firstDayOfCurrentMonth}`;

// // Chave de API
// var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';

// // Função para fazer a requisição e atualizar o card
// function updateCard(url, cardId) {
//     fetch(url, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             'user-key': apiKey
//         }
//     })
//     .then(response => response.json())
//     .then(data => {
//         // Supondo que `data.value` seja o array de itens
//         document.getElementById(cardId).textContent = data.value.length; // Atualiza o card com a contagem de itens
//     })
//     .catch(error => {
//         console.error('Erro ao buscar os dados:', error);
//     });
// }

// // Atualize os cards com os dados obtidos
// updateCard(urlPendentes, 'pendentes-count');
// updateCard(urlGanhas, 'ganhas-count');
// updateCard(urlPerdidas, 'perdidas-count');
// Funçoes para pegar API do Ploomes e passar para o Modal 


function buscarProfileId(representanteNameValue) {

    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';
    var apiUrl = `https://public-api2.ploomes.com/Users?$top=100&$select=ProfileId&$filter=Name eq '${representanteNameValue}'`;

    return fetch(apiUrl, {
       method: 'GET',
       headers: {
          'User-Key': apiKey
       }
    })
       .then(response => response.json())
       .then(data => {
          if (data && data.value && data.value.length > 0) {
             return data.value[0].ProfileId; // Pega o primeiro ID da lista (se houver)
          }
          return null; // Retorna null se nenhum ID for encontrado
       })
       .catch(error => {
          console.error(error);
          return null;
       });
 }

 function inputCidades(inputValue) {
    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';
    var apiUrl = `https://public-api2.ploomes.com/Cities?$expand=State,Country&$skip=0&$top=5&$filter=(startswith(Name,'${inputValue}'))&$select=Id,IBGECode,Name&$orderby=Name&$count=true`;

    return fetch(apiUrl, {
       method: 'GET',
       headers: {
          'User-Key': apiKey
       }
    })
       .then(response => response.json())
       .then(data => data.value)
       .catch(error => {
          console.error(error);
          return [];
       });
 }

 function inputResponsaveis(iniciais) {
    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';
    var apiUrl = `https://public-api2.ploomes.com/Users/GetContactOwners?$expand=Profile&$skip=0&$top=5&$filter=(startswith(Name,'${iniciais}'))&$select=Id,Name&$orderby=Name&$count=true`;

    return fetch(apiUrl, {
       method: 'GET',
       headers: {
          'User-Key': apiKey
       }
    })
       .then(response => response.json())
       .then(data => data.value)
       .catch(error => {
          console.error(error);
          return [];
       });
 }

 function inputPagamentos(inputValue) {
    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';

    var apiUrl = `https://public-api2.ploomes.com/Fields@OptionsTables@Options?$skip=0&$top=20&$filter=TableId+eq+27971&$select=Id,Name&$orderby=Name&$count=true`;
    // var apiUrl = `https://public-api2.ploomes.com/Fields@OptionsTables@Options?$skip=0&$top=10&$filter=(contains(Name,'${inputValue}')) and TableId+eq+27971&$select=Id,Name&$orderby=Name&$count=true`;

    return fetch(apiUrl, {
       method: 'GET',
       headers: {
          'User-Key': apiKey
       }
    })
       .then(response => response.json())
       .then(data => data.value)
       .catch(error => {
          console.error(error);
          return [];
       });
 }

 function inputEmpresas(inputValue) {
    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';

    var apiUrl = `https://public-api2.ploomes.com/Contacts?$expand=Company($select=Id,Name)&$skip=0&$top=5&$filter=TypeId+eq+1 and startswith(Name,'${inputValue}')&$select=Id,Name,CNPJ&$orderby=Name&$count=true`;
    // Contacts?$expand=Company($select=Id,Name),Owner($expand=Profile),Phones&$skip=0&$top=1&$filter=TypeId+eq+1+and+(Name+eq+%27w%27)&$select=Id,Name,TypeId,CurrencyId,Register,CPF,CNPJ,Owner&$orderby=Name&$count=true
    return fetch(apiUrl, {
       method: 'GET',
       headers: {
          'User-Key': apiKey
       }
    })
       .then(response => response.json())
       .then(data => data.value)
       .catch(error => {
          console.error(error);
          return [];
       });
 }

 function inputNomesContatos(inputValue) {
    var apiKey = '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3';

    var apiUrl = `https://public-api2.ploomes.com/Contacts?$expand=Company($select=Id,Name)&$skip=0&$top=5&$filter=TypeId+eq+2+and+(startswith(Name,'${inputValue}'))&$select=Id,Name&$orderby=Name&$count=true`;
    // Contacts?$expand=Company($select=Id,Name),Owner($expand=Profile),Phones&$skip=0&$top=1&$filter=TypeId+eq+1+and+(Name+eq+%27w%27)&$select=Id,Name,TypeId,CurrencyId,Register,CPF,CNPJ,Owner&$orderby=Name&$count=true
    return fetch(apiUrl, {
       method: 'GET',
       headers: {
          'User-Key': apiKey
       }
    })
       .then(response => response.json())
       .then(data => data.value)
       .catch(error => {
          console.error(error);
          return [];
       });
 }

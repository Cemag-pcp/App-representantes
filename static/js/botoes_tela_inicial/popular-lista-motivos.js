async function fetchApiMotivos() {

    var apiUrl = 'https://public-api2.ploomes.com/Deals@LossReasons?$filter=PipelineId+eq+37808&$select=Id,Name';
    
    try {
        // Faça a requisição para a API usando a função fetch
        const response = await fetch(apiUrl, {
            method: 'GET', // Método da requisição
            headers: {
                'user-key': '5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3',
                'Content-Type': 'application/json'
            }
        });

        // Verifique se a resposta é OK (status 200)
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        // Converta a resposta para JSON
        const data = await response.json();

        // Retorna os dados para o chamador
        return data;

    } catch (error) {
        // Trate possíveis erros
        console.error('Erro ao chamar a API:', error);
    }
};


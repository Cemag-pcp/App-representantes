import psycopg2
from psycopg2.extras import execute_values

# Configuração do banco de dados
DB_HOST = "database-2.cdcogkfzajf0.us-east-1.rds.amazonaws.com"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "15512332"

# Conexão com o banco de dados
conn = psycopg2.connect(
    dbname=DB_NAME, 
    user=DB_USER, 
    password=DB_PASS, 
    host=DB_HOST
)
cur = conn.cursor()

# Função para criar perguntas
def criar_perguntas():
    versao = "v2"

    perguntas = [
        {
            "texto": "Como você avalia o nível de dificuldade da montagem das carretas?",
            "tipo": "radio",
            "opcoes": ["Muito difícil", "Difícil", "Regular", "Fácil", "Muito fácil"]
        },
        {
            "texto": "Alguma das partes abaixo apresentou dificuldade na montagem?",
            "tipo": "checkbox",
            "opcoes": [
                "Pino de articulação", "Tampas", "Eixos", "Quinta roda", "Cilindro",
                "Mangueiras e conexões", "Plataforma no chassi", "Molas", "Rodas"
            ]
        }
    ]

    # Query para inserir os dados
    query = """
        INSERT INTO perguntas (texto, tipo, opcoes, versao) VALUES %s
    """

    # Formatar os valores para inserção
    values = [
        (pergunta["texto"], pergunta["tipo"], pergunta["opcoes"], versao) for pergunta in perguntas
    ]

    # Inserir múltiplos registros de uma vez
    execute_values(cur, query, values)
    conn.commit()
    print("Perguntas inseridas com sucesso.")

# Executar a função
criar_perguntas()

# Fechar conexão
cur.close()
conn.close()

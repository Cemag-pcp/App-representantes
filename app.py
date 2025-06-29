from flask import Flask, render_template, redirect, url_for, request, session, flash, make_response, Response
from flask import render_template_string, jsonify
import psycopg2  # pip install psycopg2
import psycopg2.extras
from psycopg2.extras import execute_values

import pandas as pd
import numpy as np
import functools
# from reportlab.lib.pagesizes import letter, landscape
# from reportlab.lib import colors
# from reportlab.lib.styles import getSampleStyleSheet
# from reportlab.lib.units import inch
# from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from io import BytesIO
from datetime import date
import json
from datetime import datetime, timedelta, timezone
import uuid
import warnings
from babel.numbers import format_currency
import requests
import cachetools
from datetime import timedelta
import gspread
from google.oauth2.service_account import Credentials
import os
import math

from dotenv import load_dotenv

load_dotenv()

warnings.filterwarnings("ignore")

app = Flask(__name__)
app.secret_key = "listaPreco"

# DB_HOST = "localhost"
DB_HOST = "database-2.cdcogkfzajf0.us-east-1.rds.amazonaws.com"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "15512332"

conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                        password=DB_PASS, host=DB_HOST)

# Você pode ajustar o tamanho máximo do cache conforme necessário
cache_precos = cachetools.LRUCache(maxsize=128)
# Você pode ajustar o tamanho máximo do cache conforme necessário
cache_produtos = cachetools.LRUCache(maxsize=128)


def resetar_cache():
    cache_precos.clear()
    cache_produtos.clear()


@cachetools.cached(cache_precos)
def api_precos():
    
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                        password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    response = requests.get(
        'http://cemag.innovaro.com.br/api/publica/v1/tabelas/listarPrecos')

    # Verificar o código de status HTTP
    if response.status_code == 200:

        # A consulta foi bem-sucedida
        dados = response.json()
        df = pd.json_normalize(dados, 'tabelaPreco')
        df = df.explode('precos')

        # Criar colunas separadas para "valor" e "produto"
        df['valor'] = df['precos'].apply(lambda x: x['valor'])
        df['produto'] = df['precos'].apply(lambda x: x['produto'])
        df['valor'] = pd.to_numeric(
            df['valor'].str.replace('.', '').str.replace(',', '.'))

        df['nome'] = df['nome'].replace(
            'Lista Preço Sudeste/Centro Oeste', 'Lista de Preço SDE/COE')
        df['nome'] = df['nome'].replace(
            'Lista Preço MT/RO', 'Lista de Preço MT/RO')
        df['nome'] = df['nome'].replace(
            'Lista Preço N e NE', 'Lista Norte/Nordeste')

        df = df.drop(columns=['precos', 'codigo'])

        df = df.rename(
            columns={'nome': 'lista', 'valor': 'preco', 'produto': 'codigo'})

        df_final = df[['lista', 'codigo', 'preco']].reset_index(drop=True)
        df_final['lista_nova'] = df_final['lista'].str.replace(' de ', ' ')\
            .str.replace('/', ' e ')\
            .str.replace('Lista Norte e Nordeste', 'Lista Preço N e NE')

        df_final_precos = df_final

    else:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        df_final = pd.read_sql("select * from tb_lista_precos", conn)

        df_final['lista_nova'] = df_final['lista'].str.replace(' de ', ' ')\
            .str.replace('/', ' e ')\
            .str.replace('Lista Norte e Nordeste', 'Lista Preço N e NE')

        df_final_precos = df_final

    #JOIN TABELA PROMOCIONAL E FRETE 

    # print(df_final_precos[(df_final_precos['lista'] == 'Lista Preço SDE e COE')&(df_final_precos['codigo'] == 'CBHM5000 GR SS RD MM M17')])

    # Carregar planilha Promocional
    promocional_df = pd.read_excel('calculo de custo.xlsx', sheet_name='Promocional')

    # Carregar planilha Frete
    frete_df = pd.read_excel('calculo de custo.xlsx', sheet_name='Frete') 

    frete_df['lista'] = frete_df['lista'].replace('Lista Preço N e NE', 'Lista Norte/Nordeste')
    
    # Supondo que as colunas 'lista' e 'codigo' são as chaves para fazer a correspondência
    merged_df = pd.merge(df_final_precos, promocional_df, on=['lista', 'codigo'], suffixes=('_final', '_promocional'), how='left')

    merged_df = pd.merge(merged_df, frete_df[['lista', 'codigo', 'preco']], on=['lista', 'codigo'], suffixes=('_final', '_frete'), how='left')

    merged_df.rename(columns={'preco': 'preco_frete'}, inplace=True)

    return df_final_precos, merged_df

@cachetools.cached(cache_produtos)
def api_lista_produtos():

    response = requests.get(
        'https://cemag.innovaro.com.br/api/publica/v1/tabelas/listarProdutos')

    # A consulta foi bem-sucedida
    dados = response.json()
    df = pd.json_normalize(dados, 'produtos')

    df_final = df[df['CRM'] == True].reset_index(drop=True)
    df_final['pneu_tratado'] = df_final['pneu'].replace('', 'Sem pneu')
    df_final['outras_caracteristicas_tratadas'] = df_final['funcionalidade'].replace(
        '', 'N/A')
    df_final['tamanho_tratados'] = df_final['tamanho'].replace('', 'N/A')

    return df_final

@app.route('/login', methods=['GET', 'POST'])
def login():
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        cache_precos.clear()
        cache_produtos.clear()

        cur.execute(
            "SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
        user = cur.fetchone()

        if user is not None:
            session['user_id'] = user['username']
            return redirect(url_for('opcoes'))
        else:
            flash('Usuário ou Senha inválida', category='error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        # Verifique se o nome de usuário já está em uso
        cur.execute(
            'SELECT id FROM users WHERE username = {}'.format("'"+username+"'"))
        verific = cur.fetchall()
        if len(verific) > 0:
            flash('Username {} is already taken.'.format(username))
        else:
            # Insira o novo usuário no banco de dados
            cur.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                        (username, email, password))
            conn.commit()
            flash('User {} registered successfully.'.format(username))
            return redirect(url_for('login'))

    return render_template('register.html')


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))

        return view(**kwargs)

    return wrapped_view


@app.route('/atualizar-cache',  methods=['GET', 'POST'])
@login_required
def atualizar_caches():

    if request.method == 'POST':

        cache_precos.clear()
        cache_produtos.clear()
        print("atualizado")
        return jsonify({'message': 'Cache atualizado com sucesso!'})

    return render_template('lista.html')


# @app.route('/',  methods=['GET', 'POST'])
# @login_required
# def lista():

#     nome_cliente = request.args.get('nome_cliente')

#     if nome_cliente == None:
#         nome_cliente = 'Agro Imperial-Leopoldina'

#     conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
#                             password=DB_PASS, host=DB_HOST)
#     cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

#     representante = session['user_id']

#     print(representante)

#     df_precos, df_precos_promo_frete = api_precos()

#     df_produtos = api_lista_produtos()

#     tb_favoritos = tabela_favoritos(representante)

#     if representante == 'Lucas Gallo' or representante == 'Renato Rodi':
#         df = df_produtos.merge(df_precos, how='left', on='codigo')
#     else:
#         df = df_produtos.merge(df_precos_promo_frete, how='left', on='codigo')
    
#     try:
#         df = df.merge(tb_favoritos, how='left', on='codigo')
#     except:
#         pass  

#     regiao = buscarRegiaoCliente(nome_cliente)

#     df = df[df['lista_nova'] == regiao]

#     df.fillna('', inplace=True)

#     if representante == 'Lucas Gallo' or representante == 'Renato Rodi':

#         df['preco'] = df['preco'].apply(lambda x: "R$ {:,.2f}".format(
#         x).replace(",", "X")Erro na solicitação:.replace(".", ",").replace("X", "."))
        
#     else:
#         df['preco_final'] = df['preco_final'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
#         df['preco_promocional'] = df['preco_promocional'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
#         df['preco_frete'] = df['preco_frete'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')

#     df['pneu'] = df['pneu'].fillna('Sem pneu')

#     try:
#         df = df.sort_values(by='favorito')
#     except:
#         pass

#     df = df.drop_duplicates(subset=['codigo','lista'])

#     data = df.values.tolist()

#     descricao_unique = df[['descGenerica']
#                           ].drop_duplicates().values.tolist()
#     modelo_unique = df[['modelo']].drop_duplicates().values.tolist()
#     eixo_unique = df[['eixo']].drop_duplicates().values.tolist()
#     mola_freio_unique = df[['molaFreio']].drop_duplicates().values.tolist()
#     tamanho_unique = df[['tamanho_tratados']].drop_duplicates().values.tolist()
#     rodado_unique = df[['rodado']].drop_duplicates().values.tolist()
#     pneu_unique = df[['pneu_tratado']].drop_duplicates().values.tolist()
#     descricao_generica_unique = df[[
#         'outras_caracteristicas_tratadas']].drop_duplicates().values.tolist()

#     return render_template('lista.html', representante=representante, data=data,
#                            descricao_unique=descricao_unique, modelo_unique=modelo_unique,
#                            eixo_unique=eixo_unique, mola_freio_unique=mola_freio_unique,
#                            tamanho_unique=tamanho_unique, rodado_unique=rodado_unique,
#                            pneu_unique=pneu_unique, descricao_generica_unique=descricao_generica_unique,
#                            nome_cliente=nome_cliente)

@app.route('/gerar-proposta',  methods=['GET','POST'])
@login_required
def tela_gerar_proposta():

    nomeRepresentante = session['user_id']
    id_representante = idRepresentante(nomeRepresentante)
    type_id = infoRepresentantes(nomeRepresentante)
    dadosProposta = None

    return render_template('pagina-precos/gerar-proposta.html',nomeRepresentante=nomeRepresentante, id_representante=id_representante, type_id=type_id, dadosProposta=dadosProposta)

@app.route('/consulta-preco',  methods=['GET'])
@login_required
def tela_consulta_preco():

    nomeRepresentante = session['user_id']
    id_representante = idRepresentante(nomeRepresentante)
    type_id = infoRepresentantes(nomeRepresentante)
    
    dadosProposta = None
    
    return render_template('pagina-precos/consulta-preco.html',
                            nomeRepresentante=nomeRepresentante,
                            id_representante=id_representante,
                            type_id=type_id,
                            dadosProposta=dadosProposta)

@app.route('/consulta-preco/<int:idCliente>/<int:quoteId>/<int:dealId>',  methods=['GET'])
@login_required
def tela_revisar(idCliente,quoteId,dealId):

    lista_preco_cliente = buscarRegiaoCliente_id(idCliente)
    dadosProposta = infoProposta(quoteId)
    
    # lista_preco_cliente = 'Lista Preço MT'
    nomeRepresentante = session['user_id']
    id_representante = idRepresentante(nomeRepresentante)
    type_id = infoRepresentantes(nomeRepresentante)

    return render_template('pagina-precos/consulta-preco.html',
                            nomeRepresentante=nomeRepresentante,
                            id_representante=id_representante,
                            type_id=type_id,
                            lista_preco_cliente=lista_preco_cliente,
                            dadosProposta=dadosProposta,quoteId=quoteId,dealId=dealId)

@app.route('/precos-gerar-proposta')
def precos_gerar_proposta():

    nome_cliente = request.args.get('nome')

    print(nome_cliente)

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    representante = session['user_id']

    df_precos, df_precos_promo_frete = api_precos()

    df_produtos = api_lista_produtos()

    tb_favoritos = tabela_favoritos(representante)

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':
        df = df_produtos.merge(df_precos, how='left', on='codigo')
    else:
        df = df_produtos.merge(df_precos_promo_frete, how='left', on='codigo')
    
    try:
        df = df.merge(tb_favoritos, how='left', on='codigo')
    except:
        pass

    regiao = buscarRegiaoCliente(nome_cliente)

    df = df[df['lista_nova'] == regiao]

    df.fillna('', inplace=True)

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':

        df['preco'] = df['preco'].apply(lambda x: "R$ {:,.2f}".format(
        x).replace(",", "X").replace(".", ",").replace("X", "."))
        
    else:
        df['preco_final'] = df['preco_final'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_promocional'] = df['preco_promocional'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_frete'] = df['preco_frete'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')

    df['pneu'] = df['pneu'].fillna('Sem pneu')

    try:
        df = df.sort_values(by='favorito')
    except:
        pass

    df = df.drop_duplicates(subset=['codigo','lista'])
    
    data = df.values.tolist()

    return jsonify({
                    'data':data,
                    'representante':representante
                    })


@app.route('/precos-consulta')
def precos_consulta():

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = session['user_id']

    try:
        lista_preco_cliente = request.args.get('listaPrecoCliente')
    except:
        lista_preco_cliente = None

    df_precos, df_precos_promo_frete = api_precos()

    df_produtos = api_lista_produtos()

    tb_favoritos = tabela_favoritos(representante)

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':
        df = df_produtos.merge(df_precos, how='left', on='codigo')
    else:
        df = df_produtos.merge(df_precos_promo_frete, how='left', on='codigo')
    
    try:
        df = df.merge(tb_favoritos, how='left', on='codigo')
    except:
        pass

    query_regiao = """select * from public.users where username = %s"""

    cur.execute(query_regiao,(representante,))

    regiao = cur.fetchone()

    lista_regioes = regiao['regiao'].split(';')

    df = df[df['lista_nova'].isin(lista_regioes)]

    if lista_preco_cliente:
        if not len(df[df['lista_nova'] == lista_preco_cliente]) == 0:
            df = df[df['lista_nova'] == lista_preco_cliente]

    df.fillna('', inplace=True)

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':

        df['preco'] = df['preco'].apply(lambda x: "R$ {:,.2f}".format(
        x).replace(",", "X").replace(".", ",").replace("X", "."))
        
    else:
        df['preco_final'] = df['preco_final'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_promocional'] = df['preco_promocional'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_frete'] = df['preco_frete'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')

    df['pneu'] = df['pneu'].fillna('Sem pneu')

    try:
        df = df.sort_values(by='favorito')
    except:
        pass

    df = df.drop_duplicates(subset=['codigo','lista'])

    data = df.values.tolist()

    return jsonify({
                    'data':data,
                    'representante':representante
                    })


@app.route('/move/<string:id>', methods=['POST', 'GET'])
@login_required
def move(id):

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = ""+session['user_id']+""

    df = pd.read_sql_query(
        'SELECT * FROM tb_lista_precos WHERE id = {}'.format(id), conn)

    for coluna in df.columns:
        if df[coluna].dtype == 'object':
            df[coluna] = df[coluna].str.strip()

    cur.execute("INSERT INTO tb_favoritos (id, familia, codigo, descricao, representante, preco) VALUES (%s,%s,%s,%s,%s,%s)", (int(
        np.int64(df['id'][0])), df['familia'][0], df['codigo'][0], df['descricao'][0], representante, df['preco'][0]))
    cur.execute('DELETE FROM tb_lista_precos WHERE id = {0}'.format(id))
    conn.commit()
    conn.close()

    return redirect(url_for('lista'))


@app.route('/favoritos', methods=['POST'])
@login_required
def lista_favoritos():

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Obter o estado do favorito da solicitação
    favorite_state = request.json.get('favorite')
    codigo_carreta = request.json.get('rowId')
    representante = ""+session['user_id']+""

    print(favorite_state)
    print(codigo_carreta)
    print(representante)
    # Faça o processamento necessário com os dados recebidos

    if favorite_state == 'on':
        """QUERY PARA ADICIONAR ITEM NA TABELA DE FAVORITOS"""
        query = """ insert into tb_favoritos (codigo,representante,favorito) 
                    values ('{}','{}','{}')""".format(codigo_carreta, representante, favorite_state)

        cur.execute(query)

        conn.commit()
        conn.close()

    else:
        """QUERY PARA EXCLUIR O ITEM DA TABELA DE FAVORITOS"""
        query = """DELETE FROM tb_favoritos WHERE codigo = '{}' and representante = '{}'""".format(
            codigo_carreta, representante)
        cur.execute(query)

        conn.commit()
        conn.close()

    return 'Sucesso'


def tabela_favoritos(representante):

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
                SELECT *
                FROM tb_favoritos
                WHERE representante = '{}'
                """.format(representante))

    tb_favoritos = cur.fetchall()
    tb_favoritos = pd.DataFrame(tb_favoritos) 

    return tb_favoritos


@app.route('/remove/<string:id>', methods=['POST', 'GET'])
@login_required
def remove(id):

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = ""+session['user_id']+""

    representante = """Galo"""

    df = pd.read_sql_query(
        'SELECT * FROM tb_favoritos WHERE id = {}'.format(id), conn)

    for coluna in df.columns:
        if df[coluna].dtype == 'object':
            df[coluna] = df[coluna].str.strip()

    cur.execute("INSERT INTO tb_lista_precos (id, familia, codigo, descricao, representante, preco) VALUES (%s,%s,%s,%s,%s,%s)", (int(
        np.int64(df['id'][0])), df['familia'][0], df['codigo'][0], df['descricao'][0], representante, df['preco'][0]))

    cur.execute('DELETE FROM tb_favoritos WHERE id = {0}'.format(id))

    conn.commit()
    conn.close()

    return redirect(url_for('lista_favoritos'))


@app.route('/logout')
@login_required
def logout():
    session.clear()  # limpa as informações da sessão
    return redirect(url_for('login'))  # redireciona para a página de login


@app.route('/teste')
@login_required
def teste():
    return render_template("teste.html")


@app.route('/car', methods=['POST'])
def adicionar_ao_carrinho():

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    car_data = request.json
    
    # Extraindo os dados individuais
    codigo = car_data.get('codigo')
    cor = car_data.get('cor')
    precoFinal = car_data.get('precoFinal')
    precoInicial = car_data.get('precoInicial')
    descricao_carreta = car_data.get('descricao')

    precoFinal = float(precoFinal.replace("R$", "").replace(".", "").replace(",", "."))
    precoInicial = float(precoInicial.replace("R$", "").replace(".", "").replace(",", "."))

    representante = session['user_id']
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        "INSERT INTO public.tb_carrinho_representante (codigo_carreta,cor,preco,representante,precoInicial,quantidade,descricao_carreta) VALUES (%s,%s,%s,%s,%s,%s,%s)", (codigo,cor,precoFinal,representante,precoInicial,1,descricao_carreta))

    conn.commit()

    return jsonify('sucess')

@app.route('/car-revisar', methods=['POST'])
@login_required
def recuperar_carrinho():

    representante = session.get('user_id')
    
    try:
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # Apagando carrinho
    cur.execute(
        "DELETE FROM public.tb_carrinho_representante WHERE representante = %s",(representante,) )
    
    car_data = request.json

    try:
        for item in car_data:
            # Extraindo os dados individuais
            codigo = item.get('codigo')
            cor = item.get('cor')
            quantidade = item.get('quantidade')
            precoFinal = item.get('precoFinal')
            precoInicial = item.get('precoInicial')
            desconto = item.get('desconto')

            try:
                cur.execute(
                    "INSERT INTO public.tb_carrinho_representante (codigo_carreta, cor, preco, representante, precoInicial, quantidade, desconto) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (codigo, cor, precoFinal, representante, precoInicial, quantidade, desconto)
                )
            except Exception as e:
                conn.rollback()
                return jsonify({'error': str(e)}), 500

        conn.commit()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify({'message': 'success'}), 200

@app.route('/buscar-carrinho', methods=['GET'])
def buscar_carrinho():

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor()

    representante = session['user_id']

    print(representante)

    query = """select * from public.tb_carrinho_representante where representante = %s"""

    cur.execute(query,(representante,))
    data = cur.fetchall()

    return jsonify({'data':data})

@app.route('/salvar_dados', methods=['POST', 'GET'])
def salvar_dados():

    if request.method == 'POST':

        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST)
        cur = conn.cursor()

        tabela = request.form.get('tabela')
        tabela = json.loads(tabela)

        cliente = request.form.get('numeroCliente')
        status = request.form.get("statusCotacao")

        print(status, cliente)

        unique_id = str(uuid.uuid4())  # Gerar id unico

        representante = ""+session['user_id']+""

        tb_orcamento = pd.DataFrame(tabela)

        query = "SELECT nome_completo FROM users WHERE username = %s"

        cur.execute(query, (representante,))

        nome_completo = cur.fetchall()
        nome_completo = nome_completo[0][0]

        tb_orcamento['representante'] = nome_completo
        tb_orcamento['dataOrcamento'] = datetime.today()
        tb_orcamento['dataOrcamento'] = tb_orcamento['dataOrcamento'].dt.strftime(
            '%Y-%m-%d')
        tb_orcamento['cliente'] = cliente
        tb_orcamento['id'] = unique_id
        tb_orcamento['status'] = status

        tb_orcamento['precoFinal'] = tb_orcamento['precoFinal'].str.replace(
            "R\$", "").str.replace(".", "").str.replace(",", ".").astype(float)
        tb_orcamento['preco'] = tb_orcamento['preco'].str.replace(
            "R\$", "").str.replace(".", "").str.replace(",", ".").astype(float)

        print(tb_orcamento)

        # Cria uma lista de tuplas contendo os valores das colunas do DataFrame
        valores = list(zip(tb_orcamento['familia'], tb_orcamento['codigo'], tb_orcamento['descricao'], tb_orcamento['preco'], tb_orcamento['precoFinal'],
                           tb_orcamento['quantidade'].astype(
                               int), tb_orcamento['representante'], tb_orcamento['dataOrcamento'], tb_orcamento['cliente'], tb_orcamento['id'],
                           tb_orcamento['status']))

        # Cria a string de consulta SQL para a inserção
        consulta = "INSERT INTO tb_orcamento (familia, codigo, descricao, preco, precoFinal, quantidade, representante, dataOrcamento, cliente, id, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"

        # Abre uma transação explícita
        with conn:
            # Cria um cursor dentro do contexto da transação
            with conn.cursor() as cur:
                # Executa a inserção das linhas usando executemany
                cur.executemany(consulta, valores)

        return jsonify({'mensagem': 'Dados enviados com sucesso'})


@app.route('/move-carrinho/<string:id>', methods=['POST', 'GET'])
@login_required
def move_carrinho(id):

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = "'"+session['user_id']+"'"

    df = pd.read_sql_query(
        'SELECT * FROM tb_lista_precos WHERE id = {}'.format(id), conn)

    for coluna in df.columns:
        if df[coluna].dtype == 'object':
            df[coluna] = df[coluna].str.strip()

    df_carrinho = pd.read_sql_query(
        'SELECT * FROM tb_carrinho_representante WHERE representante = {}'.format(representante), conn)

    df_carrinho = df_carrinho['codigo'].values.tolist()

    representante = ""+session['user_id']+""

    if df['codigo'][0] not in df_carrinho:
        cur.execute("INSERT INTO tb_carrinho_representante (familia, codigo, descricao, preco, representante) VALUES (%s,%s,%s,%s,%s)",
                    (df['familia'][0], df['codigo'][0], df['descricao'][0], df['preco'][0], representante))
        conn.commit()
        conn.close()
    else:
        pass

    return redirect(url_for('lista'))


@app.route('/move-carrinho-favorito/<string:id>', methods=['POST', 'GET'])
@login_required
def move_carrinho_favorito(id):

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = "'"+session['user_id']+"'"

    df = pd.read_sql_query(
        'SELECT * FROM tb_favoritos WHERE id = {}'.format(id), conn)

    for coluna in df.columns:
        if df[coluna].dtype == 'object':
            df[coluna] = df[coluna].str.strip()

    df_carrinho = pd.read_sql_query(
        'SELECT * FROM tb_carrinho_representante WHERE representante = {}'.format(representante), conn)

    df_carrinho = df_carrinho['codigo'].values.tolist()

    representante = ""+session['user_id']+""

    if df['codigo'][0] not in df_carrinho:
        cur.execute("INSERT INTO tb_carrinho_representante (familia, codigo, descricao, preco, representante) VALUES (%s,%s,%s,%s,%s)",
                    (df['familia'][0], df['codigo'][0], df['descricao'][0], df['preco'][0], representante))
        conn.commit()
        conn.close()
    else:
        pass

    return redirect(url_for('lista_favoritos'))


@app.route('/remove-carrinho', methods=['POST'])
@login_required
def remove_carrinho():

    data = request.json

    id = data['id']

    print(id)

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute('DELETE FROM tb_carrinho_representante WHERE id = %s',(id,))

    conn.commit()

    return jsonify('sucess')


@app.route('/remove-all', methods=['POST', 'GET'])
@login_required
def remove_all():

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = session['user_id']

    cur.execute('DELETE FROM tb_carrinho_representante WHERE representante = %s',(representante,))

    conn.commit()

    conn.close()

    return jsonify('sucess')

##### Bloco de orçamentos #####


@app.route('/orcamentos', methods=['GET'])
@login_required
def orcamentos():

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    # filtro_cliente = request.args.get('cliente')
    filtro_data = request.args.get('filtro_data')
    filtro_cliente = request.args.get('filtro_cliente')
    filtro_status = request.args.get('filtro_status')
    representante = session['user_id']

    print(representante)

    # Conexão com o banco de dados PostgreSQL
    cur = conn.cursor()

    # Construindo a consulta com placeholder
    sql1 = "SELECT cliente, id, SUM(precofinal * quantidade) AS soma_total, SUM(quantidade) AS quantidade_total, status FROM tb_orcamento WHERE 1=1 AND representante = %s"
    sql2 = " GROUP BY cliente, id, status"

    placeholders = [representante]

    if filtro_data and filtro_data != '':
        if filtro_data != '':
            data_inicial, data_final = filtro_data.split(" - ")

            print(data_inicial, data_final)

            # Converter as strings em objetos de data
            data_inicial = datetime.strptime(data_inicial, "%Y-%m-%d").date()
            data_final = datetime.strptime(data_final, "%Y-%m-%d").date()

            # Adiciona um espaço em branco antes do AND
            sql1 += " AND dataOrcamento BETWEEN %s AND %s"
            placeholders.extend([data_inicial, data_final])

    if filtro_cliente and filtro_cliente != 'Todos':
        sql1 += " AND cliente = %s"  # Adiciona um espaço em branco antes do AND
        placeholders.append(filtro_cliente)

    if filtro_status and filtro_status != 'Todos':
        sql1 += " AND status = %s"  # Adiciona um espaço em branco antes do AND
        placeholders.append(filtro_status)

    # Executando a consulta com os placeholders
    cur.execute(sql1+sql2, placeholders)
    dados = cur.fetchall()

    for i, tupla in enumerate(dados):
        # Acessa o terceiro elemento da tupla (valor a ser formatado)
        valor = tupla[2]
        valor_formatado = format_currency(valor, 'BRL', locale='pt_BR')
        valor_formatado = valor_formatado.replace(
            "\xa0", " ")  # Remove o espaço em branco
        dados[i] = (*tupla[:2], valor_formatado, *tupla[3:])

    return render_template('orcamentos.html', dados=dados)


@app.route('/orcamento/<string:id>', methods=['POST', 'GET'])
@login_required
def item_orcamento(id):

    id = "'" + id + "'"

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = "'"+session['user_id']+"'"

    # representante = """Galo"""

    cur.execute('SELECT * FROM tb_orcamento WHERE id = {}'.format(id))

    dados = cur.fetchall()

    for dicionario in dados:
        # Acessa o valor do campo 'preco' no dicionário
        valor = dicionario['preco']
        valor_formatado = format_currency(valor, 'BRL', locale='pt_BR')
        valor_formatado = valor_formatado.replace(
            "\xa0", " ")  # Remove o espaço em branco
        dicionario['preco'] = valor_formatado

    # id = "'8397d602-ca7d-43c1-a838-378ff7640ba7'"

    status_atual = [dados[0]['status']]

    lista_status = ['Pendente', 'Em andamento', 'Aguardando aprovação', 'Aprovado', 'Rejeitado',
                    'Cancelado', 'Em negociação', 'Concluído', 'Convertido em venda']

    # Remover o status atual da lista
    lista_status.remove(status_atual[0])

    # Inserir o status atual na primeira posição
    lista_status.insert(0, status_atual[0])

    return render_template("orcamento_item.html", dados=dados, lista_status=lista_status,
                           status_atual=status_atual)


@app.route('/remover_item', methods=['POST'])
@login_required
def remover_item():
    id = request.form.get('id')  # Obtém o ID enviado na requisição

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor()

    query = 'DELETE FROM tb_orcamento WHERE id_serial = %s'
    cur.execute(query, (id,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'message': 'Item removido com sucesso'})


@app.route("/checkbox", methods=['POST'])
def checkbox():

    dados_selecionados = request.get_json()

    # Faça o processamento dos dados selecionados aqui
    # Por exemplo, você pode imprimir os dados no console
    print(dados_selecionados)
    return 'Dados recebidos com sucesso!'


@app.route('/atualizar-dados', methods=['GET'])
def atualizar_dados():

    descricao = request.args.get('categoria')
    modelo = request.args.get('modelo')
    eixo = request.args.get('eixo')
    molaFreio = request.args.get('molaFreio')
    tamanho = request.args.get('tamanho')
    rodado = request.args.get('rodado')
    pneu = request.args.get('pneu')
    opcionais = request.args.get('opcionais')
    nome_cliente = request.args.get('nome_cliente')
    
    representante = session['user_id']

    df_precos, df_precos_promo_frete = api_precos()

    df_produtos = api_lista_produtos()

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':
        df = df_produtos.merge(df_precos, how='left', on='codigo')
    else:
        df = df_produtos.merge(df_precos_promo_frete, how='left', on='codigo')

    regiao = buscarRegiaoCliente(nome_cliente)
    # regiao = 'Lista Preço SDE e COE'
    
    df = df[df['lista_nova'] == regiao]

    # Inicialize um DataFrame vazio para conter os resultados
    resultados = pd.DataFrame()

    # Verifique cada variável de filtro e aplique a condição correspondente se o valor não for vazio
    if descricao != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['descGenerica'] == descricao]
        else:
            resultados = df.loc[df['descGenerica'] == descricao]

    if modelo != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['modelo'] == modelo]
        else:
            resultados = df.loc[df['modelo'] == modelo]
    
    if eixo != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['eixo'] == eixo]
        else:
            resultados = df.loc[df['eixo'] == eixo]

    if molaFreio != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['molaFreio'] == molaFreio]
        else:
            resultados = df.loc[df['molaFreio'] == molaFreio]

    if rodado != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['rodado'] == rodado]
        else:
            resultados = df.loc[df['rodado'] == rodado]

    if tamanho != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['tamanho_tratados'] == tamanho]
        else:
            resultados = df.loc[df['tamanho_tratados'] == tamanho]

    if pneu != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['pneu_tratado'] == pneu]
        else:
            resultados = df.loc[df['pneu_tratado'] == pneu]

    if opcionais != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['outras_caracteristicas_tratadas']
                                        == opcionais]
        else:
            resultados = df.loc[df['outras_caracteristicas_tratadas']
                                == opcionais]

    # O DataFrame 'resultados' agora contém as linhas que atendem a todas as condições de pesquisa

    if len(resultados) == 0:
        resultados = df
        df = resultados
    else:
        df = resultados

    # regiao = buscarRegiaoCliente(nome_cliente)

    df = df[df['lista_nova'] == regiao]

    df.fillna('', inplace=True)

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':

        df['preco'] = df['preco'].apply(lambda x: "R$ {:,.2f}".format(
        x).replace(",", "X").replace(".", ",").replace("X", "."))
        
    else:
        df['preco_final'] = df['preco_final'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_promocional'] = df['preco_promocional'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_frete'] = df['preco_frete'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')

    df['pneu'] = df['pneu'].fillna('Sem pneu')
    
    modelo = [item for item in modelo if item[0]]

    data = df.values.tolist()

    return jsonify({'data':data,
                    'representante':representante})


@app.route('/atualizar-cliente', methods=['GET'])
def atualizar_cliente():

    nameCliente = request.args.get('nameCliente')

    print(nameCliente)

    lista_opcoes_cliente = chamadaCondicoes(nameCliente)

    opcoes = ['À prazo - 1x', 'À prazo - 2x', 'À prazo - 3x', 'À prazo - 4x',
              'À prazo - 5x', 'À prazo - 6x', 'À prazo - 7x', 'À prazo - 8x',
              'À prazo - 9x', 'À prazo - 10x', 'A Vista', 'Antecipado', 'Cartão de Crédito',
              'Personalizado']

    condicoes = obter_condicoes_pagamento(lista_opcoes_cliente, opcoes)

    print(condicoes)

    return jsonify(condicoes=condicoes)

@app.route('/enviarBackend', methods=['POST'])
def obs():

    linha = request.get_json()

    return 'Itens recebidos e processados com sucesso!'


@app.route('/receber-dados', methods=['POST'])
def process_data():
    
    data = request.get_json()

    listaProdutos = []
    listaCores = []
    listaQuantidade = []
    listaPreco = []
    listaPrecoUnitario = []
    listaPercentDesconto = []
    listaContatos = []
    listaObs = []
    listaRep = []
    listaFP = []
    listaCliente = []
    lista_id=[]
    
    if 'idContato' in data:
        nomeContato = data['idContato']
    else:
        nomeContato = ""

    produtos = data['listaProdutos']
    unique_id = str(uuid.uuid4())  # Gerar id unico

    for produto in produtos:
        listaProdutos.append(produto['produto'])
        listaCores.append(produto['cor'])
        listaQuantidade.append(produto['quantidade'])
        listaPreco.append(float(produto['preco'])*float(produto['quantidade']))
        listaPrecoUnitario.append(produto['preco'])
        listaPercentDesconto.append(round((float(produto['precoInicial']) - float(produto['preco'])) / float(produto['precoInicial']),4))
        listaContatos.append(data['nomeContato'])
        listaObs.append(data['observacao'])
        listaRep.append(session['user_id'])
        listaFP.append(data['formaPagamento'])
        listaCliente.append(data['nomeCliente'])
        lista_id.append(unique_id)
    
    deal_id = criarOrdem(data['nomeCliente'], data['idCliente'], nomeContato, session['user_id'])

    try:
        criarProposta(deal_id, data['observacao'], data['formaPagamento'], session['user_id'], listaProdutos, listaCores, listaPreco, listaQuantidade, listaPrecoUnitario, listaPercentDesconto)
    except:
        return jsonify({'message': 'error'})
    
    # atualizarEtapaProposta(deal_id)
    enviar_email(session['user_id'], data['nomeCliente'], deal_id)

    query = """INSERT INTO tb_orcamento (id,nome_cliente,contato_cliente,forma_pagamento,observacoes,quantidade,preco_final,codigo,cor,representante) 
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""

    # Cria uma lista de tuplas contendo os valores das colunas do DataFrame
    valores = list(zip(lista_id, listaCliente, listaContatos, listaFP, listaObs,
                       listaQuantidade, listaPreco, listaProdutos, listaCores, listaRep,
                       ))
    
    # Abre uma transação explícita
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                        password=DB_PASS, host=DB_HOST)
    cur = conn.cursor()

    with conn:
        # Cria um cursor dentro do contexto da transação
        with conn.cursor() as cur:
            # Executa a inserção das linhas usando executemany
            cur.executemany(query, valores)
    
    conn.commit()
    conn.close()

    # flash("Enviado com sucesso", 'success')
    remove_all() # remover itens do carrinho

    return jsonify({'message': 'success'})

@app.route('/filtrar_regiao', methods=['POST'])
def atualizar_regiao():

    nome_cliente_regiao = request.form['nome_cliente_regiao']

    print('apenas_printando:', nome_cliente_regiao)

    return redirect(url_for('lista', nome_cliente=nome_cliente_regiao))


@app.route('/', methods=['GET', 'POST'])
@login_required
def opcoes():
    print('testes')
    nomeRepresentante = session['user_id']
    id_representante = idRepresentante(nomeRepresentante)
    type_id = infoRepresentantes(nomeRepresentante)

    return render_template('opcoes.html', nomeRepresentante=nomeRepresentante, id_representante=id_representante, type_id=type_id)

@app.route('/mouse-down', methods=['POST'])
@login_required
def mouse_down():

    nomeRepresentante = session['user_id']

    skip = int(request.json.get('skip', 0)) # valor padrão é 0
    statusId = request.json.get('statusId')
    top = request.json.get('top')
    data = listarOrcamentos(nomeRepresentante,skip,statusId,top)

    return jsonify(data)

@app.route('/consulta', methods=['POST','GET'])
@login_required
def consulta():

    if request.method == 'POST':
        idquota = request.form.get('valor')
        dealId = request.form.get('dealId')
    else:
        idquota = None
        dealId = None

    # if 'idquote' in session:
    #     idquota = session['idquote']
    
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    representante = session['user_id']

    df_precos, df_precos_promo_frete = api_precos()

    df_produtos = api_lista_produtos()

    tb_favoritos = tabela_favoritos(representante)

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':
        df = df_produtos.merge(df_precos, how='left', on='codigo')
    else:
        df = df_produtos.merge(df_precos_promo_frete, how='left', on='codigo')

    try:
        df = df.merge(tb_favoritos, how='left', on='codigo')
    except:
        pass

    cur.execute(
        """select regiao from users where username = '{}'""".format(representante))

    regiao = cur.fetchall()
    regiao = regiao[0]['regiao']

    regiao = regiao.split(";")

    df = df[df['lista_nova'].isin(regiao)]

    # df = df.dropna(subset='lista_nova')
    df = df.reset_index(drop=True)

    df.fillna('', inplace=True)

    # if regiao:
    #     df = df[df['lista_nova'] == regiao[0][0]]

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':

        df['preco'] = df['preco'].apply(lambda x: "R$ {:,.2f}".format(
        x).replace(",", "X").replace(".", ",").replace("X", "."))

    else:
        df['preco_final'] = df['preco_final'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_promocional'] = df['preco_promocional'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_frete'] = df['preco_frete'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')

    df['pneu'] = df['pneu'].fillna('Sem pneu')

    try:
        df = df.sort_values(by='favorito')
    except:
        pass

    tb_listarItensMaisVendidos = listarItensMaisVendidos(representante)

    if len(tb_listarItensMaisVendidos) > 0:
        df = df.merge(tb_listarItensMaisVendidos, how='left', on='codigo')
        df = df.sort_values(by='count', ascending=False)
    
    df = df.drop_duplicates(subset=['codigo','lista'])

    data = df.values.tolist()

    descricao_unique = df[['descGenerica']
                        ].drop_duplicates().values.tolist()
    modelo_unique = df[['modelo']].drop_duplicates().values.tolist()
    eixo_unique = df[['eixo']].drop_duplicates().values.tolist()
    mola_freio_unique = df[['molaFreio']].drop_duplicates().values.tolist()
    tamanho_unique = df[['tamanho_tratados']].drop_duplicates().values.tolist()
    rodado_unique = df[['rodado']].drop_duplicates().values.tolist()
    pneu_unique = df[['pneu_tratado']].drop_duplicates().values.tolist()
    descricao_generica_unique = df[[
        'outras_caracteristicas_tratadas']].drop_duplicates().values.tolist()
    lista_unique = df[['lista_nova']].drop_duplicates().values.tolist()

    return render_template('consulta.html', data=data,
                        descricao_unique=descricao_unique, modelo_unique=modelo_unique,
                        eixo_unique=eixo_unique, mola_freio_unique=mola_freio_unique,
                        tamanho_unique=tamanho_unique, rodado_unique=rodado_unique,
                        pneu_unique=pneu_unique, descricao_generica_unique=descricao_generica_unique,
                        lista_unique=lista_unique, representante=representante, idquota=idquota, dealId=dealId)


@app.route('/motivosPerda', methods=['GET'])
@login_required
def listarMotivosPerda():

    listaMotivos = listarMotivos()
    
    return jsonify(listaMotivos) 


def listarItensMaisVendidos(representante):

    """
    Esta função pega os itens mais vendidos de cada representante

    representante: nome do representante
    tb_carretasMaisVendidas: tabela com as informações de carretas mais vendidas
    por representante
    """

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
                SELECT codigo, COUNT (codigo)
                FROM tb_orcamento
                WHERE representante = '{}'
                GROUP BY codigo
                ORDER BY count desc
                LIMIT 10;
                """.format(representante))

    tb_carretasMaisVendidas = cur.fetchall()
    tb_carretasMaisVendidas = pd.DataFrame(tb_carretasMaisVendidas)

    return tb_carretasMaisVendidas


@app.route('/atualizar-dados-sem-cliente', methods=['GET'])
def atualizar_dados_sem_cliente():
    
    descricao = request.args.get('categoria')
    modelo = request.args.get('modelo')
    eixo = request.args.get('eixo')
    molaFreio = request.args.get('molaFreio')
    tamanho = request.args.get('tamanho')
    rodado = request.args.get('rodado')
    pneu = request.args.get('pneu')
    opcionais = request.args.get('opcionais')
    lista = request.args.get('listas')

    representante = session['user_id']

    df_precos, df_precos_promo_frete = api_precos()

    df_produtos = api_lista_produtos()

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':
        df = df_produtos.merge(df_precos, how='left', on='codigo')
    else:
        df = df_produtos.merge(df_precos_promo_frete, how='left', on='codigo')

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(
        """select regiao from users where username = '{}'""".format(representante))

    regiao = cur.fetchall()
    regiao = regiao[0]['regiao']

    regiao = regiao.split(";")

    df = df[df['lista_nova'].isin(regiao)]

    # Inicialize um DataFrame vazio para conter os resultados
    resultados = pd.DataFrame()

    # Verifique cada variável de filtro e aplique a condição correspondente se o valor não for vazio
    if descricao != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['descGenerica'] == descricao]
        else:
            resultados = df.loc[df['descGenerica'] == descricao]

    if modelo != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['modelo'] == modelo]
        else:
            resultados = df.loc[df['modelo'] == modelo]
    
    if eixo != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['eixo'] == eixo]
        else:
            resultados = df.loc[df['eixo'] == eixo]

    if molaFreio != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['molaFreio'] == molaFreio]
        else:
            resultados = df.loc[df['molaFreio'] == molaFreio]

    if rodado != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['rodado'] == rodado]
        else:
            resultados = df.loc[df['rodado'] == rodado]

    if tamanho != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['tamanho_tratados'] == tamanho]
        else:
            resultados = df.loc[df['tamanho_tratados'] == tamanho]

    if pneu != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['pneu_tratado'] == pneu]
        else:
            resultados = df.loc[df['pneu_tratado'] == pneu]

    if opcionais != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['outras_caracteristicas_tratadas']
                                        == opcionais]
        else:
            resultados = df.loc[df['outras_caracteristicas_tratadas']
                                == opcionais]

    if lista != '':
        if not resultados.empty:
            resultados = resultados.loc[resultados['lista_nova']
                                        == lista]
        else:
            resultados = df.loc[df['lista_nova'] == lista]

    # O DataFrame 'resultados' agora contém as linhas que atendem a todas as condições de pesquisa

    if len(resultados) == 0:
        resultados = df
        df = resultados
    else:
        df = resultados

    df.fillna('', inplace=True)

    if representante == 'Lucas Gallo' or representante == 'Renato Rodi':

        df['preco'] = df['preco'].apply(lambda x: "R$ {:,.2f}".format(
        x).replace(",", "X").replace(".", ",").replace("X", "."))

    else:
        df['preco_final'] = df['preco_final'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_promocional'] = df['preco_promocional'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')
        df['preco_frete'] = df['preco_frete'].apply(lambda x: "R$ {:,.2f}".format(x).replace(",", "X").replace(".", ",").replace("X", ".") if x != '' else '')

    df['pneu'] = df['pneu'].fillna('Sem pneu')

    # if buttonFav:
    #     tb_listarItensMaisVendidos = listarItensMaisVendidos(representante)

    #     df = df.merge(tb_listarItensMaisVendidos, how='left', on='codigo')

    #     df = df.sort_values(by='count', ascending=False)

    #     df = df.dropna()

    # descricao = df[['descGenerica']].drop_duplicates().values.tolist()
    # modelo = df[['modelo']].drop_duplicates().values.tolist()
    # eixo = df[['eixo']].drop_duplicates().values.tolist()
    # mola_freio = df[['molaFreio']].drop_duplicates().values.tolist()
    # tamanho = df[['tamanho_tratados']].drop_duplicates().values.tolist()
    # rodado = df[['rodado']].drop_duplicates().values.tolist()
    # pneu = df[['pneu_tratado']].drop_duplicates().values.tolist()
    # descricao_generica = df[[
    #     'outras_caracteristicas_tratadas']].drop_duplicates().values.tolist()
    # lista_preco = df[['lista_nova']].drop_duplicates().values.tolist()

    data = df.values.tolist()

    return jsonify({'data':data,'representante':representante})


@app.route('/perda', methods=['POST'])
@login_required
def perda():

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor()
    
    data = request.json  # Obtém os dados JSON do corpo da solicitação
    print(data)

    dealId = data['dealId']
    selectedOption = data['selectMotivoId']
    textareaDescricao = data['informacoesAdicionais']

    if not textareaDescricao == '':
        cur.execute("INSERT INTO tb_perdas (dealId, observacao) VALUES (%s, %s)",
                        (dealId, textareaDescricao))
        conn.commit()
    else:
        pass

    perderNegocio(selectedOption, dealId)

    return jsonify('sucesso')

@app.route('/ganhar', methods=['POST'])
@login_required
def ganhar():

    data = request.json

    dealId = data['dealId']
    idUltimaProposta = data['idUltimaProposta']

    #Verificar se o negócio foi ganho
    if ganharNegocio(dealId) == "Impossível ganhar um negócio já ganho":
        return jsonify({"erro": "Impossível ganhar um negócio já ganho"})
    
    criarVenda(dealId, idUltimaProposta)

    # return render_template('opcoes.html')

    return jsonify('sucesso')

@app.route('/cadastrar-empresa', methods=['POST'])
@login_required
def cadastrar_empresa():

    data = request.json

    nome = data['nome']
    cnpj = data['cnpj']
    telefone = data['telefone']
    tipoTelefone = data['tipoTelefone']
    cidade = data['cidade']
    nomeRepresentante = data['responsavel']
    condicao = data['condicao'] # Sim ou Não
    tipo_id = 1

    cnpj = ''.join(filter(str.isdigit, cnpj))

    print(cnpj)

    nome_estado,id_cidade = idCidade(cidade)
    codigoTipoTelefone =  idTipoTelefone(tipoTelefone)
    if condicao == 'Não':
        criarEmpresaEContato(nome,cnpj,nomeRepresentante,telefone,tipoTelefone,codigoTipoTelefone,nome_estado,id_cidade,tipo_id)
        criarOrdemEmpresa(nome,nomeRepresentante)
        print("Condição é Não: " + condicao)
    else:
        criarEmpresaEContato(nome,cnpj,nomeRepresentante,telefone,tipoTelefone,codigoTipoTelefone,nome_estado,id_cidade,tipo_id)
        print("Condição é Sim: " + condicao)

    return render_template('opcoes.html')

@app.route('/cadastrar-contato', methods=['POST'])
@login_required
def cadastrar_contato():

    data = request.json

    nomeContato = data['nomeContato']
    telefoneContato = data['telefoneContato']
    empresaInputContato = data['empresaInputContato']
    tipoTelefoneContato = data['tipoTelefoneContato']
    cidadeContato = data['cidadeContato']
    responsavelContato = data['responsavelContato']
    condicao = data['condicao']
    listaEmpresas = empresaInputContato.split(', ')
    tipo_id = 2

    if telefoneContato == '' or tipoTelefoneContato == '' or cidadeContato == '' and condicao == 'Contato':
        print("Função de atualizar: " + nomeContato,listaEmpresas,responsavelContato,tipo_id)
    
    elif condicao == 'Contato':
        codigoTipoTelefone =  idTipoTelefone(tipoTelefoneContato)
        nome_estado,id_cidade = idCidade(cidadeContato)
        print(responsavelContato)
        print("CONTATOO")
        criarEmpresaEContato(nomeContato,'',responsavelContato,telefoneContato,tipoTelefoneContato,codigoTipoTelefone,nome_estado,id_cidade,tipo_id,listaEmpresas)
    else:
        codigoTipoTelefone =  idTipoTelefone(tipoTelefoneContato)
        nome_estado,id_cidade = idCidade(cidadeContato)
        personId = criarEmpresaEContato(nomeContato,'',responsavelContato,telefoneContato,tipoTelefoneContato,codigoTipoTelefone,nome_estado,id_cidade,tipo_id,listaEmpresas)
        criarOrdemEmpresa(empresaInputContato,responsavelContato,personId)

    return render_template('opcoes.html')

@app.route('/cadastrar-interacao', methods=['POST'])
@login_required
def cadastrar_interacao():

    data = request.json

    nome_empresa = data['nome_empresa']
    registro = data['registro']
    dataRegistro  = data['dataRegistro']
    contatoRegistro = data['contatoRegistro']
    responsavelRegistro = data['responsavelRegistro']

    print(nome_empresa,registro,dataRegistro,contatoRegistro,responsavelRegistro)
    criarRegistroInteracao(nome_empresa,registro,dataRegistro,contatoRegistro,responsavelRegistro)

    return render_template('opcoes.html')

@app.route('/atualizar-contato', methods=['POST'])
@login_required
def atualizar_contato():

    data = request.json

    idDeals = data['idDeals']
    nomeEmpresa = data['nomeEmpresa']
    campoInput  = data['campoInput']

    print(nomeEmpresa,campoInput,idDeals)

    resposta = atualizandoContato(nomeEmpresa,campoInput,idDeals)

    if resposta == "Erro":
        return jsonify("Erro")

    return render_template('opcoes.html')

def obter_condicoes_pagamento(lista_opcoes_cliente, opcoes):
    """Função para Criar as opções de pagamento"""

    condicoes_disponiveis = []
    for condicao in lista_opcoes_cliente:
        if condicao in opcoes:
            if "A Vista" in lista_opcoes_cliente and len(lista_opcoes_cliente) == 1:
                condicoes_disponiveis.append('A Vista')
            elif "Antecipado" in lista_opcoes_cliente and len(lista_opcoes_cliente) == 1:
                condicoes_disponiveis.append('Antecipado')
            elif "À prazo" in condicao:
                x = int(condicao[9:11].split()[0])
                condicoes_disponiveis.extend(
                    [f'À prazo - {i}x' for i in range(1, x + 1)])
                condicoes_disponiveis.append('A Vista')
                condicoes_disponiveis.append('Antecipado')
                condicoes_disponiveis = list(set(condicoes_disponiveis))
            else:
                condicoes_disponiveis.append(condicao)
                condicoes_disponiveis.append('A Vista')
                condicoes_disponiveis.append('Antecipado')
                condicoes_disponiveis = list(set(condicoes_disponiveis))
    condicoes_disponiveis = list(set(condicoes_disponiveis))
    condicoes_disponiveis.sort(key=lambda x: opcoes.index(x))
    return condicoes_disponiveis


def chamadaCondicoes(nameCliente):
    """Função para pegar as opções de pagamento disponível para o cliente x"""

    import requests

    url = "https://public-api2.ploomes.com/Contacts?$top=100&$select=Name&$expand=OtherProperties&$filter=Id+eq+{}".format(
        nameCliente)

    # Substitua "SEU_TOKEN_AQUI" com a chave de usuário gerada no passo 1
    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    # Fazendo a requisição GET
    response = requests.get(url, headers=headers)

    # Verificando a resposta
    if response.status_code == 200:
        data = response.json()

        contacts = data['value']

        input_id = 189049  # O ID que você deseja filtrar

        lista_opcoes = []
        for contact in contacts:
            other_properties = contact['OtherProperties']
            for property in other_properties:
                if property['FieldId'] == input_id:
                    object_value_name = property['ObjectValueName']
                    lista_opcoes.append(object_value_name)

        return lista_opcoes

    else:
        print(f"Erro na requisição. Código de status: {response.status_code}")


def chamadaListaPreco(nameCliente):
    """Função para pegar a lista de preço de determinado cliente"""

    import requests

    url = "https://public-api2.ploomes.com/Contacts?$top=100&$select=Name&$expand=OtherProperties&$filter=Name+eq+'{}'".format(
        nameCliente)

    # Substitua "SEU_TOKEN_AQUI" com a chave de usuário gerada no passo 1
    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    # Fazendo a requisição GET
    response = requests.get(url, headers=headers)

    # Verificando a resposta
    if response.status_code == 200:
        data = response.json()

        contacts = data['value']

        input_id = 219812  # O FieldKey para filtrar

        for contact in contacts:
            other_properties = contact['OtherProperties']
            for property in other_properties:
                try:
                    if property['FieldId'] == input_id:
                        lista_preco = property['ObjectValueName']
                except:
                    lista_preco = 'Lista Preço N e NE'

        return lista_preco

    else:
        print(f"Erro na requisição. Código de status: {response.status_code}")


def criarOrdem(nomeCliente, ContactId, PersonId, nomeRepresentante):
    """Função para gerar ordem de venda"""

    # ContactId = id(nomeCliente)

    # PersonId = idContatoCliente(nomeContato, ContactId)

    OwnerId = idRepresentante(nomeRepresentante)

    url = "https://public-api2.ploomes.com/Deals"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    # Dados que você deseja enviar no corpo da solicitação POST

    if PersonId == 'Null':

        data = {
            "Title": nomeCliente,
            "ContactId": ContactId,
            "OwnerId": OwnerId,
            "StageId": 166905, # Proposta
        }

    else:

        data = {
            "Title": nomeCliente,
            "ContactId": ContactId,
            "OwnerId": OwnerId,
            "PersonId": PersonId,
            "StageId": 166905 # Proposta
        }

    # Fazendo a requisição POST com os dados no corpo
    print(data)

    response = requests.post(url, headers=headers, json=data)

    # Verifica se a requisição foi bem-sucedida (código de status 201 indica criação)
    if response.status_code == 200:

        url = "https://public-api2.ploomes.com/Deals?$top=1&$filter=ContactId+eq+{}&$orderby=CreateDate desc".format(
            ContactId)

        headers = {
            "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
        }

        response = requests.get(url, headers=headers)

        ids = response.json()
        ids = ids['value']

        for IdDeal in ids:
            IdDeal = IdDeal['Id']

        return IdDeal

    else:
        return 'Erro ao criar a ordem'


def wrap_in_paragraph(text):
    """Função para transformar o texto em html"""

    return f"<p>{text}</p>\n"


def criarProposta(DealId, observacao, formaPagamento, nomeRepresentante, listaProdutos, listaCores, listaPreco, listaQuantidade, listaPrecoUnitario, listaPercentDesconto):

    """Função para criar proposta"""

    idFormaPagamento = idFormaPagamentoF(formaPagamento)
    id_CondicaoPagamento = idCondicaoPagamento(formaPagamento)
    idRep = idRepresentante(nomeRepresentante)

    # Chamar as funções para obter os dados
    ProductId = idCarretas(listaProdutos)  # Agora retorna (ProductId, GroupId, Prazo)
    color = idCores(listaCores)
    price = listaPreco
    quantidade = listaQuantidade
    precoUnitario = listaPrecoUnitario
    percentDesconto = listaPercentDesconto

    # Inicializar uma lista vazia para armazenar os produtos
    lista_product = []

    # Criar um dicionário para cada conjunto de valores correspondentes e adicioná-lo à lista
    for i in range(len(ProductId)):
        product_info = {
            "ProductId": ProductId[i][0],  # ID do Produto
            "GroupId": ProductId[i][1],  # ID do Grupo (caso seja necessário usar futuramente)
            "Prazo": ProductId[i][2],  # Prazo correto baseado no GroupId
            "IdCor": color[i],
            "Price": price[i],
            "Quantity": quantidade[i],
            "UnitPrice": precoUnitario[i],
            "Discount": percentDesconto[i]
        }
        lista_product.append(product_info)

    # Inicializar variáveis para o total em valor e quantidade de itens
    total = sum(product["Price"] * int(product['Quantity']) for product in lista_product)
    totalItens = sum(int(product['Quantity']) for product in lista_product)

    # Criar a lista de produtos no formato JSON correto
    products = []
    total = 0

    for i, product in enumerate(lista_product):
        total += product["Price"]

        product_json = {
            "Quantity": product["Quantity"],
            "UnitPrice": product["UnitPrice"],
            "Total": product["Price"],
            "ProductId": product["ProductId"],
            "Ordination": i,
            "Discount": product["Discount"] * 100,
            "OtherProperties": [
                {
                    "FieldKey": "quote_product_76A1F57A-B40F-4C4E-B412-44361EB118D8",  # Cor
                    "IntegerValue": product["IdCor"]
                },
                {
                    "FieldKey": "quote_product_E426CC8C-54CB-4B9C-8E4D-93634CF93455", # valor unit. c/ desconto
                    "DecimalValue": product["UnitPrice"]
                },
                {
                    "FieldKey": "quote_product_4D6B83EE-8481-46B2-A147-1836B287E14C",  # prazo dias
                    "StringValue": f"{product['Prazo']};"  # Insere o prazo correto
                },
                {
                    "FieldKey": "quote_product_7FD5E293-CBB5-43C8-8ABF-B9611317DF75", # % de desconto no produto
                    "DecimalValue": product["Discount"] * 100
                }
            ]
        }

        products.append(product_json)

    max_prazo = max([product["Prazo"] for product in lista_product], default=0)

    # Estrutura JSON principal com a lista de produtos
    json_data = {
        "DealId": DealId,
        "OwnerId": idRep,
        "TemplateId": 196596,
        "Amount": total,
        "Discount": 0,
        "InstallmentsAmountFieldKey": "quote_amount",
        "Notes": observacao,
        "Sections": [
            {
                "Code": 0,
                "Total": total,
                "OtherProperties": [
                    {
                        "FieldKey": "quote_section_8136D2B9-1496-4C52-AB70-09B23A519286",  # Prazo conjunto
                        "StringValue": "045;"
                    },
                    {
                        "FieldKey": "quote_section_0F38DF78-FE65-471C-A391-9E8759470D4E",  # Total
                        "DecimalValue": total
                    },
                    {
                        "FieldKey": "quote_section_64320D57-6350-44AB-B849-6A6110354C79",  # Total de itens
                        "IntegerValue": totalItens
                    }
                ],
                "Products": products
            }
        ],
        "OtherProperties": [
            {
                "FieldKey": "quote_0FB9F0CB-2619-44C5-92BD-1A2D2D818BFE",  # Forma de pagamento
                "IntegerValue": idFormaPagamento
            },
            {
                "FieldKey": "quote_DE50A0F4-1FBE-46AA-9B5D-E182533E4B4A",  # Texto simples
                "StringValue": formaPagamento
            },
            {
                "FieldKey": "quote_E85539A9-D0D3-488E-86C5-66A49EAF5F3A",  # Condições de pagamento
                "IntegerValue": id_CondicaoPagamento
            },
            {
                "FieldKey": "quote_F879E39D-E6B9-4026-8B4E-5AD2540463A3",  # Tipo de frete
                "IntegerValue": 22886508
            },
            {
                "FieldKey": "quote_6D0FC2AB-6CCC-4A65-93DD-44BF06A45ABE",  # Validade
                "IntegerValue": 18826538
            },
            {
                "FieldKey": "quote_520B942C-F3FD-4C6F-B183-C2E8C3EB6A33",  # Dias para entrega
                "IntegerValue": max_prazo
            }
        ]
    }
    
    # if descontoMaximo:
    #     json_data["ApprovalStatusId"] = 1
    #     json_data["ApprovalLevelId"] = 6216

    print(json_data)

    # Converte a estrutura JSON em uma string JSON
    # json_string = json.dumps(json_data, indent=2)
    # json_string = json.dumps(json_data, separators=(',', ':'))

    url = "https://public-api2.ploomes.com/Quotes"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    requests.post(url, headers=headers, json=json_data)

    

    return "Proposta criada"


def revisarProposta(df, idQuote):

    """Função para revisar proposta"""

    nomeCliente = df['nome'][0]
    nomeContato = df['contato'][0]
    DealId = df['dealId'][0]

    reabrirProposta(DealId)

    df['valorReal'] = df['valorReal'].astype(float)
    df['numeros'] = df['numeros'].astype(int)

    totalSemDesconto = (df['valorReal'] * df['numeros']).sum()

    if nomeContato == '':
        nomeContato = 'Null'
    else:
        personId = idContatoCliente(nomeContato, id(nomeCliente))

    if df['nomeResponsavel'][0] == '':
        nomeRepresentante = df['representante'][0]
    else:
        nomeRepresentante = df['nomeResponsavel'][0]

    listaProdutos = df['description'].values.tolist()
    formaPagamento = df['formaPagamento'][0]
    listaCores = df['cor'].values.tolist()

    listaPreco = df['quanti'].values.tolist()

    df['observacoes'] = df['observacoes'].apply(lambda x: x.replace("<p>","").replace("</p>",""))
    df["observacoes"] = df["observacoes"].apply(wrap_in_paragraph)

    listaQuantidade = df['numeros'].values.tolist()
    listaPrecoUnitario = df['valorReal'].values.tolist()
    listaPercentDesconto = df['percentDesconto'].values.tolist()
    valorSemDesconto = df['valorReal'].values.tolist()
        
    idFormaPagamento = idFormaPagamentoF(formaPagamento)
    id_CondicaoPagamento = idCondicaoPagamento(formaPagamento)

    # idRep = idRepresentante(nomeRepresentante)

    # Suas três listas
    ProductId = idCarretas(listaProdutos)
    color = idCores(listaCores)
    price = listaPreco
    quantidade = listaQuantidade
    precoUnitario = listaPrecoUnitario
    percentDesconto = listaPercentDesconto
    valorSemDesconto = valorSemDesconto

    # Inicializar uma lista vazia
    lista_product = []

    # Criar um dicionário para cada conjunto de valores correspondentes e adicioná-lo à lista
    for i in range(len(ProductId)):
        product_info = {
            "ProductId": ProductId[i][0],
            "GroupId": ProductId[i][1],  # ID do Grupo (caso seja necessário usar futuramente)
            "Prazo": ProductId[i][2],  # Prazo correto baseado no GroupId
            "IdCor": color[i],
            "Price": price[i],
            "Quantity": quantidade[i],
            "UnitPrice": precoUnitario[i],
            "percentDesconto": percentDesconto[i],
            "valorSemDesconto": valorSemDesconto[i]
        }

        lista_product.append(product_info)

    # Inicializar variáveis para o total em valor e quantidade de itens
    total = sum(product["Price"] * int(product['Quantity']) for product in lista_product)
    totalItens = sum(int(product['Quantity']) for product in lista_product)

    # Criar a lista de produtos no formato JSON correto
    products = []
    total = 0

    # # Calcular o total somando os preços
    # for product in lista_product:
    #     total += product["Price"] * int(product['Quantity'])
    #     totalItens += int(product['Quantity'])

    # lista_product = df.to_dict(orient='records')
    # Estrutura JSON para cada produto
    for i, product_id in enumerate(lista_product):

        total += product_id["Price"]

        product_json = {
            "Quantity": product_id["Quantity"],
            "UnitPrice": product_id["UnitPrice"],
            "Total": product_id["Price"] * int(product_id["Quantity"]),
            "ProductId": product_id["ProductId"],
            "Ordination": i,
            "OtherProperties": [
                {
                    "FieldKey": "quote_product_76A1F57A-B40F-4C4E-B412-44361EB118D8",  # Cor
                    "IntegerValue": product_id["IdCor"]
                },
                {
                    "FieldKey": "quote_product_E426CC8C-54CB-4B9C-8E4D-93634CF93455", # valor unit. c/ desconto
                    "DecimalValue": product_id["Price"]
                },
                {
                    "FieldKey": "quote_product_4D6B83EE-8481-46B2-A147-1836B287E14C",  # prazo dias
                    "StringValue": f"{product_id['Prazo']};"  # Insere o prazo correto
                },
                {
                    "FieldKey": "quote_product_7FD5E293-CBB5-43C8-8ABF-B9611317DF75", # % de desconto no produto
                    "DecimalValue" : product_id["percentDesconto"] * 100
                },
                {
                    "FieldKey": "quote_product_A0AED1F2-458F-47D3-BA29-C235BDFC5D55", # Total sem desconto
                    "DecimalValue": product_id["valorSemDesconto"] * int(product_id["Quantity"])
                },
            ]
        }
        products.append(product_json)

    max_prazo = max([product["Prazo"] for product in lista_product], default=0)

    # Estrutura JSON principal com a lista de produtos
    json_data = {
        "Id": idQuote,
        "DealId": DealId,
        "PersonId": personId,
        "TemplateId": 196596,
        "Amount": total,
        "Discount": 0,
        "InstallmentsAmountFieldKey": "quote_amount",
        "Notes": df['observacoes'][0],
        "Sections": [
            {
                "Code": 0,
                "Total": total,
                "OtherProperties": [
                    {
                        "FieldKey": "quote_section_8136D2B9-1496-4C52-AB70-09B23A519286",  # Prazo conjunto
                        "StringValue": f"{max_prazo};"  # Insere o prazo correto
                    },
                    {
                        "FieldKey": "quote_section_0F38DF78-FE65-471C-A391-9E8759470D4E",  # Total
                        "DecimalValue": total
                    },
                    {
                        "FieldKey": "quote_section_0E7B5C7B-AD6B-480F-B55E-7F7ABEC4B08C", # Total sem desconto
                        "DecimalValue": totalSemDesconto
                    },
                    {
                        "FieldKey": "quote_section_64320D57-6350-44AB-B849-6A6110354C79",  # Total de itens
                        "IntegerValue": totalItens
                    }
                ],
                "Products": products
            }
        ],
        "OtherProperties": [
            {
                "FieldKey": "quote_0FB9F0CB-2619-44C5-92BD-1A2D2D818BFE",  # Forma de pagamento
                "IntegerValue": idFormaPagamento
            },
            {
                "FieldKey": "quote_DE50A0F4-1FBE-46AA-9B5D-E182533E4B4A",  # Texto simples
                "StringValue": formaPagamento
            },
            {
                "FieldKey": "quote_E85539A9-D0D3-488E-86C5-66A49EAF5F3A",  # Condições de pagamento
                "IntegerValue": id_CondicaoPagamento
            },
            {
                "FieldKey": "quote_F879E39D-E6B9-4026-8B4E-5AD2540463A3",  # Tipo de frete
                "IntegerValue": 22886508
            },
            {
                "FieldKey": "quote_6D0FC2AB-6CCC-4A65-93DD-44BF06A45ABE",  # Validade
                "IntegerValue": 18826538
            },
            {
                "FieldKey": "quote_520B942C-F3FD-4C6F-B183-C2E8C3EB6A33",  # Prazo de entrega
                "IntegerValue": max_prazo
            },
            {
                "FieldKey": "quote_82F9DE57-6E06-402A-A444-47F350284117", # Atualizar dados
                "BoolValue": True
            },
            {
                "FieldKey": "quote_16CDE30A-C6F1-4998-8B73-661CF89160B8", # Permissão - Condicões de pagamento
                "StringValue": "Permitido"
            }
        ]
    }
    
    # if descontoMaximo:
    #     json_data["ApprovalStatusId"] = 1
    #     json_data["ApprovalLevelId"] = 6216

    print(json_data)

    # Converte a estrutura JSON em uma string JSON
    # json_string = json.dumps(json_data, indent=2)
    # json_string = json.dumps(json_data, separators=(',', ':'))

    # url = "https://public-api2.ploomes.com/Quotes(" + idQuote + ")/Review?$select=Id&preservePreviousTemplate=true&preload=true"

    # headers = {
    #     "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    # }

    # requests.post(url, headers=headers, json=json_data)

    # enviar_email(nomeRepresentante, nomeCliente, DealId)

    return "Proposta criada"

def reabrirProposta(dealId):

    url = "https://public-api2.ploomes.com/Deals("+ dealId +")/Reopen?$expand=Stages"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    # Enviar a requisição POST sem dados no corpo
    response = requests.post(url, headers=headers)

    # Verificar se a requisição foi bem-sucedida
    if response.status_code == 200:
        print('POST bem-sucedido!')
    else:
        print('Erro ao fazer o POST:', response.status_code)


def id(nomeCliente):
    """Função para buscar o id do cliente"""

    url = "https://public-api2.ploomes.com/Contacts?$top=100&$select=Id&$filter=TypeId+eq+1 and Name+eq+'{}'".format(
        nomeCliente)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    ids = response.json()
    ids = ids['value']

    for idCliente in ids:
        idCliente = idCliente['Id']

    return idCliente


def converter_formato_data(data_string):

    # Converter a string de data para um objeto datetime
    data_obj = datetime.strptime(data_string, '%Y-%m-%d')

    # Criar um objeto timezone representando -03:00
    fuso_horario = timezone(timedelta(hours=-3))

    # Adicionar o fuso horário ao objeto datetime
    data_obj_com_fuso = data_obj.replace(tzinfo=fuso_horario)

    # Formatar a data no formato desejado
    data_formatada = data_obj_com_fuso.strftime('%Y-%m-%dT%H:%M%z')

    return data_formatada


def idContatoCliente(nomeContato, idCliente):
    """Função para buscar o id do contato"""

    url = "https://public-api2.ploomes.com/Contacts?$top=100&$select=Id&$filter=CompanyId+eq+{} and Name+eq+'{}'".format(
        idCliente, nomeContato)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    ids = response.json()
    ids = ids['value']

    if len(ids) == 0:
        idContato = 'Null'

    else:

        for idContato in ids:
            idContato = idContato['Id']

    return idContato


def idContato(nomeContato):
    """Função para buscar o id do contato"""

    url = "https://public-api2.ploomes.com/Contacts?$top=100&$select=Id&$filter=Name+eq+'{}'".format(nomeContato)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    ids = response.json()
    ids = ids['value']

    if len(ids) == 0:
        idContato = 'Null'

    else:

        for idContato in ids:
            idContato = idContato['Id']

    return idContato


def idRepresentante(nomeRepresentante):
    """Função para buscar o id do representante"""

    url = "https://public-api2.ploomes.com/Users?$top=100&$select=Id&$filter=Name+eq+'{}'".format(
        nomeRepresentante)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    ids = response.json()
    ids = ids['value']

    for idRep in ids:
        idRep = idRep['Id']

    return idRep


def infoRepresentantes(nomeRepresentante):
    """Função para buscar o id do representante"""

    url = "https://public-api2.ploomes.com/Users?$top=1&$select=Id,ProfileId&$filter=Name+eq+'{}'".format(
        nomeRepresentante)

    headers = {"User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"}

    response = requests.get(url, headers=headers)

    ids = response.json()

    profileId = ids['value'][0]['ProfileId']

    return profileId


def idCarretas(listaProdutos):
    """Função para buscar o id das carretas"""

    # Dicionário com os prazos por classe de produtos
    prazo_por_classe = {
        1181665: 70, 1181684: 70, 1181686: 70, 1325894: 70, 1375302: 70,
        1462324: 90, 1479315: 70, 1479336: 120, 1652695: 70, 1655647: 70,
        1669859: 120, 1669860: 70, 1669861: 120, 1669871: 70
    }

    # Define a URL da API
    url = "https://public-api2.ploomes.com/Products?$top=1&$filter=Code+eq+'{}'&$select=Id,GroupId"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    # Inicializa uma lista para armazenar os resultados
    produtos_info = []

    # Realiza uma solicitação GET para cada código de produto
    for product_code in listaProdutos:
        # Define a URL completa substituindo '{}' pelo código do produto atual
        api_url = url.format(product_code)

        try:
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()  # Levanta um erro caso a requisição falhe
            
            data = response.json()
            if "value" in data and data["value"]:
                product_id = data["value"][0]["Id"]
                group_id = data["value"][0]["GroupId"]

                # Busca o prazo com base no GroupId, se não existir, usa 0 como padrão
                prazo = prazo_por_classe.get(group_id, 0)

                produtos_info.append((product_id, group_id, prazo))
            else:
                print(f"Nenhum dado encontrado para o produto '{product_code}'.")

        except requests.exceptions.RequestException as e:
            print(f"Erro ao buscar '{product_code}': {e}")

    return produtos_info

def idCores(listaCores):
    """Função para buscar o id das cores"""

    # Define a URL da API e os nomes dos produtos que você deseja buscar
    url = "https://public-api2.ploomes.com/Fields@OptionsTables@Options?$select=Id&$filter=TableId+eq+36909 and Name+eq+'{}'"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    # Inicializa uma lista para armazenar os IDs dos produtos encontrados
    cores_id = []

    # Realiza uma solicitação GET para cada nome de produto
    for lista_name in listaCores:
        # Define a URL completa substituindo '{}' pelo nome do produto atual
        api_url = url.format(lista_name)

        # Realiza a solicitação GET para o produto atual
        response = requests.get(api_url, headers=headers)

        # Verifica se a solicitação foi bem-sucedida (código de status 200)
        if response.status_code == 200:
            data = response.json()
            # Verifica se a resposta contém dados
            if "value" in data and data["value"]:
                # Acessa o ID do primeiro item encontrado
                product_id = data["value"][0]["Id"]
                cores_id.append((product_id))
            else:
                print(f"Nenhum ID encontrado para o produto '{lista_name}'.")
        else:
            print(
                f"Erro na solicitação para o produto '{lista_name}': Código de status {response.status_code}")

    return cores_id


def idFormaPagamentoF(formaPagamento):
    """Função para buscar o id da forma de pagamento"""

    # Define a URL da API e os nomes dos produtos que você deseja buscar
    url = "https://public-api2.ploomes.com/Fields@OptionsTables@Options?$select=Id&$filter=TableId+eq+31965 and Name+eq+'{}'".format(
        formaPagamento)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=headers)

    forma_pagamento = response.json()
    forma_pagamento = forma_pagamento['value']
    idFormaPagamento = forma_pagamento[0]['Id']

    return idFormaPagamento


def obterContatos(nomeContato): 

    url = f"https://public-api2.ploomes.com/Contacts?$filter=TypeId+eq+2 and Name+eq+'{nomeContato}'&$expand=Company,Owner($expand=Profile),Phones"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=headers)

    obterContatos = response.json()

    obterContatos = obterContatos['value']

    if obterContatos:
        # Itera sobre cada contato e adiciona as informações adicionais
        for contato in obterContatos:
            contato['display'] = contato.get('Name', '')  # Adiciona o display com base no nome do contato
            contato['subtitle'] = {}  # Adiciona um subtítulo vazio
            contato['subtitleTooltip'] = f" Empresa: {contato['Company']['Name']}"  # Adiciona o subtítuloTooltip com base no nome da empresa
            contato['tooltipHTML'] = {}  # Adiciona um tooltipHTML vazio
            contato['ContactId'] = contato.get('Id', 0)  # Adiciona o ContactId com base no Id do contato

    return obterContatos


def idFormaPagamentoCriarContato(formaPagamento):
    """Função para buscar o id da forma de pagamento"""

    # Define a URL da API e os nomes dos produtos que você deseja buscar
    url = "https://public-api2.ploomes.com/Fields@OptionsTables@Options?$select=Id&$filter=TableId+eq+27971 and Name+eq+'{}'".format(
        formaPagamento)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=headers)

    forma_pagamento = response.json()
    forma_pagamento = forma_pagamento['value']
    idFormaPagamento = forma_pagamento[0]['Id']

    return idFormaPagamento


def idCondicaoPagamento(formaPagamento):
    """Função para buscar o id da condição de pagamento"""

    # Define a URL da API e os nomes dos produtos que você deseja buscar
    url = "https://public-api2.ploomes.com/Fields@OptionsTables@Options?$select=Id&$filter=TableId+eq+32062 and Name+eq+'{}'".format(
        formaPagamento)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=headers)

    forma_pagamento = response.json()
    forma_pagamento = forma_pagamento['value']
    id_CondicaoPagamento = forma_pagamento[0]['Id']

    return id_CondicaoPagamento


def idTipoTelefone(tipoTelefone):
    """Função para buscar o id do tipo de contato"""

    # Define a URL da API e os nomes dos produtos que você deseja buscar
    url = "https://public-api2.ploomes.com/PhoneTypes?&$filter=Name+eq+'{}'".format(
        tipoTelefone)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=headers)

    tipoTelefone = response.json()
    tipoTelefone = tipoTelefone['value']
    idTipoTelefone = tipoTelefone[0]['Id']

    return idTipoTelefone


def idCidade(cidade):
    """Função para buscar o id do tipo de contato"""

    # Define a URL da API e os nomes dos produtos que você deseja buscar
    url = "https://public-api2.ploomes.com/Cities?$top=20&$expand=Country,State&$filter=Name+eq+'{}'".format(
        cidade)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=headers)

    cidade = response.json()
    cidade = cidade['value']
    id_cidade = cidade[0]['Id']
    nome_estado = cidade[0]['State']['Name']

    return nome_estado,id_cidade


def obterEmailRepresentante(nomeRepresentante):
    """Função para obter o email do representante dentro do postgres"""

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER,
                            password=DB_PASS, host=DB_HOST)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("select email from users where username = '{}'".format(
        nomeRepresentante), conn)

    emailRepresentante = cur.fetchall()
    emailRepresentante = emailRepresentante[0]['email']
    emailRepresentante = emailRepresentante.split(';')

    return emailRepresentante


def buscarLinkAceitePdf(DealId):

    """Função para buscar o pdf e aceite da proposta"""

    url = "https://public-api2.ploomes.com/Quotes?$top=6&$filter=DealId+eq+{}&$select=DocumentUrl,Key,ApprovalStatusId".format(
        DealId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    documentos = response.json()
    documentos = documentos['value']

    for doc in documentos:
        pdf = doc['DocumentUrl']
        key = doc['Key']
        approver = doc['ApprovalStatusId']

    if approver == 1:
        
        links =  {'pdf':pdf}

    else:
        aceite = "https://documents.ploomes.com/?k={}&entity=quote".format(key)

        links =  {'pdf':pdf, 'aceite':aceite}

    return links

def consultarLinkPedidoVendas(DealId):

    """Função para buscar o pdf e aceite da proposta"""

    url_orders = f"https://public-api2.ploomes.com/Orders?$top=6&$filter=true+and+true+and+(DealId+eq+{DealId})&$select=Id,DocumentUrl"
    
    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }
    
    try:
        response = requests.get(url_orders, headers=headers)
        documentos = response.json().get('value', [])

        if documentos:
            link = documentos[0].get('DocumentUrl', '')
            return link
    except Exception as e:
        print(f"Erro ao consultar link de pedidos de vendas: {e}")

    return ''


def obterDocumentoPdf(DealId):
    """Função para buscar o pdf e aceite da proposta e preparar e-mail"""

    url = "https://public-api2.ploomes.com/Quotes?$top=10&$filter=DealId+eq+{}&$select=DocumentUrl,Key,ApprovalStatusId".format(
        DealId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    documentos = response.json()
    documentos = documentos['value']

    for doc in documentos:
        pdf = doc['DocumentUrl']
        key = doc['Key']
        approver = doc['ApprovalStatusId']

    if approver == 1:
        
        corpo_email = "Aguardando aprovação do pedido. \n\n Proposta em pdf:{}".format(
            pdf)

    else:

        aceite = "https://documents.ploomes.com/?k={}&entity=quote".format(key)

        corpo_email = "Link de aceite: {} \n\n Proposta em pdf:{}".format(
            aceite, pdf)

    return corpo_email


def enviar_email(nomeRepresentante, nomeCliente, DealId):
    """Função para enviar email para os representantes"""

    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    email_representante = obterEmailRepresentante(nomeRepresentante)

    corpo_email = obterDocumentoPdf(DealId)

    # Configurações do servidor SMTP
    smtp_host = 'smtp.gmail.com'
    smtp_port = 587
    smtp_user = 'sistema@cemag.com.br'
    smtp_password = 'qlxn ible gdmg yamz'

    for email in email_representante:

        # Crie uma mensagem de e-mail
        mensagem = MIMEMultipart()
        mensagem['From'] = 'sistema@cemag.com.br'
        mensagem['To'] = email
        mensagem['Subject'] = 'Proposta Ploomes para o cliente {}'.format(
            nomeCliente)

        # Adicione o corpo do e-mail

        mensagem.attach(MIMEText(corpo_email, 'plain'))

        # Conecte-se ao servidor SMTP e envie o e-mail
        with smtplib.SMTP(smtp_host, smtp_port) as servidor_smtp:
            servidor_smtp.starttls()
            servidor_smtp.login(smtp_user, smtp_password)
            servidor_smtp.send_message(mensagem)
            print('E-mail enviado com sucesso!')

    return 'Sucess'

def buscarRegiaoCliente(nomeCliente):
    """Função para buscar a região por cliente"""

    url = "https://public-api2.ploomes.com/Contacts?$top=10&$filter=contains(Name,'{}')&$expand=OtherProperties($filter=FieldKey+eq+'contact_70883643-FFE7-4C84-8163-89242423A4EF')".format(
        nomeCliente)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    data = response.json()

    try:
        regiao = data['value'][0]['OtherProperties'][0]['ObjectValueName']
    except:
        regiao = 'Lista Preço SDE e COE'

    return regiao


def formatar_data(data_str):
    """Função para formatar data e hora"""

    # Divide a string em data/hora e deslocamento de tempo
    partes = data_str.split('T')
    # Converter a parte da data/hora em objeto datetime
    data_obj = datetime.fromisoformat(partes[0])
    data_formatada = data_obj.strftime('%d/%m/%Y')  # Formatar a data
    return data_formatada


def listarOrcamentos(nomeRepresentante,skip,statusId,top):
    """Função para listar negócios de cada representante"""

    idRep = idRepresentante(nomeRepresentante)

    print(idRep)
    print(skip)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    # Obter dados dos Quotes
    url_quotes = f"https://public-api2.ploomes.com/Quotes?$top={top}&$skip={skip}&$filter=OwnerId+eq+{idRep} and LastReview&$orderby=DealId desc&$select=DealId,ExternallyAccepted,ApprovalStatusId"
    response_quotes = requests.get(url_quotes, headers=headers)
    data_quotes = response_quotes.json().get('value', [])

    # Criar lista de DealId usando compreensão de dicionário
    list_dealId = [quote['DealId'] for quote in data_quotes]

    if list_dealId == []:
        return 'Terminou'

    filter_ids = " or ".join(f"(Id eq {deal_id})" for deal_id in list_dealId)
    url_deals = f"https://public-api2.ploomes.com/Deals?$top={top}&$filter=(OwnerId eq {idRep}) and ((StatusId eq {statusId})) and ({filter_ids})&$orderby=Id desc&$select=StatusId,LastUpdateDate,Id,ContactName,Amount,PersonId"
    print(url_deals)
    response_deals = requests.get(url_deals, headers=headers)
    data_deals = response_deals.json().get('value', [])

    # Criar um dicionário para mapear DealId para os itens no segundo JSON
    deal_id_mapping = {item['Id']: item for item in data_deals}

    # Combine os JSONs com base em DealId
    combined_json = []
    for item1 in data_quotes:
        deal_id = item1['DealId']
        if deal_id in deal_id_mapping:
            item = deal_id_mapping[deal_id]
            link = buscarLinkAceitePdf(deal_id)
            link_venda = consultarLinkPedidoVendas(deal_id)
            combined_item = {**item1, **item, 'link': link, 'link_venda': link_venda}
            combined_json.append(combined_item)
    

    # Atualizar valores 'ExternallyAccepted' e 'LastUpdateDate' dentro do loop
    for item in combined_json:
        item['ExternallyAccepted'] = "Sim" if item.get('ExternallyAccepted') else "Não"
        if item['LastUpdateDate']:
            item['LastUpdateDate'] = formatar_data(item['LastUpdateDate'])

    # Remover duplicatas baseadas em 'DealId'
    unique_data = {item['DealId']: item for item in combined_json}.values()


    return list(unique_data)


def listarMotivos():
    """Função para listar motivos de perda e seus respectivos ID"""

    url = "https://public-api2.ploomes.com/Deals@LossReasons?$filter=PipelineId+eq+37808&$select=Id,Name"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    data = response.json()
    listaMotivos = data['value']

    return listaMotivos


def perderNegocio(IdMotivo, DealId):
    """Função que faz perder o negócio"""

    json_data = {
        "LossReasonId": int(IdMotivo)
    }

    url = "https://public-api2.ploomes.com/Deals({})/Lose".format(DealId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    requests.post(url, headers=headers, json=json_data)

    return "Negócio perdido"


def buscarProdutosQuotes(dealId):
    """Função para buscar lista de produtos naquele pedido"""

    url = "https://public-api2.ploomes.com/Quotes?$filter=DealId+eq+{}&$expand=Products".format(
        dealId)

    header = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=header)

    data = response.json()
    json_produtos = data['value'][0]['Products']

    discount = 0
    amount = data['value'][0]['Amount']

    json_win = {
        "Order": {
            "Discount": discount,
            "Amount": amount,
            "Products": []
        }
    }

    # Loop através dos itens no primeiro JSON
    for product_item in json_produtos:
        # Crie um novo dicionário com os campos necessários
        new_product = {
            "ProductId": product_item['ProductId'],
            "Quantity": product_item['Quantity'],
            "CurrencyId": product_item['CurrencyId'],
            "UnitPrice": product_item['UnitPrice'],
            "Discount": product_item['Discount'],
            "Total": product_item['Total']
        }
        # Adicione o novo dicionário à lista de Products no segundo JSON
        json_win['Order']["Products"].append(new_product)

    return json_produtos


def ganharNegocio(DealId):
    """Função para ganhar negócio"""

    #verificar se o atributo WonQuoteId está null
    # url = "https://public-api2.ploomes.com/Deals?$filter=Id eq {}".format(DealId)

    # 7670438 negocio que está ganho
    urlCheckDeal = "https://public-api2.ploomes.com/Deals?$filter=Id eq {}".format(DealId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }
    response = requests.get(urlCheckDeal, headers=headers)

    data = response.json()
    print(data)
    print("Ganho?",data['value'][0]['StatusId'])
    if data['value'][0]['StatusId'] == 2:
        print('Deal já ganho')
        return 'Impossível ganhar um negócio já ganho'
    # else:
    #     print('Deal ganho')
    # print(data)
    # print(data['value'][0]['WonQuoteId'])
    # print(data['value'][0]['Amount'])
    print('Deal ainda não ganho')
    atualizarEtapaFechamento(DealId)

    json_data = buscarProdutosQuotes(DealId)

    url = "https://public-api2.ploomes.com/Deals({})/Win".format(DealId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    requests.post(url, headers=headers, json=json_data)

    return "Negócio ganho"


def atualizarEtapaProposta(DealId):

    url = "https://public-api2.ploomes.com/Deals({})".format(DealId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    json_data = {
        "StageId": 166905
    }

    requests.patch(url, headers=headers, json=json_data)

    return 'Deal atualizado'


def atualizarEtapaFechamento(DealId):

    url = "https://public-api2.ploomes.com/Deals({})".format(DealId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    json_data = {
        "StageId": 230240
    }

    requests.patch(url, headers=headers, json=json_data)

    return 'Deal atualizado'


@app.route('/escolherProposta', methods=['GET'])
def escolherProposta():

    dealId = request.args.get('dealId')
    
    print(dealId)

    url = "https://public-api2.ploomes.com/Quotes?$filter=DealId+eq+{} and LastReview&$select=QuoteNumber,Id,Amount,DocumentUrl,Date".format(
        dealId)

    header = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=header)
    data = response.json()

    listaPropostas = data['value']

    print(listaPropostas)

    return jsonify(listaPropostas)


def criarVenda(dealId, idUltimaProposta):
    
    """
    Função para criar venda após ganhar a proposta.
    """

    url = "https://public-api2.ploomes.com/Quotes?$filter=DealId+eq+{}&$expand=Products($expand=OtherProperties)".format(
        dealId)

    header = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    response = requests.get(url, headers=header)

    data = response.json()

    ownerId = data['value'][0]['OwnerId']
    personId = data['value'][0]['PersonId']
    json_produtos = data['value'][0]['Products']
    contactId = data['value'][0]['ContactId']
    amount = data['value'][0]['Amount']
    notes = data['value'][0]['Notes']

    json1 = {
        "ContactId": contactId,
        "DealId": dealId,
        "PersonId": personId,
        "OwnerId": ownerId,
        "CurrencyId": 1,
        "Amount": amount,
        "OriginQuoteId": idUltimaProposta,
        "OtherProperties": [
            {
                "FieldKey": "order_7BB4AC64-8B0F-40AF-A854-CBE860A4B179", # Observação
                "BigStringValue": notes
            },
            {
                "FieldKey": "order_2A8B87D1-3E73-4C5A-94F5-29A53347FFC1", # Atualizar dados
                "BoolValue": True
            },
            {
                "FieldKey": "order_62D206E8-1881-4234-A341-F9E82C08885C", # Programação de entrega
                "DateTimeValue": prazoDias()
            },
            {
                "FieldKey": "order_7932F9F0-B3E8-40D3-9815-53C8613D33F1", # Valor Total
                "DecimalValue": amount
            },
            {
                "FieldKey": "order_377A29A2-69F9-4E34-9307-0764EE3D9A89", # Prazo Dias
                "IntegerValue": 45
            }
        ],
        "Date": dataHojeFormato(), # Hoje
        "Sections": [{"Products":[],"Total": amount}],
    }

    total = {"Total": amount}

    # Loop através dos itens no primeiro JSON
    for product_item in json_produtos:

        # Obter o valor do campo 'quote_product_7FD5E293-CBB5-43C8-8ABF-B9611317DF75'
        discount_value = None  # Valor padrão se não for encontrado
        for other_prop in product_item.get('OtherProperties', []):
            if other_prop.get('FieldKey') == 'quote_product_7FD5E293-CBB5-43C8-8ABF-B9611317DF75':
                discount_value = other_prop.get('DecimalValue')
                break  # Parar a busca após encontrar o valor desejado
            
        # Crie um novo dicionário com os campos necessários
        new_product = {
                "OtherProperties": [
                    {
                        "FieldKey": "order_table_product_69BAEC44-676C-4458-823A-C0F29E605B0F", # Valor unitário com desconto
                        "DecimalValue": product_item['Total'] / product_item['Quantity']
                    },
                    {
                        "FieldKey": "order_table_product_56BC6561-A0C8-4EA7-BF03-40ADC8D03899", # Previsão de Entrega
                        "DateTimeValue": prazoDias() # Hoje + 45 dias corridos
                    }
                ],
                                
                "Quantity": product_item['Quantity'],
                "UnitPrice": product_item['Total'] / product_item['Quantity'],
                "Total": product_item['Total'],
                "ProductId": product_item['ProductId'],
                "Discount": discount_value # aqui o valor do fieldKey: 'quote_product_7FD5E293-CBB5-43C8-8ABF-B9611317DF75'
            },

        # Crie uma nova seção para cada produto
        json1["Sections"][0]['Products'].append(new_product[0])


    print(json1)

    url = "https://public-api2.ploomes.com/Orders"

    requests.post(url, headers=header, json=json1)


def atualizarPedido():

    

    return 'Sucesso'

@app.route('/reenviarEmail', methods=['POST'])
@login_required
def reenviarEmail():
    """Função para reenviar e-mail"""

    data = request.get_json()

    # Extraia as variáveis do JSON
    deal_id = data.get('dealId')
    nomeCliente = data.get('nomeCliente')
    nome_representante = session['user_id']

    # enviar_email(nome_representante, nomeCliente, deal_id)

    return 'E-mail reenviado'


def prazoDias():

    from datetime import datetime, timedelta

    # Obtenha a data atual
    hoje = datetime.now()

    # Adicione 45 dias à data atual
    data_futura = hoje + timedelta(days=45)

    # Formate a data no formato desejado
    data_formatada = data_futura.strftime("%Y-%m-%dT00:00:00-03:00")

    return data_formatada


def dataHojeFormato():

    from datetime import datetime, timedelta

    # Obtenha a data atual
    hoje = datetime.now()

    # Formate a data no formato desejado
    data_formatada = hoje.strftime("%Y-%m-%dT00:00:00-03:00")

    return data_formatada


@app.route('/lista_produtos', methods=['POST','GET'])
@login_required
def lista_produtos():
    
    
    # Aqui, você deve obter os dados do backend, por exemplo, de um banco de dados
    lista_produtos = [
        {
            'description': 'CBHM5000 GR SS RD M17',
            'color': 'Laranja',
            'price': 'R$ 23.325,00'
        },
        # Adicione mais itens de dados conforme necessário
    ]

    return jsonify(lista_produtos)


@app.route('/revisar/<idquote>', methods=['GET'])
@login_required
def revisar(idquote):
    
    if idquote is not None:
        session['idquote'] = idquote

    return redirect(url_for('consulta'))

def criarEmpresaEContato(nomeContato,cnpj,nomeRepresentante,telefone,tipoTelefone,codigoTipoTelefone,nome_estado,id_cidade,tipo_id,listaEmpresas=''):
    
    idResponsavel = idRepresentante(nomeRepresentante)
    
    if tipo_id == 2:
        
        lista_json_data = []
        for empresa in listaEmpresas:

            companyId  = id(empresa)

            json_data = {
                        "CompanyId":companyId
                        }
            
            lista_json_data.append(json_data)

        companhia = []
        if len(listaEmpresas) > 1:
            companhia = lista_json_data

        contato = {
            "Name": nomeContato,
            "Phones": [
                {
                    "Type": {
                        "Id": codigoTipoTelefone,
                        "Name": tipoTelefone
                    },
                    "TypeId": codigoTipoTelefone,
                    "PhoneNumber": telefone,
                    "Country": {
                        "Id": 76,
                        "Short": "BRA",
                        "Short2": "BR",
                        "Name": "BRASIL",
                        "PhoneMask": "(99) 9999?9-9999"
                    },
                    "CountryId": 76
                }
            ],
            "Companies": companhia,
            "CompanyId":lista_json_data[0]["CompanyId"],
            "CityId": id_cidade,
            "State": nome_estado,
            "Country": "Brasil",
            "TypeId": tipo_id,
            "OwnerId": idResponsavel

        }
        url = "https://public-api2.ploomes.com/Contacts?select=Id"

        headers = {
            "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
        }
        response = requests.post(url, headers=headers, json=contato)

        data_json = json.loads(response.text)

        person_id = data_json['value'][0]['Id']

        return person_id

    else:
        contato = {
            "Name": nomeContato,
            "Phones": [
                {
                    "Type": {
                        "Id": codigoTipoTelefone,
                        "Name": tipoTelefone
                    },
                    "TypeId": codigoTipoTelefone,
                    "PhoneNumber": telefone,
                    "Country": {
                        "Id": 76,
                        "Short": "BRA",
                        "Short2": "BR",
                        "Name": "BRASIL",
                        "PhoneMask": "(99) 9999?9-9999"
                    },
                    "CountryId": 76
                }
            ],
            "CityId": id_cidade,
            "State": nome_estado,
            "Register": cnpj,
            "Country": "Brasil",
            "TypeId": tipo_id,
            "OwnerId": idResponsavel
        }

    url = "https://public-api2.ploomes.com/Contacts?select=Id"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }
    response = requests.post(url, headers=headers, json=contato)

def criarEmpresa(nomeRepresentante, listaPagamento, tipoTelefone,codigoTipoTelefone ,telefone,nomeEmpresa,nome_estado,id_cidade):

    idResponsavel = idRepresentante(nomeRepresentante)

    lista_json_data = []
    for formapagamento in listaPagamento:

        idFormaPagamento = idFormaPagamentoCriarContato(formapagamento)

        json_data = {
                    "FieldKey": "contact_7A306110-6643-4AF7-9E1C-DDF1EFAC36FA", # id Forma pagamento
                    "IntegerValue": idFormaPagamento
                }
        
        lista_json_data.append(json_data)

    json_final = {
        
        "OtherProperties": 
            lista_json_data
        ,
        "Phones": [
            {
                "Type": {
                    "Id": codigoTipoTelefone,
                    "Name": tipoTelefone
                },
                "TypeId": codigoTipoTelefone,
                "PhoneNumber": telefone,
                "Country": {
                    "Id": 76,
                    "Short": "BRA",
                    "Short2": "BR",
                    "Name": "BRASIL",
                    "PhoneMask": "(99) 9999?9-9999"
                },
                "CountryId": 76
            }
        ],
        "Name": nomeEmpresa,
        "Tags": [],
        "CityId": id_cidade,
        "State": nome_estado,
        "Country": "Brasil",
        "OwnerId": idResponsavel,
        "TypeId": 1
    }

    url = "https://public-api2.ploomes.com/Contacts"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    requests.post(url, headers=headers, json=json_final) 
    

# def atualizarContato():


def criarOrdemEmpresa(nomeCliente, nomeRepresentante,personId=None):
    """Função para gerar ordem de Empresa"""

    ContactId = id(nomeCliente)

    OwnerId = idRepresentante(nomeRepresentante)

    url = "https://public-api2.ploomes.com/Deals"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    data = {
        "ContactId": ContactId,
        "OwnerId": OwnerId,
        "StageId":174788,
        "PersonId": personId,
    }

    # Fazendo a requisição POST com os dados no corpo
    requests.post(url, headers=headers, json=data)
    # requests.Response

def criarRegistroInteracao(nome_empresa,registro,dataRegistro,contatoRegistro,responsavelRegistro):
    """Função para gerar ordem de Empresa"""

    ContactId = id(nome_empresa)

    OwnerId = idRepresentante(responsavelRegistro)

    Contacts = obterContatos(contatoRegistro)

    if dataRegistro != '':
        data_formatada = converter_formato_data(dataRegistro)
    else: 
        data_formatada = dataHojeFormato()
    

    url = "https://api2.ploomes.com/InteractionRecords"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    # Dados que você deseja enviar no corpo da solicitação POST

    data = {
        "ContactId": ContactId,
        "Content": registro,
        "Date": data_formatada,
        "Contacts":Contacts,
        "OtherProperties":[{
            "FieldKey": "interaction_record_EF9D0AE3-2A8E-44C1-AB6E-910795489B79",
            "IntegerValue": OwnerId
        }]
    }
    
    print(data)

    # Fazendo a requisição POST com os dados no corpo
    requests.post(url, headers=headers, json=data)


def atualizandoContato(nome_empresa,contatoRegistro,idDeals):
    """Função para gerar ordem de Empresa"""

    idDeals = int(idDeals)

    ContactId = idContato(contatoRegistro)

    print(ContactId)

    if ContactId == 'Null':
        return 'Erro'

    url = f"https://api2.ploomes.com/Deals({idDeals})"

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3",
    }

    # Dados que você deseja enviar no corpo da solicitação POST

    data = {
            "Id": idDeals,
            "PersonId": ContactId
        }
    
    print(data)

    # Fazendo a requisição POST com os dados no corpo
    requests.patch(url, headers=headers, json=data)


def buscarRegiaoCliente_id(idCliente):
    """Função para buscar a região por cliente"""

    url = "https://public-api2.ploomes.com/Contacts?$top=10&$filter=Id eq {}&$expand=OtherProperties($filter=FieldKey+eq+'contact_70883643-FFE7-4C84-8163-89242423A4EF')".format(
        idCliente)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    data = response.json()

    try:
        regiao = data['value'][0]['OtherProperties'][0]['ObjectValueName']
    except:
        regiao = 'Lista Preço SDE e COE'

    return regiao

def infoProposta(quoteId):
    """Função para buscar a região por cliente"""

    url = "https://public-api2.ploomes.com/Quotes?$filter=true and Id eq {} &$expand=OtherProperties,Contact,Deal($select=Id,Title),Creator($select=Id,Name,AvatarUrl),Deal($select=Id,Status;$expand=Status($select=Id,Name))".format(quoteId)

    headers = {
        "User-Key": "5151254EB630E1E946EA7D1F595F7A22E4D2947FA210A36AD214D0F98E4F45D3EF272EE07FCF09BB4AEAEA13976DCD5E1EE313316FD9A5359DA88975965931A3"
    }

    response = requests.get(url, headers=headers)

    data = response.json()

    listaInfos = []

    observacao = data['value'][0]['Notes']
    nomeEmpresa = data['value'][0]['ContactName']
    idEmpresa = data['value'][0]['ContactId']
    nomeContato = data['value'][0]['PersonName']
    idContato = data['value'][0]['PersonId']
    
    # Lista para armazenar as propriedades filtradas
    filtered_properties = []

    # Itera sobre cada propriedade em 'OtherProperties'
    for property in data['value'][0]['OtherProperties']:
        # Verifica se o 'FieldKey' corresponde ao valor desejado
        if property['FieldKey'] == 'quote_0FB9F0CB-2619-44C5-92BD-1A2D2D818BFE':
            # Se corresponder, adiciona a propriedade à lista de propriedades filtradas
            filtered_properties.append(property)

    formaPagamento = filtered_properties[0]['ObjectValueName']
    idFormaPagamento = filtered_properties[0]['Id']

    listaInfos.append(nomeEmpresa)
    listaInfos.append(idEmpresa)
    listaInfos.append(nomeContato)
    listaInfos.append(idContato)
    listaInfos.append(formaPagamento)
    listaInfos.append(idFormaPagamento)
    listaInfos.append(observacao)

    return listaInfos

# Função de conexão com o banco
def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST
    )

# Endpoint para a pesquisa
@app.route('/pesquisa1/<int:contact_id>/<versao>/', methods=['GET', 'POST'])
def pesquisa1(contact_id, versao):
    conn = get_db_connection()
    cur = conn.cursor()

    # Verificar se o usuário já respondeu à pesquisa
    cur.execute("SELECT 1 FROM respostas WHERE contact_id = %s and versao = %s LIMIT 1", (contact_id,versao,))
    ja_respondeu = cur.fetchone()

    if ja_respondeu:
        cur.close()
        conn.close()
        return redirect(url_for('ja_respondeu'))

    if request.method == 'POST':
        respostas = []

        # Capturar todas as respostas enviadas
        for pergunta_id in request.form.keys():
            if pergunta_id.isdigit():  # IDs de perguntas
                valores = request.form.getlist(pergunta_id)  # Captura todos os valores selecionados
                for valor in valores:
                    respostas.append((contact_id, int(pergunta_id), valor, versao))

        # Inserir respostas no banco
        query = """
            INSERT INTO respostas (contact_id, pergunta_id, resposta, versao) 
            VALUES %s
        """
        execute_values(cur, query, respostas)
        conn.commit()

        cur.close()
        conn.close()

        return redirect(url_for('obrigado'))

    # Obter perguntas do banco
    cur.execute("SELECT id, texto, tipo, opcoes FROM perguntas WHERE versao = 'v2' ORDER BY id ASC")
    perguntas = cur.fetchall()

    cur.close()
    conn.close()

    return render_template('pesquisas/pesquisa2.html', perguntas=perguntas, contact_id=contact_id)

@app.route('/obrigado')
def obrigado():
    return "<h1>Obrigado por responder a pesquisa!</h1>"

@app.route('/ja_respondeu')
def ja_respondeu():
    return "<h1>Você já respondeu a pesquisa!</h1>"

@app.route('/programacao')
def programacao():
    return render_template("programacao/programacao.html")

@app.route('/api/dados/programacao', methods=['GET'])
def dados_programacao():
    try:
        load_dotenv(override=True)

        google_credentials_json={
            "type":os.environ.get('type'),
            "project_id":os.environ.get('project_id'),
            "private_key":os.environ.get('private_key'),
            "private_key_id":os.environ.get('private_key_id'),
            "client_x509_cert_url":os.environ.get('client_x509_cert_url'),
            "client_email":os.environ.get('client_email'),
            "auth_uri":os.environ.get('auth_uri'),
            "auth_provider_x509_cert_url":os.environ.get('auth_provider_x509_cert_url'),
            "universe_domain":os.environ.get('universe_domain'),
            "client_id":os.environ.get('client_id'),
            "token_uri":os.environ.get('token_uri'),
        }

        scopes = ['https://www.googleapis.com/auth/spreadsheets',
                      "https://www.googleapis.com/auth/drive"]

        if google_credentials_json:
            # credentials_dict = json.loads(google_credentials_json)
            credentials = Credentials.from_service_account_info(google_credentials_json, scopes=scopes)
            gc = gspread.authorize(credentials)
            sh = gc.open_by_key("1olnMhK7OI6W0eJ-dvsi3Lku5eCYqlpzTGJfh1Q7Pv9I")
            wks = sh.worksheet('Importar Dados')

        # # Autenticação do Google Sheets
        # scopes = ['https://www.googleapis.com/auth/spreadsheets',
        #           "https://www.googleapis.com/auth/drive"]

        # credentials = Credentials.from_service_account_file(
        #     'credentials-google.json',
        #     scopes=scopes
        # )

        # gc = gspread.authorize(credentials)
        # sh = gc.open_by_key("1olnMhK7OI6W0eJ-dvsi3Lku5eCYqlpzTGJfh1Q7Pv9I")
        # wks = sh.worksheet('Importar Dados')

        # Obtém todos os dados da planilha
        data = wks.get_all_values()

        # Lista completa das classes a serem filtradas
        classe_recurso = [
            "Carretas Agrícolas com Carroceria Metálica",
            "Carretas Agrícolas de Madeira",
            "Carretas Tanque",
            "Carretas Basculantes hidráulicas",
            "Carretas Especiais",
            "Colheitadeira",
            "Transbordo",
            "Roçadeiras M24",
            "Outros Equipamentos",
            "Produtos de Plantio",
            "Carretas Agrícolas Fora de Linha"
        ]

        # Lista das classes que precisam de uma flag especial
        classes_com_flag = {
            "Carretas Especiais": "Carretas Especiais",
            "Colheitadeira": "Colheitadeira",
            "Transbordo": "Transbordo",
            "Roçadeiras M24": "Roçadeiras M24",
            "Outros Equipamentos": "Outros Equipamentos",
            "Produtos de Plantio": "Produtos de Plantio",
            "Carretas Agrícolas Fora de Linha": "Carretas Agrícolas Fora de Linha"
        }

        # Converte os dados para um formato estruturado (dicionário)
        headers = data[0]
        rows = data[1:]
        structured_data = [dict(zip(headers, row)) for row in rows]

        # structured_data = pd.DataFrame(structured_data)
        # structured_data['PED_PREVISAOEMISSAODOC'] = pd.to_datetime(structured_data['PED_PREVISAOEMISSAODOC'], format='%d/%m/%Y')
        # structured_data[structured_data['PED_PREVISAOEMISSAODOC'] == '2025-02-03']

        # Obtém os parâmetros start e end da requisição
        start = request.args.get('start')
        end = request.args.get('end')

        if not start or not end:
            return jsonify({'error': 'Parâmetros start e end são obrigatórios.'}), 400

        # Converte as datas para o formato datetime
        start_date = datetime.fromisoformat(start.split('T')[0])  # Pega apenas a data
        end_date = datetime.fromisoformat(end.split('T')[0])  # Pega apenas a data

        # Converter classes_com_flag para minúsculas
        classes_com_flag_lower = {key.lower(): value.lower() for key, value in classes_com_flag.items()}

        # Converter a lista de classes para minúsculas
        classe_recurso_lower = [classe.lower() for classe in classe_recurso]

        # Converter a coluna "PED_RECURSO.CLASSE.NOME" para minúsculas
        for row in structured_data:
            if "PED_RECURSO.CLASSE.NOME" in row and isinstance(row["PED_RECURSO.CLASSE.NOME"], str):
                row["PED_RECURSO.CLASSE.NOME"] = row["PED_RECURSO.CLASSE.NOME"].lower()

        # Filtra apenas as linhas com as classes desejadas (agora em minúsculas)
        filtered_data_rows = [row for row in structured_data if row.get("PED_RECURSO.CLASSE.NOME") in classe_recurso_lower]

        # Filtra os dados com base na coluna `PED_PREVISAOEMISSAODOC`
        filtered_data = []
        for row in filtered_data_rows:
            try:
                programacao_date = datetime.strptime(row['PED_PREVISAOEMISSAODOC'], '%d/%m/%Y')
                if start_date <= programacao_date <= end_date:
                    filtered_data.append(row)
            except (KeyError, ValueError):
                continue  # Ignora linhas sem data válida

        # Consolida os dados agrupando por cliente e data
        consolidated_data = {}
        total_por_dia = {}  # Dicionário para armazenar o total do dia
        for row in filtered_data:
            cliente = row['PED_PESSOA.CODIGO'].strip().lower()  # Remove espaços e padroniza em minúsculas
            data_programacao = datetime.strptime(row['PED_PREVISAOEMISSAODOC'], '%d/%m/%Y').strftime('%Y-%m-%d')  # Garante o mesmo formato de data
            
            # Converte `PED_TOTAL` para float
            try:
                total = float(row.get("PED_TOTAL", "0").replace(",", "."))
            except ValueError:
                total = 0.0

            produtos = row['PED_RECURSO.CODIGO']
            classe = row.get("PED_RECURSO.CLASSE.NOME", "")

            # Se a classe estiver na lista especial, a flag será o nome da classe
            classe_flag = classes_com_flag_lower.get(classe, None)

            key = f"{cliente}_{data_programacao}"  # Chave única

            if key not in consolidated_data:
                consolidated_data[key] = {
                    "title": f"{cliente}",
                    "start": data_programacao,
                    "extendedProps": {
                        "cliente": cliente,
                        "produtos": produtos if isinstance(produtos, list) else [produtos],
                        "total": total,
                        "classe_flag": classe_flag  # Adiciona a flag com o nome da classe
                    }
                }
            else:
                # Atualiza produtos e soma os valores
                consolidated_data[key]["extendedProps"]["produtos"].extend(
                    produtos if isinstance(produtos, list) else [produtos]
                )
                consolidated_data[key]["extendedProps"]["total"] += total

                # Atualiza o título com o novo total consolidado
                consolidated_data[key]["title"] = f"{cliente}"

            # Atualiza o total por dia
            if data_programacao not in total_por_dia:
                total_por_dia[data_programacao] = total
            else:
                total_por_dia[data_programacao] += total

        # Adiciona entradas para "TOTAL DIA: " no consolidated_data
        total_dia_entries = []
        for data, total_dia in total_por_dia.items():
            total_dia_entry = {
                "title": f"TOTAL DIA",
                "start": data,
                "extendedProps": {
                    "cliente": "TOTAL DIA",
                    "produtos": [],
                    "total": total_dia,
                    "is_total_dia": True  # Adiciona este campo para diferenciar
                }
            }            
            total_dia_entries.append(total_dia_entry)

        # Organiza os resultados: primeiro os clientes normais, depois "TOTAL DIA"
        normal_entries = [value for key, value in consolidated_data.items()]
        result = normal_entries + total_dia_entries  # Adiciona "TOTAL DIA" ao final

        # Retorna os dados no formato JSON esperado pelo FullCalendar
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def proximo_dia_livre(data_inicial, ocupados):
    data = data_inicial
    while True:
        data += timedelta(days=1)
        if data.weekday() < 5 and data not in ocupados:
            return data

def somar_dias_uteis(data_inicial, dias_uteis, ocupados):
    data = data_inicial
    adicionados = 0
    while adicionados < dias_uteis:
        data += timedelta(days=1)
        if data.weekday() < 5 and data not in ocupados:
            adicionados += 1
    return data

def proximo_dia_util(data_inicial, dias):
    
    """
    Soma a quantidade de dias e empurra para frente se cair em sábado ou domingo.
    Retorna a próxima data útil após a soma.
    """

    data = data_inicial + timedelta(days=dias)

    # Empurra para segunda-feira se cair no fim de semana
    while data.weekday() >= 5:  # 5 = sábado, 6 = domingo
        data += timedelta(days=1)

    return data

def carretas_pendentes():

    # conectar com planilha que fala se a carga ta aberta ou fechada
    load_dotenv(override=True)

    classe_recurso = [
            "Carretas Agrícolas com Carroceria Metálica",
            "Carretas Agrícolas de Madeira",
            "Carretas Tanque",
            "Carretas Basculantes hidráulicas",
            "Carretas Especiais",
            "Colheitadeira",
            "Transbordo",
            "Roçadeiras M24",
            "Outros Equipamentos",
            "Produtos de Plantio",
            "Carretas Agrícolas Fora de Linha"
        ]

    google_credentials_json={
        "type":os.environ.get('type'),
        "project_id":os.environ.get('project_id'),
        "private_key":os.environ.get('private_key'),
        "private_key_id":os.environ.get('private_key_id'),
        "client_x509_cert_url":os.environ.get('client_x509_cert_url'),
        "client_email":os.environ.get('client_email'),
        "auth_uri":os.environ.get('auth_uri'),
        "auth_provider_x509_cert_url":os.environ.get('auth_provider_x509_cert_url'),
        "universe_domain":os.environ.get('universe_domain'),
        "client_id":os.environ.get('client_id'),
        "token_uri":os.environ.get('token_uri'),
    }

    scopes = ['https://www.googleapis.com/auth/spreadsheets',
                    "https://www.googleapis.com/auth/drive"]

    if google_credentials_json:
        # credentials_dict = json.loads(google_credentials_json)
        credentials = Credentials.from_service_account_info(google_credentials_json, scopes=scopes)
        gc = gspread.authorize(credentials)
        sh = gc.open_by_key("1olnMhK7OI6W0eJ-dvsi3Lku5eCYqlpzTGJfh1Q7Pv9I")
        wks = sh.worksheet('Importar Dados')

    data = wks.get_all_values()

    df_carretas_pendentes = pd.DataFrame(data[1:], columns=data[0])  # Pulando o cabeçalho

    # Buscando ultima data com status "fechada"
    df_carretas_pendentes['PED_PREVISAOEMISSAODOC'] = pd.to_datetime(
        df_carretas_pendentes['PED_PREVISAOEMISSAODOC'], 
        format='%d/%m/%Y', 
        errors='coerce'
    )

    df_carretas_pendentes = df_carretas_pendentes[
        (df_carretas_pendentes['PED_PREVISAOEMISSAODOC'] >= '2025-12-01') &
        (df_carretas_pendentes['PED_RECURSO.CLASSE.NOME'].isin(classe_recurso))
    ]
    
    df_carretas_pendentes['PED_QUANTIDADE'] = df_carretas_pendentes['PED_QUANTIDADE'].astype(int)

    qt_carretas = df_carretas_pendentes['PED_QUANTIDADE'].sum()

    # 10 carretas -> 1 carga, 20 carretas -> 2 cargas...
    # a cada 10 carretas será 1 dia útil a mais
    qtd_dias_uteis_extras = math.ceil(qt_carretas / 10)

    return qtd_dias_uteis_extras

# Função para encontrar o próximo dia livre considerando finais de semana e ocupação
def encontrar_proximo_dia_livre():

    # conectar com planilha que fala se a carga ta aberta ou fechada
    load_dotenv(override=True)

    google_credentials_json={
        "type":os.environ.get('type'),
        "project_id":os.environ.get('project_id'),
        "private_key":os.environ.get('private_key'),
        "private_key_id":os.environ.get('private_key_id'),
        "client_x509_cert_url":os.environ.get('client_x509_cert_url'),
        "client_email":os.environ.get('client_email'),
        "auth_uri":os.environ.get('auth_uri'),
        "auth_provider_x509_cert_url":os.environ.get('auth_provider_x509_cert_url'),
        "universe_domain":os.environ.get('universe_domain'),
        "client_id":os.environ.get('client_id'),
        "token_uri":os.environ.get('token_uri'),
    }

    scopes = ['https://www.googleapis.com/auth/spreadsheets',
                    "https://www.googleapis.com/auth/drive"]

    if google_credentials_json:
        # credentials_dict = json.loads(google_credentials_json)
        credentials = Credentials.from_service_account_info(google_credentials_json, scopes=scopes)
        gc = gspread.authorize(credentials)
        sh = gc.open_by_key("1olnMhK7OI6W0eJ-dvsi3Lku5eCYqlpzTGJfh1Q7Pv9I")
        wks = sh.worksheet('Acomp. de cargas formadas')

    data = wks.get_all_values()

    df_datas = pd.DataFrame(data[1:], columns=data[0])  # Pulando o cabeçalho

    # Buscando ultima data com status "fechada"
    df_datas['Data'] = pd.to_datetime(df_datas['Data'], format='%d/%m/%Y', errors='coerce')

    # Transformar em lista de objetos datetime
    # df_datas = df_datas['Data'].dropna().tolist()

    # Verificar se existe algum dia útil "livre" dentro do dataframe
    # Caso seja sabado, domingo, feriado ou fechado não usar o dia
    # Procurar sempre na data maior que hoje
    # Lista de feriados e dias fechados
    dias_indisponiveis = df_datas[df_datas['Status'].isin(['feriado', 'fechada'])]['Data'].dropna().tolist()

    # Data base: hoje
    hoje = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Achar o próximo dia útil livre após hoje

    data_livre = proximo_dia_livre(hoje, dias_indisponiveis)

    # +5 dias úteis a partir do próximo dia livre
    prazo_5 = somar_dias_uteis(data_livre, 5, dias_indisponiveis)

    qtd_dias_uteis_extras = carretas_pendentes()
    proximo_dia_util_var = proximo_dia_util(data_livre, qtd_dias_uteis_extras)

    # somar a quantidade de dias úteis extras
    dias_soma = proximo_dia_util_var + timedelta(days=qtd_dias_uteis_extras)

    # +10 dias úteis a partir do prazo +5
    prazo_10 = somar_dias_uteis(dias_soma, 10, dias_indisponiveis)
    
    return prazo_5,prazo_10 

def tratamento_prazo_entrega():

    load_dotenv(override=True)

    google_credentials_json={
        "type":os.environ.get('type'),
        "project_id":os.environ.get('project_id'),
        "private_key":os.environ.get('private_key'),
        "private_key_id":os.environ.get('private_key_id'),
        "client_x509_cert_url":os.environ.get('client_x509_cert_url'),
        "client_email":os.environ.get('client_email'),
        "auth_uri":os.environ.get('auth_uri'),
        "auth_provider_x509_cert_url":os.environ.get('auth_provider_x509_cert_url'),
        "universe_domain":os.environ.get('universe_domain'),
        "client_id":os.environ.get('client_id'),
        "token_uri":os.environ.get('token_uri'),
    }

    scopes = ['https://www.googleapis.com/auth/spreadsheets',
                    "https://www.googleapis.com/auth/drive"]

    if google_credentials_json:
        # credentials_dict = json.loads(google_credentials_json)
        credentials = Credentials.from_service_account_info(google_credentials_json, scopes=scopes)
        gc = gspread.authorize(credentials)
        sh = gc.open_by_key("1olnMhK7OI6W0eJ-dvsi3Lku5eCYqlpzTGJfh1Q7Pv9I")
        wks = sh.worksheet('Importar Dados')

    data = wks.get_all_values()
    
    df = pd.DataFrame(data[1:], columns=data[0])  # Pulando o cabeçalho

    # Convertendo a coluna 'PED_PREVISAOEMISSAODOC' para datetime
    df['PED_PREVISAOEMISSAODOC'] = pd.to_datetime(df['PED_PREVISAOEMISSAODOC'], format='%d/%m/%Y', errors='coerce')

    # Definir a data atual
    hoje = datetime.today()

    # Encontrar o próximo dia livre a partir de hoje
    # prox_dia_livre = df[df['PED_PREVISAOEMISSAODOC'] > hoje]['PED_PREVISAOEMISSAODOC'].min()

    # Calcular o prazo de entrega
    prazo_carga_fechada,prazo_carreta_avulsa = encontrar_proximo_dia_livre()

    return prazo_carga_fechada,prazo_carreta_avulsa 

@app.route('/api/programacao/prazo-entrega', methods=['GET'])
def prazo_entrega():

    """
    Api para calcular prazo de entrega com base no dia atual
    """   

    # conectar com google sheets
        # coluna de data da carga: PED_PREVISAOEMISSAODOC
    # buscar o proximo dia livre de carga
    # definir regra:
        # 1. Caso seja carreta avulsa: contar 15 dias úteis a partir do dia da última carga fechada (não conta sabado e domingo nem feriado).
        # 2. Caso seja carga fechada: contar 5 dias úteis a partir do dia da última carga fechada (não conta sabado e domingo nem feriado).
    # mostrar essa informação atraves de um card no front-end na tela inicial
    # modelo do texto: 
        # 1. "Para carretas avulsas, o prazo de entrega é: 20/04/2025."
        # 2. "Para cargas fechadas, o prazo de entrega é: 20/04/2025."

    prazo_carga_fechada, prazo_carreta_avulsa = tratamento_prazo_entrega()

    hoje = date.today()

    if isinstance(prazo_carga_fechada, datetime):
        prazo_carga_fechada = prazo_carga_fechada.date()
    if isinstance(prazo_carreta_avulsa, datetime):
        prazo_carreta_avulsa = prazo_carreta_avulsa.date()

    dias_corridos_fechada = (prazo_carga_fechada - hoje).days
    dias_corridos_avulsa = (prazo_carreta_avulsa - hoje).days

    return jsonify({'prazo_carreta_avulsa':prazo_carreta_avulsa, 'prazo_carga_fechada':prazo_carga_fechada,
                     'dias_corridos_fechada':dias_corridos_fechada, 'dias_corridos_avulsa':dias_corridos_avulsa})


if __name__ == '__main__':
    app.run(port=8000,debug=True,host='0.0.0.0')
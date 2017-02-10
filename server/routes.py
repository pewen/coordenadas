#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
API simple para visualizar los ladrilleros de cordoba
desarrollado en el hack(at)ONG 2016
"""

from __future__ import print_function, division

import json
import random
from math import sqrt
from datetime import datetime
from string import ascii_uppercase, digits

from flask import Flask
from flask import jsonify, make_response, request, abort, url_for, redirect,\
    current_app, flash, session, render_template
from flask_cors import CORS, cross_origin
from flask_oauthlib.client import OAuth

from .utils import read4json, save2json


# creacion del server
app = Flask(__name__,
            template_folder="../templates/_site",
            static_folder="../static",
            instance_relative_config=True)

# Cofiguration of flask
app.config.from_object('server.config.DevelopmentConfig')

# Allow post from other domains with cookies
cors = CORS(app, supports_credentials=True)

# Twitter configuration to login via OAuth
oauth = OAuth()
twitter = oauth.remote_app(
    'twitter',
    base_url='https://api.twitter.com/1.1/',
    request_token_url='https://api.twitter.com/oauth/request_token',
    access_token_url='https://api.twitter.com/oauth/access_token',
    authorize_url='https://api.twitter.com/oauth/authorize',
    consumer_key=app.config['TWITTER_CONSUMER_KEY'],
    consumer_secret=app.config['TWITTER_CONSUMER_SECRET']
)


def generate_random_id(size=20, chars=ascii_uppercase + digits):
    """
    Generate a random string used on the cookies to
    autetication of the user.

    Thanks to Ignacio Vazquez-Abrams for this solution
    https://stackoverflow.com/questions/2257441/random-string-generation-with-upper-case-letters-and-digits-in-python#2257449

    Parameters
    ----------
    size: int
      Leng of the random string
    chars: string
      String used to choice the random values
    """
    return ''.join(random.choice(chars) for _ in range(size))


"""
Login in the aplication
-----------------------
"""


@app.route('/login')
def login():
    """
    Login via twitter

    Parameters
    ----------
    return_to: str
      Url to return after login

    TODO:
    ----
    * Login via facebook
    """
    next_url = request.args.get('next')

    allowed_routes = ['accionDirecta', 'mapeoCiudadano',
                      'historico']
    if next_url not in allowed_routes:
        next_url = ''

    callback_url = url_for('oauthorized', next=next_url)
    return twitter.authorize(callback=callback_url or
                             request.referrer or None)


@app.route('/logout')
def logout():
    """
    Logout and remove all the cookies

    TODO:
    ----
    * Guardar la url de la que viene para volver a la misma
    """
    next_url = request.args.get('next')

    allowed_routes = ['accionDirecta', 'mapeoCiudadano',
                      'historico']
    if next_url not in allowed_routes:
        next_url = '/'

    response = current_app.make_response(redirect(next_url))

    # Remove all the cookies
    response.set_cookie('status', '', expires=0)
    response.set_cookie('session', '', expires=0)

    return response


@app.route('/oauthorized')
def oauthorized():
    """
    Check if the login user have the correct permission to add points.

    TODO:
    * check if the facebook user have the coorect permission
    * retornar a la ultima pagina que visito el usuario antes del login
    """
    next_url = request.args.get('next') or '/'

    resp = twitter.authorized_response()

    if resp is None:
        flash('You denied the request to sign in.')
        return redirect('/')
    elif resp['screen_name'] not in app.config['TWITTER_ALLOWED']:
        flash('You dont have premission')
        return redirect('/')

    access_token = resp['oauth_token']
    session['access_token'] = access_token
    session['screen_name'] = resp['screen_name']

    session['twitter_token'] = (
        resp['oauth_token'],
        resp['oauth_token_secret']
    )

    flash('You were successfully logged in')

    response = current_app.make_response(redirect(next_url))
    response.set_cookie('status', value=generate_random_id())
    return response


"""
Basic routes
------------
"""


@app.route('/')
def home():
    return render_template("index.html",
                           serverUrl=app.config['SERVER_URL'])


@app.route('/mapa')
def mapa():
    return render_template("mapa.html",
                           serverUrl=app.config['SERVER_URL'],
                           layersNames=app.config['VALID_LAYER_NAME'],
                           layersFullName=app.config['LAYER_FULL_NAME'])


@app.route('/analisis')
def analisis():
    return render_template("analisis.html",
                           serverUrl=app.config['SERVER_URL'],
                           layersNames=app.config['VALID_LAYER_NAME'],
                           layersFullName=app.config['LAYER_FULL_NAME'])


@app.route('/analisis/datos/<data_name>')
def get_analysis(data_name):
    valid_data = ['acceso_agua_hist.csv', 'acceso_area_hist.csv',
                  'acceso_gas_hist.csv', 'baño_hist.csv',
                  'educacion_hist.csv', 'hacinamiento_hist.csv',
                  'cantidad_por_departamento.csv', 'vivienda_hist.csv']

    if data_name not in valid_data:
        abort(404, 'No existe esos datos')

    path = app.config['DATA_DIR'] + 'analisis/' + data_name
    csv = ''
    with open(path) as f:
        for line in f.readlines():
            csv += line

    response = make_response(csv)
    cd = 'attachment; filename=mycsv.csv'
    response.headers['Content-Disposition'] = cd
    response.mimetype = 'text/csv'

    return response


@app.route('/analisis/por_departamento')
def por_departamento():
    # Cortaderos por departamento
    return render_template("cortaderos_por_departamentos_cordoba.html")


@app.route('/equipo')
def equipo():
    return render_template("equipo.html",
                           serverUrl=app.config['SERVER_URL'])


"""
API routes
----------
"""


@app.route("/api/v1.0/datos/<capa>", methods=['GET'])
def get_datos(capa):
    """
    Retorna un GeoJSON con los datos de alguna capa
    (cortaderos, salud o educacion).
    Si esta logeado, retorna los elementos que hay que validar.

    Parameter
    ---------
    capa: str
      Capa a obtener. Puede ser cortaderos, salud, educacion

    Return
    ------
    data: geojson
      GeoJSON con los datos de la capa.

    Error
    -----
    400: Nombre de capa invalido
    """
    # Chequeo que sea un nombre de capa valido
    capa = capa.lower()
    if capa not in app.config['VALID_LAYER_NAME']:
        abort(400, 'Nombre de capa invalido')

    path = app.config['DATA_DIR'] + capa + '.geojson'
    data = read4json(path)

    # Si el usuario esta logeado, retorno todos los puntos
    if 'twitter_token' in session:
        return jsonify(data)

    # Si no, solo retorno los puntos validos
    else:
        valid_elements = []
        for element in data['features']:
            if element['properties']['valido']:
                valid_elements.append(element)

        data = {'type': 'FeatureCollection',
                'features': valid_elements}

        for cnt, element in enumerate(data['features']):
            if 'borrar_contador' in element['properties']:
                data['features'][cnt]['properties'].pop('borrar_contador',
                                                        None)

        return jsonify(data)


@app.route("/api/v1.0/datos/completos/<capa>", methods=['GET'])
def get_datos_completos(capa):
    """
    Retorna un GeoJSON con los datos de alguna capa
    (cortaderos, salud o educacion).
    Si esta logeado, retorna los elementos que hay que validar.

    Parameter
    ---------
    capa: str
      Capa a obtener. Puede ser cortaderos, salud, educacion

    Return
    ------
    data: geojson
      GeoJSON con los datos de la capa.

    Error
    -----
    400: Nombre de capa invalido
    """
    # Chequeo que sea un nombre de capa valido
    capa = capa.lower()
    if capa not in app.config['VALID_LAYER_NAME']:
        abort(400, 'Nombre de capa invalido')

    path = app.config['DATA_DIR'] + 'analisis/completos/' +\
           capa + '.geojson'
    data = read4json(path)

    return jsonify(data)


@app.route("/api/v1.0/datos/modificar/", methods=['POST'])
def nuevo_elemento():
    """
    Crear un nuevo elemento en una capa especificada.
    Si el usuario esta logeado, el punto ya esta validado.
    Si no, hay que validarlo

    Request
    -------
    capa: str
      Nombre de la capa: cortaderos, salud o educacion.
    lat: float
      Latidud del nuevo elemento.
    lng: float
      Longitud del nuevo elemento.
    nombre: str
      Nombre del elemento.

    Errors
    ------
    400: Request vacio
    400: Nombre de elemento invalido
    400: Latitud invalida
    400: Longitud invalida
    400: Nombre del nuevo punto invalido
    """
    # Primero chequeo todos los elementos del request
    if not request.json:
        abort(400, "Request vacio")
    if 'capa' not in request.json:
        abort(400, "No hay nombre de capa")
    if 'lat' not in request.json:
        abort(400, "No hay latitud")
    if 'lng' not in request.json:
        abort(400, "No hay logitud")
    if 'nombre' not in request.json:
        abort(400, "No hay nombre del nuevo punto")

    # Chequeo que sea un nombre de capa valido
    capa = request.json['capa'].lower()
    if capa not in app.config['VALID_LAYER_NAME']:
        abort(400, 'Nombre de capa invalido')

    path = app.config['DATA_DIR'] + capa + '.geojson'
    data = read4json(path)

    # Si el usuario esta logeado, el punto ya es valido
    if 'twitter_token' in session:
        punto_valido = True
    else:
        punto_valido = False

    # Obtengo el id del nuevo punto
    punto_id = int(data['features'][-1]['properties']['id']) + 1

    # Nuevo dato
    nuevo_punto = {'geometry':
                   {'coordinates': [float(request.json['lng']),
                                    float(request.json['lat'])],
                    'type': 'Point'},
                   'properties': {'id': punto_id,
                                  'name': request.json['nombre'],
                                  'type': capa,
                                  'valido': punto_valido,
                                  'ip': request.remote_addr},
                   'type': 'Feature'}

    # Agrego el nuevo punto y lo guardo
    data['features'].append(nuevo_punto)
    save2json(path, data)

    return jsonify({'status': 201})


@app.route("/api/v1.0/datos/modificar/", methods=['DELETE'])
@cross_origin()
def borrar_elemento():
    """
    Borra un elemento existente.
    Si el usuario esta logeado, lo borro directamente.
    Si no, pasa a que validen la borrada.

    Request
    -------
    capa: str
      Nombre de la capa: cortaderos, salud o educacion.
    id: int
      Id unico del punto a borrar

    Errors
    ------
    400: Request vacio
    400: Nombre de capa invalido
    400: No existe ese numero de id
    """
    # Primero chequeo todos los elementos del request
    if not request.json:
        abort(400, "Request vacio")
    if 'capa' not in request.json:
        abort(400, "No hay nombre de capa")
    if 'id' not in request.json:
        abort(400, "No hay un id de elemento")

    # Chequeo que sea un nombre de capa valido
    capa = request.json['capa'].lower()
    if capa not in app.config['VALID_LAYER_NAME']:
        abort(400, 'Nombre de capa invalido')

    path = app.config['DATA_DIR'] + capa + '.geojson'
    data = read4json(path)

    # Encuentro la posicion del elemento a borrar
    id2del = int(request.json['id'])
    position = -1
    for cnt, element in enumerate(data['features']):
        if int(element['properties']['id']) == id2del:
            position = cnt
            break

    # Si el elemento no existe, retorno un error
    if position == -1:
        abort(400, "No existe ese numero de id")

    # Si el usuario esta logeado, el punto se borra directamente
    if 'twitter_token' in session:
        data['features'].pop(position)
    else:
        if 'borrar_contador' in data['features'][position]['properties']:
            data['features'][position]['properties']['borrar_contador'] += 1
        else:
            data['features'][position]['properties']['borrar_contador'] = 1

    # Save the data
    save2json(path, data)
    return jsonify({'status': 201})


@app.route("/api/v1.0/datos/modificar/", methods=['PUT'])
def actualizar_elemento():
    """
    Valida un elemento.

    Request
    -------
    Capa: str
      Nombre de la capa: cortaderos, salud o educacion.
    Id: int
      Id unico del punto a validar

    Errors
    ------
    400: Request vacio
    400: Nombre de capa invalido
    400: No existe ese numero de id
    """
    if 'twitter_token' not in session:
        abort(401, 'No tenes permiso')

    # Primero chequeo todos los elementos del request
    if not request.json:
        abort(400, "Request vacio")
    if 'capa' not in request.json:
        abort(400, "No hay nombre de capa")
    if 'id' not in request.json:
        abort(400, "No hay un id de elemento")

    # Chequeo que sea un nombre de capa valido
    capa = request.json['capa'].lower()
    if capa not in app.config['VALID_LAYER_NAME']:
        abort(400, 'Nombre de capa invalido')

    path = app.config['DATA_DIR'] + capa + '.geojson'
    data = read4json(path)

    # Encuentro la posicion del elemento a borrar
    id2validate = int(request.json['id'])
    position = -1
    for cnt, element in enumerate(data['features']):
        if int(element['properties']['id']) == id2validate:
            position = cnt
            break

    # Si el elemento no existe, retorno un error
    if position == -1:
        abort(400, "No existe ese numero de id")

    data['features'][position]['properties']['valido'] = True
    if 'borrar_contador' in data['features'][position]['properties']:
        data['features'][position]['properties'].pop('borrar_contador',
                                                     None)

    # Save the data
    save2json(path, data)
    return jsonify({'status': 201})


@app.route("/api/coordinate/")
def coordinate():
    """
    Retorna todos los datos dentro de un radio

    Request
    -------
    lat: float
      Latidud del centro de la circunferencia
    lng: float
      Longitud del centro de la circunferencia
    radio: float
      Radio de la circunferencia
    """
    if not request.json:
        abort(400)
    if 'lat' not in request.json:
        abort(400)
    if 'lng' not in request.json:
        abort(400)
    if 'radio' not in request.json:
        abort(400)

    latitude = request.json['lat']
    longitude = request.json['lng']
    radio = request.json['radio']

    cortadero = read4json('../datos/cortaderos.geojson')
    dispensarios = read4json('../datos/salud.geojson')
    esculas = read4json('../datos/educacion.geojson')

    # Datos para los cortadores
    corta_counts = []
    for count, element in enumerate(cortadero['Cortadores']):
        diff1 = (element['coordenada'][0] - latitude)**2
        diff2 = (element['coordenada'][1] - longitude)**2
        dist = sqrt(diff1 + diff2)

        if dist < radio:
            corta_counts.append(count)

    data_corta = []
    for i in corta_counts:
        data_corta.append(cortadero['Cortadores'][i])

    # Datos para los dispensarios
    disp_counts = []
    for count, element in enumerate(dispensarios['Dispensarios']):
        diff1 = (element['coordenadas'][0] - latitude)**2
        diff2 = (element['coordenadas'][1] - longitude)**2
        dist = sqrt(diff1 + diff2)

        if dist < radio:
            disp_counts.append(count)

    data_disp = []
    for i in disp_counts:
        data_disp.append(dispensarios['Dispensarios'][i])

    # Datos para las escuelas
    escu_counts = []
    for count, element in enumerate(esculas['Escuelas']):
        diff1 = (element['coordenadas'][0] - latitude)**2
        diff2 = (element['coordenadas'][1] - longitude)**2
        dist = sqrt(diff1 + diff2)

        if dist < radio:
            escu_counts.append(count)

    data_escu = []
    for i in escu_counts:
        data_escu.append(dispensarios['Dispensarios'][i])

    data = {'cortaderos': data_corta,
            'dispensarios': data_disp,
            'escuelas': data_escu}

    return json.dumps(data)


"""
Http Errors
-----------
"""


@app.errorhandler(400)
def bad_request(error):
    """
    Error 400 for Bad Request.
    The body request is empy or with a bad key
    For example `new_name` in side of `name`.
    """
    return make_response(jsonify({'error': 'Bad request'}), 400)


@app.errorhandler(401)
def unauthorized(error):
    """
    Error 401 for Unauthorized.
    """
    return make_response(jsonify({'error': 'Unauthorized'}), 401)


@app.errorhandler(404)
def not_found(error):
    """
    Error 404 for Resource Not Found.
    The id in the URI don't exist.
    """
    return make_response(jsonify({'error': 'Not found'}), 404)

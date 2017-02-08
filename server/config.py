"""
Configuration of the server depending if running local or in openshift
"""

import sys

from .keys import flask_key, twitter_key, twitter_secret

# Configure the base path depending if is the local machine or openshift
if 'openshift' in sys.path[1]:
    PATH_BASE = '/var/lib/openshift/589b8f240c1e66aa7c00006e/' +\
                'app-root/runtime/repo/'
    SERVER_URL = 'coordenadas-pewen.rhcloud.com'
else:
    PATH_BASE = './'
    SERVER_URL = 'http://127.0.0.1:5000/'


class Config(object):
    DEBUG = False
    TESTING = False

    # Flask secret key
    SECRET_KEY = flask_key

    SERVER_URL = SERVER_URL

    # name of the all valid layer
    VALID_LAYER_NAME = ['cortaderos', 'salud', 'primarios', 'secundarios']
    LAYER_FULL_NAME = {'cortaderos': 'Cortaderos',
                       'salud': 'Centro de Salud',
                       'primarios': 'Instituto Primario',
                       'secundarios': 'Instituto Secundario'}
    # Path to the data directory
    DATA_DIR = PATH_BASE + 'data/'

    # Twitter consumer key and secret.
    # Keep this in diferent file to be secured
    TWITTER_CONSUMER_KEY = twitter_key
    TWITTER_CONSUMER_SECRET = twitter_secret

    # Twitter allowed user to create a new point
    TWITTER_ALLOWED = ['fnbellomo', 'ucaomo']


class ProductionConfig(Config):
    """
    In the config I can put all the path to local host
    and in this config, put all the path to the server
    """
    pass


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = True


class TestingConfig(Config):
    DEBUG = False
    TESTING = True

#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
Algunas funciones utilizadas en el servidor
"""

import json


def read4json(file_path):
    """
    Leo la un json y lo retorno

    Parameter
    ---------
    file_path : str
      Path al json
    """
    with open(file_path, 'r') as data_file:
        data = json.load(data_file)
    return data


def save2json(file_path, data):
    """
    Salvo un dic a un json

    Parameters
    ----------
    file_path: str
      Path al json
    data: dic
      Diccionario a guardar
    """
    with open(file_path, 'w') as data_file:
        json.dump(data, data_file)

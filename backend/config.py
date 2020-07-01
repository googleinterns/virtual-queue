"""Flask config."""
import os
from os.path import join, dirname
from dotenv import load_dotenv
dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)

class Config:
    """Base config."""
    MAPS_DISTANCE_URL = os.environ.get('MAPS_DISTANCE_URL')
    MAPS_SEARCH_URL =  os.environ.get('MAPS_SEARCH_URL')
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True

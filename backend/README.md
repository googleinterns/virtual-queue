## Backend Python server set up 

The backend server has been written in Flask.

### Install requirements
```
pip install -r requirements.txt
```
### Environment configuration

1. Follow the format in [.env_sample](.env_sample) to create your own environment file `.env` in the same folder. 
```
MAPS_DISTANCE_URL = <Maps Distance Matrix URL to calculate travel time>
MAPS_SEARCH_URL = <Maps Places Search (Textsearch) URL to calculate travel time>
```
2. To change the configuration settings, edit the [main](main.py) file to include the following settings. They are set to production mode by default.
- Development mode: `app.config.from_object('config.DevelopmentConfig')`

- Testing: 
`app.config.from_object('config.TestingConfig')`

These classes are defined in the [config.py](config.py) file. 

### Run the app
```
python3 main.py
```
# app.py
from flask import Flask, render_template, jsonify, make_response, send_from_directory, request
from flask_caching import Cache
from datetime import datetime, timedelta, timezone
import os
import logging
import traceback
from utils import complete_bitcoin_data, obstacles_drawdowns_weekly, get_bitcoin_events, get_random_bitcoin_data
from dotenv import load_dotenv
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
from config import config
from flask_migrate import Migrate
import urllib.parse
import ssl

load_dotenv()
print(f"FLASK_DEBUG environment variable: '{os.environ.get('FLASK_DEBUG')}'")

app = Flask(__name__)

# Use settings from config.py
config_name = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[config_name])

# Initialize extensions
csrf = CSRFProtect(app)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Import db and models
from models import db, LeaderboardEntry

# Initialize the database with the app
db.init_app(app)
migrate = Migrate(app, db)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
if not app.debug:
    handler = logging.StreamHandler()
    handler.setLevel(logging.ERROR)
    app.logger.addHandler(handler)

# Modify the Redis setup
redis_url = app.config['REDIS_URL']
if redis_url == 'local':
    redis_client = None
else:
    try:
        # Create a custom SSL context
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        # Use from_url to handle the Redis connection with custom SSL context
        redis_client = redis.from_url(redis_url, ssl=True, ssl_cert_reqs='none', ssl_context=ssl_context)
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.error(f"Error connecting to Redis: {e}")
        redis_client = None

# Ensure the limiter uses the same Redis client
if redis_client:
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=redis_url,
        storage_options={'connection_class': redis.StrictRedis, 'ssl': True, 'ssl_cert_reqs': 'none', 'ssl_context': ssl_context}
    )
else:
    limiter = Limiter(
        app=app,
        key_func=get_remote_address
    )

# Integrate WhiteNoise to serve static files in production
if config_name == 'production':
    from whitenoise import WhiteNoise
    app.wsgi_app = WhiteNoise(app.wsgi_app, root='static/')

def handle_error(error):
    error_message = str(error)
    stack_trace = traceback.format_exc()
    logger.error(f"Error: {error_message}\nStack trace: {stack_trace}")
    return make_response(jsonify({"error": error_message}), 500)

@app.errorhandler(Exception)
def handle_exception(e):
    return handle_error(e)

@cache.memoize(timeout=3600)  # Cache
def cached_complete_bitcoin_data(ma=7):
    return complete_bitcoin_data(ma)

@cache.memoize(timeout=3600)  # Cache
def cached_obstacles_data(drawdown_percentage=0.1):
    return obstacles_drawdowns_weekly(drawdown_percentage)

@cache.memoize(timeout=3600)  # Cache
def cached_bitcoin_events():
    return get_bitcoin_events()

@app.route('/')
def index():
    return render_template('index.html')  # This serves the landing page

@app.route('/game')
def game():
    return render_template('game.html')  # This will serve the Phaser game

@app.route('/terrain_data')
@cache.cached(timeout=3600)  # Cache for 1 hour
def terrain_data():
    try:
        # Use the cached function instead
        df = cached_complete_bitcoin_data(ma=7)

        # Select relevant columns
        df_selected = df[['date_unix', 'ma_7']].copy()
        df_selected.loc[:, 'ma_7'] = df_selected['ma_7'].round(3)

        # Convert the DataFrame to a list of dictionaries
        data = df_selected.to_dict(orient='records')

        response = jsonify(data)
        response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
        return response
    except Exception as e:
        return handle_error(e)

@app.route('/obstacles_data')
def obstacles_data():
    try:
        # Use the cached function
        df = cached_obstacles_data()

        # Select relevant columns
        df_selected = df[['drawdown_date_unix', 'drawdown_price', 'drawdown']]

        # Convert the DataFrame to a list of dictionaries
        data = df_selected.to_dict(orient='records')

        return jsonify(data)
    except Exception as e:
        return handle_error(e)

@app.route('/bitcoin_events')
def bitcoin_events():
    try:
        # Use the cached function instead of calling directly
        df = cached_bitcoin_events()
        
        # Select the required columns
        df_selected = df[['event', 'impact', 'date_unix']]
        
        # Convert the DataFrame to a list of dictionaries
        data = df_selected.to_dict(orient='records')
        
        return jsonify(data)
    except Exception as e:
        return handle_error(e)

# Global constant for the number of enemies
NUM_ENEMIES = 60

@app.route('/enemies_data')
def enemies_data():
    try:
        # Use the cached complete Bitcoin data
        df = cached_complete_bitcoin_data(ma=7)

        # Get random rows using the new function
        random_df = get_random_bitcoin_data(df=df, n=NUM_ENEMIES)

        # Select relevant columns
        df_selected = random_df[['date_unix', 'ma_7']]

        # Convert the DataFrame to a list of dictionaries
        data = df_selected.to_dict(orient='records')

        return jsonify(data)
    except Exception as e:
        return handle_error(e)

def clear_cache_daily():
    try:
        cache.delete_memoized(cached_complete_bitcoin_data)
        cache.delete_memoized(cached_obstacles_data)
        logger.info("Cache cleared successfully")
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")

@app.before_request
def before_request():
    try:
        last_update = cache.get('last_update')
        now = datetime.now(timezone.utc)
        if last_update is None or now - last_update > timedelta(days=1):
            clear_cache_daily()
            cache.set('last_update', now)
    except Exception as e:
        logger.error(f"Error in before_request: {str(e)}")

@app.route('/clear_cache', methods=['POST'])
def manual_clear_cache():
    clear_cache_daily()
    return jsonify({'message': 'Cache cleared successfully'}), 200

@app.route('/static/<path:path>')
def send_static(path):
    try:
        return send_from_directory('static', path)
    except Exception as e:
        logger.error(f"Error serving static file: {str(e)}")
        return make_response(jsonify({"error": "File not found"}), 404)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

# For database integration and leaderboard feature
# Route to submit a score
@app.route('/submit_score', methods=['POST'])
@limiter.limit("5 per minute")
def submit_score():
    try:
        data = request.get_json()
        player_name = data.get('player_name')
        score = data.get('score')
        hodl = data.get('hodl', False)

        # Validate player_name
        if not player_name or not isinstance(player_name, str) or len(player_name) > 50:
            return jsonify({'error': 'Invalid player name'}), 400
        
        # Validate score
        if not isinstance(score, int) or score < 0:
            return jsonify({'error': 'Invalid score'}), 400

        # Validate hodl
        if not isinstance(hodl, bool):
            return jsonify({'error': 'Invalid hodl value'}), 400

        # Create new leaderboard entry
        new_entry = LeaderboardEntry(player_name=player_name, score=score, hodl=hodl)
        db.session.add(new_entry)
        db.session.commit()

        return jsonify({'message': 'Score submitted successfully'}), 201
    except Exception as e:
        app.logger.error(f"Error submitting score: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# Route to get the leaderboard
@app.route('/leaderboard')
def leaderboard():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    sort_by = request.args.get('sort_by', 'score')
    order = request.args.get('order', 'desc')

    query = LeaderboardEntry.query

    if sort_by == 'date':
        query = query.order_by(LeaderboardEntry.timestamp.desc() if order == 'desc' else LeaderboardEntry.timestamp.asc())
    else:
        query = query.order_by(LeaderboardEntry.score.desc() if order == 'desc' else LeaderboardEntry.score.asc())

    paginated_entries = query.paginate(page=page, per_page=per_page, error_out=False)

    leaderboard_data = [
        {
            'player_name': entry.player_name,
            'score': entry.score,
            'hodl': entry.hodl,
            'timestamp': entry.timestamp.isoformat()
        } for entry in paginated_entries.items
    ]

    return jsonify({
        'entries': leaderboard_data,
        'total_pages': paginated_entries.pages,
        'current_page': page
    })

@app.route('/test_redis')
def test_redis():
    if redis_client:
        try:
            redis_client.set('test_key', 'test_value')
            value = redis_client.get('test_key')
            return jsonify({'redis_test': value.decode('utf-8')})
        except Exception as e:
            return jsonify({'error': f"Redis error: {str(e)}"}), 500
    else:
        return jsonify({'message': 'Using local development mode without Redis.'})

if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'])

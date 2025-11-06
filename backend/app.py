"""Simple Flask backend for Oasis frontend.

Endpoints:
- GET /api/songs -> returns list of songs from the `music_streaming` database
- GET /media/<path:filename> -> serves static media files from backend/media

Configuration is read from environment variables or a .env file (see .env.example).
"""
import os
from flask import Flask, jsonify, send_from_directory, abort
from flask_cors import CORS
from dotenv import load_dotenv

import mysql.connector
from mysql.connector import pooling
import uuid
from flask import request

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, '.env'))

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'music_streaming')
# Port for the Flask dev server (default 5001 to avoid conflicts with services on 5000)
SERVER_PORT = int(os.getenv('PORT', os.getenv('FLASK_PORT', 5001)))

app = Flask(__name__)
CORS(app)

def make_pool():
    return pooling.MySQLConnectionPool(
        pool_name='oasis_pool',
        pool_size=5,
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4'
    )


POOL = make_pool()
TOKENS = {}


@app.get('/')
def health():
    return jsonify({'status': 'ok', 'db': DB_NAME})


@app.get('/api/songs')
def api_songs():
    """Return songs with artist and album metadata as JSON.

    The query aggregates artists (if any) and returns duration in seconds.
    """
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        query = '''
     SELECT s.song_id,
         s.title,
         s.file_url,
         s.language,
         TIME_TO_SEC(s.duration) AS duration_seconds,
         al.title AS album,
         al.cover_url AS album_cover_url,
         -- concat all artist names (main artists first) and also expose the first artist as `artist`
         GROUP_CONCAT(DISTINCT ar.name ORDER BY CASE WHEN sa.role = 'main' THEN 0 ELSE 1 END SEPARATOR ', ') AS artists,
         SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT ar.name ORDER BY CASE WHEN sa.role = 'main' THEN 0 ELSE 1 END SEPARATOR ', '), ', ', 1) AS artist
        FROM Songs s
        LEFT JOIN Albums al ON s.album_id = al.album_id
        LEFT JOIN Song_Artists sa ON s.song_id = sa.song_id
        LEFT JOIN Artists ar ON sa.artist_id = ar.artist_id
        GROUP BY s.song_id
        ORDER BY s.song_id;
        '''
        cur.execute(query)
        rows = cur.fetchall()
        # Clean up results: None -> '' for artists
        for r in rows:
            if r.get('artists') is None:
                r['artists'] = ''
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


@app.post('/api/login')
def api_login():
    """Simple login endpoint. Development-only password check: compares provided password to password_hash field.

    Returns a short-lived token that the frontend should send in Authorization: Bearer <token>.
    """
    data = request.get_json(force=True) or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400

    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute('SELECT user_id, username, password_hash FROM Users WHERE username = %s OR email = %s', (username, username))
        user = cur.fetchone()
        if not user:
            return jsonify({'error': 'invalid credentials'}), 401
        # Development: plain equality. In production, use hashed passwords and secure checks.
        if password != user.get('password_hash'):
            return jsonify({'error': 'invalid credentials'}), 401

        token = uuid.uuid4().hex
        TOKENS[token] = user['user_id']
        return jsonify({'token': token, 'user_id': user['user_id'], 'username': user['username']})
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


def get_user_id_from_token(req):
    auth = req.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        t = auth.split(' ', 1)[1].strip()
        return TOKENS.get(t)
    return None


@app.post('/api/history')
def api_history():
    """Record a listening event. Requires Authorization Bearer token or user_id in body (token preferred).
    Body: { song_id: int, device: str (optional) }
    """
    user_id = get_user_id_from_token(request)
    data = request.get_json(force=True) or {}
    if not user_id and data.get('user_id'):
        user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401

    song_id = data.get('song_id')
    device = data.get('device')
    if not song_id:
        return jsonify({'error': 'song_id required'}), 400

    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        
        # Check user's streaming status
        cur.execute('''
            SELECT subscription_type, songs_streamed, is_allowed_to_stream 
            FROM Users 
            WHERE user_id = %s
        ''', (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'user not found'}), 404
        
        # If user is on free tier, check streaming limits
        if user['subscription_type'] == 'free':
            if not user['is_allowed_to_stream']:
                return jsonify({
                    'error': 'streaming_limit_exceeded',
                    'message': 'Daily streaming limit reached'
                }), 403
            
            if user['songs_streamed'] >= 10:
                return jsonify({
                    'error': 'streaming_limit_exceeded',
                    'message': 'Daily streaming limit reached'
                }), 403

        # Record the stream
        cur.execute('INSERT INTO Listening_History (user_id, song_id, device) VALUES (%s, %s, %s)', 
                   (user_id, song_id, device))
        
        # The trigger will handle updating songs_streamed and is_allowed_to_stream
        conn.commit()
        
        # Return updated streaming counts for free users
        if user['subscription_type'] == 'free':
            cur.execute('''
                SELECT songs_streamed, is_allowed_to_stream, 
                       (10 - songs_streamed) as songs_remaining
                FROM Users 
                WHERE user_id = %s
            ''', (user_id,))
            stats = cur.fetchone()
            return jsonify({
                'ok': True,
                'streaming_stats': stats
            }), 201
        
        return jsonify({'ok': True}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


@app.post('/api/playlists')
def api_create_playlist():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    data = request.get_json(force=True) or {}
    title = data.get('title')
    description = data.get('description')
    is_public = 1 if data.get('is_public', True) else 0
    if not title:
        return jsonify({'error': 'title required'}), 400
    conn = POOL.get_connection()
    try:
        cur = conn.cursor()
        cur.execute('INSERT INTO Playlists (user_id, title, description, is_public) VALUES (%s, %s, %s, %s)', (user_id, title, description, is_public))
        conn.commit()
        pid = cur.lastrowid
        return jsonify({'playlist_id': pid}), 201
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


@app.get('/api/playlists')
def api_list_playlists():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute('SELECT playlist_id, title, description, is_public, date_created FROM Playlists WHERE user_id = %s', (user_id,))
        pls = cur.fetchall()
        # fetch songs for each playlist
        for p in pls:
            cur2 = conn.cursor(dictionary=True)
            cur2.execute('SELECT s.song_id, s.title, s.file_url FROM Playlist_Songs ps JOIN Songs s ON ps.song_id = s.song_id WHERE ps.playlist_id = %s', (p['playlist_id'],))
            p['songs'] = cur2.fetchall()
            cur2.close()
        return jsonify(pls)
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

@app.get('/api/user/profile')
def api_get_profile():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        
        # Get user details including streaming limits
        cur.execute('''
            SELECT 
                username, email, subscription_type, date_joined,
                songs_streamed, is_allowed_to_stream,
                (10 - songs_streamed) as songs_remaining
            FROM Users 
            WHERE user_id = %s
        ''', (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'user not found'}), 404
        
        # Get playlist count
        cur.execute('SELECT COUNT(*) as count FROM Playlists WHERE user_id = %s', (user_id,))
        playlists = cur.fetchone()
        user['total_playlists'] = playlists['count'] if playlists else 0
        
        # Get liked songs count
        cur.execute('SELECT COUNT(*) as count FROM Likes WHERE user_id = %s', (user_id,))
        likes = cur.fetchone()
        user['songs_liked'] = likes['count'] if likes else 0
        
        # Get total streams count
        cur.execute('SELECT COUNT(*) as count FROM Listening_History WHERE user_id = %s', (user_id,))
        streams = cur.fetchone()
        user['total_streams'] = streams['count'] if streams else 0
        
        return jsonify(user)
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()
  

@app.post('/api/playlists/<int:pid>/songs')
def api_add_song_to_playlist(pid):
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    data = request.get_json(force=True) or {}
    song_id = data.get('song_id')
    if not song_id:
        return jsonify({'error': 'song_id required'}), 400
    conn = POOL.get_connection()
    try:
        cur = conn.cursor()
        # verify playlist belongs to user
        cur.execute('SELECT user_id FROM Playlists WHERE playlist_id = %s', (pid,))
        row = cur.fetchone()
        if not row or row[0] != user_id:
            return jsonify({'error': 'not allowed'}), 403
        cur.execute('INSERT INTO Playlist_Songs (playlist_id, song_id) VALUES (%s, %s)', (pid, song_id))
        conn.commit()
        return jsonify({'ok': True}), 201
    except mysql.connector.errors.IntegrityError:
        return jsonify({'error': 'already exists'}), 409
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

@app.delete('/api/playlists/<int:pid>/songs/<int:sid>')
def api_remove_song_from_playlist(pid, sid):
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor()
        # verify playlist belongs to user
        cur.execute('SELECT user_id FROM Playlists WHERE playlist_id = %s', (pid,))
        row = cur.fetchone()
        if not row or row[0] != user_id:
            return jsonify({'error': 'not allowed'}), 403
            
        cur.execute('DELETE FROM Playlist_Songs WHERE playlist_id = %s AND song_id = %s', (pid, sid))
        conn.commit()
        return jsonify({'ok': True}), 200
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

@app.delete('/api/playlists/<int:pid>')
def api_delete_playlist(pid):
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor()
        # verify playlist belongs to user
        cur.execute('SELECT user_id FROM Playlists WHERE playlist_id = %s', (pid,))
        row = cur.fetchone()
        if not row or row[0] != user_id:
            return jsonify({'error': 'not allowed'}), 403
            
        # Delete the playlist (cascade will handle playlist_songs)
        cur.execute('DELETE FROM Playlists WHERE playlist_id = %s AND user_id = %s', (pid, user_id))
        conn.commit()
        return jsonify({'ok': True}), 200
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


@app.get('/media/<path:filename>')
def media(filename):
    """Serve media files placed in backend/media directory.

    If you store audio files elsewhere, set MEDIA_DIR env var to a path
    relative to the backend folder.
    """
    media_dir = os.getenv('MEDIA_DIR', 'media')
    media_path = os.path.join(BASE_DIR, media_dir)
    if not os.path.isdir(media_path):
        abort(404, description=f'Media directory not found: {media_path}')
    return send_from_directory(media_path, filename)


if __name__ == '__main__':
    # Development server
    app.run(host='0.0.0.0', port=SERVER_PORT, debug=True)

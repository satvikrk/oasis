"""Simple Flask backend for Oasis frontend.

Endpoints:
- GET /api/songs -> returns list of songs from the `music_streaming` database
- GET /media/<path:filename> -> serves static media files from backend/media

Configuration is read from environment variables or a .env file (see .env.example).
"""
import os
from flask import Flask, jsonify, send_from_directory, abort, make_response
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

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
# allow cookies to be sent if the frontend uses the cookie token flow
CORS(app, supports_credentials=True)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'media')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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


@app.post('/api/admin/users')
def admin_create_user():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401

    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # verify admin
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        u = cur.fetchone()
        if not u or not u.get('is_admin'):
            return jsonify({'error': 'not authorized'}), 403

        data = request.get_json(force=True) or {}
        required = ['username', 'email', 'password']
        if not all(field in data for field in required):
            return jsonify({'error': 'missing required fields'}), 400

        subscription_type = data.get('subscription_type', 'free')
        is_admin_flag = bool(data.get('is_admin'))

        cur.execute('INSERT INTO Users (username, email, password_hash, country, subscription_type, is_admin) VALUES (%s,%s,%s,%s,%s,%s)',
                    (data['username'], data['email'], data['password'], data.get('country'), subscription_type, is_admin_flag))
        conn.commit()
        return jsonify({'ok': True, 'user_id': cur.lastrowid}), 201
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


@app.delete('/api/admin/songs/<int:sid>')
def admin_delete_song(sid):
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401

    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # verify admin
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        u = cur.fetchone()
        if not u or not u.get('is_admin'):
            return jsonify({'error': 'not authorized'}), 403

        cur.execute('DELETE FROM Songs WHERE song_id = %s', (sid,))
        conn.commit()
        return jsonify({'ok': True}), 200
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
        # include is_admin so frontend can know admin status at login
        cur.execute('SELECT user_id, username, password_hash, is_admin FROM Users WHERE username = %s OR email = %s', (username, username))
        user = cur.fetchone()
        if not user:
            return jsonify({'error': 'invalid credentials'}), 401
        # Development: plain equality. In production, use hashed passwords and secure checks.
        if password != user.get('password_hash'):
            return jsonify({'error': 'invalid credentials'}), 401

        token = uuid.uuid4().hex
        TOKENS[token] = user['user_id']
        # Return token and admin flag in JSON and also set a non-HttpOnly cookie so browser <audio>
        # elements can include the token automatically if the frontend prefers that flow.
        resp = make_response(jsonify({
            'token': token,
            'user_id': user['user_id'],
            'username': user['username'],
            'is_admin': bool(user.get('is_admin'))
        }))
        # Development defaults: not secure, SameSite Lax to allow basic local dev flows.
        resp.set_cookie('token', token, httponly=False, samesite='Lax', max_age=3600)
        return resp
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
    # also accept token via query parameter (useful for <audio src="/media/...?token=...")
    t = req.args.get('token')
    if t:
        return TOKENS.get(t)
    # also accept token via cookie (frontend may set cookie on login)
    t = req.cookies.get('token')
    if t:
        return TOKENS.get(t)
    return None


@app.post('/api/history')
def api_history():
    """Record a listening event. Requires Authorization Bearer token.
    Body: { song_id: int, device: str (optional) }
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
        
    data = request.get_json(force=True) or {}

    song_id = data.get('song_id')
    device = data.get('device')
    if not song_id:
        return jsonify({'error': 'song_id required'}), 400

    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        
        # First check if user is allowed to stream
        cur.execute('SELECT is_allowed_to_stream FROM Users WHERE user_id = %s', (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'user not found'}), 404
            
        if not user['is_allowed_to_stream']:
            return jsonify({
                'error': 'streaming_not_allowed',
                'message': 'You have reached your daily streaming limit'
            }), 403

        # User is allowed to stream, record it
        cur.execute('INSERT INTO Listening_History (user_id, song_id, device) VALUES (%s, %s, %s)', 
                   (user_id, song_id, device))
        conn.commit()
        
        # Get updated stats after trigger has run
        cur.execute('''
            SELECT songs_streamed, is_allowed_to_stream,
                   CASE 
                       WHEN subscription_type = 'free' THEN (10 - songs_streamed)
                       ELSE NULL 
                   END as songs_remaining
            FROM Users 
            WHERE user_id = %s
        ''', (user_id,))
        stats = cur.fetchone()
        
        return jsonify({
            'ok': True,
            'streaming_stats': stats
        }), 201
        
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

@app.get('/api/user/detailed-stats')
def get_user_stats():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        # Use a dictionary cursor so stored_results returns dict rows
        cur = conn.cursor(dictionary=True)
        cur.callproc('get_user_listening_stats', [user_id])

        stats_row = None
        # proc results are available via stored_results()
        for res in cur.stored_results():
            rows = res.fetchall()
            if rows:
                # take the first row (procedure returns single row grouped by user)
                stats_row = rows[0]
                break

        cur.close()

        if stats_row:
            stats = {
                'unique_songs_played': stats_row.get('unique_songs_played') or 0,
                'total_plays': stats_row.get('total_plays') or 0,
                'total_listening_time': str(stats_row.get('total_listening_time')) if stats_row.get('total_listening_time') else '0:00:00',
                'languages_listened': stats_row.get('languages_listened'),
                'playlist_count': stats_row.get('playlist_count') or 0,
                'likes_count': stats_row.get('likes_count') or 0
            }
            return jsonify(stats)
        else:
            return jsonify({
                'unique_songs_played': 0,
                'total_plays': 0,
                'total_listening_time': '0:00:00',
                'languages_listened': None,
                'playlist_count': 0,
                'likes_count': 0
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
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


# Admin endpoints
@app.get('/api/admin/verify')
def admin_verify():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        user = cur.fetchone()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'not authorized'}), 403
            
        return jsonify({'ok': True})
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

@app.get('/api/admin/users')
def admin_list_users():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # First verify admin status
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        user = cur.fetchone()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'not authorized'}), 403
            
        # Get all users
        cur.execute('''
            SELECT user_id, username, email, subscription_type, 
                   date_joined, is_admin, songs_streamed
            FROM Users
        ''')
        users = cur.fetchall()
        return jsonify(users)
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

@app.patch('/api/admin/users/<int:uid>')
def admin_update_user(uid):
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # First verify admin status
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        user = cur.fetchone()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'not authorized'}), 403
            
        data = request.get_json(force=True) or {}
        allowed_updates = {
            'subscription_type': ['free', 'premium'],
            'is_admin': [True, False]
        }
        
        updates = []
        values = []
        for field, allowed_values in allowed_updates.items():
            if field in data and data[field] in allowed_values:
                updates.append(f"{field} = %s")
                values.append(data[field])
        
        if not updates:
            return jsonify({'error': 'no valid updates'}), 400
            
        values.append(uid)  # for WHERE clause
        query = f"UPDATE Users SET {', '.join(updates)} WHERE user_id = %s"
        cur.execute(query, values)
        conn.commit()
        
        return jsonify({'ok': True})
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

@app.post('/api/admin/songs')
def admin_add_song():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # First verify admin status
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        user = cur.fetchone()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'not authorized'}), 403
            
        data = request.get_json(force=True) or {}
        required = ['title', 'duration', 'language', 'file_url']
        if not all(field in data for field in required):
            return jsonify({'error': 'missing required fields'}), 400

        # Determine album_id: accept explicit album_id or create/find by album_name
        album_id = data.get('album_id')
        album_name = data.get('album_name')
        album_release_date = data.get('album_release_date')
        album_genre = data.get('album_genre')

        if album_id in ('', 'null'):
            album_id = None
        elif album_id is not None:
            try:
                album_id = int(album_id)
            except (ValueError, TypeError):
                return jsonify({'error': 'invalid album_id'}), 400

        if not album_id and album_name:
            # try to find existing album by title
            cur.execute('SELECT album_id FROM Albums WHERE title = %s LIMIT 1', (album_name,))
            arow = cur.fetchone()
            if arow and arow.get('album_id'):
                album_id = arow['album_id']
            else:
                # create new album
                cur.execute('INSERT INTO Albums (title, release_date, genre) VALUES (%s, %s, %s)',
                            (album_name, album_release_date or None, album_genre or None))
                album_id = cur.lastrowid

        # Insert song
        query = '''
            INSERT INTO Songs (title, duration, language, file_url, album_id) 
            VALUES (%s, %s, %s, %s, %s)
        '''
        values = (
            data['title'],
            data['duration'],
            data['language'],
            data['file_url'],
            album_id
        )

        cur.execute(query, values)
        song_id = cur.lastrowid

        # Handle artist(s): accept comma-separated artist_name(s)
        artist_names = data.get('artist_name')
        if artist_names:
            # split by comma to support multiple artists
            names = [n.strip() for n in artist_names.split(',') if n.strip()]
            for idx, name in enumerate(names):
                # find or create artist
                cur.execute('SELECT artist_id FROM Artists WHERE name = %s LIMIT 1', (name,))
                a = cur.fetchone()
                if a and a.get('artist_id'):
                    artist_id = a['artist_id']
                else:
                    cur.execute('INSERT INTO Artists (name) VALUES (%s)', (name,))
                    artist_id = cur.lastrowid

                # insert into Song_Artists; role main for first artist, featured for others
                role = 'main' if idx == 0 else 'featured'
                try:
                    cur.execute('INSERT INTO Song_Artists (song_id, artist_id, role) VALUES (%s, %s, %s)',
                                (song_id, artist_id, role))
                except mysql.connector.errors.IntegrityError:
                    # ignore duplicates
                    pass

        conn.commit()

        return jsonify({
            'ok': True,
            'song_id': song_id
        }), 201
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()

@app.post('/api/admin/upload')
def admin_upload_file():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # First verify admin status
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        user = cur.fetchone()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'not authorized'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'no file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'no file selected'}), 400
            
        if file:
            filename = secure_filename(file.filename)
            # Save to media directory
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return jsonify({'url': f'/media/{filename}'})
            
        return jsonify({'error': 'file upload failed'}), 500
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
    # require authentication: accept token via Authorization header, ?token= or cookie
    user_id = get_user_id_from_token(request)
    if not user_id:
        abort(401, description='authentication required')

    media_dir = os.getenv('MEDIA_DIR', 'media')
    media_path = os.path.join(BASE_DIR, media_dir)
    if not os.path.isdir(media_path):
        abort(404, description=f'Media directory not found: {media_path}')
    return send_from_directory(media_path, filename)


## Analytics endpoints (admin-only)
@app.get('/api/admin/analytics/top-artists')
def analytics_top_artists():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # check admin
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        u = cur.fetchone()
        if not u or not u.get('is_admin'):
            return jsonify({'error': 'not authorized'}), 403
        cur.execute('''
            SELECT ar.artist_id, ar.name AS artist_name, COUNT(l.history_id) AS play_count
            FROM Listening_History l
            JOIN Songs s ON l.song_id = s.song_id
            JOIN Song_Artists sa ON s.song_id = sa.song_id
            JOIN Artists ar ON sa.artist_id = ar.artist_id
            GROUP BY ar.artist_id, ar.name
            ORDER BY play_count DESC
            LIMIT 25
        ''')
        rows = cur.fetchall()
        return jsonify(rows)
    finally:
        try: cur.close()
        except: pass
        conn.close()


@app.get('/api/admin/analytics/top-albums')
def analytics_top_albums():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        u = cur.fetchone()
        if not u or not u.get('is_admin'):
            return jsonify({'error': 'not authorized'}), 403
        cur.execute('''
            SELECT al.album_id, al.title AS album_title, al.release_date, COUNT(l.history_id) AS play_count
            FROM Listening_History l
            JOIN Songs s ON l.song_id = s.song_id
            JOIN Albums al ON s.album_id = al.album_id
            GROUP BY al.album_id, al.title, al.release_date
            ORDER BY play_count DESC
            LIMIT 25
        ''')
        rows = cur.fetchall()
        return jsonify(rows)
    finally:
        try: cur.close()
        except: pass
        conn.close()


@app.get('/api/admin/analytics/active-users')
def analytics_active_users():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        u = cur.fetchone()
        if not u or not u.get('is_admin'):
            return jsonify({'error': 'not authorized'}), 403
        cur.execute('''
            SELECT u.user_id, u.username,
                COUNT(l.history_id) AS total_plays_last_7_days,
                COUNT(DISTINCT l.song_id) AS unique_songs_last_7_days
            FROM Users u
            LEFT JOIN Listening_History l ON u.user_id = l.user_id AND l.listened_at >= NOW() - INTERVAL 7 DAY
            GROUP BY u.user_id, u.username
            HAVING total_plays_last_7_days > 0
            ORDER BY total_plays_last_7_days DESC
            LIMIT 100
        ''')
        rows = cur.fetchall()
        return jsonify(rows)
    finally:
        try: cur.close()
        except: pass
        conn.close()


@app.get('/api/admin/analytics/recent-songs')
def analytics_recent_songs():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        u = cur.fetchone()
        if not u or not u.get('is_admin'):
            return jsonify({'error': 'not authorized'}), 403
        cur.execute('''
            SELECT s.song_id, s.title, s.file_url, TIME_FORMAT(s.duration, '%H:%i:%s') AS duration, s.language,
                   al.album_id, al.title AS album_title, al.release_date AS album_release_date, al.cover_url AS album_cover_url,
                   SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT ar.name ORDER BY CASE WHEN sa.role = 'main' THEN 0 ELSE 1 END SEPARATOR ', '), ', ', 1) AS main_artist,
                   GROUP_CONCAT(DISTINCT ar.name ORDER BY CASE WHEN sa.role = 'main' THEN 0 ELSE 1 END SEPARATOR ', ') AS all_artists
            FROM Songs s
            LEFT JOIN Albums al ON s.album_id = al.album_id
            LEFT JOIN Song_Artists sa ON s.song_id = sa.song_id
            LEFT JOIN Artists ar ON sa.artist_id = ar.artist_id
            GROUP BY s.song_id
            ORDER BY s.song_id DESC
            LIMIT 100
        ''')
        rows = cur.fetchall()
        return jsonify(rows)
    finally:
        try: cur.close()
        except: pass
        conn.close()


@app.get('/api/admin/analytics/genre-language')
def analytics_genre_language():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
        u = cur.fetchone()
        if not u or not u.get('is_admin'):
            return jsonify({'error': 'not authorized'}), 403
        cur.execute('''
            SELECT COALESCE(al.genre, 'unknown') AS album_genre,
                   COALESCE(s.language, 'unknown') AS song_language,
                   COUNT(s.song_id) AS song_count
            FROM Songs s
            LEFT JOIN Albums al ON s.album_id = al.album_id
            GROUP BY COALESCE(al.genre, 'unknown'), COALESCE(s.language, 'unknown')
            ORDER BY song_count DESC
        ''')
        rows = cur.fetchall()
        return jsonify(rows)
    finally:
        try: cur.close()
        except: pass
        conn.close()


# Endpoint that returns the playlist song count using the stored function
@app.get('/api/playlist/<int:pid>/count')
def playlist_song_count(pid):
    user_id = get_user_id_from_token(request)
    if not user_id:
        return jsonify({'error': 'authentication required'}), 401
    conn = POOL.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        # allow owners of the playlist or admins
        cur.execute('SELECT user_id FROM Playlists WHERE playlist_id = %s', (pid,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'playlist not found'}), 404
        owner_id = row.get('user_id')
        # if not owner, ensure admin
        if owner_id != user_id:
            cur.execute('SELECT is_admin FROM Users WHERE user_id = %s', (user_id,))
            u = cur.fetchone()
            if not u or not u.get('is_admin'):
                return jsonify({'error': 'not authorized'}), 403
        # compute playlist count directly (fallback if stored function not present)
        cur.execute('SELECT COUNT(*) AS cnt FROM Playlist_Songs WHERE playlist_id = %s', (pid,))
        res = cur.fetchone()
        cnt = res.get('cnt') if res else 0
        return jsonify({'playlist_id': pid, 'song_count': cnt})
    finally:
        try: cur.close()
        except: pass
        conn.close()


if __name__ == '__main__':
    # Development server
    app.run(host='0.0.0.0', port=SERVER_PORT, debug=True)

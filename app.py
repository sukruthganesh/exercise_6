import string
import random
from datetime import datetime
from flask import Flask, g
from functools import wraps

from flask import *
import sqlite3

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u

def get_user_from_cookie(request):
    user_id = request.cookies.get('user_id')
    password = request.cookies.get('user_password')
    if user_id and password:
        return query_db('select * from users where id = ? and password = ?', [user_id, password], one=True)
    return None

# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/room')
@app.route('/room/<chat_id>')
def index(chat_id=None):
    return app.send_static_file('index.html')

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404

def validate_api_key(req):
    api_key = req.headers['Api-Key']
    if api_key:
        return query_db('select * from users where api_key = ?', [api_key], one=True)
    return None


# -------------------------------- API ROUTES ----------------------------------

# TODO: Create the API

# @app.route('/api/signup')
# def login():
#   ...


# @app.route('/api/login')
# def login():
#   ... 

# ... etc

# POST to change the user's name


@app.route('/api/rooms/new', methods=['GET', 'POST'])
def create_room():
    user = validate_api_key(request)
    
    if user:
        if request.method == 'POST':
            name = "Unnamed Room " + ''.join(random.choices(string.digits, k=6))
            room = query_db('insert into rooms (name) values (?) returning id', [name], one=True)            
            return {'room_id': room["id"]}
    else:
        return app.send_static_file('401.html'), 401
        
@app.route('/api/login', methods = ['POST'])
def login():
    if request.method == 'POST':
        name = request.headers['userName']
        password = request.headers['password']
        user = query_db('select id, api_key, name from users where name = ? and password = ?', [name, password], one=True)
        if not user:
            return {'api_key': ''}
        return {'api_key': user[1], 'user_id': user[0], 'user_name': user[2]}
    return {'api_key': ''}


@app.route('/api/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        u = new_user()

        return {'api_key': u['api_key'], 'user_id': u['id'], 'user_name': u['name']}
    
    return {'Status: Unable to create the user!'}, 401


@app.route('/api/user/name', methods=['POST'])
def change_username():
    user = validate_api_key(request)
    if user:
        if request.method == 'POST':
            update_user = query_db('update users set name = ? where api_key = ? returning id, name', 
                [request.args['user_name'], request.headers['Api-Key']],
                one=True
            )
            return {'name': update_user['name']}
    else:
        return app.send_static_file('401.html'), 401
    return {}

# POST to change the user's password
@app.route('/api/user/password', methods=['POST'])
def change_password():
    user = validate_api_key(request)
    if user:
        if request.method == 'POST':
            query_db('update users set password = ? where api_key = ?',
                [request.headers['password'], request.headers['Api-Key']],
                one=True
            )
            return {}, 200
    else:
        return app.send_static_file('401.html'), 401
    
    return {'Status': 'Something went wrong!!'}, 403


@app.route('/api/rooms', methods=['GET'])
def get_all_rooms():
    output = {}
    user = validate_api_key(request)
    if user:
        if request.method == 'GET':
            rooms = query_db('select * from rooms')
            
            for msg in rooms:
                output[msg['id']] = {'name': msg['name']}
    else:
        return app.send_static_file('401.html'), 401
    return output, 200

# POST to change the name of a room
@app.route('/api/room/name', methods=['POST'])
def change_room():
    user = validate_api_key(request)
    if user:
        if request.method == 'POST':
            query_db('update rooms set name = ? where id = ?',
                [request.args['name'], request.args['room_id']],
                one=True
            )
            return {}, 200
    else:
        return app.send_static_file('401.html'), 401
    
    return render_template('404.html'), 404

# GET to get all the messages in a room
@app.route('/api/room/messages', methods=['GET'])
def get_chat_messages():
    output = {}
    user = validate_api_key(request)
    if user:
        if request.method == 'GET':
            room_id = request.args['room_id']
            messages = query_db('select msg.id, u.name, msg.body from messages msg, users u '
                        'where msg.room_id = ? and msg.user_id = u.id order by msg.id', [room_id], one=False)
            if not messages:
                return output
            for msg in messages:
                output[msg[0]] = {'id': msg[0], 'name': msg[1], 'body': msg[2]}
        return output, 200
    else:
        return app.send_static_file('401.html'), 401


# POST to post a new message to a room
@app.route('/api/room/new_msg', methods=['POST'])
def post_message():
    user = validate_api_key(request)
    if user:
        if request.method == 'POST':
            query_db('insert into messages (user_id, room_id, body) ' + 'values (?, ?, ?)',
                             [request.headers['User-Id'], request.args['room_id'], request.args['body']], one=True)
            return {'status': 'Success'}, 200
    else:
        return app.send_static_file('401.html'), 401

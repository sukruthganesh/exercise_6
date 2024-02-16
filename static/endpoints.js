const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

const CHANGE_USERNAME = '/api/user/name';
const CHANGE_PASSWORD = '/api/user/password';
const CHANGE_ROOM = '/api/room/name';
const SIGNUP = '/api/signup';
const POST_MESSAGE = '/api/room/new_msg'
const LOGIN_URL = '/api/login';
const NEW_ROOM = '/api/rooms/new';
const ALL_MESSAGES = '/api/room/messages';
const ALL_ROOMS = '/api/rooms';

var rooms = {};
var previousPath = '';
var CURRENT_ROOM = 0;

var getAllChatsDict = {
    room_id: 0
};

var postRequest = {
    room_id: 0,
    body: ''
};

var updateUserNameRequest = {
    user_name: ''   
};

var updatePasswordRequest = {
    password: ''
};

var loginDict = {
    userName: '',
    password: ''
};

var updateRoomRequest = {
    name: '',
    room_id: 0
};

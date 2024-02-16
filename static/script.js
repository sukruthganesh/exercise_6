// Custom validation on the password reset fields
const passwordField = document.querySelector(".profile input[name=password]");
const repeatPasswordField = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password]").value;
  const r = repeatPassword.value;
  return p == r;
};

const checkPasswordRepeat = () => {
  const passwordField = document.querySelector(".profile input[name=password]");
  if(passwordField.value == repeatPasswordField.value) {
    repeatPasswordField.setCustomValidity("");
    return;
  } else {
    repeatPasswordField.setCustomValidity("Password doesn't match");
  }
}

passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);

async function RetrieveMessages(){
  getAllChatsDict.room_id = CURRENT_ROOM;
  let msgs = await CallApi(ALL_MESSAGES, getAllChatsDict, {}, 'GET');
  let chatsMainClass = document.body.querySelector(".messages");
  EmptyTheClass(chatsMainClass);

  Object.keys(msgs).forEach(key => {
    let message = document.createElement("message");
    let author = document.createElement("author");
    author.innerHTML = msgs[key].name;
    let content = document.createElement("content");
    content.innerHTML = msgs[key].body;
    message.appendChild(author);
    message.appendChild(content);
    chatsMainClass.append(message);
  });
}

routePageHelper = (element) => {
  CURRENT_ROOM = 0;
  PROFILE.classList.add('hide');
  LOGIN.classList.add('hide');
  ROOM.classList.add('hide');
  SPLASH.classList.add('hide');
  element.classList.remove('hide');
}

function loggedIn(){
  document.querySelector(".signup").classList.add("hide");
  document.querySelector(".loggedOut").classList.add("hide");
  document.querySelector('.loggedIn').classList.remove("hide");
  document.querySelector('.create').classList.remove("hide");

  let userName = document.getElementsByClassName('username');

  for(let i=0; i < userName.length; i++){
    if(!userName[i].innerHTML.includes("Welcome")){
      console.log(localStorage.getItem('User-Name'));
      userName[i].innerHTML = '<a onclick="updateDetails()" style="text-decoration: underline; cursor: pointer; color: blue;">' + localStorage.getItem('User-Name') + 
      '</a> <a class="logout" onclick="Logout()" style="text-decoration: underline; cursor: pointer;">(logout)</a>'; 
    }
    else {
      userName[i].innerHTML = 'Welcome back, <a onclick="updateDetails()" style="text-decoration: underline; cursor: pointer; color: blue;">' + localStorage.getItem('User-Name') + 
      '</a> <a class="logout" onclick="Logout()" style="text-decoration: underline; cursor: pointer;">(logout)</a>'; 
    }
  }
  let userNameInput = document.querySelector('input[name="username"]');
  userNameInput.value = localStorage.getItem('User-Name');
}

function loggedOut(){
  document.querySelector(".create").classList.add("hide");
  document.querySelector(".loggedIn").classList.add("hide");
  document.querySelector('.loggedOut').classList.remove("hide");
  document.querySelector('.signup').classList.remove("hide");
}

function loadPage(url){
  window.history.pushState(null, null, '/' + url);
  router();
}

function loadRoom(roomId) {
  loadPage("room/" + roomId);
}

async function createNewRoom(){
  let newRoom = await CallApi(NEW_ROOM, {}, {}, 'POST');
  loadPage('room/' + newRoom['room_id']);
}

function toggleEditMode(){
  document.querySelector('.displayRoomName').classList.add('hide');
  document.querySelector('.editRoomName').classList.remove('hide');
}

async function postMessage(body) {
  postRequest.room_id = CURRENT_ROOM;
  postRequest.body = body;
  postMsg = await CallApi(POST_MESSAGE, postRequest, {}, 'POST')
  document.getElementById("commentTA").value = '';
}

async function populateRooms(){
  rooms = await CallApi(ALL_ROOMS, {}, {}, 'GET')
  let chatsMainClass = document.body.querySelector(".roomList");

  EmptyTheClass(chatsMainClass);

  if(Object.keys(rooms).length <= 0){
    document.querySelector('.noRooms').setAttribute("style", "display: block");
  } else {
    document.querySelector('.noRooms').setAttribute("style", "display: none");
  }

  Object.keys(rooms).forEach(key => {
    let msg = document.createElement("a");
    msg.setAttribute("style", "cursor: pointer;")
    msg.setAttribute("onclick", "loadRoom(" + key + ', "' + rooms[key]['name'] + '")');
    msg.innerHTML = key + ': <strong>' + rooms[key]['name'] + "</strong>";
    chatsMainClass.append(msg);
  });
}

async function saveRoomName() {
  updateRoomRequest.name = document.getElementById('roomNameInput').value;
  updateRoomRequest.room_id = CURRENT_ROOM;
  var resp = await CallApi(CHANGE_ROOM, updateRoomRequest, {}, 'POST');
  document.querySelector('.displayRoomName strong').innerHTML = updateRoomRequest.name;
  document.querySelector('.editRoomName').classList.add('hide');
  document.querySelector('.displayRoomName').classList.remove('hide');
}

async function updateDetails(){
  loadPage('profile');
}

let router = async () => {
  let path = window.location.pathname;
  if(localStorage.getItem('Api-Key') == null){
    loggedOut();

    if(path != "/" && path.length > 1){
      splitted = path.split('/');
      previousPath = splitted[1];
      for(var j = 2; j < splitted.length; j++){
        previousPath += '/' + splitted[j];
      }
      window.history.pushState(null, null, '/login');
      path = '/login';
    }
  }
  else{
    loggedIn();

    if(path == "/login"){
      window.history.pushState(null, null, '/');
      path = '/';
    }
  }
  
  // Hide by default
  document.querySelector('.editRoomName').classList.add('hide');
  document.querySelector('.displayRoomName').classList.remove('hide');
  document.querySelector('.login .failed').setAttribute("style", "display: none");

  if(path == "/" || path == "/room") {
    document.title = 'Home';
    routePageHelper(SPLASH);
    if(localStorage.getItem('Api-Key') != null){
      await populateRooms();
    }
  }
  else if(path == "/profile"){
    document.title = 'Signup and Update';
    routePageHelper(PROFILE);
  }
  else if(path.startsWith("/room")) {
    document.title = 'Rooms';
    let paths = path.split('/');

    // URI doesnt contain any room id
    if(paths.length <= 2){
      routePageHelper(SPLASH);
      if(localStorage.getItem('Api-Key') != null){
        await populateRooms();
      }
      return;
    }

    routePageHelper(ROOM);

    CURRENT_ROOM = paths[2];
    document.title = 'Room ' + CURRENT_ROOM;

    await populateRooms();
    document.querySelector('.displayRoomName strong').innerHTML = rooms[CURRENT_ROOM]['name'];
    document.getElementById('roomNameInput').value = rooms[CURRENT_ROOM]['name'];
    document.querySelector('.roomDetail #roomId').innerHTML = '/rooms/' + CURRENT_ROOM;
  }
  else if(path == "/login") {
    document.title = 'Login User';
    routePageHelper(LOGIN);
  } 
  else {
    // We handle unknown paths in app.py itself
    console.log("I don't know how we got to "+path+", but something has gone wrong");
  }
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);

async function startMessagePolling() {
  setInterval(async () => {
    if (CURRENT_ROOM == 0) return;
    await RetrieveMessages();
  }, 500);
  return;
}

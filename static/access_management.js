
async function SignUp() {
    postMsg = await CallApi(SIGNUP, {}, {}, 'POST');
    PersistUser(postMsg);
    loadPage('');
}
  
async function Login(){
    loginDict.userName = document.getElementById('username').value;
    loginDict.password = document.getElementById('password').value;
    let loginUsr = await CallApi(LOGIN_URL, {}, loginDict, 'POST');
    if(loginUsr.api_key.length > 0){
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      PersistUser(loginUsr);
      loadPage(previousPath.length > 0 ? previousPath : '');
      return;
    }

    document.querySelector('.login .failed').setAttribute("style", "display: flex");
}

function Logout(){
    rooms = {};
    let roomsMainClass = document.body.querySelector(".roomList");
    EmptyTheClass(roomsMainClass);
    localStorage.removeItem('Api-Key');
    document.querySelector('.noRooms').setAttribute("style", "display: block");
    loadPage('');
}
  
async function UpdateUsername(){
    updateUserNameRequest.user_name = document.querySelector('input[name="username"]').value;
    postMsg = await CallApi(CHANGE_USERNAME, updateUserNameRequest, {}, 'POST');
    localStorage.setItem('User-Name', postMsg['name']);
    loggedIn();
}

async function UpdatePassword(){
    let password = document.querySelector('input[name="password"]').value;
    let repeatPassword = document.querySelector('input[name="repeatPassword"]').value;
  
    if(password == repeatPassword){
      updatePasswordRequest.password = password;
      postMsg = await CallApi(CHANGE_PASSWORD, {}, updatePasswordRequest, 'POST');
    }
    loggedIn();
}

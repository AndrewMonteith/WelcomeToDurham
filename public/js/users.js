import { SetSessionCookie, ClearSessionCookie, GetSessionCookie, HasSessionCookie } from "./session.js";
import { IsWhitespaceOrEmpty, CreateErrorDialog } from "./utils.js";

// ------------------------------ Error Dialog 
function bindInputInvalidityVisuals(input, errorMsg) {
    const showErrorDialog = CreateErrorDialog(input, errorMsg);

    return isInvalid => {
        showErrorDialog(isInvalid);
        if (isInvalid) {
            input.addClass("is-invalid");
        } else {
            input.removeClass("is-invalid");
        }
    };
}

function watchUsernameInput(input) {
    const makeInputAppearInvalid = bindInputInvalidityVisuals(input, "Username cannot be empty");
    let onValueChanged = () => {
        const isEmpty = IsWhitespaceOrEmpty(input.val());

        makeInputAppearInvalid(isEmpty);
    };

    input.blur(onValueChanged);
}
$('.modal-username').each((_, input) => watchUsernameInput($(input)));

// ---------------------- Navbar Button Changing

const navbarLoginButton = $("#navbar-login"), navbarRegisterButton = $("#navbar-register");

const createNavbarButton = (newId, newText) => {
    const navbarButton = navbarLoginButton.clone();

    navbarButton.attr("id", newId);
    navbarButton.children().removeAttr("data-toggle", "data-target");
    navbarButton.children().text(newText);

    return navbarButton;
};

const navbarMyEvents = createNavbarButton("navbar-my-events", "My Events");
const navbarMakeEvent = createNavbarButton("navbar-create-event", "Start an event");
const navbarLogoutButton = createNavbarButton("navbar-logout-button", "Logout");

function changeNavbarButtons(isLoggedIn) {
    if (isLoggedIn) {
        navbarLoginButton.detach();
        navbarRegisterButton.detach();
        navbarMyEvents.insertAfter($("#navbar-events-on"));
        navbarMakeEvent.insertAfter(navbarMyEvents);
        navbarLogoutButton.insertAfter(navbarMakeEvent);
    } else {
        navbarMyEvents.detach();
        navbarMakeEvent.detach();
        navbarLogoutButton.detach();
        navbarLoginButton.insertAfter($("#navbar-events-on"));
        navbarRegisterButton.insertAfter(navbarLoginButton);
    }
}

// ----------------------- Register Dialog Handler
const registerUsernameInput = $("#register-username");
const registerPasswordInput = $("#register-password");
const registerConfirmPasswordInput = $("#register-confirm-password");

const usernameIsInvalidDialog = CreateErrorDialog(registerUsernameInput,
    "Username must be only letters, numbers and underscores. Must be longer than 3 letters.");
const usernameTakenDialog = CreateErrorDialog(registerUsernameInput,
    "Username already taken");
const passwordNotValidDialog = CreateErrorDialog(registerPasswordInput,
    "Password must contain a capital letter, number and punctuation and be at least 8 characters");
const passwordNotMatching = CreateErrorDialog(registerConfirmPasswordInput,
    "Passwords must be the same");

let isUsernameTaken = false; 

function isValidUsername(username) {
    if (IsWhitespaceOrEmpty(username)) {
        return false;
    }

    if (username.match(/[^a-zA-Z0-9_]/) !== null) {
        return false;
    }

    if (username.length < 3) {
        return false;
    }

    return true;
}

function checkInputUsernameIsntTaken() {
    const inputUsername = registerUsernameInput.val();

    $.get(
        "http://localhost:8081/usernameExists/",
        `username=${inputUsername}`,
        response => {
            isUsernameTaken = response.Message;
            usernameTakenDialog(isUsernameTaken);
        });
}

function usernameInputValueChanged() {
    const username = registerUsernameInput.val();
    
    usernameTakenDialog(false); 
    
    if (IsWhitespaceOrEmpty(username)) {
        usernameIsInvalidDialog(false);
        return;
    }

    const isValid = isValidUsername(username);
    usernameIsInvalidDialog(!isValid);
}
registerUsernameInput.on('input propertychange paste', usernameInputValueChanged);
registerUsernameInput.focusout(checkInputUsernameIsntTaken);

function isValidPassword(password) {
    /*
        - Must contain at least 1:
            - Capital Letter
            - Number
            - Punctuation
        - Be at least 8 letters long.
    */
    if (IsWhitespaceOrEmpty(password)) {
        return false;
    }

    if (password.length < 8) {
        return false;
    }

    const uppercase = /[A-Z]/, lowercase = /[a-z]/, punctuation = /[^a-zA-Z0-9]/;
    return password.match(uppercase) && password.match(lowercase) && password.match(punctuation);
}

function doInputPasswordsMatch() {
    return registerConfirmPasswordInput.val() === registerPasswordInput.val();
}

function updateConfirmPasswordInput(isPasswordValid) {
    if (!isPasswordValid) {
        passwordNotMatching(false); 
        return;
    }

    const matching = doInputPasswordsMatch();
    passwordNotMatching(!matching);
}

function passwordInputChanged() {
    const passwordInput = registerPasswordInput.val();
    if (IsWhitespaceOrEmpty(passwordInput)) {
        passwordNotValidDialog(false);
        return;
    }

    const isPasswordValid = isValidPassword(passwordInput);
    passwordNotValidDialog(!isPasswordValid);
    updateConfirmPasswordInput(isPasswordValid);
}

registerPasswordInput.on('input propertychange paste', passwordInputChanged);
registerConfirmPasswordInput.on('input propertychange paste', passwordInputChanged);

function sendRegisterRequest() {
    const username = registerUsernameInput.val();
    if (!isValidUsername(username)) {
        return;
    }

    const password = registerPasswordInput.val();
    if (!isValidPassword(password)) {
        return;
    }

    if (!doInputPasswordsMatch()) {
        return;
    }

    $.post("http://localhost:8081/register",
        {username: username, password: password})
        .done(data => {
            $("#close-register-dialog").trigger("click");
            loginRequestSucceeded(data); // "Register Succeeded."
        }) 
        .fail(console.log);
}
$("#register-dialog-button").click(sendRegisterRequest);

// ----------------------- Login Dialog Handler

const loginRequestErrorDialog = CreateErrorDialog($("#login-button-contanier"),
    "Username or password was incorrect");

$("#close-login-dialog").click(() => loginRequestErrorDialog(false));

function loginRequestSucceeded(data) {
    $("#close-login-dialog").trigger("click");
    changeNavbarButtons(true);
    SetSessionCookie(data.Token);
}

function loginRequestFailed() {
    loginRequestErrorDialog(true);
}

function makeLoginRequest() {
    $.post(
        "http://localhost:8081/login",
        {
            username: $("#login-username").val(),
            password: $("#login-password").val()
        })
        .done(loginRequestSucceeded)
        .fail(loginRequestFailed);
}

$("#login-button").click(makeLoginRequest);

// -------------------- Logout Button

function MakeLogoutRequest() {
    const sessionCookie = GetSessionCookie();
    ClearSessionCookie();

    $.post(
        "http://localhost:8081/logout",
        { session: sessionCookie }
    );
}

function navbarLogoutButtonClicked() {
    if (!HasSessionCookie()) { return; }

    MakeLogoutRequest();
    changeNavbarButtons(false);
}

navbarLogoutButton.click(navbarLogoutButtonClicked);

// ------------------------ Check Login


function CheckLogin() {
    if (!HasSessionCookie()) { return; }

    // Temporarily remove them until we work out whether to readd them.
    navbarLoginButton.detach();
    navbarRegisterButton.detach();

    const sessionCookie = GetSessionCookie();

    $.get(
        "http://localhost:8081/amILoggedIn",
        `session=${sessionCookie}`,
        data => {
            const isLoggedIn = data.Message;
            console.log("Am I logged in?" + isLoggedIn);
            changeNavbarButtons(isLoggedIn);
            if (!isLoggedIn) {
                ClearSessionCookie();
            }
        }
    );
}

CheckLogin();
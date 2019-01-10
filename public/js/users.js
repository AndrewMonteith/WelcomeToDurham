import { SetSessionCookie, ClearSessionCookie, GetSessionCookie, HasSessionCookie } from "./session.js";
import { IsWhitespaceOrEmpty, CreateErrorDialog, RedirectTo } from "./utils.js";

// ------------------------ Navbar Button
const navbarLoginButton = $("#navbar-login"), navbarRegisterButton = $("#navbar-register");

const createNavbarButton = (newId, newText, href) => {
    const navbarButton = navbarLoginButton.clone();

    if (href !== undefined) {
        navbarButton.click(RedirectTo(href));
    }
    navbarButton.attr("id", newId);
    navbarButton.children().removeAttr("data-toggle", "data-target");
    navbarButton.children().text(newText);

    return navbarButton;
};

const navbarMyEvents = createNavbarButton("navbar-my-events", "My Events", "/my-events.html");
const navbarMakeEvent = createNavbarButton("navbar-create-event", "Start an event", "/new-event.html");
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

// ------------------------------------------- Dialog Validation

function isValidUsername(username) {
    return !IsWhitespaceOrEmpty(username) &&
        !username.match(/[^a-zA-Z0-9_]/) &&
        username.length >= 3;
}

function isValidPassword(password) {
    /*
    - Must contain at least 1:
        - Capital Letter
        - Number
        - Punctuation
    - Be at least 8 letters long.
    */
    const uppercase = /[A-Z]/, lowercase = /[a-z]/, punctuation = /[^a-zA-Z0-9]/;
    
    return !IsWhitespaceOrEmpty(password) && 
        password.length >= 8 && 
        password.match(uppercase) && password.match(lowercase) && password.match(punctuation);
}

function changeInputValidityVisuals(input, valid) {
    if (valid) {
        input.removeClass("is-invalid");
    } else {
        input.addClass("is-invalid");
    }
}

const inputsAreValid = {};
function bindValidatorForInputDialog(id, invalidMsg, validityCallback, eventtype="change") {
    const inputNode = $('#' + id);
    const errorDialog = CreateErrorDialog(inputNode, invalidMsg);

    const updateState = isInputValid => {
        changeInputValidityVisuals(inputNode, isInputValid);
        inputsAreValid[id] = isInputValid;
        errorDialog(!isInputValid);
    };

    inputNode.focusout(() => validityCallback(inputNode.val(), updateState));

    if (eventtype==="change") {
        const onChangeCallback = () => {
            const value = inputNode.val();
            if (IsWhitespaceOrEmpty(value)) {
                updateState(false);
            } else {
                validityCallback(value, updateState);
            }
        };

        inputNode.on('input propertychange paste', onChangeCallback);
    } 
    if (!IsWhitespaceOrEmpty(inputNode.val())) {
        validityCallback(inputNode.val(), updateState) 
    }
}

function getInputValues(...ids) {
    const values = {};

    for (const id of ids) {
        console.log(id);
        if (!inputsAreValid[id]) { return undefined; }

        values[id] = $("#" + id).val();
    }

    return values;
}

const makeSureNotEmpty = (value, isInputValid) => isInputValid(!IsWhitespaceOrEmpty(value));

bindValidatorForInputDialog("register-firstname", "Cannot be empty", makeSureNotEmpty);
bindValidatorForInputDialog("register-secondname", "Cannot be empty", makeSureNotEmpty);

bindValidatorForInputDialog("register-password", "Password must be greater than 8 characters and at least 1: Capital letter, Lowercase letter and Puncation.", 
    (password, isInputValid) => isInputValid(isValidPassword(password)));
bindValidatorForInputDialog("register-confirm-password", "Passwords must match", (confirmPassword, isInputValid) => {
    const password = $("#register-password").val();

    if (IsWhitespaceOrEmpty(password)) {
        isInputValid(true); // Silence whilst they're inputting first password.
    } else {
        isInputValid(password === confirmPassword);
    }
});

function checkUsernameValidity(username, isInputValid) {
    if (IsWhitespaceOrEmpty(username) || !isValidUsername(username)) {
        isInputValid(false);
    } else {
        $.get("http://localhost:8081/usernameExists/",
            { username: username },
            response => isInputValid(!response.Message));
    }
}

bindValidatorForInputDialog("register-username", "Username must be unique and at least 3 letters", 
    checkUsernameValidity, "focuslost");

bindValidatorForInputDialog("login-username", "Username cannot be empty", makeSureNotEmpty);
bindValidatorForInputDialog("login-password", "Password cannot be empty", makeSureNotEmpty);

// --------------------------- Dialog Buttons
const loginFailedDialog = CreateErrorDialog($("#login-button-contanier"),
    "Username or password was incorrect");

function clearInputs(...ids) {
    for (const id of ids) {
        $("#" + id).val('');
    }
}

function loginRequestSucceeded(response) {
    $("#close-login-dialog").trigger("click");
    changeNavbarButtons(true);
    SetSessionCookie(response.Token);
    clearInputs("login-username", "login-password");
}

function loginRequestFailed() {
    loginFailedDialog(true);
}
$("#close-login-dialog").click(() => loginFailedDialog(false));

function makeLoginRequest() {
    const formDetails = getInputValues(
        "login-username", "login-password");
    if (formDetails === undefined) { return; }

    $.post("http://localhost:8081/login",
        {
            username: formDetails["login-username"],
            password: formDetails["login-password"]
        })
        .done(loginRequestSucceeded)
        .fail(loginRequestFailed);
}
$("#login-button").click(makeLoginRequest);

function registerRequestSucceeded(response) {
    $("#close-register-dialog").trigger("click");
    loginRequestSucceeded(response); 
    clearInputs("reigster-firstname", "register-secondname",
        "register-username", "register-password", "register-confirm-password");
}

function makeRegisterRequest() {
    const formDetails = getInputValues(
        "register-firstname", "register-secondname", "register-username", 
        "register-password", "register-confirm-password");
    
    if (formDetails === undefined) { return; }
    
    $.post("http://localhost:8081/register",
        {
            username: formDetails["register-username"],
            password: formDetails["register-password"],
            firstname: formDetails["register-firstname"],
            surname: formDetails["register-secondname"]
        })
        .done(registerRequestSucceeded);
}
$("#register-dialog-button").click(makeRegisterRequest);

// ------------------------- Logout Button

function MakeLogoutRequest() {
    const sessionCookie = GetSessionCookie();
    ClearSessionCookie();

    $.post(
        "http://localhost:8081/logout",
        { Session: sessionCookie }
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
        { Session: sessionCookie },
        data => {
            const isLoggedIn = data.Message;
            changeNavbarButtons(isLoggedIn);
            if (!isLoggedIn) {
                ClearSessionCookie();
            }
        }
    );
}

CheckLogin();
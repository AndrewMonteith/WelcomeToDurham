import { SetSessionCookie, ClearSessionCookie, GetSessionCookie, HasSessionCookie } from "./session.js";

// ------------------------------ Error Dialog 

const createErrorDialog = msg => $("<div />", {
    "class": "alert alert-danger",
    text: msg
});

function bindInputInvalidityVisuals(input, errorMsg) {
    const errorDialog = createErrorDialog(errorMsg);

    return isInvalid => {
        if (isInvalid) {
            input.addClass("is-invalid");
            errorDialog.insertAfter(input);
        } else {
            input.removeClass("is-invalid");
            errorDialog.detach();
        }
    };
}

function watchUsernameInput(input) {
    const makeInputAppearInvalid = bindInputInvalidityVisuals(input, "Username cannot be empty");
    let onValueChanged = event => {
        const isEmpty = $.trim(input.val()).length === 0;

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

// ----------------------- Login Dialog Handler

const loginRequestErrorDialog = createErrorDialog("Username or password was incorrect");

$("#close-login-dialog").click(() => {
    loginRequestErrorDialog.detach();
});

function loginRequestSucceeded(data) {
    $("#close-login-dialog").trigger("click");
    changeNavbarButtons(true);
    SetSessionCookie(data.Token);
}

function loginRequestFailed() {
    loginRequestErrorDialog.insertAfter($("#login-button-contanier"));
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
    const response = $.get(
        "http://localhost:8081/amILoggedIn",
        `session=${sessionCookie}`,
        isLoggedIn => {
            changeNavbarButtons(isLoggedIn);

            if (!isLoggedIn) {
                ClearSessionCookie();
            }
        }
    );
}

CheckLogin();
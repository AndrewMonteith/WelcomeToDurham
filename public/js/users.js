// ------------------------------ Error Dialog Code 

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
            errorDialog.remove();
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

// ---------------------- Navbar Buttons  Changing

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
        navbarLoginButton.remove();
        navbarRegisterButton.remove();
        navbarMyEvents.insertAfter($("#navbar-events-on"));
        navbarMakeEvent.insertAfter(navbarMyEvents);
        navbarLogoutButton.insertAfter(navbarMakeEvent);
    } else {
        navbarMakeEvent.remove();
        navbarMakeEvent.remove();
        navbarLogoutButton.remove();
        navbarLoginButton.insertAfter($("#navbar-events-on"));
        navbarRegisterButton.insertAfter(navbarLoginButton);
    }
}

// ----------------------- Login Dialog Handler

const loginRequestErrorDialog = createErrorDialog("Username or password was incorrect");

function loginRequestSucceeded(data) {
    $("#close-login-dialog").trigger("click");
    changeNavbarButtons(true);
    console.log(data);
}

function loginRequestFailed(a, b, c) {
    loginRequest.insertAfter($("#login-button-contanier"));
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

// -------------------- Navbar button handler

function navbarLogoutButtonClicked() {
    
}

navbarLogoutButton.click(navbarLogoutButtonClicked)
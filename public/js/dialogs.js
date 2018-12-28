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

const loginRequest = createErrorDialog("Username or password was incorrect");
function loginRequestSucceeded(data) {
    loginRequest.remove();

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
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
    }
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

function makeLoginRequest() {
    const username = get("login-username"),
        password = get("login-password");

    console.log(username + " " + password);
}

$("#login-button").click(makeLoginRequest);
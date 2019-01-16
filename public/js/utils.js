export { IsWhitespaceOrEmpty, CreateErrorDialog, RedirectTo };

function IsWhitespaceOrEmpty(s) {
    return s.trim() === "";
}

function CreateErrorDialog(input, msg) {
    const errorDialogNode = $("<div />", {
        "class": "alert alert-danger",
        text: msg
    });

    return display => {
        if (display) {
            errorDialogNode.insertAfter(input);
        } else {
            errorDialogNode.detach();
        }
    };
}

function RedirectTo(url) {
    return () => window.location.replace(url);
}
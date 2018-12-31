export { IsWhitespaceOrEmpty , CreateErrorDialog };

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


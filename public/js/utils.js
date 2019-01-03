export { IsWhitespaceOrEmpty , CreateErrorDialog, NewTimer };

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

function NewTimer(timeout, callback) {
    let timer;

    const startTimer = () => { timer = setTimeout(callback, timeout); };
    const stopTimer = () => { clearTimeout(timeout); }

    return {
        start: startTimer,
        stop: stopTimer,
    };
}
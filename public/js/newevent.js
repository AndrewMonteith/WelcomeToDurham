import { CreateErrorDialog } from './utils.js';
import { GetSessionCookie, OnSessionCookieChanged } from './session.js';

function fileUploadChanged(e) {
    const file = e.target.files[0];
    const preview = $("#event-logo"); 
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        preview.addClass("has-image");
        preview.attr("src", reader.result);
      }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}

$("#event-picture-input").change(fileUploadChanged);

const dateInput = $("#event-date-input");
const invalidDateDialog = CreateErrorDialog(dateInput, 
    "Dates cannot be in the past!");

function isValidDate(date) {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    return date-todayMidnight > 0;
}

function dateInputChanged() {
    const inputDate = new Date(dateInput.val());
    const isInvalidDate = !isValidDate(inputDate);

    $("#event-create-button").attr("disabled", isInvalidDate);
    invalidDateDialog(isInvalidDate);
}
dateInput.change(dateInputChanged);

$("#sessionInput").val(GetSessionCookie());

OnSessionCookieChanged("newevent", newCookie => {
    console.log("cookie has changed to " + newCookie);
    $("#sessionInput").val(newCookie);
});
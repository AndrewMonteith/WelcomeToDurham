import { GetSessionCookie } from './session.js';

const eventId = window.location.search
    .match(/\?event=(.+)/)[1];

const updateLabelCallback = data => 
    $("#number-going").text(data.Message);

function checkboxStateChanged() {
    $.post("/eventregister",
        {
            event:eventId,
            Session:GetSessionCookie(),
            going:this.checked
        })
        .done(updateLabelCallback)
        .fail(console.log);
}
$("#going-checkbox").change(checkboxStateChanged);

function updatePageState() {
    $.get("/numbergoing",
        `?event=${eventId}`,
        updateLabelCallback);
}

updatePageState();
window.setInterval(updatePageState, 30 * 1000);
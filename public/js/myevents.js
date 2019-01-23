import { GetSessionCookie } from './session.js';
import { RedirectTo } from './utils.js';
import { BindPopupEvents as BindEventSummaryPopup } from './eventpopup.js';

const createEventNode = event =>
    $(`<li class="event-node">
        <img src="/${event.LogoURL}" height="200px">
        <br>
        ${event.Name} on ${event.Date}
    </li>`); //


function loadIntoList(listNode, eventList) {
    Object.keys(eventList)
        .forEach(eventId => {
            const eventMetdata = eventList[eventId];
            const eventNode = createEventNode(eventMetdata);

            eventNode.click(RedirectTo(`/view-event?event=${eventId}`));
            BindEventSummaryPopup(eventId, eventNode);

            listNode.append(eventNode);
        });
}

function updateEventLists(data) {
    loadIntoList($("#going-to-list"), data.GoingTo);
    loadIntoList($("#running-list"), data.Running);
}

function loadEventLists() {
    $.get("/myevents",
        { Session: GetSessionCookie() })
        .done(updateEventLists);
}

function clearLists() {
    $("#going-to-list").empty();
    $("#running-list").empty();
}

function updateState() {
    clearLists();
    loadEventLists();
}

window.setInterval(updateState, 30 * 1000);
updateState();
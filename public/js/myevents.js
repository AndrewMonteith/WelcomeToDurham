import { GetSessionCookie } from './session.js';
import { RedirectTo } from './utils.js';

const createEventNode = event =>
    $(`<li class="event-node">
        <img src="/${event.LogoURL}" height="200px">
        <br>
        ${event.Name} on ${event.Date}
    </li>`); //

function changePopupVisuals(popup, data) {
    popup.find("#number-going").text(data.NumberGoing);
    popup.find("#event-date").text(data.Date);
    popup.find("#description").text(data.Description);
}

function bindPopupEvents(eventId, eventNode) {
    const popup = $("#pop-up");
    const movePopup = e => popup.css({ top: (e.pageY + 3), left: (e.pageX + 3) });
    const triggerNode = eventNode.find("img");

    const bindPopupEvents = data => {
        triggerNode.hover(e => {
            changePopupVisuals(popup, data);
            movePopup(e);
            popup.show().appendTo("body");
        },
            () => popup.hide());

        triggerNode.mousemove(movePopup);
    };

    $.get("/eventsummary",
        { event: eventId })
        .done(bindPopupEvents);
}

function loadIntoList(listNode, eventList) {
    Object.keys(eventList).forEach(eventId => {
        const eventMetdata = eventList[eventId];
        const eventNode = createEventNode(eventMetdata);

        eventNode.click(RedirectTo(`/view-event?event=${eventId}`));
        bindPopupEvents(eventId, eventNode);

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
import { GetSessionCookie } from './session.js';

const createEventNode = event =>
    $(`<li>
        <img src="/${event.LogoURL}" height="200px">
        <br>
        ${event.Name} on ${event.Date}
    </li>`);

const redirectTo = url => 
    () => window.location.replace(url);

function loadIntoList(listNode, eventList) {
    Object.keys(eventList).forEach(eventId => {
        const eventMetdata = eventList[eventId];
        const eventNode = createEventNode(eventMetdata);

        eventNode.click(redirectTo(`/view-event?event=${eventId}`));
        
        listNode.append(eventNode);
    });
}

function updateEventLists(data) {
    loadIntoList($("#going-to-list"), data.GoingTo);
    loadIntoList($("#running-list"), data.Running);
}

const QueryServerAndPopulateLists = () => 
    $.get("/myevents",
        { Session: GetSessionCookie() })
        .done(updateEventLists)
        .fail(console.log);

function ClearLists() {
    $("#going-to-list").empty();
    $("#running-list").empty();
}

function UpdateState() {
    ClearLists();
    QueryServerAndPopulateLists();
}

window.setInterval(UpdateState, 30 * 1000);
UpdateState();
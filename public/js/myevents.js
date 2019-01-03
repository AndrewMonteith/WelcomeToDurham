import { GetSessionCookie } from './session.js';
import { NewTimer } from './utils.js';

const createEventNode = event =>
    $(`<li class="event-node">
        <img src="/${event.LogoURL}" height="200px">
        <br>
        ${event.Name} on ${event.Date}
        <br>
        <span class="event-description"></span>
    </li>`);

const redirectTo = url => 
    () => window.location.replace(url);

const fillEventDescription = (eventId, descNode) => {
    const fillNode = data => descNode.text(`Description: ${data.Message}`); 

    $.get("/getdescription",
        {event: eventId})
        .done(fillNode);
};

function listenForHover(eventId, eventNode) {
    const setDescriptionVisible = visible => {
        const descNode = eventNode.find(".event-description");
        if (visible) {
            if (descNode.val() === "") {
                fillEventDescription(eventId, descNode);
            }
            
            descNode.show();
        } else {
            descNode.hide();
        }
    };
    const timer = NewTimer(600, () => setDescriptionVisible(true));
    
    const hoverIn = () => timer.start();

    const hoverOut = () => {
        timer.stop();
        setDescriptionVisible(false);
    };

    setDescriptionVisible(false);
    eventNode.hover(hoverIn, hoverOut);
}

function loadIntoList(listNode, eventList) {
    Object.keys(eventList).forEach(eventId => {
        const eventMetdata = eventList[eventId];
        const eventNode = createEventNode(eventMetdata);

        eventNode.click(redirectTo(`/view-event?event=${eventId}`));
        listenForHover(eventId, eventNode);

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
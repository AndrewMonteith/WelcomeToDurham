const eventItemTemplate = $(
    `<div class="event d-flex">
        <p class="event-title"></p>
        <img class="event-image">
    </div>`);

function createNewEventListItem(id, details) {
    const item = eventItemTemplate.clone();
    item.attr("id", id);
    item.find(".event-title").text(details.Name);
    item.find(".event-image").attr("src", details.LogoURL);
    return item;
}

let eventsInList = {};

function removeOldEvents(newEventList) {
    function deleteEventFromWebpage(eventId) {
        const listItem = $("#" + eventId);
        if (listItem.length > 0) {
            listItem.remove();
        }
        eventsInList[eventId] = undefined;
    }

    Object.keys(eventsInList)
        .filter(id => !newEventList[id])
        .forEach(deleteEventFromWebpage);
}

function addNewEvents(newEventList) {
    function addEventToList(eventId) {
        const details = newEventList[eventId];
        const eventItem = createNewEventListItem(eventId, details);

        eventItem.click(() => window.location.replace("/view-event?event=" + eventId));

        $("#event-list").append(eventItem);
        eventsInList[eventId] = details;
    }

    Object.keys(newEventList)
        .filter(id => !eventsInList[id])
        .forEach(addEventToList);
}

function updateEventList(events) {
    console.log(JSON.stringify(events));
    removeOldEvents(events);
    addNewEvents(events);
}

const updateState = () => $.get("/events", updateEventList);

updateState();
window.setInterval(updateState, 30 * 1000);
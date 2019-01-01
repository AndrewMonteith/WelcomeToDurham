const eventItemTemplate = $(
    `<div class="event d-flex">
        <p class="event-title"></p>
        <img class="event-image">
    </div>`);

function createNewEventListItem(eventDetails) {
    const item = eventItemTemplate.clone();
    item.find(".event-title").text(eventDetails.Name);
    item.find(".event-image").attr("src", eventDetails.LogoURL);
    return item;
}

function loadEvents(events) {
    const itemList = $("#event-list");
   
    Object.keys(events).forEach(name => {
        const eventItem = createNewEventListItem(events[name]);

        eventItem.click(() => {
            window.location.replace("/view-event?event=" + name);
        });

        itemList.append(eventItem);
    });
}

$.get("/events", loadEvents);
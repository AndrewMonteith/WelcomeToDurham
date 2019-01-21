export { BindPopupEvents }

function changePopupVisuals(popup, data) {
    popup.find("#number-going").text(data.NumberGoing);
    popup.find("#event-date").text(data.Date);
    popup.find("#description").text(data.Description);
}

function BindPopupEvents(eventId, eventNode) {
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

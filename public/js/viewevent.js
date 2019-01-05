import { GetSessionCookie, OnSessionCookieChanged } from './session.js';

const eventId = window.location.search
    .match(/\?event=(.+)/)[1];

const isLoggedIn = () => GetSessionCookie() !== "";

function checkboxStateChanged() {
    $.post("/eventregister",
        {
            event:eventId,
            Session:GetSessionCookie(),
            going:this.checked
        })
        .done(updatePageState)
        .fail(console.log);
}
$("#going-checkbox").change(checkboxStateChanged);

function postComment() {
    const addCommentToWebpage = comment => {
        addComment(comment);
        $("#comment-input").val("");
    };

    $.post(
        "/makecomment",
        {
            Session: GetSessionCookie(),
            event: eventId,
            comment: $("#comment-input").val()
        })
        .done(addCommentToWebpage)
        .fail(console.log);
}
$("#submit-button").click(postComment);

function PopulatePeopleList(peopleGoing) {
    const personList = $("#people-list");
    const createPersonNode = name => $(`<p>${name}</p>`);

    $("#people-list").empty();
    for (const person of peopleGoing) {
        personList.append(createPersonNode(person));
    }
}

function addComment(comment) {
    console.log(comment);
    const commentNode = (`<div class="comment-group">
        <p class="comment">${comment.comment}</p>
        <p class="commenter">${comment.commenter}</p>
    </div>`);

    $("#comment-list").append(commentNode);
}

function PopulateCommentList(comments) {
    const commentList = $("#comment-list");
    const numberOfComments = commentList.children().length;
    if (numberOfComments == comments.length) {
        return;
    }

    for (let i = numberOfComments; i < comments.length; i++) {
        addComment(comments[i]);
    }
}

function UpdateLoggedInPanel(data) {
    const numberGoing = data.PeopleGoing.length;
    const userGoing = data.UserGoing;

    $("#going-checkbox").prop("checked", userGoing);
    $("#number-going").text(numberGoing);
}

function ChangeVisualsOfLoggedInPanel(loggedIn) {
    const descriptionPanel = $("#description-panel"),
        goingPanel = $("#going-panel"),
        commentInput = $("#comment-group");  

    if (loggedIn) {
        commentInput.show();
        goingPanel.show();
        goingPanel.addClass("col-md-6");
        descriptionPanel.addClass("col-md-6");
    } else {
        commentInput.hide();
        goingPanel.hide();
        goingPanel.removeClass("col-md-6");
        descriptionPanel.removeClass("col-md-6");
    }
}

function updatePage(data) {
    ChangeVisualsOfLoggedInPanel(isLoggedIn());

    PopulatePeopleList(data.PeopleGoing);
    PopulateCommentList(data.Comments);

    if (isLoggedIn()) {
        UpdateLoggedInPanel(data);
    }
}

function updatePageState() {
    $.get("/getvieweventstate",
        {event:eventId},
        updatePage);
}

updatePageState();
window.setInterval(updatePageState, 30 * 1000);

OnSessionCookieChanged("viewevent", () => {
    if (isLoggedIn) {
        updatePageState();
    } else {
        ChangeVisualsOfLoggedInPanel(false);
    }
});
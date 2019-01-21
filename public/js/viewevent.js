import { GetSessionCookie, OnSessionCookieChanged } from './session.js';

const eventId = window.location.search.
    match(/\?event=(.+)/)[1];

const isLoggedIn = () => GetSessionCookie() !== "";

function checkboxStateChanged() {
    $.post("/eventregister",
        {
            event: eventId,
            Session: GetSessionCookie(),
            going: this.checked
        })
        .done(updatePageState);
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

function populatePeopleList(peopleGoing) {
    const personList = $("#people-list");
    const createPersonNode = name => $(`<p>${name}</p>`);

    $("#people-list").empty();
    if (peopleGoing.length > 0) {
        for (const person of peopleGoing) {
            personList.append(createPersonNode(person));
        }
    } else {
        personList.append($(`<em><b>Be the first to go!</b></em>`));
    }
}

function createCommentNode(comment) {
    return $(`<div class="comment-group">
        <p class="comment">${comment.comment}</p>
        <p class="commenter">${comment.commenter}</p>
    </div>`)
}


function populateCommentList(comments) {
    const commentList = $("#comment-list");
    const numberOfComments = commentList.children().length;

    if (numberOfComments === 0) {
        commentList.append($(`<b>No comments yet!</b>`))
    } else if (numberOfComments === comments.length) {
        return;
    } else {
        for (let i = numberOfComments; i < comments.length; i++) {
            commentList.append(createCommentNode(comments[i]));
        }
    }
}

function updateLoggedInPanel(data) {
    const numberGoing = data.PeopleGoing.length;
    const userGoing = data.IsGoing;

    $("#going-checkbox").prop("checked", userGoing);
    $("#number-going").text(numberGoing);
}

function changeVisualsOfLoggedInPanel(loggedIn) {
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
    changeVisualsOfLoggedInPanel(isLoggedIn());

    populatePeopleList(data.PeopleGoing);
    populateCommentList(data.Comments);

    if (isLoggedIn()) {
        updateLoggedInPanel(data);
    }
}

function updatePageState() {
    $.get("/getvieweventstate",
        { event: eventId, Session: GetSessionCookie() },
        updatePage);
}

updatePageState();
window.setInterval(updatePageState, 30 * 1000);

OnSessionCookieChanged("viewevent", () => {
    if (isLoggedIn) {
        updatePageState();
    } else {
        changeVisualsOfLoggedInPanel(false);
    }
});
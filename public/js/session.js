export { HasSessionCookie, GetSessionCookie, ClearSessionCookie, SetSessionCookie, OnSessionCookieChanged };

function setCookie(key, value, hoursToExpireIn) {
    let expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (hoursToExpireIn + 60 * 60 * 1000));

    document.cookie = `${key}=${value};expires=${expiryDate};`;
}

function getCookie(key) {
    const cookies = document.cookie.split(";").map(s => s.trimLeft());
    const keyString = key + "=";

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        if (cookie.indexOf(keyString) == 0) {
            return cookie.substring(keyString.length, cookie.length);
        }
    }

    return "";
}

function deleteCookie(key) {
    document.cookie = `${key}=; Max-Age=-1`;
}

function SetSessionCookie(cookie) {
    console.log("Cookie has been set!");
    setCookie("session", cookie);
    RaiseCallback(cookie);
}

function GetSessionCookie() {
    return getCookie("session");
}

function ClearSessionCookie() {
    RaiseCallback("");
    deleteCookie("session");
}

function HasSessionCookie() {
    return GetSessionCookie() !== "";
}

let callbacks = {};
function OnSessionCookieChanged(id, callback) {
    callbacks[id] = callback;
}

function RaiseCallback(value) {
    Object.values(callbacks).forEach(callback => callback(value));
}
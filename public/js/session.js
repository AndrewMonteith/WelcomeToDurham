export { HasSessionCookie, GetSessionCookie, ClearSessionCookie, SetSessionCookie };

function setCookie(key, value, hoursToExpireIn) {
    let expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (hoursToExpireIn+60*60*1000));

    document.cookie = `${key}=${value};expires=${expiryDate};`;
}

function getCookie(key) {
    const cookies = document.cookie.split(";").map(s => s.trimLeft());
    const keyString = key+"=";

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
    setCookie("session", cookie);
}

function GetSessionCookie(cookie) {
    return getCookie("session");
}

function ClearSessionCookie() {
    deleteCookie("session");
}

function HasSessionCookie() {
    return GetSessionCookie() !== "";
}
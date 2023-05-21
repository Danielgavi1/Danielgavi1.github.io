function setCookie(name, value, days) {

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value || ""}; expires=${expires.toUTCString()}; path=/`;
}

function getCookie(name) {

    const nameEQ = name + "=";
    const ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
        c = c.substring(1, c.length);
        }
        
        if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
        }
    }

    return null;
}

function hideCookieNotice() {

    const cookieNotice = document.querySelector(".cookie-banner");
    
    if (cookieNotice) {
        cookieNotice.style.display = "none";
    }
}

function handleAcceptCookies() {

    setCookie("cookies_accepted", "true", 365);
    hideCookieNotice();
}

document.addEventListener("DOMContentLoaded", function () {
const acceptCookiesButton = document.querySelector(".cookie-button");

if (acceptCookiesButton) {
    acceptCookiesButton.addEventListener("click", handleAcceptCookies);
}

if (getCookie("cookies_accepted")) {
    hideCookieNotice();
}});
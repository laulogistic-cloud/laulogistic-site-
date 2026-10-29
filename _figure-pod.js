!function () {
    "use strict";
    "figcaption" in document.documentElement &&
        document.querySelectorAll("figure > img[alt]").forEach(function (img) {
            var caption = document.createElement("figcaption");
            caption.textContent = img.getAttribute("alt");
            img.parentElement.insertBefore(caption, img.nextSibling);
        });
}();

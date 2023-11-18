class classNotification {
    constructor() {
        this.notification = document.getElementById("notification");
        this.notification_wrapper = document.getElementById("notification_wrapper");
        this.notification.setAttribute("low-contrast", true)
        this.hide()
    }

    setTitle(title) {
        this.notification.setAttribute("title", title);
    }

    setSubtitle(subtitle) {
        this.notification.setAttribute("subtitle", subtitle);
    }

    setKind(kind) {
        this.notification.setAttribute("kind", kind);
    }

    show() {
        this.notification_wrapper.style.display = "block";
    }

    hide() {
        this.notification_wrapper.style.display = "none";
    }

    error(error){
        this.setTitle("Chyba: ")
        this.setSubtitle(error)
        this.setKind("error")
        this.show()
    }

    success(){
        this.setTitle("Úspěch: ")
        this.setSubtitle("Faktura byla úspěšně převedena")
        this.setKind("success")
        this.show()
    }
}

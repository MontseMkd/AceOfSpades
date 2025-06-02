<?php

class action_aceofspadesp extends APP_GameAction {
    public function __default() {
        if (self::isArg('notifwindow')) {
            $this->view = "common_notifwindow";
            $this->viewArgs['table'] = self::getArg("table", AT_posint, true);
        } else {
            $this->view = "aceofspadesp_aceofspadesp";
            self::trace("Complete reinitialization of board game");
        }
    }

    public function actTest() {
        self::setAjaxMode();
        $message = self::getArg("message", AT_alphanum, true);
        self::debug("Message from JS: $message");
        self::ajaxResponse();
    }
}

public function actPlayCard()
{
    self::checkAction('actPlayCard');
    $cardId = (int) self::getArg('cardId');
    $this->game->actPlayCard($cardId);
    self::ajaxResponse();
}

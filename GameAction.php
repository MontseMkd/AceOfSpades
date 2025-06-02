/**
 * @param int[] $cardIds
 */
public function actShuffleDeck2(array $cardIds)
{
    self::setAjaxMode();
    $this->game->actShuffleDeck2($cardIds);
    self::ajaxResponse();
}


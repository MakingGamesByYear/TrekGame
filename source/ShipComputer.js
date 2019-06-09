class ShipComputerMenu extends Menu
{
    constructor(trekGame)
    {
        super();
        this.options = [];

        this.options.push(

            new MenuOption
            (
                "1",
                ") ",
                "MAP / SENSOR RECORD",
                function()
                {
                }
            ),

            new MenuOption
            (
                "2",
                ") ",
                "DAMAGE REPORT",
                function()
                {
                }
            ),

        );
    }
}
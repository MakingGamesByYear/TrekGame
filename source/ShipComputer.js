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
                "DAMAGE REPORT",
                function()
                {
                    return true;
                }
            ),

            new MenuOption
            (
                "2",
                ") ",
                "STARBASE MAP",
                function()
                {
                    gameOutputAppend("MAP OF FEDERATION STARBASES");
                    gameOutputAppend(trekGame.galaxyMap.mapString(trekGame.galaxyMap, StarBase, trekGame.enterprise));
                    return true;
                }
            ),

            new MenuOption
            (
                "3",
                ") ",
                "KLINGONS MAP",
                function()
                {
                    gameOutputAppend("SENSOR RECORDS OF KLINGONS IN EACH SECTOR");
                    gameOutputAppend(trekGame.enterprise.sensorHistory.mapString(Klingon, trekGame.enterprise));
                    return true;
                }
            ),

            new MenuOption
            (
                "4",
                ") ",
                "STAR DENSITY MAP",
                function()
                {
                    gameOutputAppend("SENSOR RECORDS SHOWING NUMBER OF STARS IN EACH SECTOR");
                    gameOutputAppend(trekGame.enterprise.sensorHistory.mapString(Star, trekGame.enterprise));
                    return true;
                }
            ),



            new MenuOption
            (
                "5",
                ") ",
                "BACK",
                function()
                {
                    return true;
                }
            )

        );
    }
}
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
                    trekGame.enterprise.damageReport();
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
                    if (trekGame.enterprise.components.LibraryComputer.componentHealth <= Enterprise.libraryComputerDamagedThreshold)
                    {
                        gameOutputAppend("Ship's computer too damaged to access maps.");
                        return true;
                    }

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
                    if (trekGame.enterprise.components.LibraryComputer.componentHealth <= Enterprise.libraryComputerDamagedThreshold)
                    {
                        gameOutputAppend("Ship's computer too damaged to access maps.");
                        return true;
                    }

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
                    if (trekGame.enterprise.components.LibraryComputer.componentHealth <= Enterprise.libraryComputerDamagedThreshold)
                    {
                        gameOutputAppend("Ship's computer too damaged to access maps.");
                        return true;
                    }
                    
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
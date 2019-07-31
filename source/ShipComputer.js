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
                "CAPTAIN'S MANUAL",
                function()
                {
                    trekGame.printTutorial();
                    return false;
                }
            ),

            new MenuOption
            (
                "2",
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
                "3", ") ", "MAPS",
                function()
                {
                    ShipComputerMenu.showMapMenu(trekGame);
                    return false;
                }
            ),

            new MenuOption
            (
                "4",
                ") ",
                "SELF DESTRUCT",
                function()
                {
                    let resignMenu = new Menu();

                    resignMenu.options.push
                    (
                        new MenuOption("1", ") ", "END CURRENT GAME AND ERASE SAVE", function(){trekGame.endGame()}),
                        new MenuOption("2", ") ", "CANCEL", function(){return true})
                    );

                    trekGame.awaitInput(resignMenu.toString(), "1", function(inputLine){return resignMenu.chooseOption(inputLine);});
                    return;
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

    static showMapMenu(trekGame)
    {
        let mapMenu = new Menu();

        mapMenu.options.push(
        new MenuOption
            (
                "1",
                ") ",
                "STARBASE MAP",
                function()
                {
                    if (!trekGame.enterprise.components.LibraryComputer.mapsAccessible())
                    {
                        gameOutputAppend("\nShip's computer too damaged to access maps.");
                        return true;
                    }

                    gameOutputAppend(trekGame.primeUniverse ? "\nFEDERATION STARBASES" : "\nIMPERIAL STARBASES");
                    gameOutputAppend(trekGame.galaxyMap.mapString(trekGame.galaxyMap, StarBase, trekGame.enterprise));
                    return true;
                }
            ),

            new MenuOption
            (
                "2",
                ") ",
                trekGame.primeUniverse ? "KLINGONS MAP" : "ENEMY LOCATIONS MAP",
                function()
                {
                    if (!trekGame.enterprise.components.LibraryComputer.mapsAccessible())
                    {
                        gameOutputAppend("\nShip's computer too damaged to access maps.");
                        return true;
                    }

                    gameOutputAppend("\nSENSOR RECORDS OF ENEMIES IN EACH SECTOR");
                    gameOutputAppend(trekGame.enterprise.sensorHistory.mapString(Klingon, trekGame.enterprise));
                    return true;
                }
            ),

            new MenuOption
            (
                "3",
                ") ",
                "STAR DENSITY MAP",
                function()
                {
                    if (!trekGame.enterprise.components.LibraryComputer.mapsAccessible())
                    {
                        gameOutputAppend("\nShip's computer too damaged to access maps.");
                        return true;
                    }
                    
                    gameOutputAppend("\nSENSOR RECORDS SHOWING NUMBER OF STARS IN EACH SECTOR");
                    gameOutputAppend(trekGame.enterprise.sensorHistory.mapString(Star, trekGame.enterprise));
                    return true;
                }
            ), 

            new MenuOption("4", ") ", "BACK", function(){return true;})
        );

        trekGame.awaitInput(mapMenu.toString(), "1", function(inputLine){return mapMenu.chooseOption(inputLine);});
    }
}
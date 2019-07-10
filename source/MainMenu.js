class MainMenu extends Menu
{
    constructor(trekgame)
    {
        super();

        this.options = [];

        this.options.push
        (
            new MenuOption
            (
                "0",
                ") ",
                "DOCK WITH STARBASE",
                function()
                {
                    let adjacentStarbases = trekgame.currentQuadrant.getAdjacentEntitiesOfType(trekgame.enterprise, StarBase);
                    console.assert(adjacentStarbases.length);

                    let sb = adjacentStarbases[0];

                    trekgame.enterprise.dockWithStarbase(sb);

                    trekgame.showDockMenu(sb);

                    trekgame.advanceStardate(1.0);

                    return false;
                }
            ),
            new MenuOption
            (
                "1",
                ") ",
                "NAVIGATION",
                function()
                {
                    let navigationMenu = new Menu();
                    navigationMenu.options.push
                    (
                        new MenuOption
                        (
                            "1",
                            ") ",
                            "SHORT RANGE JUMP (1 STARDATE)",
                            function()
                            {
                                trekgame.awaitInput("Enter destination subsector (X coordinate)", 2, trekgame.navigationHandlerShortRangeX);
                                return false;
                            }
                        ),
                        new MenuOption
                        (
                            "2",
                            ") ",
                            "LONG RANGE JUMP  (1 STARDATE)",
                            function()
                            {
                                trekgame.awaitInput("Enter destination sector X coordinate. Enter a value between 1 and " + mapWidthQuadrants, 2, trekgame.navigationHandlerLongRangeX);
                                return false;
                            }
                        ),
                        new MenuOption
                        (
                            "3", ") ", "BACK", function(){return true;}
                        )
                    );

                    trekgame.awaitInput(navigationMenu.toString(), 1, function(inputline){return navigationMenu.chooseOption(inputline);});

                    //trekgame.awaitInput("Enter heading (degrees).", 3, trekgame.navigationHandler);
                }
            ), 

            new MenuOption
            (
                "2", ") ", "WEAPONS",
                function()
                {
                    MainMenu.showWeaponsMenu(trekgame);
                }
            ),

            new MenuOption
            (
                "3",
                ") ",
                "SHIELD CONTROL",
                function()
                {
                    let totalEnergy = (trekgame.enterprise.freeEnergy + trekgame.enterprise.shields);
                    
                    let suggestedStr = "";
                    if (trekgame.currentQuadrant.countEntitiesOfType(Klingon))
                    {
                        let klingonList = trekgame.currentQuadrant.getEntitiesOfType(Klingon);

                        let suggestedShieldLevel = trekgame.enterprise.suggestedMinShieldLevel(klingonList);

                        suggestedStr += "\nSUGGESTED SHIELD LEVEL FOR CURRENT COMBAT SITUATION: " + suggestedShieldLevel;
                    }

                    trekgame.awaitInput("ENTER NEW SHIELD ENERGY LEVEL. \nAVAILABLE: " + totalEnergy + suggestedStr, 4, trekgame.shieldHandler);
                }
            ),

            new MenuOption
            (
                "4",
                ") ",
                "LONG RANGE SENSORS (1 STARDATE)",
                function()
                {
                    gameOutputAppend("\nLong Range Scan completed.");
                    gameOutputAppend("Adjacent sectors have been scanned.  The ship's computer has been updated with the following information:\n");
                    gameOutputAppend(trekgame.enterprise.lrsString(trekgame.galaxyMap));

                    var sh = trekgame.enterprise.sensorHistory;
                    sh.updateSensorHistoryForEntityTypes
                    (
                        [Star, Klingon], 
                        trekgame.galaxyMap, 
                        trekgame.enterprise.quadrantX-1, 
                        trekgame.enterprise.quadrantY-1, 
                        trekgame.enterprise.quadrantX+1, 
                        trekgame.enterprise.quadrantY+1
                    );

                    trekgame.currentQuadrant.klingonsFire(trekgame.enterprise, trekgame);
                    trekgame.advanceStardate(1.0);
                }
            ),

            new MenuOption
            (
                "5",
                ") ",
                "SHIP'S COMPUTER",
                function()
                {
                    return trekgame.awaitInput(trekgame.computerMenu.toString(), 1, function(inputline){return trekgame.computerMenu.chooseOption(inputline);});
                }
            )
        );

        this.dockOption = this.options[0];
        this.dockOption.enabled = false;
    }

    static showWeaponsMenu(trekgame)
    {
        var weaponsMenu = new Menu();

        weaponsMenu.options.push(
        new MenuOption
            (
                "1",
                ") ",
                "PHASERS",
                function()
                {
                    if (trekgame.currentQuadrant.countEntitiesOfType(Klingon))
                    {
                        let freestring = "\nFREE ENERGY : " + trekgame.enterprise.freeEnergy;
                        trekgame.awaitInput("ENTER ENERGY TO EXPEND ON PHASER FIRE"+freestring, 4, trekgame.phaserHandler);
                        return false;
                    }
                    else
                    {
                        gameOutputAppend("\nPhaser control : No enemies detected in this sector, captain.");
                        return true;
                    }
                }
            ),

            new MenuOption
            (
                "2",
                ") ",
                "PHOTON TORPEDOES ("+Enterprise.TorpedoEnergyCost+" ENERGY)",
                function()
                {
                    if (trekgame.enterprise.torpedoes <= 0)
                    {
                        gameOutputAppend("\nWe're out of torpedoes, captain!");
                    }
                    else if (trekgame.enterprise.components.PhotonTubes.componentHealth > Enterprise.torpedoTubesDamagedThreshold)
                    {
                        // automatic targeting enabled. push a menu of targets.
                        console.log("auto targeting path");

                        let torpMenu = new TorpedoMenu(trekgame.currentQuadrant.getEntitiesOfType(Klingon), trekgame);

                        trekgame.awaitInput(torpMenu.toString(), 1, function(inputline){return torpMenu.chooseOption(inputline);});
                    }
                    else if (trekgame.enterprise.components.PhotonTubes.componentHealth > Enterprise.torpedoTubesDisabledThreshold)
                    {
                        gameOutputAppend("Due to damage, torpedo targeting computer is nonfunctional.");
                        gameOutputAppend("Enter torpedo heading manually (in degrees).");
                        trekgame.awaitInput("Torpedo Heading (degrees)", 3, trekgame.torpedoHandler);
                    }
                    else
                    {
                        gameOutputAppend("Torpedo tubes too damaged to fire!");
                    }
                }
            ),

            new MenuOption("3", ") ", "BACK", function(){return true;})

        );

        return trekgame.awaitInput(weaponsMenu.toString(), 1, function(inputline){return weaponsMenu.chooseOption(inputline);});
    }

}


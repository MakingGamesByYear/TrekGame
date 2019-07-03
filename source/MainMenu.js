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
                "1",
                ") ",
                "NAVIGATION",
                function()
                {
                    gameOutputAppend("Navigation");
                    trekgame.awaitInput("Enter heading (degrees).", 3, trekgame.navigationHandler);
                }
            ), 

            new MenuOption
            (
                "2",
                ") ",
                "LONG RANGE SENSORS (1 STARDATE)",
                function()
                {
                    gameOutputAppend("Long Range Scan");
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
                    trekgame.starDate += 1.0;
                }
            ),

            new MenuOption
            (
                "3",
                ") ",
                "PHASERS",
                function()
                {
                    gameOutputAppend("Fire phasers");
                    if (trekgame.currentQuadrant.countEntitiesOfType(Klingon))
                    {
                        gameOutputAppend("Enter the energy to commit to the phasers.");
                        gameOutputAppend("Total available : " + trekgame.enterprise.freeEnergy);
                        trekgame.awaitInput("Energy:", 4, trekgame.phaserHandler);
                    }
                    else
                    {
                        gameOutputAppend("No enemies detected in this sector, captain.");
                    }
                }
            ),

            new MenuOption
            (
                "4",
                ") ",
                "PHOTON TORPEDOES",
                function()
                {
                    gameOutputAppend("Fire torpedoes");
                    if (trekgame.enterprise.torpedoes <= 0)
                    {
                        gameOutputAppend("We're out of torpedoes, captain!");
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

            new MenuOption
            (
                "5",
                ") ",
                "SHIELD CONTROL",
                function()
                {
                    gameOutputAppend("Configure shields");
                    gameOutputAppend("Enter the new energy level for the shields.");
                    gameOutputAppend("Total available is : " + (trekgame.enterprise.freeEnergy + trekgame.enterprise.shields));
                    
                    if (trekgame.currentQuadrant.countEntitiesOfType(Klingon))
                    {
                        let klingonList = trekgame.currentQuadrant.getEntitiesOfType(Klingon);

                        let suggestedShieldLevel = trekgame.enterprise.suggestedMinShieldLevel(klingonList);

                        gameOutputAppend("Based on current combat conditions, the ship's computer suggests a minimum shield energy level of " + suggestedShieldLevel);
                    }

                    trekgame.awaitInput("New shield level:", 4, trekgame.shieldHandler);
                }
            ),

            new MenuOption
            (
                "6",
                ") ",
                "SHIP'S COMPUTER",
                function()
                {
                    return trekgame.awaitInput(trekgame.computerMenu.toString(), 1, function(inputline){return trekgame.computerMenu.chooseOption(inputline);});
                }
            ),

            new MenuOption
            (
                "7",
                ") ",
                "RESIGN YOUR COMMAND",
                function()
                {
                    gameOutputAppend("Resign command");
                    trekgame.awaitInput("Are you sure you want to end your current game and erase your autosave? (Y/N)", 1, trekgame.endGameHandler);
                    return;
                }
            )
        );
    }
}


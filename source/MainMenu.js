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
                "NAV",
                " ",
                "(TO SET COURSE)",
                function()
                {
                    gameOutputAppend("Navigation");
                    trekgame.awaitInput("Enter heading (degrees).", 3, trekgame.navigationHandler);
                }
            ), 

            new MenuOption
            (
                "LRS",
                " ",
                "(FOR LONG RANGE SENSOR SCAN)",
                function()
                {
                    gameOutputAppend("Long Range Scan");
                    gameOutputAppend(trekgame.enterprise.lrsString(trekgame.galaxyMap));
                }
            ),

            new MenuOption
            (
                "PHA",
                " ",
                "(TO FIRE PHASERS)",
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
                "TOR",
                " ",
                "(TO FIRE PHOTON TORPEDOES)",
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

                        trekgame.awaitInput(torpMenu.toString(), 1, function(inputline){torpMenu.chooseOption(inputline);});
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
                "SHE",
                " ",
                "(TO RAISE OR LOWER SHIELDS)",
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
                "COM",
                " ",
                "(TO CALL ON LIBRARY-COMPUTER)",
                function()
                {
                    return trekgame.awaitInput(trekgame.computerMenu.toString(), 1, function(inputline){trekgame.computerMenu.chooseOption(inputline);});
                }
            ),

            new MenuOption
            (
                "XXX",
                " ",
                "(TO RESIGN YOUR COMMAND)",
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

